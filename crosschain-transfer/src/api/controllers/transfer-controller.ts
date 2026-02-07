import { Request, Response } from 'express';
import { TransferOrchestrator } from '../../services/orchestrator.js';

const orchestrator = new TransferOrchestrator();

export async function executeCctpTransfer(req: Request, res: Response) {
  try {
    const { amount, recipient } = req.body;

    // Use server wallet private key from environment variable
    const privateKey = process.env.SERVER_PRIVATE_KEY;
    if (!privateKey) {
      res.status(500).json({
        success: false,
        error: 'SERVER_PRIVATE_KEY not configured in environment',
      });
      return;
    }

    const result = await orchestrator.transferSepoliaToArc(
      { amount, recipient, privateKey },
      { skipConfirm: true }
    );

    res.json({
      success: result.success,
      result: result.result,
      explorerUrls: result.explorerUrls,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    });
  }
}

export async function resumeCctpTransfer(req: Request, res: Response) {
  try {
    const { txHash } = req.body;

    if (!txHash) {
      res.status(400).json({
        success: false,
        error: 'txHash is required',
      });
      return;
    }

    // Use server wallet private key from environment variable
    const privateKey = process.env.SERVER_PRIVATE_KEY;
    if (!privateKey) {
      res.status(500).json({
        success: false,
        error: 'SERVER_PRIVATE_KEY not configured in environment',
      });
      return;
    }

    const result = await orchestrator.resumeFromBurn(txHash, privateKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Resume failed',
    });
  }
}

export async function getCctpStatus(req: Request, res: Response) {
  res.json({
    txHash: req.params.txHash,
    status: 'pending',
    message: 'Status check not yet implemented',
  });
}
