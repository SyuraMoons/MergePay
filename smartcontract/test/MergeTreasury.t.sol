// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MergeTreasury.sol";
import "../src/interfaces/IStorkOracle.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

// Mock USDC for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1_000_000 * 10 ** 6); // 1M USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Mock Stork Oracle for testing
contract MockStorkOracle is IStorkOracle {
    mapping(bytes32 => int256) private prices;
    mapping(bytes32 => uint256) private timestamps;

    function setPrice(
        bytes32 assetId,
        int256 price,
        uint256 timestamp
    ) external {
        prices[assetId] = price;
        timestamps[assetId] = timestamp;
    }

    function getLatestPrice(
        bytes32 assetId
    ) external view override returns (int256 price, uint256 timestamp) {
        price = prices[assetId];
        timestamp = timestamps[assetId];
    }

    function getPriceAtTimestamp(
        bytes32 assetId,
        uint256 timestamp
    ) external view override returns (int256 price) {
        // For simplicity, return current price regardless of timestamp
        return prices[assetId];
    }

    function getLatestPrices(
        bytes32[] calldata assetIds
    )
        external
        view
        override
        returns (int256[] memory prices_, uint256[] memory timestamps_)
    {
        prices_ = new int256[](assetIds.length);
        timestamps_ = new uint256[](assetIds.length);
        for (uint256 i = 0; i < assetIds.length; i++) {
            prices_[i] = prices[assetIds[i]];
            timestamps_[i] = timestamps[assetIds[i]];
        }
    }

    function isPriceFresh(
        bytes32 assetId,
        uint256 maxAge
    ) external view override returns (bool isFresh) {
        uint256 priceTimestamp = timestamps[assetId];
        return (block.timestamp - priceTimestamp) <= maxAge;
    }
}

