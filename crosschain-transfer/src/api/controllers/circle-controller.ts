import { Request, Response } from 'express';
import { CircleWalletService } from '../../services/circle-wallet-service.js';

const circleService = new CircleWalletService();

export async function createUserToken(req: Request, res: Response) {
  try {
    const { userId } = req.body;
    const result = await circleService.createUserToken(userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user token',
    });
  }
}

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
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize wallet',
    });
  }
}

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

export async function getUserWallets(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      });
      return;
    }

    const result = await circleService.getUserWallets(userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get wallets',
    });
  }
}
