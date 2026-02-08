import { Router } from 'express';
import {
  // User Management
  createUser,
  getUser,
  createUserToken,
  createDeviceToken,
  // Wallet Creation
  createWalletWithPin,
  createWallet,
  initializeWallet,
  // Wallet Queries
  listWallets,
  getUserWallets,
  getWalletBalance,
  // Transactions
  createTransaction,
  getTransactionStatus,
  listTransactions,
  executeWalletTransfer,
} from '../controllers/circle-controller.js';

const router = Router();

// ============================================
// USER ROUTES
// ============================================
router.post('/users', createUser);
router.get('/users/:userId', getUser);
router.post('/users/token', createUserToken);
router.post('/users/social/token', createDeviceToken);

// ============================================
// WALLET ROUTES
// ============================================
router.post('/wallets/create-with-pin', createWalletWithPin);
router.post('/wallets/create', createWallet);
router.post('/wallets/initialize', initializeWallet); // Deprecated
router.post('/wallets/list', listWallets);
router.get('/wallets/:userId', getUserWallets);
router.post('/wallets/balance', getWalletBalance);
router.post('/wallets/transfer', executeWalletTransfer); // Deprecated

// ============================================
// TRANSACTION ROUTES
// ============================================
router.post('/transactions/create', createTransaction);
router.post('/transactions/status', getTransactionStatus);
router.post('/transactions/list', listTransactions);

export default router;