contract MergeTreasuryTest is Test {
    MergeTreasury public treasury;
    MockUSDC public usdc;
    MockStorkOracle public oracle;

    address public owner = address(1);
    address public user = address(2);
    address public payer = address(3);

    bytes32 constant ETH_USD = keccak256("ETH/USD");
    bytes32 constant BTC_USD = keccak256("BTC/USD");

    function setUp() public {
        vm.startPrank(owner);

        // Deploy mock USDC
        usdc = new MockUSDC();

        // Deploy mock oracle
        oracle = new MockStorkOracle();

        // Deploy treasury
        treasury = new MergeTreasury(address(usdc), address(oracle));

        vm.stopPrank();

        // Give user some USDC
        usdc.mint(user, 1000 * 10 ** 6); // 1000 USDC
        usdc.mint(payer, 500 * 10 ** 6); // 500 USDC

        // Set initial prices
        vm.startPrank(owner);
        oracle.setPrice(ETH_USD, 3000 * 1e8, block.timestamp); // $3000
        oracle.setPrice(BTC_USD, 50000 * 1e8, block.timestamp); // $50000
        vm.stopPrank();
    }

    function test_ReceivePayment() public {
        uint256 amount = 100 * 10 ** 6; // 100 USDC
        uint256 sourceChainId = 84532; // Base Sepolia

        // Payer approves treasury
        vm.startPrank(payer);
        usdc.approve(address(treasury), amount);

        // Simulate LI.FI contract calling receivePayment
        // In real scenario, LI.FI router would call this
        treasury.receivePayment(payer, amount, sourceChainId);
        vm.stopPrank();

        // Check balances
        assertEq(treasury.userBalances(payer), amount);
        assertEq(treasury.totalTreasuryBalance(), amount);
        assertEq(treasury.getUserPaymentCount(payer), 1);

        // Check payment details
        MergeTreasury.Payment memory payment = treasury.getPayment(0);
        assertEq(payment.payer, payer);
        assertEq(payment.amount, amount);
        assertEq(payment.sourceChainId, sourceChainId);
    }

    function test_Deposit() public {
        uint256 amount = 200 * 10 ** 6;

        vm.startPrank(user);
        usdc.approve(address(treasury), amount);
        treasury.deposit(amount);
        vm.stopPrank();

        assertEq(treasury.userBalances(user), amount);
    }

    function test_Withdraw() public {
        // First deposit
        uint256 depositAmount = 300 * 10 ** 6;
        vm.startPrank(user);
        usdc.approve(address(treasury), depositAmount);
        treasury.deposit(depositAmount);

        // Then withdraw
        uint256 withdrawAmount = 100 * 10 ** 6;
        uint256 balanceBefore = usdc.balanceOf(user);

        treasury.withdraw(withdrawAmount, user);
        vm.stopPrank();

        uint256 balanceAfter = usdc.balanceOf(user);
        assertEq(balanceAfter - balanceBefore, withdrawAmount);
        assertEq(treasury.userBalances(user), depositAmount - withdrawAmount);
    }

    function test_InsufficientBalanceWithdraw() public {
        vm.startPrank(user);
        vm.expectRevert("Insufficient balance");
        treasury.withdraw(100 * 10 ** 6, user);
        vm.stopPrank();
    }

    function test_GetContractBalance() public {
        uint256 amount = 500 * 10 ** 6;
        usdc.mint(address(treasury), amount);

        assertEq(treasury.getContractBalance(), amount);
    }

    function test_EmergencyWithdraw() public {
        uint256 amount = 400 * 10 ** 6;

        // First, deposit funds to the treasury (updates totalTreasuryBalance)
        vm.startPrank(user);
        usdc.approve(address(treasury), amount);
        treasury.deposit(amount);
        vm.stopPrank();

        uint256 ownerBalanceBefore = usdc.balanceOf(owner);

        // Now owner can emergency withdraw
        vm.prank(owner);
        treasury.emergencyWithdraw(amount);

        uint256 ownerBalanceAfter = usdc.balanceOf(owner);
        assertEq(ownerBalanceAfter - ownerBalanceBefore, amount);
    }

    function test_EmergencyWithdrawNotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        treasury.emergencyWithdraw(100);
    }

    // ========== Oracle Tests ==========

    function test_GetPrice_NoCache() public {
        (int256 price, uint256 timestamp) = treasury.getPrice(ETH_USD, false);

        assertEq(price, 3000 * 1e8);
        assertEq(timestamp, block.timestamp);
    }

    function test_GetPrice_WithCache() public {
        // First call caches the price
        treasury.getPrice(ETH_USD, false);

        // Second call with useCache=true should return cached price
        (int256 price, uint256 timestamp) = treasury.getPrice(ETH_USD, true);

        assertEq(price, 3000 * 1e8);
        assertEq(timestamp, block.timestamp);
    }

    function test_GetMultiplePrices() public {
        bytes32[] memory assetIds = new bytes32[](2);
        assetIds[0] = ETH_USD;
        assetIds[1] = BTC_USD;

        (int256[] memory prices, uint256[] memory timestamps) = treasury
            .getMultiplePrices(assetIds, false);

        assertEq(prices.length, 2);
        assertEq(prices[0], 3000 * 1e8);
        assertEq(prices[1], 50000 * 1e8);
    }

    function test_CheckPriceAndExecute_UpperThreshold() public {
        // Set threshold to $2500, current price is $3000
        int256 upperThreshold = 2500 * 1e8;
        int256 lowerThreshold = 0;

        (bool executed, int256 price) = treasury.checkPriceAndExecute(
            ETH_USD,
            upperThreshold,
            lowerThreshold,
            1 // action type 1 = emit event
        );

        assertTrue(executed);
        assertEq(price, 3000 * 1e8);
    }

    function test_CheckPriceAndExecute_LowerThreshold() public {
        // Set lower threshold to $3500, current price is $3000 (below threshold)
        int256 upperThreshold = 0;
        int256 lowerThreshold = 3500 * 1e8;

        (bool executed, int256 price) = treasury.checkPriceAndExecute(
            ETH_USD,
            upperThreshold,
            lowerThreshold,
            1
        );

        assertTrue(executed);
        assertEq(price, 3000 * 1e8);
    }

    function test_CheckPriceAndExecute_NoThresholdCrossed() public {
        // Set thresholds that current price doesn't cross
        int256 upperThreshold = 4000 * 1e8;
        int256 lowerThreshold = 2000 * 1e8;

        (bool executed, int256 price) = treasury.checkPriceAndExecute(
            ETH_USD,
            upperThreshold,
            lowerThreshold,
            1
        );

        assertFalse(executed);
        assertEq(price, 3000 * 1e8);
    }

    function test_IsCachedPriceFresh() public {
        // Initially no cache
        assertFalse(treasury.isCachedPriceFresh(ETH_USD));

        // Cache a price
        treasury.getPrice(ETH_USD, false);

        // Cache should be fresh
        assertTrue(treasury.isCachedPriceFresh(ETH_USD));

        // Fast forward past staleness threshold
        vm.warp(block.timestamp + 61);

        // Cache should be stale
        assertFalse(treasury.isCachedPriceFresh(ETH_USD));
    }

    function test_GetCachedPrice() public {
        // Initially no cache
        (int256 price, uint256 timestamp, bool isValid) = treasury
            .getCachedPrice(ETH_USD);
        assertEq(price, 0);
        assertEq(timestamp, 0);
        assertFalse(isValid);

        // Cache a price
        treasury.getPrice(ETH_USD, false);

        // Should return cached price
        (price, timestamp, isValid) = treasury.getCachedPrice(ETH_USD);
        assertEq(price, 3000 * 1e8);
        assertTrue(isValid);
    }

    function test_UpdatePriceCache() public {
        bytes32[] memory assetIds = new bytes32[](2);
        assetIds[0] = ETH_USD;
        assetIds[1] = BTC_USD;

        vm.prank(owner);
        treasury.updatePriceCache(assetIds);

        // Check prices were cached
        (int256 price, uint256 timestamp, bool isValid) = treasury
            .getCachedPrice(ETH_USD);
        assertEq(price, 3000 * 1e8);
        assertTrue(isValid);

        (price, timestamp, isValid) = treasury.getCachedPrice(BTC_USD);
        assertEq(price, 50000 * 1e8);
        assertTrue(isValid);
    }

    function test_UpdatePriceCache_NotOwner() public {
        bytes32[] memory assetIds = new bytes32[](1);
        assetIds[0] = ETH_USD;

        vm.prank(user);
        vm.expectRevert();
        treasury.updatePriceCache(assetIds);
    }
}
