// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    PoolKey
} from "../../lib/uniswap-hooks/lib/v4-core/src/types/PoolKey.sol";
import {PoolId} from "../../lib/uniswap-hooks/lib/v4-core/src/types/PoolId.sol";

/**
 * @title IUniswapV4Agent
 * @notice Interface for Uniswap V4 liquidity provisioning agent
 * @dev Handles adding/removing liquidity to v4 pools on behalf of MergeTreasury
 */
interface IUniswapV4Agent {
    /**
     * @notice Information about a liquidity position
     */
    struct LiquidityPosition {
        uint128 liquidity;
        int24 tickLower;
        int24 tickUpper;
        uint256 lastFeeCollection;
        uint256 amount0;
        uint256 amount1;
    }

    /**
     * @notice Parameters for adding liquidity
     */
    struct AddLiquidityParams {
        PoolKey poolKey;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    /**
     * @notice Parameters for removing liquidity
     */
    struct RemoveLiquidityParams {
        PoolKey poolKey;
        int24 tickLower;
        int24 tickUpper;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    /**
     * @notice Add liquidity to a Uniswap V4 pool
     * @param params Parameters for adding liquidity
     * @return liquidity The amount of liquidity added
     * @return amount0 Actual amount of token0 added
     * @return amount1 Actual amount of token1 added
     */
    function addLiquidity(
        AddLiquidityParams calldata params
    ) external returns (uint128 liquidity, uint256 amount0, uint256 amount1);

    /**
     * @notice Remove liquidity from a Uniswap V4 pool
     * @param params Parameters for removing liquidity
     * @return amount0 Amount of token0 received
     * @return amount1 Amount of token1 received
     */
    function removeLiquidity(
        RemoveLiquidityParams calldata params
    ) external returns (uint256 amount0, uint256 amount1);

    /**
     * @notice Collect accumulated fees from a position
     * @param poolKey The pool key
     * @param tickLower Lower tick of the position
     * @param tickUpper Upper tick of the position
     * @param recipient Address to receive the fees
     * @return amount0 Amount of token0 fees collected
     * @return amount1 Amount of token1 fees collected
     */
    function collectFees(
        PoolKey calldata poolKey,
        int24 tickLower,
        int24 tickUpper,
        address recipient
    ) external returns (uint256 amount0, uint256 amount1);

    /**
     * @notice Get user's liquidity position in a pool
     * @param user User address
     * @param poolId Pool identifier
     * @return position The liquidity position details
     */
    function getUserPosition(
        address user,
        PoolId poolId
    ) external view returns (LiquidityPosition memory position);

    /**
     * @notice Calculate the current value of a liquidity position
     * @param poolKey The pool key
     * @param tickLower Lower tick of the position
     * @param tickUpper Upper tick of the position
     * @param liquidity Amount of liquidity
     * @return amount0 Current amount of token0
     * @return amount1 Current amount of token1
     */
    function getPositionValue(
        PoolKey calldata poolKey,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity
    ) external view returns (uint256 amount0, uint256 amount1);

    /**
     * @notice Get the pool manager address
     * @return The address of the Uniswap V4 PoolManager
     */
    function poolManager() external view returns (address);

    // Events
    event LiquidityAdded(
        address indexed user,
        PoolId indexed poolId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1,
        int24 tickLower,
        int24 tickUpper
    );

    event LiquidityRemoved(
        address indexed user,
        PoolId indexed poolId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

    event FeesCollected(
        address indexed user,
        PoolId indexed poolId,
        uint256 amount0,
        uint256 amount1
    );

    /**
     * @notice Swap tokens on a pool
     * @param poolKey The pool key
     * @param zeroForOne If true, swap token0 for token1
     * @param amountSpecified The amount of the swap
     * @param sqrtPriceLimitX96 The price limit for the swap
     * @return amount0 The amount of token0 delta
     * @return amount1 The amount of token1 delta
     */
    function swap(
        PoolKey calldata poolKey,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96
    ) external returns (int256 amount0, int256 amount1);
}
