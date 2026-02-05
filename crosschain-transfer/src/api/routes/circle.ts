import { Router } from 'express';
import {
  createUserToken,
  initializeWallet,
  executeWalletTransfer,
  getUserWallets,
} from '../controllers/circle-controller.js';

const router = Router();

router.post('/users/token', createUserToken);
router.post('/wallets/initialize', initializeWallet);
router.post('/wallets/transfer', executeWalletTransfer);
router.get('/wallets/:userId', getUserWallets);

export default router;
