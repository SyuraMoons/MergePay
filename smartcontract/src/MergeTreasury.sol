// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/access/Ownable.sol";
import "openzeppelin-contracts/utils/ReentrancyGuard.sol";

import "./interfaces/IAddressBookModule.sol";
import "./USYCYieldManager.sol";

/**
 * @title IMessageTransmitter
 * @notice Interface for Circle CCTP MessageTransmitterV2
 * @dev Used to receive cross-chain USDC transfers via CCTP
 */
interface IMessageTransmitter {
    /**
     * @notice Receive a message from another domain
     * @param message The CCTP message bytes (from burn event)
     * @param attestation The Circle API attestation signature
     * @return success True if message was successfully processed
     */
    function receiveMessage(
        bytes calldata message,
        bytes calldata attestation
    ) external returns (bool success);

    /**
     * @notice Check if a nonce has been used
     * @param sourceDomain Source CCTP domain
     * @param nonce Message nonce
     * @return used True if nonce has been used
     */
    function usedNonces(
        uint256 sourceDomain,
        uint64 nonce
    ) external view returns (bool);
}

/**
 * @title MergeTreasury
 * @notice Receives cross-chain USDC via Circle CCTP and manages treasury
 * @dev Deployed on Arc blockchain as settlement hub for Circle Wallets integration
 */
