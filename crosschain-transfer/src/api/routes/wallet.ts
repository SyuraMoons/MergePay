import { Router } from 'express';
import {
  getWalletStatus,
  getWalletBalances,
} from '../controllers/wallet-controller.js';

const router = Router();

router.get('/status', getWalletStatus);
router.get('/balances/:address', getWalletBalances);

export default router;
