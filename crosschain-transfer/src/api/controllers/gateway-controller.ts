import { Request, Response } from 'express';
import { TransferOrchestrator } from '../../services/orchestrator.js';
import type { GatewayChain } from '../../config/gateway.js';

const orchestrator = new TransferOrchestrator();

export async function depositToGateway(req: Request, res: Response) {
  try {
    const { amount, chain, privateKey } = req.body;

    if (!amount || !chain || !privateKey) {
      res.status(400).json({
        success: false,
        error: 'amount, chain, and privateKey are required',
      });
      return;
    }

    const result = await orchestrator.depositToGateway(
      amount,
      chain as GatewayChain,
      privateKey
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deposit failed',
    });
  }
}

export async function transferViaGateway(req: Request, res: Response) {
  try {
    const { amount, destinationChain, recipient, privateKey } = req.body;

    if (!amount || !destinationChain || !recipient || !privateKey) {
      res.status(400).json({
        success: false,
        error: 'amount, destinationChain, recipient, and privateKey are required',
      });
      return;
    }

    const result = await orchestrator.transferViaGateway(
      amount,
      destinationChain as GatewayChain,
      recipient,
      privateKey
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    });
  }
}

export async function getGatewayBalance(req: Request, res: Response) {
  try {
    const { privateKey, chains } = req.query;

    if (!privateKey || typeof privateKey !== 'string') {
      res.status(400).json({ success: false, error: 'privateKey is required' });
      return;
    }

    const chainArray = chains
      ? (chains as string).split(',') as GatewayChain[]
      : undefined;

    const result = await orchestrator.getGatewayBalance(privateKey, chainArray);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Balance query failed',
    });
  }
}
