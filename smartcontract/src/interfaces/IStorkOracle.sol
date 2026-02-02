// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStorkOracle
 * @notice Interface for Stork Oracle price feed
 * @dev Stork provides high-frequency, low-latency price data on-chain
 */
interface IStorkOracle {
    /**
     * @notice Get the latest price for an asset
     * @param assetId The asset identifier (e.g., keccak256("ETH/USD"))
     * @return price The latest price as a signed 256-bit integer
     * @return timestamp The timestamp of the price update
     */
    function getLatestPrice(
        bytes32 assetId
    ) external view returns (int256 price, uint256 timestamp);

    /**
     * @notice Get the price for an asset at a specific timestamp
     * @param assetId The asset identifier
     * @param timestamp The timestamp to query
     * @return price The price at the given timestamp
     */
    function getPriceAtTimestamp(
        bytes32 assetId,
        uint256 timestamp
    ) external view returns (int256 price);

    /**
     * @notice Get multiple latest prices in a single call
     * @param assetIds Array of asset identifiers
     * @return prices Array of prices
     * @return timestamps Array of timestamps
     */
    function getLatestPrices(
        bytes32[] calldata assetIds
    ) external view returns (int256[] memory prices, uint256[] memory timestamps);

    /**
     * @notice Check if price data is fresh (within maxAge seconds)
     * @param assetId The asset identifier
     * @param maxAge Maximum acceptable age in seconds
     * @return isFresh True if price data is within maxAge
     */
    function isPriceFresh(
        bytes32 assetId,
        uint256 maxAge
    ) external view returns (bool isFresh);
}
