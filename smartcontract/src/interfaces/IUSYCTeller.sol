// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IUSYCTeller
 * @notice Interface for Circle's USYC Teller contract
 * @dev Handles deposits (USDC → USYC) and redemptions (USYC → USDC)
 */
interface IUSYCTeller {
    /**
     * @notice Deposit USDC to receive USYC shares
     * @param _assets Amount of USDC to deposit
     * @param _receiver Address to receive USYC shares
     * @return shares Amount of USYC shares minted
     */
    function deposit(uint256 _assets, address _receiver) external returns (uint256 shares);

    /**
     * @notice Redeem USYC shares for USDC
     * @param _shares Amount of USYC shares to redeem
     * @param _receiver Address to receive USDC
     * @param _account Account from which shares are burned
     * @return assets Amount of USDC received
     */
    function redeem(uint256 _shares, address _receiver, address _account) external returns (uint256 assets);

    /**
     * @notice Preview how many shares will be received for a deposit
     * @param _assets Amount of USDC to deposit
     * @return shares Expected USYC shares
     */
    function previewDeposit(uint256 _assets) external view returns (uint256 shares);

    /**
     * @notice Preview how much USDC will be received for a redemption
     * @param _shares Amount of USYC shares to redeem
     * @return assets Expected USDC amount
     */
    function previewRedeem(uint256 _shares) external view returns (uint256 assets);
}
