export interface PoolKey {
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
}

export interface LiquidityPosition {
    liquidity: bigint;
    tickLower: number;
    tickUpper: number;
    lastFeeCollection: bigint;
    amount0: bigint;
    amount1: bigint;
}

export interface SwapParams {
    poolKey: PoolKey;
    zeroForOne: boolean;
    amountSpecified: bigint;
    sqrtPriceLimitX96: bigint;
}

export interface AddLiquidityParams {
    poolKey: PoolKey;
    tickLower: number;
    tickUpper: number;
    amount0Desired: bigint;
    amount1Desired: bigint;
    amount0Min: bigint;
    amount1Min: bigint;
    recipient: string;
    deadline: bigint;
}

export interface RemoveLiquidityParams {
    poolKey: PoolKey;
    tickLower: number;
    tickUpper: number;
    liquidity: bigint;
    amount0Min: bigint;
    amount1Min: bigint;
    recipient: string;
    deadline: bigint;
}

export interface SwapResponse {
    delta0: bigint;
    delta1: bigint;
    txHash: string;
}

export interface LiquidityResponse {
    liquidity: bigint;
    amount0: bigint;
    amount1: bigint;
    txHash: string;
}
