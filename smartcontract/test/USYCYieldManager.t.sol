// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/USYCYieldManager.sol";
import "../src/interfaces/IUSYCTeller.sol";
import "openzeppelin-contracts/token/ERC20/IERC20.sol";

/**
 * @title USYCYieldManagerTest
 * @notice Unit tests for USYCYieldManager contract
 */
contract USYCYieldManagerTest is Test {
    USYCYieldManager public yieldManager;

    // Mock contracts
    MockUSYCTeller public mockTeller;
    MockERC20 public mockUSDC;
    MockERC20 public mockUSYC;
    address public mockTreasury;
    address public testUser;

    function setUp() public {
        // Setup mock contracts
        mockUSDC = new MockERC20("USD Coin", "USDC", 6);
        mockUSYC = new MockERC20("Circle Yield", "USYC", 6);
        mockTeller = new MockUSYCTeller(address(mockUSDC), address(mockUSYC));
        mockTreasury = address(0x123);
        testUser = address(0x456);

        // Deploy yield manager
        yieldManager = new USYCYieldManager(
            address(mockTeller),
            address(mockUSDC),
            address(mockUSYC),
            mockTreasury
        );

        // Setup initial balances
        mockUSDC.mint(mockTreasury, 1000000e6); // 1M USDC
        mockUSYC.mint(address(mockTeller), 1000000e6); // 1M USYC for mocking
    }

    function testDepositToUSYC() public {
        uint256 depositAmount = 1000e6; // 1000 USDC

        // Approve and transfer to treasury
        vm.startPrank(mockTreasury);
        mockUSDC.approve(address(yieldManager), depositAmount);

        // Deposit
        uint256 usycReceived = yieldManager.depositToUSYC(testUser, depositAmount);

        // Verify USYC shares received
        assertGt(usycReceived, 0, "Should receive USYC shares");
        assertEq(yieldManager.userPrincipal(testUser), depositAmount, "Principal should be tracked");
        assertEq(yieldManager.userUSYCBalance(testUser), usycReceived, "USYC balance should be updated");
        vm.stopPrank();
    }

    function testRedeemFromUSYC() public {
        // First deposit
        uint256 depositAmount = 1000e6;
        vm.startPrank(mockTreasury);
        mockUSDC.approve(address(yieldManager), depositAmount);
        uint256 usycReceived = yieldManager.depositToUSYC(testUser, depositAmount);

        // Redeem half
        uint256 redeemAmount = usycReceived / 2;
        uint256 usdcReceived = yieldManager.redeemFromUSYC(testUser, redeemAmount);

        // Verify balances
        assertGt(usdcReceived, 0, "Should receive USDC");
        assertEq(yieldManager.userUSYCBalance(testUser), usycReceived - redeemAmount, "USYC balance should be reduced");
        vm.stopPrank();
    }

    function testGetUserPosition() public {
        // Deposit
        uint256 depositAmount = 1000e6;
        vm.startPrank(mockTreasury);
        mockUSDC.approve(address(yieldManager), depositAmount);
        yieldManager.depositToUSYC(testUser, depositAmount);

        // Get position
        (
            uint256 principal,
            uint256 usycShares,
            uint256 currentValue,
            uint256 yieldAccrued
        ) = yieldManager.getUserPosition(testUser);

        assertEq(principal, depositAmount, "Principal should match deposit");
        assertGt(usycShares, 0, "Should have USYC shares");
        assertGt(currentValue, 0, "Should have current value");
        vm.stopPrank();
    }

    function testOnlyMergeTreasuryCanDeposit() public {
        uint256 depositAmount = 1000e6;

        vm.startPrank(testUser);
        vm.expectRevert("Only MergeTreasury");
        yieldManager.depositToUSYC(testUser, depositAmount);
        vm.stopPrank();
    }

    function testOnlyMergeTreasuryCanRedeem() public {
        uint256 depositAmount = 1000e6;

        vm.startPrank(testUser);
        vm.expectRevert("Only MergeTreasury");
        yieldManager.redeemFromUSYC(testUser, depositAmount);
        vm.stopPrank();
    }

    function testCannotRedeemMoreThanBalance() public {
        uint256 depositAmount = 1000e6;

        vm.startPrank(mockTreasury);
        mockUSDC.approve(address(yieldManager), depositAmount);
        uint256 usycReceived = yieldManager.depositToUSYC(testUser, depositAmount);

        // Try to redeem more than balance
        vm.expectRevert("Insufficient USYC balance");
        yieldManager.redeemFromUSYC(testUser, usycReceived + 1);
        vm.stopPrank();
    }
}

// ========== Mock Contracts ==========

contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external {
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(_balances[from] >= amount, "Insufficient balance");
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = _allowances[owner][spender];
        require(currentAllowance >= amount, "Insufficient allowance");
        _approve(owner, spender, currentAllowance - amount);
    }
}

contract MockUSYCTeller is IUSYCTeller {
    IERC20 public usdc;
    IERC20 public usyc;

    // 1 USDC = 1 USYC for simplicity (can be adjusted for yield simulation)
    uint256 public constant EXCHANGE_RATE = 1e6; // 1:1

    constructor(address _usdc, address _usyc) {
        usdc = IERC20(_usdc);
        usyc = IERC20(_usyc);
    }

    function deposit(uint256 _assets, address _receiver) external override returns (uint256 shares) {
        // Transfer USDC from caller
        require(usdc.transferFrom(msg.sender, address(this), _assets), "USDC transfer failed");

        // Calculate shares (1:1 for simplicity)
        shares = _assets;

        // Transfer USYC shares to receiver
        require(usyc.transfer(_receiver, shares), "USYC transfer failed");

        return shares;
    }

    function redeem(uint256 _shares, address _receiver, address _account) external override returns (uint256 assets) {
        // Transfer USYC from account
        require(usyc.transferFrom(_account, address(this), _shares), "USYC transfer failed");

        // Calculate assets (1:1 for simplicity, could add yield simulation here)
        assets = _shares;

        // Transfer USDC to receiver
        require(usdc.transfer(_receiver, assets), "USDC transfer failed");

        return assets;
    }

    function previewDeposit(uint256 _assets) external pure override returns (uint256 shares) {
        return _assets; // 1:1
    }

    function previewRedeem(uint256 _shares) external pure override returns (uint256 assets) {
        return _shares; // 1:1
    }
}
