import { Request, Response } from 'express';
import { UniswapV4AgentService } from '../../services/uniswap-v4-agent.js';
import type { SwapParams, AddLiquidityParams, RemoveLiquidityParams } from '../../types/uniswap-v4.js';

export async function executeSwap(req: Request, res: Response) {
    try {
        const privateKey = process.env.SERVER_PRIVATE_KEY;
        if (!privateKey) {
            res.status(500).json({
                success: false,
                error: 'SERVER_PRIVATE_KEY not configured',
            });
            return;
        }

        const service = new UniswapV4AgentService(privateKey);

        // Note: amountSpecified can be negative for exactInput (if I recall correctly how V4 might handle it, or standard V3 behavior). 
        // The Validator allows negative. BigInt handles it.
        const params: SwapParams = {
            poolKey: req.body.poolKey,
            zeroForOne: req.body.zeroForOne,
            amountSpecified: BigInt(req.body.amountSpecified),
            sqrtPriceLimitX96: BigInt(req.body.sqrtPriceLimitX96),
        };

        const result = await service.swap(params);

        res.json({
            success: true,
            delta0: result.delta0.toString(),
            delta1: result.delta1.toString(),
            txHash: result.txHash,
            explorerUrl: `${process.env.BASE_EXPLORER || 'https://sepolia.basescan.org'}/tx/${result.txHash}`,
        });
    } catch (error) {
        console.error('Swap error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Swap failed',
        });
    }
}

export async function addLiquidity(req: Request, res: Response) {
    try {
        const privateKey = process.env.SERVER_PRIVATE_KEY;
        if (!privateKey) {
            res.status(500).json({
                success: false,
                error: 'SERVER_PRIVATE_KEY not configured',
            });
            return;
        }

        const service = new UniswapV4AgentService(privateKey);

        const params: AddLiquidityParams = {
            poolKey: req.body.poolKey,
            tickLower: req.body.tickLower,
            tickUpper: req.body.tickUpper,
            amount0Desired: BigInt(req.body.amount0Desired),
            amount1Desired: BigInt(req.body.amount1Desired),
            amount0Min: BigInt(req.body.amount0Min),
            amount1Min: BigInt(req.body.amount1Min),
            recipient: req.body.recipient,
            deadline: BigInt(req.body.deadline),
        };

        const result = await service.addLiquidity(params);

        res.json({
            success: true,
            liquidity: result.liquidity.toString(),
            amount0: result.amount0.toString(),
            amount1: result.amount1.toString(),
            txHash: result.txHash,
            explorerUrl: `${process.env.BASE_EXPLORER || 'https://sepolia.basescan.org'}/tx/${result.txHash}`,
        });
    } catch (error) {
        console.error('Add liquidity error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Add liquidity failed',
        });
    }
}

export async function removeLiquidity(req: Request, res: Response) {
    try {
        const privateKey = process.env.SERVER_PRIVATE_KEY;
        if (!privateKey) {
            res.status(500).json({
                success: false,
                error: 'SERVER_PRIVATE_KEY not configured',
            });
            return;
        }

        const service = new UniswapV4AgentService(privateKey);

        const params: RemoveLiquidityParams = {
            poolKey: req.body.poolKey,
            tickLower: req.body.tickLower,
            tickUpper: req.body.tickUpper,
            liquidity: BigInt(req.body.liquidity),
            amount0Min: BigInt(req.body.amount0Min),
            amount1Min: BigInt(req.body.amount1Min),
            recipient: req.body.recipient,
            deadline: BigInt(req.body.deadline),
        };

        const result = await service.removeLiquidity(params);

        res.json({
            success: true,
            amount0: result.amount0.toString(),
            amount1: result.amount1.toString(),
            txHash: result.txHash,
            explorerUrl: `${process.env.BASE_EXPLORER || 'https://sepolia.basescan.org'}/tx/${result.txHash}`,
        });
    } catch (error) {
        console.error('Remove liquidity error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Remove liquidity failed',
        });
    }
}

export async function getPosition(req: Request, res: Response) {
    try {
        const service = new UniswapV4AgentService();

        const { owner, poolId, tickLower, tickUpper } = req.params;

        const position = await service.getPosition(
            owner as `0x${string}`,
            poolId,
            parseInt(tickLower),
            parseInt(tickUpper)
        );

        res.json({
            success: true,
            position: {
                liquidity: position.liquidity.toString(),
                tickLower: position.tickLower,
                tickUpper: position.tickUpper,
                lastFeeCollection: position.lastFeeCollection.toString(),
                amount0: position.amount0.toString(),
                amount1: position.amount1.toString(),
            },
        });
    } catch (error) {
        console.error('Get position error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Get position failed',
        });
    }
}

export async function getPoolManager(req: Request, res: Response) {
    try {
        const service = new UniswapV4AgentService();
        const poolManager = await service.getPoolManager();

        res.json({
            success: true,
            poolManager,
        });
    } catch (error) {
        console.error('Get pool manager error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Get pool manager failed',
        });
    }
}
