// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/access/Ownable.sol";
import "openzeppelin-contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IUSYCTeller.sol";

/**
 * @title USYCYieldManager
 * @notice Manages USDC → USYC conversions for yield generation via Circle's tokenized treasury fund
 * @dev Integrates with Circle USYC Teller to deposit/redeem funds
 * @dev Tracks user positions and yield separately for manual claiming
 */
contract USYCYieldManager is Ownable, ReentrancyGuard {
    // ========== State Variables ==========

    /// @notice Circle's USYC Teller contract (handles deposits/redemptions)
    IUSYCTeller public immutable usycTeller;

    /// @notice USDC token contract
    IERC20 public immutable usdc;

    /// @notice USYC token contract (ERC-20 representing treasury fund shares)
    IERC20 public immutable usyc;

    /// @notice MergeTreasury contract (only address allowed to deposit/redeem)
    address public immutable mergeTreasury;

    /// @notice Track user's principal deposit (USDC amount originally deposited)
    mapping(address => uint256) public userPrincipal;

    /// @notice Track user's USYC share balance
    mapping(address => uint256) public userUSYCBalance;

    /// @notice Total USYC shares managed by this contract
    uint256 public totalUSYCManaged;

    /// @notice Total principal deposited (for accounting)
    uint256 public totalPrincipal;

    // ========== Events ==========

    event DepositedToUSYC(
        address indexed user,
        uint256 usdcAmount,
        uint256 usycShares,
        uint256 timestamp
    );

    event RedeemedFromUSYC(
        address indexed user,
        uint256 usycShares,
        uint256 usdcAmount,
        uint256 timestamp
    );

    event YieldClaimed(
        address indexed user,
        uint256 yieldAmount,
        uint256 timestamp
    );

    // ========== Constructor ==========

    /**
     * @notice Initialize the USYC Yield Manager
     * @param _usycTeller Circle's USYC Teller contract address
     * @param _usdc USDC token address
     * @param _usyc USYC token address
     * @param _mergeTreasury MergeTreasury contract address
     */
    constructor(
        address _usycTeller,
        address _usdc,
        address _usyc,
        address _mergeTreasury
    ) Ownable(msg.sender) {
        require(_usycTeller != address(0), "Invalid USYC Teller");
        require(_usdc != address(0), "Invalid USDC");
        require(_usyc != address(0), "Invalid USYC");
        require(_mergeTreasury != address(0), "Invalid MergeTreasury");

        usycTeller = IUSYCTeller(_usycTeller);
        usdc = IERC20(_usdc);
        usyc = IERC20(_usyc);
        mergeTreasury = _mergeTreasury;
    }

    // ========== Modifiers ==========

    /**
     * @notice Only MergeTreasury can deposit/redeem
     */
    modifier onlyMergeTreasury() {
        require(msg.sender == mergeTreasury, "Only MergeTreasury");
        _;
    }

    // ========== External Functions ==========

    /**
     * @notice Deposit USDC to USYC for a user
     * @dev Called by MergeTreasury when policy is executed
     * @param user User address to track position for
     * @param usdcAmount Amount of USDC to convert to USYC
     * @return usycShares Amount of USYC shares received
     */
    function depositToUSYC(
        address user,
        uint256 usdcAmount
    ) external onlyMergeTreasury nonReentrant returns (uint256 usycShares) {
        require(user != address(0), "Invalid user");
        require(usdcAmount > 0, "Amount must be > 0");

        // Transfer USDC from MergeTreasury to this contract
        require(
            usdc.transferFrom(msg.sender, address(this), usdcAmount),
            "USDC transfer failed"
        );

        // Approve USYC Teller to spend USDC
        require(usdc.approve(address(usycTeller), usdcAmount), "Approval failed");

        // Deposit USDC to receive USYC shares
        usycShares = usycTeller.deposit(usdcAmount, address(this));
        require(usycShares > 0, "No USYC shares received");

        // Update user position tracking
        userPrincipal[user] += usdcAmount;
        userUSYCBalance[user] += usycShares;
        totalPrincipal += usdcAmount;
        totalUSYCManaged += usycShares;

        emit DepositedToUSYC(user, usdcAmount, usycShares, block.timestamp);

        return usycShares;
    }

    /**
     * @notice Redeem USYC shares back to USDC
     * @dev Called by MergeTreasury when user withdraws
     * @param user User address whose position to redeem
     * @param usycAmount Amount of USYC shares to redeem
     * @return usdcReceived Amount of USDC received from redemption
     */
    function redeemFromUSYC(
        address user,
        uint256 usycAmount
    ) external onlyMergeTreasury nonReentrant returns (uint256 usdcReceived) {
        require(user != address(0), "Invalid user");
        require(usycAmount > 0, "Amount must be > 0");
        require(userUSYCBalance[user] >= usycAmount, "Insufficient USYC balance");

        // Approve USYC Teller to burn USYC shares
        require(usyc.approve(address(usycTeller), usycAmount), "USYC approval failed");

        // Redeem USYC for USDC
        usdcReceived = usycTeller.redeem(
            usycAmount,
            mergeTreasury, // Send USDC directly to MergeTreasury
            address(this)  // Burn USYC from this contract
        );
        require(usdcReceived > 0, "No USDC received");

        // Calculate how much principal is being redeemed
        uint256 principalRedeemed = (userPrincipal[user] * usycAmount) / userUSYCBalance[user];

        // Update user position
        userUSYCBalance[user] -= usycAmount;
        userPrincipal[user] -= principalRedeemed;
        totalUSYCManaged -= usycAmount;
        totalPrincipal -= principalRedeemed;

        emit RedeemedFromUSYC(user, usycAmount, usdcReceived, block.timestamp);

        return usdcReceived;
    }

    /**
     * @notice Claim accrued yield for a user
     * @dev Calculates yield as (current USYC value - principal), redeems only yield portion
     * @param user User address to claim yield for
     * @return yieldClaimed Amount of USDC yield claimed
     */
    function claimYield(
        address user
    ) external onlyMergeTreasury nonReentrant returns (uint256 yieldClaimed) {
        require(user != address(0), "Invalid user");
        require(userUSYCBalance[user] > 0, "No position to claim from");

        // Get current value of user's USYC position in USDC
        uint256 currentValue = usycTeller.previewRedeem(userUSYCBalance[user]);
        uint256 principal = userPrincipal[user];

        require(currentValue > principal, "No yield to claim");

        // Calculate yield
        uint256 yieldAmount = currentValue - principal;

        // Calculate how many USYC shares represent the yield
        uint256 usycSharesForYield = (userUSYCBalance[user] * yieldAmount) / currentValue;

        // Approve USYC Teller to burn USYC shares
        require(usyc.approve(address(usycTeller), usycSharesForYield), "USYC approval failed");

        // Redeem only the yield portion
        uint256 usdcReceived = usycTeller.redeem(
            usycSharesForYield,
            mergeTreasury, // Send USDC to MergeTreasury
            address(this)  // Burn USYC from this contract
        );

        // Update user position (only reduce USYC shares, principal stays same)
        userUSYCBalance[user] -= usycSharesForYield;
        totalUSYCManaged -= usycSharesForYield;

        emit YieldClaimed(user, usdcReceived, block.timestamp);

        return usdcReceived;
    }

    // ========== View Functions ==========

    /**
     * @notice Get user's USYC position details
     * @param user User address
     * @return principal Original USDC deposited
     * @return usycShares Current USYC share balance
     * @return currentValue Current USDC value of USYC shares
     * @return yieldAccrued Yield earned (currentValue - principal)
     */
    function getUserPosition(
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
        principal = userPrincipal[user];
        usycShares = userUSYCBalance[user];

        if (usycShares > 0) {
            currentValue = usycTeller.previewRedeem(usycShares);
            yieldAccrued = currentValue > principal ? currentValue - principal : 0;
        } else {
            currentValue = 0;
            yieldAccrued = 0;
        }

        return (principal, usycShares, currentValue, yieldAccrued);
    }

    /**
     * @notice Calculate accrued yield for a user
     * @param user User address
     * @return yieldAmount Yield earned in USDC
     */
    function calculateYield(address user) external view returns (uint256 yieldAmount) {
        if (userUSYCBalance[user] == 0) {
            return 0;
        }

        uint256 currentValue = usycTeller.previewRedeem(userUSYCBalance[user]);
        uint256 principal = userPrincipal[user];

        return currentValue > principal ? currentValue - principal : 0;
    }

    /**
     * @notice Get total USYC managed by this contract
     * @return totalShares Total USYC shares
     * @return totalValue Total USDC value
     */
    function getTotalManaged()
        external
        view
        returns (uint256 totalShares, uint256 totalValue)
    {
        totalShares = totalUSYCManaged;
        totalValue = totalUSYCManaged > 0 ? usycTeller.previewRedeem(totalUSYCManaged) : 0;

        return (totalShares, totalValue);
    }
}
