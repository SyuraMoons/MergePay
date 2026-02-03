// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MergeTreasury.sol";
import "../src/interfaces/IStorkOracle.sol";
import "openzeppelin-contracts/token/ERC20/ERC20.sol";

// Mock CCTP MessageTransmitter for testing
contract MockCCTPMessageTransmitter {
    mapping(uint256 sourceDomain => mapping(uint64 nonce => bool)) public usedNonces;
    MergeTreasury public treasury;

    error AlreadyProcessed();
    error InvalidAttestation();

    constructor() {}

    function setTreasury(address _treasury) external {
        treasury = MergeTreasury(_treasury);
    }

    /**
     * @notice Mock receiveMessage - mints USDC to the calling treasury
     * @dev This simulates CCTP minting USDC to the treasury address
     */
    function receiveMessage(
        bytes calldata message,
        bytes calldata attestation
    ) external returns (bool success) {
        // Decode message to get nonce and sourceDomain
        (uint32 version, address sender, uint256 amount, uint32 sourceDomain, uint64 nonce) =
            _decodeMessage(message);

        require(version == 2, "Invalid CCTP version");
        require(!usedNonces[sourceDomain][nonce], "Already processed");

        // Mark as processed
        usedNonces[sourceDomain][nonce] = true;

        // Mint USDC to the treasury (caller)
        address usdcAddress = address(treasury.usdc());
        MockUSDC mockUsdc = MockUSDC(usdcAddress);
        mockUsdc.mint(address(treasury), amount);

        return true;
    }

    function _decodeMessage(bytes calldata message)
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
        // Decode using abi.decode (must match abi.encode format)
        (version, sender, amount, sourceDomain, nonce) = abi.decode(
            message,
            (uint32, address, uint256, uint32, uint64)
        );
    }
}

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
    MockCCTPMessageTransmitter public cctpTransmitter;

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

        // Deploy mock CCTP MessageTransmitter
        cctpTransmitter = new MockCCTPMessageTransmitter();

        // Deploy treasury
        treasury = new MergeTreasury(address(usdc), address(oracle), address(cctpTransmitter));

        // Set treasury in CCTP mock
        cctpTransmitter.setTreasury(address(treasury));

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
        // Test CCTP message reception
        uint256 amount = 100 * 10 ** 6; // 100 USDC
        uint32 sourceDomain = 0; // Ethereum Sepolia CCTP domain
        uint64 nonce = 1;

        // Create a mock CCTP message
        bytes memory message = _createMockCctpMessage(
            address(0), // burnToken (unused in new encoding)
            address(0), // mintRecipient (unused in new encoding)
            payer,
            amount,
            sourceDomain,
            nonce
        );

        bytes memory attestation = hex"01"; // Mock attestation

        // Anyone can call receiveCctpMessage to deliver a transfer
        treasury.receiveCctpMessage(message, attestation);

        // Check balances
        assertEq(treasury.userBalances(payer), amount);
        assertEq(treasury.totalTreasuryBalance(), amount);
        assertEq(treasury.getUserPaymentCount(payer), 1);

        // Check payment details
        MergeTreasury.Payment memory payment = treasury.getPayment(0);
        assertEq(payment.payer, payer);
        assertEq(payment.amount, amount);
        assertEq(payment.sourceChainId, sourceDomain);
    }

    function test_ReceiveCctpMessage_ReplayProtection() public {
        uint256 amount = 100 * 10 ** 6;
        uint32 sourceDomain = 0;
        uint64 nonce = 1;

        bytes memory message = _createMockCctpMessage(
            address(0), address(0), payer, amount, sourceDomain, nonce
        );
        bytes memory attestation = hex"01";

        // First call should succeed
        treasury.receiveCctpMessage(message, attestation);

        // Second call with same nonce should fail
        vm.expectRevert("Already processed");
        treasury.receiveCctpMessage(message, attestation);
    }

    function test_IsCctpNonceProcessed() public {
        uint256 amount = 100 * 10 ** 6;
        uint32 sourceDomain = 0;
        uint64 nonce = 1;

        bytes memory message = _createMockCctpMessage(
            address(0), address(0), payer, amount, sourceDomain, nonce
        );
        bytes memory attestation = hex"01";

        // Initially not processed
        assertFalse(treasury.isCctpNonceProcessed(sourceDomain, nonce));

        // After processing, should be true
        treasury.receiveCctpMessage(message, attestation);
        assertTrue(treasury.isCctpNonceProcessed(sourceDomain, nonce));
    }

    /**
     * @notice Helper to create a mock CCTP V2 message
     * @dev Uses abi.encode for easy decoding
     */
    function _createMockCctpMessage(
        address burnToken,
        address mintRecipient,
        address sender,
        uint256 amount,
        uint32 sourceDomain,
        uint64 nonce
    ) internal pure returns (bytes memory) {
        // Use abi.encode for easy ABI decoding
        // Note: burnToken and mintRecipient are not needed for decoding but kept for consistency
        return abi.encode(
            uint32(2),     // version (CCTP V2)
            sender,        // sender address
            amount,        // amount
            sourceDomain,  // source domain
            nonce          // nonce
        );
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

    // ========== Multi-Wallet Aggregation Tests ==========

    function test_RegisterWallet() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);

        vm.prank(wallet1);
        treasury.registerWallet(userId, wallet1);

        // Check wallet is registered
        address[] memory wallets = treasury.getUserWallets(userId);
        assertEq(wallets.length, 1);
        assertEq(wallets[0], wallet1);

        // Check reverse mapping
        bytes32 retrievedUserId = treasury.walletToUser(wallet1);
        assertEq(retrievedUserId, userId);
    }

    function test_RegisterMultipleWallets() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);
        address wallet2 = address(0x222);
        address wallet3 = address(0x333);

        vm.prank(wallet1);
        treasury.registerWallet(userId, wallet1);
        vm.prank(wallet2);
        treasury.registerWallet(userId, wallet2);
        vm.prank(wallet3);
        treasury.registerWallet(userId, wallet3);

        // Check all wallets are registered
        address[] memory wallets = treasury.getUserWallets(userId);
        assertEq(wallets.length, 3);
        assertEq(wallets[0], wallet1);
        assertEq(wallets[1], wallet2);
        assertEq(wallets[2], wallet3);
    }

    function test_RegisterWallet_InvalidAddress() public {
        bytes32 userId = keccak256("user1");

        // address(0) is caught by the invalid wallet check first
        vm.prank(owner);
        vm.expectRevert("Invalid wallet");
        treasury.registerWallet(userId, address(0));
    }

    function test_RegisterWallet_AlreadyRegistered() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);

        vm.prank(wallet1);
        treasury.registerWallet(userId, wallet1);

        // Try to register same wallet again
        vm.prank(wallet1);
        vm.expectRevert("Wallet already registered");
        treasury.registerWallet(userId, wallet1);
    }

    function test_PullFunds() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);
        uint256 amount = 100 * 10 ** 6;

        // Register wallet
        vm.prank(wallet1);
        treasury.registerWallet(userId, wallet1);

        // Mint USDC to wallet1
        usdc.mint(wallet1, amount);

        // Approve treasury to spend
        vm.prank(wallet1);
        usdc.approve(address(treasury), amount);

        // Pull funds (must be called by wallet owner)
        vm.prank(wallet1);
        treasury.pullFunds(wallet1, amount);

        // Check balances
        assertEq(treasury.userIdBalances(userId), amount);
        assertEq(treasury.pulledAmount(wallet1), amount);
        assertEq(treasury.totalTreasuryBalance(), amount);
    }

    function test_PullFunds_WalletNotRegistered() public {
        address wallet1 = address(0x111);
        uint256 amount = 100 * 10 ** 6;

        vm.prank(wallet1);
        vm.expectRevert("Wallet not registered");
        treasury.pullFunds(wallet1, amount);
    }

    function test_PullFunds_InsufficientAllowance() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);
        uint256 amount = 100 * 10 ** 6;

        // Register wallet
        vm.prank(wallet1);
        treasury.registerWallet(userId, wallet1);

        // Mint USDC to wallet1
        usdc.mint(wallet1, amount);

        // Don't approve - should fail
        vm.prank(wallet1);
        vm.expectRevert("Insufficient allowance");
        treasury.pullFunds(wallet1, amount);
    }

    function test_GetAggregatedBalance() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);
        address wallet2 = address(0x222);
        uint256 amount1 = 30 * 10 ** 6;
        uint256 amount2 = 20 * 10 ** 6;

        // Register wallets
        vm.prank(wallet1);
        treasury.registerWallet(userId, wallet1);
        vm.prank(wallet2);
        treasury.registerWallet(userId, wallet2);

        // Mint USDC to wallets
        usdc.mint(wallet1, amount1);
        usdc.mint(wallet2, amount2);

        // Approve treasury to spend
        vm.startPrank(wallet1);
        usdc.approve(address(treasury), amount1);
        vm.stopPrank();

        vm.startPrank(wallet2);
        usdc.approve(address(treasury), amount2);
        vm.stopPrank();

        // Check aggregated balance before pulling (should include allowances)
        uint256 aggBalance = treasury.getAggregatedBalance(userId);
        assertEq(aggBalance, amount1 + amount2); // 50 USDC

        // Pull from wallet1
        vm.prank(wallet1);
        treasury.pullFunds(wallet1, amount1);

        // Check aggregated balance after partial pull
        aggBalance = treasury.getAggregatedBalance(userId);
        assertEq(aggBalance, amount1 + amount2); // Still 50 USDC (30 in treasury + 20 allowance)
    }

    function test_GetAggregatedBalance_MultiplePulls() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);
        address wallet2 = address(0x222);
        uint256 amount1 = 30 * 10 ** 6;
        uint256 amount2 = 20 * 10 ** 6;

        // Register wallets
        vm.prank(wallet1);
        treasury.registerWallet(userId, wallet1);
        vm.prank(wallet2);
        treasury.registerWallet(userId, wallet2);

        // Mint USDC to wallets
        usdc.mint(wallet1, amount1);
        usdc.mint(wallet2, amount2);

        // Approve treasury to spend
        vm.startPrank(wallet1);
        usdc.approve(address(treasury), amount1);
        vm.stopPrank();

        vm.startPrank(wallet2);
        usdc.approve(address(treasury), amount2);
        vm.stopPrank();

        // Pull all funds
        vm.prank(wallet1);
        treasury.pullFunds(wallet1, amount1);
        vm.prank(wallet2);
        treasury.pullFunds(wallet2, amount2);

        // Check aggregated balance (should equal total in treasury)
        uint256 aggBalance = treasury.getAggregatedBalance(userId);
        assertEq(aggBalance, amount1 + amount2); // 50 USDC
        assertEq(treasury.userIdBalances(userId), amount1 + amount2);
    }

    function test_GetUserWallets_EmptyUser() public {
        bytes32 userId = keccak256("nonexistent");

        address[] memory wallets = treasury.getUserWallets(userId);
        assertEq(wallets.length, 0);
    }

    function test_AggregationIntegration() public {
        // Full integration test simulating real user flow
        bytes32 userId = keccak256("alice");
        address walletA = address(0xA1);
        address walletB = address(0xB2);
        address walletC = address(0xC3);
        uint256 amountA = 30 * 10 ** 6;
        uint256 amountB = 20 * 10 ** 6;
        uint256 amountC = 50 * 10 ** 6;

        // Step 1: Register wallets to user identity
        vm.prank(walletA);
        treasury.registerWallet(userId, walletA);
        vm.prank(walletB);
        treasury.registerWallet(userId, walletB);
        vm.prank(walletC);
        treasury.registerWallet(userId, walletC);

        // Step 2: Mint USDC to each wallet
        usdc.mint(walletA, amountA);
        usdc.mint(walletB, amountB);
        usdc.mint(walletC, amountC);

        // Step 3: Approve treasury on each wallet
        vm.startPrank(walletA);
        usdc.approve(address(treasury), amountA);
        vm.stopPrank();

        vm.startPrank(walletB);
        usdc.approve(address(treasury), amountB);
        vm.stopPrank();

        vm.startPrank(walletC);
        usdc.approve(address(treasury), amountC);
        vm.stopPrank();

        // Step 4: Check initial aggregated balance (all in wallets)
        uint256 aggBalance = treasury.getAggregatedBalance(userId);
        assertEq(aggBalance, amountA + amountB + amountC); // 100 USDC

        // Step 5: Pull funds from walletA
        vm.prank(walletA);
        treasury.pullFunds(walletA, amountA);

        // Step 6: Pull funds from walletB
        vm.prank(walletB);
        treasury.pullFunds(walletB, amountB);

        // Step 7: Check aggregated balance (partial pull)
        aggBalance = treasury.getAggregatedBalance(userId);
        assertEq(aggBalance, amountA + amountB + amountC); // Still 100 USDC

        // Step 8: Pull remaining from walletC
        vm.prank(walletC);
        treasury.pullFunds(walletC, amountC);

        // Step 9: Final aggregated balance
        aggBalance = treasury.getAggregatedBalance(userId);
        assertEq(aggBalance, amountA + amountB + amountC); // 100 USDC
        assertEq(treasury.userIdBalances(userId), amountA + amountB + amountC);

        // Step 10: User can withdraw from aggregated balance via withdrawByUserId
        uint256 withdrawAmount = 40 * 10 ** 6;
        uint256 walletABalanceBefore = usdc.balanceOf(walletA);

        // walletA can withdraw on behalf of userId
        vm.prank(walletA);
        treasury.withdrawByUserId(userId, withdrawAmount, walletA);

        uint256 walletABalanceAfter = usdc.balanceOf(walletA);
        assertEq(walletABalanceAfter - walletABalanceBefore, withdrawAmount);
        assertEq(treasury.userIdBalances(userId), 60 * 10 ** 6); // 100 - 40
    }

    // ========== Security Tests ==========

    function test_RegisterWallet_SelfRegistrationOnly() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);

        // Should fail when caller is not the wallet owner
        vm.prank(owner);
        vm.expectRevert("Only wallet owner can register");
        treasury.registerWallet(userId, wallet1);

        // Should succeed when wallet owner calls
        vm.prank(wallet1);
        treasury.registerWallet(userId, wallet1);

        assertEq(treasury.walletToUser(wallet1), userId);
    }

    function test_PullFunds_SelfPullOnly() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);
        uint256 amount = 100 * 10**6;

        vm.prank(wallet1);
        treasury.registerWallet(userId, wallet1);

        usdc.mint(wallet1, amount);
        vm.prank(wallet1);
        usdc.approve(address(treasury), amount);

        // Should fail when caller is not the wallet owner
        vm.prank(owner);
        vm.expectRevert("Only wallet owner can pull funds");
        treasury.pullFunds(wallet1, amount);

        // Should succeed when wallet owner calls
        vm.prank(wallet1);
        treasury.pullFunds(wallet1, amount);

        assertEq(treasury.userIdBalances(userId), amount);
    }

    function test_WithdrawByUserId_OnlyRegisteredWallet() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);
        address wallet2 = address(0x222);
        address attacker = address(0x999);
        uint256 amount = 100 * 10**6;

        // Register two wallets to same userId
        vm.startPrank(wallet1);
        treasury.registerWallet(userId, wallet1);
        vm.stopPrank();

        vm.startPrank(wallet2);
        treasury.registerWallet(userId, wallet2);
        vm.stopPrank();

        // Deposit funds to userId
        vm.prank(wallet1);
        usdc.approve(address(treasury), amount);
        usdc.mint(wallet1, amount);
        vm.prank(wallet1);
        treasury.pullFunds(wallet1, amount);

        // Random attacker should not be able to withdraw
        vm.prank(attacker);
        vm.expectRevert("Not authorized: sender not registered to this userId");
        treasury.withdrawByUserId(userId, amount, attacker);

        // wallet1 should be able to withdraw
        uint256 balanceBefore = usdc.balanceOf(wallet2);
        vm.prank(wallet1); // wallet1 initiates, sends to wallet2
        treasury.withdrawByUserId(userId, amount, wallet2);
        uint256 balanceAfter = usdc.balanceOf(wallet2);

        assertEq(balanceAfter - balanceBefore, amount);
    }

    function test_EmergencyWithdraw_SeparateAccounting() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);
        uint256 amount = 400 * 10**6;

        // Deposit funds
        vm.startPrank(wallet1);
        treasury.registerWallet(userId, wallet1);
        usdc.mint(wallet1, amount);
        usdc.approve(address(treasury), amount);
        treasury.pullFunds(wallet1, amount);
        vm.stopPrank();

        uint256 totalBefore = treasury.totalTreasuryBalance();
        assertEq(totalBefore, amount);
        assertEq(treasury.emergencyWithdrawnTotal(), 0);

        // Emergency withdraw
        uint256 ownerBalanceBefore = usdc.balanceOf(owner);
        uint256 emergencyAmount = 100 * 10**6;

        vm.prank(owner);
        treasury.emergencyWithdraw(emergencyAmount);

        uint256 ownerBalanceAfter = usdc.balanceOf(owner);
        assertEq(ownerBalanceAfter - ownerBalanceBefore, emergencyAmount);
        assertEq(treasury.emergencyWithdrawnTotal(), emergencyAmount);

        // totalTreasuryBalance should not change
        assertEq(treasury.totalTreasuryBalance(), amount);

        // Second emergency withdraw should check available balance
        vm.prank(owner);
        treasury.emergencyWithdraw(emergencyAmount);

        assertEq(treasury.emergencyWithdrawnTotal(), emergencyAmount * 2);
    }

    function test_RegisterWallet_MaxWalletsLimit() public {
        bytes32 userId = keccak256("user1");

        // Register MAX_WALLETS_PER_USER wallets
        for (uint256 i = 0; i < 50; i++) {
            address wallet = address(uint160(i + 1));
            vm.prank(wallet);
            treasury.registerWallet(userId, wallet);
        }

        // Try to register one more - should fail
        address extraWallet = address(0x999);
        vm.prank(extraWallet);
        vm.expectRevert("Too many wallets registered");
        treasury.registerWallet(userId, extraWallet);
    }

    function test_GetAggregatedBalance_ChecksWalletBalance() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);
        uint256 allowanceAmount = 1000 * 10**6;
        uint256 actualBalance = 50 * 10**6;

        vm.prank(wallet1);
        treasury.registerWallet(userId, wallet1);

        // Approve more than wallet actually has
        vm.prank(wallet1);
        usdc.approve(address(treasury), allowanceAmount);
        // But only mint smaller amount
        usdc.mint(wallet1, actualBalance);

        // Aggregated balance should use actual wallet balance
        uint256 aggBalance = treasury.getAggregatedBalance(userId);
        assertEq(aggBalance, actualBalance); // Should be 50, not 1000
    }

    function test_WithdrawByUserId_InsufficientBalance() public {
        bytes32 userId = keccak256("user1");
        address wallet1 = address(0x111);
        uint256 amount = 100 * 10**6;

        vm.prank(wallet1);
        treasury.registerWallet(userId, wallet1);

        // Should fail with no balance
        vm.prank(wallet1);
        vm.expectRevert("Insufficient balance");
        treasury.withdrawByUserId(userId, amount, wallet1);
    }
}
