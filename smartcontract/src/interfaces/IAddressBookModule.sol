// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAddressBookModule
 * @notice Interface for Circle's Address Book module (ERC-6900)
 * @dev Used to restrict withdrawals to approved addresses only
 */
interface IAddressBookModule {
    /**
     * @notice Check if an address is allowed for withdrawals
     * @param _address Address to check
     * @return allowed True if address is in the allowlist
     */
    function isAddressAllowed(address _address) external view returns (bool allowed);

    /**
     * @notice Add an address to the allowlist
     * @dev Only authorized accounts can add addresses
     * @param _address Address to add
     */
    function addAllowedAddress(address _address) external;

    /**
     * @notice Remove an address from the allowlist
     * @dev Only authorized accounts can remove addresses
     * @param _address Address to remove
     */
    function removeAllowedAddress(address _address) external;
}
