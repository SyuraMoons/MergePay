import { Router } from 'express';
import { initializeWallet, createTransfer } from '../controllers/walletController';

const router = Router();

router.post('/initialize', initializeWallet);
router.post('/transfer', createTransfer);

export default router;
