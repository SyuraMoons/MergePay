import { Router } from 'express';
import {
    executeSwap,
    addLiquidity,
    removeLiquidity,
    getPosition,
    getPoolManager,
} from '../controllers/uniswap-v4-controller.js';
import {
    validateSwap,
    validateAddLiquidity,
    validateRemoveLiquidity,
    validateGetPosition,
} from '../validators/uniswap-v4-validator.js';

const router = Router();

// Swap endpoints
router.post('/swap', validateSwap, executeSwap);

// Liquidity management endpoints
router.post('/liquidity/add', validateAddLiquidity, addLiquidity);
router.post('/liquidity/remove', validateRemoveLiquidity, removeLiquidity);

// Query endpoints
router.get('/position/:owner/:poolId/:tickLower/:tickUpper', validateGetPosition, getPosition);
router.get('/pool-manager', getPoolManager);

export default router;
