// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import {IERC20} from "openzeppelin-contracts/token/ERC20/IERC20.sol";
import {
    IPoolManager
} from "../lib/uniswap-hooks/lib/v4-core/src/interfaces/IPoolManager.sol";
import {
    IUnlockCallback
} from "../lib/uniswap-hooks/lib/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "../lib/uniswap-hooks/lib/v4-core/src/types/PoolKey.sol";
import {
    PoolId,
    PoolIdLibrary
} from "../lib/uniswap-hooks/lib/v4-core/src/types/PoolId.sol";
import {
    BalanceDelta,
    BalanceDeltaLibrary
} from "../lib/uniswap-hooks/lib/v4-core/src/types/BalanceDelta.sol";
import {
    Currency,
    CurrencyLibrary
} from "../lib/uniswap-hooks/lib/v4-core/src/types/Currency.sol";
import {
    TickMath
} from "../lib/uniswap-hooks/lib/v4-core/src/libraries/TickMath.sol";
import {
    SafeCast
} from "../lib/uniswap-hooks/lib/v4-core/src/libraries/SafeCast.sol";
import {
    StateLibrary
} from "../lib/uniswap-hooks/lib/v4-core/src/libraries/StateLibrary.sol";

import {
    ModifyLiquidityParams
} from "../lib/uniswap-hooks/lib/v4-core/src/types/PoolOperation.sol";
import {
    SwapParams
} from "../lib/uniswap-hooks/lib/v4-core/src/types/PoolOperation.sol";

import {IUniswapV4Agent} from "./interfaces/IUniswapV4Agent.sol";
import {LiquidityAmounts} from "./libraries/LiquidityAmounts.sol";

