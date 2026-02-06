import { Request, Response } from 'express';
import { CircleWalletService } from '../../services/circle-wallet-service.js';
import type { Blockchain } from '@circle-fin/user-controlled-wallets';

const circleService = new CircleWalletService();

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * POST /circle/users
 * Create a new user in Circle
 */
export async function createUser(req: Request, res: Response) {
  try {
    const { userId } = req.body;
    const result = await circleService.createUser(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    });
  }
}

/**
 * GET /circle/users/:userId
 * Get user details
 */
export async function getUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId || Array.isArray(userId)) {
      res.status(400).json({
        success: false,
        error: 'userId is required and must be a string',
      });
      return;
    }

    const result = await circleService.getUser(userId as string);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user',
    });
  }
}

/**
 * POST /circle/users/token
 * Generate user token (60 min expiry)
 */
export async function createUserToken(req: Request, res: Response) {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      });
      return;
    }

    const result = await circleService.createUserToken(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user token',
    });
  }
}

// ============================================
// WALLET CREATION
// ============================================

/**
 * POST /circle/wallets/create-with-pin
 * Create wallet with PIN setup (single step)
 * Returns challengeId for frontend to execute
 */
export async function createWalletWithPin(req: Request, res: Response) {
  try {
    const { userToken, blockchains, accountType } = req.body;

    if (!userToken) {
      res.status(400).json({
        success: false,
        error: 'userToken is required',
      });
      return;
    }

    const result = await circleService.createWalletWithPin(
      userToken,
      (Array.isArray(blockchains) ? blockchains : [blockchains]) as Blockchain[],
      accountType
    );

    res.json({
      success: true,
      data: result,
      message: 'Execute this challengeId on the frontend using W3S SDK',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create wallet',
    });
  }
}

/**
 * POST /circle/wallets/create
 * Create additional wallet (after PIN is set)
 */
export async function createWallet(req: Request, res: Response) {
  try {
    const { userToken, blockchains, accountType } = req.body;

    if (!userToken) {
      res.status(400).json({
        success: false,
        error: 'userToken is required',
      });
      return;
    }

    const result = await circleService.createWallet(
      userToken,
      (Array.isArray(blockchains) ? blockchains : [blockchains]) as Blockchain[],
      accountType
    );

    res.json({
      success: true,
      data: result,
      message: 'Execute this challengeId on the frontend using W3S SDK',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create wallet',
    });
  }
}

/**
 * POST /circle/wallets/initialize
 * @deprecated Use createWalletWithPin instead
 */
export async function initializeWallet(req: Request, res: Response) {
  try {
    const { userId, userToken, blockchains } = req.body;

    if (!userId || !userToken) {
      res.status(400).json({
        success: false,
        error: 'userId and userToken are required',
      });
      return;
    }

    const result = await circleService.initializeWallet(userId, userToken, blockchains);

    res.json({
      success: true,
      data: result,
      message: 'Deprecated: Use /circle/wallets/create-with-pin instead',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize wallet',
    });
  }
}

// ============================================
// WALLET QUERIES
// ============================================

/**
 * POST /circle/wallets/list
 * Get all wallets for a user (by userToken)
 */
export async function listWallets(req: Request, res: Response) {
  try {
    const { userToken } = req.body;

    if (!userToken) {
      res.status(400).json({
        success: false,
        error: 'userToken is required',
      });
      return;
    }

    const result = await circleService.listWallets(userToken);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list wallets',
    });
  }
}

/**
 * GET /circle/wallets/:userId
 * Get user's wallets (by userId)
 */
export async function getUserWallets(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId || Array.isArray(userId)) {
      res.status(400).json({
        success: false,
        error: 'userId is required and must be a string',
      });
      return;
    }

    const result = await circleService.getUserWallets(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get wallets',
    });
  }
}

/**
 * POST /circle/wallets/balance
 * Get wallet token balance
 */
export async function getWalletBalance(req: Request, res: Response) {
  try {
    const { userToken, walletId } = req.body;

    if (!userToken || !walletId) {
      res.status(400).json({
        success: false,
        error: 'userToken and walletId are required',
      });
      return;
    }

    const result = await circleService.getWalletBalance(userToken, walletId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get balance',
    });
  }
}

// ============================================
// TRANSACTIONS
// ============================================

/**
 * POST /circle/transactions/create
 * Create a transaction (returns challengeId)
 */
export async function createTransaction(req: Request, res: Response) {
  try {
    const { userToken, walletId, destinationAddress, amount, tokenId, blockchain, tokenAddress, feeLevel } = req.body;

    if (!userToken || !walletId || !destinationAddress || !amount) {
      res.status(400).json({
        success: false,
        error: 'userToken, walletId, destinationAddress, and amount are required',
      });
      return;
    }

    const result = await circleService.createTransaction({
      userToken,
      walletId,
      destinationAddress,
      amount,
      tokenId,
      blockchain,
      tokenAddress,
      feeLevel,
    });

    res.json({
      success: true,
      data: result,
      message: 'Execute this challengeId on the frontend using W3S SDK',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create transaction',
    });
  }
}

/**
 * POST /circle/transactions/status
 * Get transaction status
 */
export async function getTransactionStatus(req: Request, res: Response) {
  try {
    const { userToken, transactionId } = req.body;

    if (!userToken || !transactionId) {
      res.status(400).json({
        success: false,
        error: 'userToken and transactionId are required',
      });
      return;
    }

    const result = await circleService.getTransaction(userToken, transactionId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transaction',
    });
  }
}

/**
 * POST /circle/transactions/list
 * List transactions
 */
export async function listTransactions(req: Request, res: Response) {
  try {
    const { userToken, walletIds } = req.body;

    if (!userToken) {
      res.status(400).json({
        success: false,
        error: 'userToken is required',
      });
      return;
    }

    const result = await circleService.listTransactions(userToken, walletIds);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list transactions',
    });
  }
}

/**
 * POST /circle/wallets/transfer
 * @deprecated Use createTransaction instead
 */
export async function executeWalletTransfer(req: Request, res: Response) {
  try {
    const { userId, userToken, amount, destinationAddress, tokenId } = req.body;

    if (!userId || !userToken || !amount || !destinationAddress) {
      res.status(400).json({
        success: false,
        error: 'userId, userToken, amount, and destinationAddress are required',
      });
      return;
    }

    const result = await circleService.executeTransfer({
      userId,
      userToken,
      amount,
      destinationAddress,
      tokenId,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    });
  }
}
