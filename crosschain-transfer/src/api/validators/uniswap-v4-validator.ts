import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const poolKeySchema = z.object({
    currency0: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token0 address'),
    currency1: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token1 address'),
    fee: z.number().int().nonnegative(),
    tickSpacing: z.number().int(),
    hooks: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid hooks address'),
});

export const swapSchema = z.object({
    poolKey: poolKeySchema,
    zeroForOne: z.boolean(),
    amountSpecified: z.string().regex(/^-?\d+$/, 'Amount must be an integer (positive or negative)'),
    sqrtPriceLimitX96: z.string().regex(/^\d+$/, 'Price limit must be a positive integer'),
});

export const addLiquiditySchema = z.object({
    poolKey: poolKeySchema,
    tickLower: z.number().int(),
    tickUpper: z.number().int(),
    amount0Desired: z.string().regex(/^\d+$/, 'Amount0 must be a positive integer'),
    amount1Desired: z.string().regex(/^\d+$/, 'Amount1 must be a positive integer'),
    amount0Min: z.string().regex(/^\d+$/, 'Min amount0 must be a positive integer'),
    amount1Min: z.string().regex(/^\d+$/, 'Min amount1 must be a positive integer'),
    recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
    deadline: z.number().int().positive(),
});

export const removeLiquiditySchema = z.object({
    poolKey: poolKeySchema,
    tickLower: z.number().int(),
    tickUpper: z.number().int(),
    liquidity: z.string().regex(/^\d+$/, 'Liquidity must be a positive integer'),
    amount0Min: z.string().regex(/^\d+$/, 'Min amount0 must be a positive integer'),
    amount1Min: z.string().regex(/^\d+$/, 'Min amount1 must be a positive integer'),
    recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
    deadline: z.number().int().positive(),
});

export const getPositionSchema = z.object({
    owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid owner address'),
    poolId: z.string().length(66).regex(/^0x[a-fA-F0-9]+$/, 'Invalid pool ID'),
    tickLower: z.string().or(z.number()).transform(val => Number(val)),
    tickUpper: z.string().or(z.number()).transform(val => Number(val)),
});

export function validateSwap(req: Request, res: Response, next: NextFunction) {
    try {
        swapSchema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.issues,
            });
            return;
        }
        next(error);
    }
}

export function validateAddLiquidity(req: Request, res: Response, next: NextFunction) {
    try {
        addLiquiditySchema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.issues,
            });
            return;
        }
        next(error);
    }
}

export function validateRemoveLiquidity(req: Request, res: Response, next: NextFunction) {
    try {
        removeLiquiditySchema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.issues,
            });
            return;
        }
        next(error);
    }
}

export function validateGetPosition(req: Request, res: Response, next: NextFunction) {
    try {
        getPositionSchema.parse(req.params);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.issues,
            });
            return;
        }
        next(error);
    }
}