contract UniswapV4Agent is Ownable, IUnlockCallback, IUniswapV4Agent {
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;
    using BalanceDeltaLibrary for BalanceDelta;
    using SafeCast for uint256;
    using SafeCast for int256;
    using StateLibrary for IPoolManager;

    IPoolManager public immutable manager;

    // Track positions
    mapping(bytes32 => LiquidityPosition) public positions;

    // Helper struct for passing data to unlockCallback
    struct CallbackData {
        PoolKey poolKey;
        ModifyLiquidityParams params;
        SwapParams swapParams;
        bool isSwap;
        address payer;
    }

    constructor(address _poolManager, address _owner) Ownable(_owner) {
        manager = IPoolManager(_poolManager);
    }

    /// @inheritdoc IUniswapV4Agent
    function swap(
        PoolKey calldata poolKey,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96
    ) external override returns (int256 delta0, int256 delta1) {
        SwapParams memory params = SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: amountSpecified,
            sqrtPriceLimitX96: sqrtPriceLimitX96
        });

        CallbackData memory data = CallbackData({
            poolKey: poolKey,
            params: ModifyLiquidityParams(0, 0, 0, bytes32(0)), // Dummy info
            swapParams: params,
            isSwap: true,
            payer: msg.sender
        });

        BalanceDelta delta = abi.decode(
            manager.unlock(abi.encode(data)),
            (BalanceDelta)
        );

        delta0 = delta.amount0();
        delta1 = delta.amount1();

        // Transfer output tokens to user (if any)
        if (delta0 > 0) {
            IERC20(Currency.unwrap(poolKey.currency0)).transfer(
                msg.sender,
                uint256(delta0)
            );
        }
        if (delta1 > 0) {
            IERC20(Currency.unwrap(poolKey.currency1)).transfer(
                msg.sender,
                uint256(delta1)
            );
        }
    }

    /// @inheritdoc IUniswapV4Agent
    function addLiquidity(
        AddLiquidityParams calldata params
    )
        external
        override
        returns (uint128 liquidity, uint256 amount0, uint256 amount1)
    {
        PoolId poolId = params.poolKey.toId();

        // 1. Calculate Liquidity
        // 1. Calculate Liquidity
        (uint160 sqrtPriceX96, , , ) = manager.getSlot0(poolId);

        uint160 sqrtPriceAX96 = TickMath.getSqrtPriceAtTick(params.tickLower);
        uint160 sqrtPriceBX96 = TickMath.getSqrtPriceAtTick(params.tickUpper);

        liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            sqrtPriceAX96,
            sqrtPriceBX96,
            params.amount0Desired,
            params.amount1Desired
        );

        if (liquidity == 0) revert("Zero liquidity");

        // 2. Prepare Unlock Data
        ModifyLiquidityParams memory modifyParams = ModifyLiquidityParams({
            tickLower: params.tickLower,
            tickUpper: params.tickUpper,
            liquidityDelta: int256(uint256(liquidity)),
            salt: bytes32(0)
        });

        CallbackData memory data = CallbackData({
            poolKey: params.poolKey,
            params: modifyParams,
            swapParams: SwapParams(false, 0, 0),
            isSwap: false,
            payer: msg.sender // Caller must assume we pull tokens from them or contract has them
        });

        // 3. Unlock and Execute
        // We need to ensure tokens are in this contract before unlock, or pull them in callback.
        // For standalone agent, usually funds are deposited or pulled from owner.
        // Here we'll pull from this contract (assuming funded) or msg.sender if approved?
        // Let's assume funds are in THIS contract for simplicity of standalone agent, OR pull from owner.
        // The implementation_plan said "agent that programmatically interact...".
        // Let's pull from msg.sender (Owner) to this contract first, or facilitate transfer in callback.
        // It's cleaner to pull to contract first.

        // Actually, the IUniswapV4Agent interface suggests the agent manages the position.
        // We will pull the Max amount needed to this contract first to be safe, then refund excess?
        // Or just pull exactly what's needed in callback.
        // Let's do pulling in callback for strictness.

        BalanceDelta delta = abi.decode(
            manager.unlock(abi.encode(data)),
            (BalanceDelta)
        );

        // 4. Update Position Tracking
        amount0 = uint256(int256(-delta.amount0()));
        amount1 = uint256(int256(-delta.amount1()));

        // Verify min amounts
        require(amount0 >= params.amount0Min, "Insufficient amount0");
        require(amount1 >= params.amount1Min, "Insufficient amount1");
        require(block.timestamp <= params.deadline, "Deadline");

        bytes32 positionId = keccak256(
            abi.encodePacked(
                params.poolKey.toId(),
                params.tickLower,
                params.tickUpper
            )
        );
        LiquidityPosition storage pos = positions[positionId];

        pos.liquidity += liquidity;
        pos.tickLower = params.tickLower;
        pos.tickUpper = params.tickUpper;
        pos.amount0 += amount0;
        pos.amount1 += amount1;

        emit LiquidityAdded(
            msg.sender,
            poolId,
            liquidity,
            amount0,
            amount1,
            params.tickLower,
            params.tickUpper
        );
    }

    /// @inheritdoc IUniswapV4Agent
    function removeLiquidity(
        RemoveLiquidityParams calldata params
    ) external override returns (uint256 amount0, uint256 amount1) {
        // 1. Prepare Unlock Data
        ModifyLiquidityParams memory modifyParams = ModifyLiquidityParams({
            tickLower: params.tickLower,
            tickUpper: params.tickUpper,
            liquidityDelta: -int256(uint256(params.liquidity)),
            salt: bytes32(0)
        });

        CallbackData memory data = CallbackData({
            poolKey: params.poolKey,
            params: modifyParams,
            swapParams: SwapParams(false, 0, 0),
            isSwap: false,
            payer: address(0) // Not used for removal
        });

        // 2. Unlock
        BalanceDelta delta = abi.decode(
            manager.unlock(abi.encode(data)),
            (BalanceDelta)
        );

        amount0 = uint256(int256(delta.amount0()));
        amount1 = uint256(int256(delta.amount1()));

        require(amount0 >= params.amount0Min, "Insufficient amount0");
        require(amount1 >= params.amount1Min, "Insufficient amount1");
        require(block.timestamp <= params.deadline, "Deadline");

        // 3. Update Position
        bytes32 positionId = keccak256(
            abi.encodePacked(
                msg.sender,
                params.poolKey.toId(),
                params.tickLower,
                params.tickUpper
            )
        );
        LiquidityPosition storage pos = positions[positionId];
        require(pos.liquidity >= params.liquidity, "Insufficient liquidity");
        pos.liquidity -= params.liquidity;
        // Do not update pos.amount0/1 with current value here as it's complex, just liquidity.
        // Or update by subtracting removed portion?
        // Usually positions track liquidity. amount0/1 are strictly historical/accounting.

        // Transfer tokens to recipient
        if (params.recipient != address(this)) {
            if (amount0 > 0) {
                IERC20(Currency.unwrap(params.poolKey.currency0)).transfer(
                    params.recipient,
                    amount0
                );
            }
            if (amount1 > 0) {
                IERC20(Currency.unwrap(params.poolKey.currency1)).transfer(
                    params.recipient,
                    amount1
                );
            }
        }

        emit LiquidityRemoved(
            msg.sender,
            params.poolKey.toId(),
            params.liquidity,
            amount0,
            amount1
        );
    }

    function collectFees(
        PoolKey calldata,
        int24,
        int24,
        address
    ) external override returns (uint256, uint256) {
        // Uniswap V4 fees are collected via modifyLiquidity with 0 liquidity delta if using hook-based fees,
        // or separate fee protocol.
        // For standard pools, fees are auto-compounded into liquidity or explicit claim?
        // Actually V4 doesn't have explicit `collect` like V3. It depends on the hook.
        // If the pool uses a Hook that distributes fees, we call the hook.
        // If it's a standard pool, fees might be added to liquidity or uncollected.
        // In V4, fees on ticks are NOT standard like V3.
        // We will leave this stubbed or implement a 0-liquidity modify to harvest if supported.
        revert("Not implemented for V4 Base");
    }

    /// @inheritdoc IUniswapV4Agent
    function poolManager() external view override returns (address) {
        return address(manager);
    }

    /// @inheritdoc IUniswapV4Agent
    function getUserPosition(
        address, // user is irrelevant as agent holds it
        PoolId poolId
    ) external view override returns (LiquidityPosition memory) {
        // Find position for pool? We need tick lower/upper.
        // This helper is hard to implement without ticks.
        // We return empty or need to track by user.
        return LiquidityPosition(0, 0, 0, 0, 0, 0);
    }

    // Explicit position getter with owner
    function getPosition(
        address owner,
        PoolId poolId,
        int24 tickLower,
        int24 tickUpper
    ) external view returns (LiquidityPosition memory) {
        bytes32 positionId = keccak256(
            abi.encodePacked(owner, poolId, tickLower, tickUpper)
        );
        return positions[positionId];
    }

    /// @inheritdoc IUniswapV4Agent
    function getPositionValue(
        PoolKey calldata,
        int24,
        int24,
        uint128
    ) external view override returns (uint256, uint256) {
        // Logic to calculate current amounts for liquidity would go here
        return (0, 0);
    }

    // --- Unlock Callback ---

    function unlockCallback(
        bytes calldata data
    ) external override returns (bytes memory) {
        require(msg.sender == address(manager), "Caller not PoolManager");

        CallbackData memory callbackData = abi.decode(data, (CallbackData));
        BalanceDelta delta;

        if (callbackData.isSwap) {
            delta = manager.swap(
                callbackData.poolKey,
                callbackData.swapParams,
                bytes("") // hook data
            );
        } else {
            (delta, ) = manager.modifyLiquidity(
                callbackData.poolKey,
                callbackData.params,
                bytes("") // hook data
            );
        }

        // Handle Deltas
        if (delta.amount0() > 0) {
            // Pool owes us tokens (Removal)
            // PM will pay us via take()
            manager.take(
                callbackData.poolKey.currency0,
                address(this),
                uint256(uint128(delta.amount0()))
            );
        } else if (delta.amount0() < 0) {
            // We owe Pool (Addition)
            // Pay PM via settle()
            uint256 amountToPay = uint256(uint128(-delta.amount0()));
            manager.sync(callbackData.poolKey.currency0);
            IERC20(Currency.unwrap(callbackData.poolKey.currency0))
                .transferFrom(
                    callbackData.payer,
                    address(manager),
                    amountToPay
                );
            manager.settle();
        }

        if (delta.amount1() > 0) {
            manager.take(
                callbackData.poolKey.currency1,
                address(this),
                uint256(uint128(delta.amount1()))
            );
        } else if (delta.amount1() < 0) {
            uint256 amountToPay = uint256(uint128(-delta.amount1()));
            manager.sync(callbackData.poolKey.currency1);
            IERC20(Currency.unwrap(callbackData.poolKey.currency1))
                .transferFrom(
                    callbackData.payer,
                    address(manager),
                    amountToPay
                );
            manager.settle();
        }

        return abi.encode(delta);
    }

    // --- Admin ---
    function withdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(msg.sender, amount);
    }
}
