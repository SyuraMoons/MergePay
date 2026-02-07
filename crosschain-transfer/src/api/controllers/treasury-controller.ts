import { Request, Response } from 'express';
import { TransferOrchestrator } from '../../services/orchestrator.js';
import type { Address } from 'viem';

const orchestrator = new TransferOrchestrator();

export async function configureTreasuryPolicy(req: Request, res: Response) {
  try {
    const {
      threshold,
      useUSYC,
      vaultAddress,
      cooldownPeriod = 3600,
    } = req.body;

    if (threshold === undefined || useUSYC === undefined) {
      res.status(400).json({
        success: false,
        error: 'threshold and useUSYC are required',
      });
      return;
    }

    if (!useUSYC && !vaultAddress) {
      res.status(400).json({
        success: false,
        error: 'vaultAddress is required when useUSYC is false',
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

    await orchestrator.configurePolicy({
      threshold,
      useUSYC,
      vaultAddress: vaultAddress as Address,
      cooldownPeriod,
      privateKey,
    });

    res.json({ success: true, message: 'Policy configured successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Configuration failed',
    });
  }
}

export async function getTreasuryPolicy(req: Request, res: Response) {
  try {
    const { address } = req.params;

    if (!address) {
      res.status(400).json({
        success: false,
        error: 'address is required',
      });
      return;
    }

    await orchestrator.getPolicyStatus(address as Address);

    // Note: orchestrator.getPolicyStatus logs to console
    // TODO: Refactor to return data
    res.json({ success: true, message: 'Check server logs for policy status' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get policy',
    });
  }
}

export async function executeTreasuryPolicy(req: Request, res: Response) {
  try {
    const { address } = req.body;

    if (!address) {
      res.status(400).json({
        success: false,
        error: 'address is required',
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

    await orchestrator.executePolicy(address as Address, privateKey);
    res.json({ success: true, message: 'Policy executed successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Execution failed',
    });
  }
}

export async function canExecuteTreasuryPolicy(req: Request, res: Response) {
  try {
    const { address } = req.params;

    if (!address) {
      res.status(400).json({
        success: false,
        error: 'address is required',
      });
      return;
    }

    await orchestrator.checkPolicyStatus(address as Address);
    res.json({ success: true, message: 'Check server logs for execution status' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Check failed',
    });
  }
}


