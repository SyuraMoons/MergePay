// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IStorkOracle.sol";

/**
 * @title MergeTreasury
 * @notice Receives cross-chain payments from multiple sources and manages treasury
 * @dev Deployed on Arc blockchain as settlement hub
 */
contract MergeTreasury is Ownable, ReentrancyGuard {
    // USDC token on Arc
    IERC20 public immutable usdc;

    // Stork Oracle for price data
    IStorkOracle public immutable storkOracle;

    // Track user balances
    mapping(address => uint256) public userBalances;

    // Price caching to reduce oracle calls
    uint256 public lastPriceUpdate;
    mapping(bytes32 => int256) public cachedPrices;
    mapping(bytes32 => uint256) public cachedPriceTimestamps;

    // Price staleness threshold (in seconds)
    uint256 public constant PRICE_STALENESS_THRESHOLD = 60;

    // Track total treasury balance
    uint256 public totalTreasuryBalance;

    // Track deposits by source chain for analytics
    struct Payment {
        address payer;
        uint256 amount;
        uint256 sourceChainId;
        uint256 timestamp;
    }

    Payment[] public paymentHistory;
    mapping(address => uint256[]) public userPaymentIds;

    // Events
    event PaymentReceived(
        address indexed payer,
        uint256 amount,
        uint256 sourceChainId,
        uint256 timestamp
    );

    event Withdrawal(
        address indexed user,
        uint256 amount,
        address indexed to,
        uint256 timestamp
    );

    event TreasuryDeposit(address indexed from, uint256 amount);

    event PriceFetched(bytes32 indexed assetId, int256 price, uint256 timestamp);
    event PriceCached(bytes32 indexed assetId, int256 price, uint256 timestamp);
    event AgentActionExecuted(
        bytes32 indexed assetId,
        int256 price,
        int256 threshold,
        bool actionTaken
    );

    constructor(address _usdc, address _storkOracle) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_storkOracle != address(0), "Invalid oracle address");
        usdc = IERC20(_usdc);
        storkOracle = IStorkOracle(_storkOracle);
    }

    /**
     * @notice Receive payment from LI.FI routing (from any source chain)
     * @param payer Original payer address
     * @param amount Amount of USDC received
     * @param sourceChainId Chain ID where payment originated
     */
    function receivePayment(
        address payer,
        uint256 amount,
        uint256 sourceChainId
    ) external nonReentrant {
        require(payer != address(0), "Invalid payer");
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Update balances
        userBalances[payer] += amount;
        totalTreasuryBalance += amount;

        // Record payment
        Payment memory payment = Payment({
            payer: payer,
            amount: amount,
            sourceChainId: sourceChainId,
            timestamp: block.timestamp
        });

        uint256 paymentId = paymentHistory.length;
        paymentHistory.push(payment);
        userPaymentIds[payer].push(paymentId);

        emit PaymentReceived(payer, amount, sourceChainId, block.timestamp);
    }

    /**
     * @notice User withdraws their balance to specified address
     * @param amount Amount to withdraw
     * @param to Destination address
     */
    function withdraw(uint256 amount, address to) external nonReentrant {
        require(to != address(0), "Invalid destination");
        require(amount > 0, "Amount must be greater than 0");
        require(userBalances[msg.sender] >= amount, "Insufficient balance");

        // Update balances
        userBalances[msg.sender] -= amount;
        totalTreasuryBalance -= amount;

        // Transfer USDC
        require(usdc.transfer(to, amount), "Transfer failed");

        emit Withdrawal(msg.sender, amount, to, block.timestamp);
    }

    /**
     * @notice Direct deposit to treasury (alternative to receivePayment)
     * @param amount Amount to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        userBalances[msg.sender] += amount;
        totalTreasuryBalance += amount;

        emit TreasuryDeposit(msg.sender, amount);
    }

    /**
     * @notice Get user's payment history count
     */
    function getUserPaymentCount(address user) external view returns (uint256) {
        return userPaymentIds[user].length;
    }

    /**
     * @notice Get payment details by ID
     */
    function getPayment(
        uint256 paymentId
    ) external view returns (Payment memory) {
        require(paymentId < paymentHistory.length, "Invalid payment ID");
        return paymentHistory[paymentId];
    }

    /**
     * @notice Get contract USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @notice Emergency withdraw (only owner)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= totalTreasuryBalance, "Insufficient balance");
        require(usdc.transfer(owner(), amount), "Transfer failed");
        totalTreasuryBalance -= amount;
    }

    // ========== Oracle Functions ==========

    /**
     * @notice Get the latest price for an asset, using cache if available
     * @param assetId The asset identifier (e.g., keccak256("ETH/USD"))
     * @param useCache Whether to use cached price if available
     * @return price The latest price
     * @return timestamp The timestamp of the price
     */
    function getPrice(
        bytes32 assetId,
        bool useCache
    ) external returns (int256 price, uint256 timestamp) {
        if (useCache) {
            (int256 cachedPrice, uint256 cachedTimestamp, bool isValid) = _getCachedPrice(
                assetId
            );
            if (isValid) {
                return (cachedPrice, cachedTimestamp);
            }
        }

        (price, timestamp) = storkOracle.getLatestPrice(assetId);
        emit PriceFetched(assetId, price, timestamp);
        _cachePrice(assetId, price, timestamp);
    }

    /**
     * @notice Get multiple prices in a single call
     * @param assetIds Array of asset identifiers
     * @param useCache Whether to use cached prices if available
     * @return prices Array of prices
     * @return timestamps Array of timestamps
     */
    function getMultiplePrices(
        bytes32[] calldata assetIds,
        bool useCache
    ) external returns (int256[] memory prices, uint256[] memory timestamps) {
        prices = new int256[](assetIds.length);
        timestamps = new uint256[](assetIds.length);

        for (uint256 i = 0; i < assetIds.length; i++) {
            (int256 price, uint256 timestamp) = this.getPrice(assetIds[i], useCache);
            prices[i] = price;
            timestamps[i] = timestamp;
        }
    }

    /**
     * @notice Check price and execute action based on threshold
     * @dev Basic agent decision logic - executes action if price crosses threshold
     * @param assetId The asset identifier to check
     * @param upperThreshold Upper price threshold (action if price > this)
     * @param lowerThreshold Lower price threshold (action if price < this)
     * @param actionType Type of action to execute (0 = none, 1 = emit only)
     * @return executed Whether action was executed
     * @return price The price that triggered the action
     */
    function checkPriceAndExecute(
        bytes32 assetId,
        int256 upperThreshold,
        int256 lowerThreshold,
        uint256 actionType
    ) external returns (bool executed, int256 price) {
        (price, ) = this.getPrice(assetId, false);

        bool shouldExecute = false;

        if (upperThreshold > 0 && price > upperThreshold) {
            shouldExecute = true;
        } else if (lowerThreshold > 0 && price < lowerThreshold) {
            shouldExecute = true;
        }

        if (shouldExecute && actionType == 1) {
            // Action: emit event only (can be extended for actual actions)
            emit AgentActionExecuted(assetId, price, upperThreshold, true);
            executed = true;
        } else {
            emit AgentActionExecuted(assetId, price, upperThreshold, false);
            executed = false;
        }

        return (executed, price);
    }

    /**
     * @notice Update price cache manually (only owner)
     * @param assetIds Array of asset identifiers to cache
     */
    function updatePriceCache(
        bytes32[] calldata assetIds
    ) external onlyOwner {
        for (uint256 i = 0; i < assetIds.length; i++) {
            (int256 price, uint256 timestamp) = storkOracle.getLatestPrice(
                assetIds[i]
            );
            _cachePrice(assetIds[i], price, timestamp);
        }
        lastPriceUpdate = block.timestamp;
    }

    /**
     * @notice Check if cached price is still fresh
     * @param assetId The asset identifier
     * @return isFresh True if cached price is within staleness threshold
     */
    function isCachedPriceFresh(
        bytes32 assetId
    ) external view returns (bool isFresh) {
        uint256 cachedTimestamp = cachedPriceTimestamps[assetId];
        if (cachedTimestamp == 0) {
            return false;
        }
        return (block.timestamp - cachedTimestamp) <= PRICE_STALENESS_THRESHOLD;
    }

    /**
     * @notice Get cached price for an asset
     * @param assetId The asset identifier
     * @return price The cached price
     * @return timestamp The timestamp of the cached price
     * @return isValid True if cache exists and is fresh
     */
    function getCachedPrice(
        bytes32 assetId
    )
        external
        view
        returns (int256 price, uint256 timestamp, bool isValid)
    {
        return _getCachedPrice(assetId);
    }

    // ========== Internal Functions ==========

    /**
     * @notice Internal: Cache a price
     */
    function _cachePrice(
        bytes32 assetId,
        int256 price,
        uint256 timestamp
    ) internal {
        cachedPrices[assetId] = price;
        cachedPriceTimestamps[assetId] = timestamp;
        emit PriceCached(assetId, price, timestamp);
    }

    /**
     * @notice Internal: Get cached price if valid
     */
    function _getCachedPrice(
        bytes32 assetId
    ) internal view returns (int256 price, uint256 timestamp, bool isValid) {
        price = cachedPrices[assetId];
        timestamp = cachedPriceTimestamps[assetId];

        if (timestamp == 0) {
            return (0, 0, false);
        }

        uint256 age = block.timestamp - timestamp;
        isValid = age <= PRICE_STALENESS_THRESHOLD;
        return (price, timestamp, isValid);
    }
}