contract MergeTreasury is Ownable, ReentrancyGuard {
    // USDC token on Arc
    IERC20 public immutable usdc;

    // CCTP MessageTransmitter on Arc
    IMessageTransmitter public immutable cctpMessageTransmitter;

    // USYC Yield Manager for earning yield on excess treasury funds
    USYCYieldManager public usycYieldManager;

    // Circle Address Book module for withdrawal allowlisting
    IAddressBookModule public addressBook;

    // Track processed CCTP messages to prevent replay attacks
    mapping(uint256 sourceDomain => mapping(uint64 nonce => bool))
        public processedCctpNonces;

    // Track user balances (address-based for existing functionality)
    mapping(address => uint256) public userBalances;

    // ========== Multi-Wallet Aggregation ==========

    // Mapping from userId to their aggregated balance
    mapping(bytes32 userId => uint256) public userIdBalances;

    // Mapping from userId to their array of approved wallet addresses
    mapping(bytes32 userId => address[] wallets) public userWallets;

    // Mapping from wallet address to userId (for reverse lookup)
    mapping(address wallet => bytes32 userId) public walletToUser;

    // Track how much has been pulled from each wallet
    mapping(address wallet => uint256) public pulledAmount;

    // Maximum number of wallets that can be registered to one userId
    uint256 public constant MAX_WALLETS_PER_USER = 50;

    // Track emergency withdrawals separately for proper accounting
    uint256 public emergencyWithdrawnTotal;

    // Track total treasury balance
    uint256 public totalTreasuryBalance;

    // Track deposits by source chain for analytics
    // Note: Payment details are emitted in events for off-chain indexing

    // Events
    event PaymentReceived(
        address indexed payer,
        uint256 amount,
        uint256 sourceChainId,
        uint256 timestamp
    );

    event CctpMessageReceived(
        address indexed sender,
        uint256 amount,
        uint32 sourceDomain,
        uint64 nonce,
        uint256 timestamp
    );

    event Withdrawal(
        address indexed user,
        uint256 amount,
        address indexed to,
        uint256 timestamp
    );

    event TreasuryDeposit(address indexed from, uint256 amount);

    // ========== Multi-Wallet Aggregation Events ==========

    event WalletRegistered(bytes32 indexed userId, address wallet);
    event FundsPulled(
        bytes32 indexed userId,
        address indexed wallet,
        uint256 amount
    );
    event WithdrawalByUserId(
        bytes32 indexed userId,
        uint256 amount,
        address indexed to,
        uint256 timestamp
    );
    event EmergencyWithdrawal(
        address indexed owner,
        uint256 amount,
        string note
    );

    // ========== Modifiers ==========

    /**
     * @notice Only allow withdrawals to addresses in Address Book (if configured)
     */
    modifier onlyAllowedAddress(address recipient) {
        if (address(addressBook) != address(0)) {
            require(
                addressBook.isAddressAllowed(recipient),
                "Address not in allowlist"
            );
        }
        _;
    }

    constructor(
        address _usdc,
        address _cctpMessageTransmitter
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");

        require(
            _cctpMessageTransmitter != address(0),
            "Invalid CCTP MessageTransmitter"
        );
        usdc = IERC20(_usdc);

        cctpMessageTransmitter = IMessageTransmitter(_cctpMessageTransmitter);
    }

    /**
     * @notice Process CCTP message and credit user balance
     * @dev Anyone can call this to deliver a CCTP transfer to a user
     * @dev Follows CEI pattern: state update before external call
     * @param message The CCTP message bytes (from burn event)
     * @param attestation The Circle API attestation signature
     */
    function receiveCctpMessage(
        bytes calldata message,
        bytes calldata attestation
    ) external nonReentrant {
        // Parse CCTP message format to get nonce and sourceDomain
        (
            uint32 version,
            address sender,
            uint256 amount,
            uint32 sourceDomain,
            uint64 nonce
        ) = _decodeCctpMessage(message);

        require(version == 2, "Invalid CCTP version");
        require(!processedCctpNonces[sourceDomain][nonce], "Already processed");

        // Mark as processed BEFORE external call (CEI pattern)
        processedCctpNonces[sourceDomain][nonce] = true;

        // Call CCTP MessageTransmitter to mint USDC to this contract
        // This will mint the USDC directly to address(this)
        bool success = cctpMessageTransmitter.receiveMessage(
            message,
            attestation
        );
        require(success, "CCTP receiveMessage failed");

        // Now the USDC has been minted to this contract
        // Credit the original sender's balance
        userBalances[sender] += amount;
        totalTreasuryBalance += amount;

        emit PaymentReceived(sender, amount, sourceDomain, block.timestamp);
        emit CctpMessageReceived(
            sender,
            amount,
            sourceDomain,
            nonce,
            block.timestamp
        );
    }

    /**
     * @notice User withdraws their balance to specified address
     * @param amount Amount to withdraw
     * @param to Destination address
     */
    function withdraw(
        uint256 amount,
        address to
    ) external nonReentrant onlyAllowedAddress(to) {
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
     * @notice Withdraw funds from userId balance
     * @dev Only wallets registered to this userId can initiate withdrawal
     * @param userId The user's identity hash (keccak256 of Circle userId)
     * @param amount The amount to withdraw
     * @param to Destination address
     */
    function withdrawByUserId(
        bytes32 userId,
        uint256 amount,
        address to
    ) external nonReentrant onlyAllowedAddress(to) {
        require(to != address(0), "Invalid destination");
        require(amount > 0, "Amount must be greater than 0");
        require(userIdBalances[userId] >= amount, "Insufficient balance");

        // Verify msg.sender is authorized to withdraw for this userId
        // Must be one of the wallets registered to this userId
        bool isAuthorized = false;
        address[] storage wallets = userWallets[userId];

        for (uint256 i = 0; i < wallets.length; i++) {
            if (wallets[i] == msg.sender) {
                isAuthorized = true;
                break;
            }
        }

        require(
            isAuthorized,
            "Not authorized: sender not registered to this userId"
        );

        // Update balances
        userIdBalances[userId] -= amount;
        totalTreasuryBalance -= amount;

        // Transfer USDC
        require(usdc.transfer(to, amount), "Transfer failed");

        emit WithdrawalByUserId(userId, amount, to, block.timestamp);
    }

    /**
     * @notice Direct deposit to treasury
     * @dev Users can deposit USDC directly from wallets already on Arc
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

    // ========== CCTP Helper Functions ==========

    /**
     * @notice Check if a CCTP message has been processed
     * @param sourceDomain Source CCTP domain
     * @param nonce Message nonce
     * @return processed True if already processed
     */
    function isCctpNonceProcessed(
        uint32 sourceDomain,
        uint64 nonce
    ) external view returns (bool) {
        return processedCctpNonces[sourceDomain][nonce];
    }

    // ========== Internal Functions ==========

    /**
     * @notice Decode CCTP V2 message to extract key fields
     * @dev Uses a wrapper format for easier ABI decoding
     * @param message The CCTP message bytes
     * @return version CCTP version (should be 2)
     * @return sender Original sender address
     * @return amount Amount of USDC transferred
     * @return sourceDomain Source CCTP domain
     * @return nonce Message nonce for replay protection
     */
    function _decodeCctpMessage(
        bytes calldata message
    )
        internal
        pure
        returns (
            uint32 version,
            address sender,
            uint256 amount,
            uint32 sourceDomain,
            uint64 nonce
        )
    {
        // Decode using the same structure as encoding
        (version, sender, amount, sourceDomain, nonce) = abi.decode(
            message,
            (uint32, address, uint256, uint32, uint64)
        );
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
        uint256 availableBalance = totalTreasuryBalance -
            emergencyWithdrawnTotal;
        require(amount <= availableBalance, "Insufficient available balance");
        require(usdc.transfer(owner(), amount), "Transfer failed");

        emergencyWithdrawnTotal += amount;

        emit EmergencyWithdrawal(
            owner(),
            amount,
            "Emergency withdrawal - accounting offset tracked"
        );
    }

    // ========== Multi-Wallet Aggregation Functions ==========

    /**
     * @notice Register a wallet to a user identity
     * @dev Maps wallet to userId for reverse lookup
     * @param userId The user's identity hash (e.g., from Circle User-Controlled Wallet)
     * @param wallet The EOA wallet address to register
     */
    function registerWallet(bytes32 userId, address wallet) external {
        require(wallet != address(0), "Invalid wallet");
        require(
            walletToUser[wallet] == bytes32(0),
            "Wallet already registered"
        );
        require(msg.sender == wallet, "Only wallet owner can register");
        require(
            userWallets[userId].length < MAX_WALLETS_PER_USER,
            "Too many wallets registered"
        );

        userWallets[userId].push(wallet);
        walletToUser[wallet] = userId;

        emit WalletRegistered(userId, wallet);
    }

    /**
     * @notice Pull USDC from an approved wallet to the treasury
     * @dev Requires prior USDC approval on the wallet
     * @param wallet The wallet address to pull from
     * @param amount The amount of USDC to pull
     */
    function pullFunds(address wallet, uint256 amount) external nonReentrant {
        bytes32 userId = walletToUser[wallet];
        require(userId != bytes32(0), "Wallet not registered");
        require(msg.sender == wallet, "Only wallet owner can pull funds");
        require(amount > 0, "Amount must be greater than 0");

        // Check if we can pull (allowance)
        uint256 currentAllowance = usdc.allowance(wallet, address(this));
        require(currentAllowance >= amount, "Insufficient allowance");

        // Pull USDC from wallet
        require(
            usdc.transferFrom(wallet, address(this), amount),
            "Transfer failed"
        );

        // Update aggregated balance
        userIdBalances[userId] += amount;
        totalTreasuryBalance += amount;
        pulledAmount[wallet] += amount;

        emit FundsPulled(userId, wallet, amount);
    }

    /**
     * @notice Get aggregated balance for a user identity
     * @dev Returns sum of treasury balance + available allowance from linked wallets
     * @param userId The user's identity hash
     * @return balance The aggregated balance
     */
    function getAggregatedBalance(
        bytes32 userId
    ) external view returns (uint256 balance) {
        balance = userIdBalances[userId];

        // Add available allowance from all linked wallets
        address[] storage wallets = userWallets[userId];
        for (uint256 i = 0; i < wallets.length; i++) {
            uint256 allowance = usdc.allowance(wallets[i], address(this));
            uint256 alreadyPulled = pulledAmount[wallets[i]];
            if (allowance > alreadyPulled) {
                uint256 availableAllowance = allowance - alreadyPulled;
                // Check actual wallet balance too
                uint256 walletBalance = usdc.balanceOf(wallets[i]);
                uint256 actuallyAvailable = walletBalance < availableAllowance
                    ? walletBalance
                    : availableAllowance;
                balance += actuallyAvailable;
            }
        }

        return balance;
    }

    /**
     * @notice Get all wallet addresses linked to a user identity
     * @param userId The user's identity hash
     * @return wallets Array of wallet addresses
     */
    function getUserWallets(
        bytes32 userId
    ) external view returns (address[] memory wallets) {
        return userWallets[userId];
    }

    // ========== POLICY-BASED TREASURY AUTOMATION ==========

    // ========== POLICY-BASED TREASURY AUTOMATION ==========

    /**
     * Treasury policy configuration
     * @dev Simplified structure for USYC-only yield generation
     */
    struct TreasuryPolicy {
        uint256 balanceThreshold; // Minimum USDC to keep in treasury
        bool enabled; // Policy active/inactive
        bool useUSYC; // true = use USYC for yield, false = use manual vault
        address vaultAddress; // For manual mode: where to send excess
        uint256 lastExecutionTime; // Track when policy last ran
        uint256 cooldownPeriod; // Minimum time between executions (prevent spam)
    }

    // User policies: one policy per user
    mapping(address => TreasuryPolicy) public userPolicies;

    /**
     * @notice Configure treasury policy
     * @param balanceThreshold Minimum USDC to keep (excess will be managed)
     * @param useUSYC true = use Circle USYC for yield, false = manual vault
     * @param vaultAddress Where to send excess if not using USYC
     * @param cooldownPeriod Minimum seconds between policy executions
     */
    function configureTreasuryPolicy(
        uint256 balanceThreshold,
        bool useUSYC,
        address vaultAddress,
        uint256 cooldownPeriod
    ) external {
        require(balanceThreshold > 0, "Threshold must be positive");

        if (!useUSYC) {
            require(vaultAddress != address(0), "Invalid vault address");
        } else {
            require(
                address(usycYieldManager) != address(0),
                "USYC manager not set"
            );
        }

        userPolicies[msg.sender] = TreasuryPolicy({
            balanceThreshold: balanceThreshold,
            enabled: true,
            useUSYC: useUSYC,
            vaultAddress: vaultAddress,
            lastExecutionTime: 0,
            cooldownPeriod: cooldownPeriod
        });

        emit PolicyConfigured(msg.sender, balanceThreshold, useUSYC);
    }

    /**
     * @notice Execute treasury policy (check and rebalance)
     * @dev Anyone can call to trigger policy execution for a user
     * @param user The user whose policy to execute
     */
    function executeTreasuryPolicy(
        address user
    ) external nonReentrant returns (bool executed) {
        TreasuryPolicy storage policy = userPolicies[user];

        require(policy.enabled, "Policy not enabled");
        require(
            block.timestamp >= policy.lastExecutionTime + policy.cooldownPeriod,
            "Cooldown not met"
        );

        uint256 currentBalance = userBalances[user];

        // Check if balance exceeds threshold
        if (currentBalance <= policy.balanceThreshold) {
            return false; // Nothing to do
        }

        uint256 excessAmount = currentBalance - policy.balanceThreshold;
        require(excessAmount > 0, "No excess to manage");

        address destination;
        string memory strategyUsed;

        if (policy.useUSYC) {
            // USYC MODE: Deposit to USYC for yield
            userBalances[user] -= excessAmount;

            // Approve USDC transfer to USYCYieldManager
            require(
                usdc.approve(address(usycYieldManager), excessAmount),
                "Approval failed"
            );

            // Deposit to USYC
            usycYieldManager.depositToUSYC(user, excessAmount);

            policy.lastExecutionTime = block.timestamp;

            emit PolicyExecuted(
                user,
                excessAmount,
                address(usycYieldManager),
                "USYC Yield",
                block.timestamp
            );

            return true;
        } else {
            // MANUAL MODE: Use vault address
            destination = policy.vaultAddress;
            strategyUsed = "Manual Vault";

            require(destination != address(0), "Invalid destination");

            // Execute transfer
            userBalances[user] -= excessAmount;
            bool success = usdc.transfer(destination, excessAmount);
            require(success, "Transfer failed");

            policy.lastExecutionTime = block.timestamp;

            emit PolicyExecuted(
                user,
                excessAmount,
                destination,
                strategyUsed,
                block.timestamp
            );

            return true;
        }
    }

    // ========== USYC Yield Functions ==========

    /**
     * @notice Withdraw funds from USYC position back to user balance
     * @dev Redeems USYC shares for USDC and adds to user balance
     * @param usycAmount Amount of USYC shares to redeem
     */
    function withdrawFromUSYC(uint256 usycAmount) external nonReentrant {
        require(usycAmount > 0, "Amount must be > 0");
        require(
            address(usycYieldManager) != address(0),
            "USYC manager not set"
        );

        // Redeem USYC to USDC via yield manager
        uint256 usdcReceived = usycYieldManager.redeemFromUSYC(
            msg.sender,
            usycAmount
        );

        // Add redeemed USDC to user balance
        userBalances[msg.sender] += usdcReceived;

        emit USYCWithdrawn(
            msg.sender,
            usycAmount,
            usdcReceived,
            block.timestamp
        );
    }

    /**
     * @notice Claim accrued yield from USYC position
     * @dev Claims yield without touching principal
     */
    function claimUSYCYield() external nonReentrant {
        require(
            address(usycYieldManager) != address(0),
            "USYC manager not set"
        );

        // Claim yield via yield manager
        uint256 yieldClaimed = usycYieldManager.claimYield(msg.sender);
        require(yieldClaimed > 0, "No yield to claim");

        // Add yield to user balance
        userBalances[msg.sender] += yieldClaimed;

        emit USYCYieldClaimed(msg.sender, yieldClaimed, block.timestamp);
    }

    /**
     * @notice Get user's USYC position details
     * @param user User address
     * @return principal Original USDC deposited
     * @return usycShares Current USYC share balance
     * @return currentValue Current USDC value
     * @return yieldAccrued Yield earned
     */
    function getUserUSYCPosition(
        address user
    )
        external
        view
        returns (
            uint256 principal,
            uint256 usycShares,
            uint256 currentValue,
            uint256 yieldAccrued
        )
    {
        if (address(usycYieldManager) == address(0)) {
            return (0, 0, 0, 0);
        }

        return usycYieldManager.getUserPosition(user);
    }

    // ========== Admin Functions ==========

    /**
     * @notice Set USYCYieldManager contract address
     * @dev Only owner can set this
     * @param _manager USYCYieldManager address
     */
    function setUSYCYieldManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Invalid manager");
        usycYieldManager = USYCYieldManager(_manager);
        emit USYCYieldManagerSet(_manager);
    }

    /**
     * @notice Set Address Book module for withdrawal allowlisting
     * @dev Only owner can set this
     * @param _addressBook Address Book module address
     */
    function setAddressBook(address _addressBook) external onlyOwner {
        addressBook = IAddressBookModule(_addressBook);
        emit AddressBookSet(_addressBook);
    }

    /**
     * @notice Get policy details for a user
     */
    function getUserPolicy(
        address user
    ) external view returns (TreasuryPolicy memory) {
        return userPolicies[user];
    }

    /**
     * @notice Check if policy can be executed
     */
    function canExecutePolicy(
        address user
    ) external view returns (bool canExecute, string memory reason) {
        TreasuryPolicy storage policy = userPolicies[user];

        if (!policy.enabled) {
            return (false, "Policy not enabled");
        }

        if (
            block.timestamp < policy.lastExecutionTime + policy.cooldownPeriod
        ) {
            return (false, "Cooldown not met");
        }

        uint256 currentBalance = userBalances[user];
        if (currentBalance <= policy.balanceThreshold) {
            return (false, "Balance below threshold");
        }

        return (true, "Ready to execute");
    }

    /**
     * @notice Disable policy
     */
    function disablePolicy() external {
        userPolicies[msg.sender].enabled = false;
        emit PolicyDisabled(msg.sender);
    }

    // ========== Address Book Management ==========

    /**
     * @notice Add an address to the withdrawal allowlist
     * @dev Only owner can manage allowlist
     * @param _address Address to add
     */
    function addAllowedWithdrawalAddress(address _address) external onlyOwner {
        require(address(addressBook) != address(0), "Address Book not set");
        require(_address != address(0), "Invalid address");

        addressBook.addAllowedAddress(_address);
        emit AllowedAddressAdded(_address);
    }

    /**
     * @notice Remove an address from the withdrawal allowlist
     * @dev Only owner can manage allowlist
     * @param _address Address to remove
     */
    function removeAllowedWithdrawalAddress(
        address _address
    ) external onlyOwner {
        require(address(addressBook) != address(0), "Address Book not set");
        require(_address != address(0), "Invalid address");

        addressBook.removeAllowedAddress(_address);
        emit AllowedAddressRemoved(_address);
    }

    /**
     * @notice Check if an address is allowed for withdrawals
     * @param _address Address to check
     * @return allowed True if address is in allowlist or if Address Book not configured
     */
    function isWithdrawalAddressAllowed(
        address _address
    ) external view returns (bool allowed) {
        if (address(addressBook) == address(0)) {
            return true; // No restriction if Address Book not set
        }
        return addressBook.isAddressAllowed(_address);
    }

    // ========== Events ==========

    event PolicyConfigured(
        address indexed user,
        uint256 balanceThreshold,
        bool useUSYC
    );

    event PolicyExecuted(
        address indexed user,
        uint256 amount,
        address indexed destination,
        string strategy,
        uint256 timestamp
    );

    event PolicyDisabled(address indexed user);

    event USYCWithdrawn(
        address indexed user,
        uint256 usycAmount,
        uint256 usdcReceived,
        uint256 timestamp
    );

    event USYCYieldClaimed(
        address indexed user,
        uint256 yieldAmount,
        uint256 timestamp
    );

    event USYCYieldManagerSet(address indexed manager);

    event AddressBookSet(address indexed addressBook);

    event AllowedAddressAdded(address indexed allowedAddress);

    event AllowedAddressRemoved(address indexed allowedAddress);
}
