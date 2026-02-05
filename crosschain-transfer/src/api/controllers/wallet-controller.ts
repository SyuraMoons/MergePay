import { Request, Response } from 'express';
import { TransferOrchestrator } from '../../services/orchestrator.js';

const orchestrator = new TransferOrchestrator();

export async function getWalletStatus(req: Request, res: Response) {
  try {
    const { privateKey } = req.query;

    if (!privateKey || typeof privateKey !== 'string') {
      res.status(400).json({
        success: false,
        error: 'privateKey is required',
      });
      return;
    }

    const status = await orchestrator.getWalletStatus(privateKey);
    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get wallet status',
    });
  }
}

export async function getWalletBalances(req: Request, res: Response) {
  try {
    const { address } = req.params;

    if (!address) {
      res.status(400).json({
        success: false,
        error: 'address is required',
      });
      return;
    }

    // TODO: Implement balance fetching for specific address
    res.json({
      success: true,
      address,
      balances: [],
      message: 'Balance fetching for specific address not yet implemented',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get balances',
    });
  }
}
