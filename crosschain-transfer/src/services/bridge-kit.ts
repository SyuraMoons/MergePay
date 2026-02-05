/**
 * Bridge Kit Service - Circle's official SDK for cross-chain USDC transfers
 *
 * This service wraps Circle's Bridge Kit SDK, which provides:
 * - Automatic CCTP V2 API usage (no manual attestation polling)
 * - Built-in retry logic and error handling
 * - Progress event monitoring
 * - Type-safe interfaces
 * - Production-ready patterns
 */

import { BridgeKit } from '@circle-fin/bridge-kit';
import { createViemAdapterFromPrivateKey } from '@circle-fin/adapter-viem-v2';
import type { Address } from 'viem';
import {
  TransferProgressCallback,
  TransferStatus,
  TransferResult,
  TransferFailedError,
} from '../types/index.js';

/**
 * Bridge Kit Service class
 */
export class BridgeKitService {
  private kit: BridgeKit;
  private onProgress?: TransferProgressCallback;

  constructor(onProgress?: TransferProgressCallback) {
    this.kit = new BridgeKit();
    this.onProgress = onProgress;

    // Set up event monitoring
    this.setupEventHandlers();
  }

  /**
   * Set up Bridge Kit event handlers for progress tracking
   */
  private setupEventHandlers(): void {
    // Listen to all events for comprehensive progress tracking
    this.kit.on('*', (event) => {
      // Map Bridge Kit events to our progress callbacks
      switch (event.method) {
        case 'approve':
          this.emit(TransferStatus.Burning, 'Approving USDC for transfer...', event.values.txHash);
          break;
        case 'burn':
          this.emit(TransferStatus.Burning, 'Burning USDC on source chain...', event.values.txHash);
          break;
        case 'fetchAttestation':
          this.emit(
            TransferStatus.AwaitingAttestation,
            'Waiting for Circle attestation...',
            undefined
          );
          break;
        case 'mint':
          this.emit(TransferStatus.Minting, 'Minting USDC on destination chain...', event.values.txHash);
          break;
      }
    });
  }

  /**
   * Emit progress event
   */
  private emit(status: TransferStatus, message: string, txHash?: string): void {
    if (this.onProgress) {
      this.onProgress({
        timestamp: Date.now(),
        status,
        message,
        txHash,
      });
    }
  }

  /**
   * Execute complete transfer from Sepolia to Arc using Bridge Kit
   */
  async transferSepoliaToArc(
    amount: bigint,
    mintRecipient: Address,
    privateKey: string
  ): Promise<TransferResult> {
    try {
      this.emit(TransferStatus.Burning, 'Initializing Bridge Kit transfer...');

      // Create adapter from private key
      // This adapter works across multiple chains automatically
      const adapter = createViemAdapterFromPrivateKey({
        privateKey: privateKey as `0x${string}`,
      });

      // Convert amount from smallest units to human-readable format
      // Bridge Kit expects "10.50" format, not wei/smallest units
      const amountFormatted = (Number(amount) / 1_000_000).toFixed(6);

      // Execute bridge operation
      // Bridge Kit handles all steps automatically:
      // 1. Approval (if needed)
      // 2. Burn on Sepolia
      // 3. Attestation polling (automatic, no manual API calls)
      // 4. Mint on Arc
      const result = await this.kit.bridge({
        from: { adapter, chain: 'Ethereum_Sepolia' },
        to: {
          adapter,
          chain: 'Arc_Testnet',
          recipientAddress: mintRecipient,
        },
        amount: amountFormatted,
        config: {
          transferSpeed: 'SLOW', // SLOW = 0% fees, FAST = 1-14 bps
        },
      });

      // Check if bridge was successful
      if (result.state !== 'success') {
        throw new TransferFailedError(
          `Bridge transfer failed: ${result.steps.find((s) => s.state === 'error')?.error || 'Unknown error'}`
        );
      }

      // Extract transaction hashes from successful steps
      const burnStep = result.steps.find((s) => s.name === 'depositForBurn' || s.name === 'burn');
      const mintStep = result.steps.find((s) => s.name === 'mint');

      if (!burnStep?.txHash || !mintStep?.txHash) {
        throw new TransferFailedError('Missing transaction hashes from bridge result');
      }

      this.emit(TransferStatus.Completed, 'Transfer complete!');

      return {
        burnHash: burnStep.txHash,
        attestation: 'handled-by-bridge-kit', // Bridge Kit handles attestation internally
        mintHash: mintStep.txHash,
        sourceChain: 'sepolia',
        destinationChain: 'arc',
        amount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit(TransferStatus.Failed, `Transfer failed: ${errorMessage}`);
      throw new TransferFailedError(`Bridge Kit transfer failed: ${errorMessage}`);
    }
  }

  /**
   * Retry a failed transfer
   * Bridge Kit has built-in retry logic for recoverable failures
   */
  async retryTransfer(
    previousResult: any,
    privateKey: string
  ): Promise<TransferResult> {
    try {
      this.emit(TransferStatus.Burning, 'Retrying transfer with Bridge Kit...');

      const adapter = createViemAdapterFromPrivateKey({
        privateKey: privateKey as `0x${string}`,
      });

      // Use Bridge Kit's built-in retry mechanism
      const retryResult = await this.kit.retry(previousResult, {
        from: adapter,
        to: adapter,
      });

      if (retryResult.state !== 'success') {
        throw new TransferFailedError('Retry failed');
      }

      const burnStep = retryResult.steps.find((s) => s.name === 'depositForBurn' || s.name === 'burn');
      const mintStep = retryResult.steps.find((s) => s.name === 'mint');

      if (!burnStep?.txHash || !mintStep?.txHash) {
        throw new TransferFailedError('Missing transaction hashes from retry result');
      }

      this.emit(TransferStatus.Completed, 'Retry successful!');

      return {
        burnHash: burnStep.txHash,
        attestation: 'handled-by-bridge-kit',
        mintHash: mintStep.txHash,
        sourceChain: 'sepolia',
        destinationChain: 'arc',
        amount: 0n, // Amount unknown from retry
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit(TransferStatus.Failed, `Retry failed: ${errorMessage}`);
      throw new TransferFailedError(`Bridge Kit retry failed: ${errorMessage}`);
    }
  }

  /**
   * Estimate transfer costs before execution
   * Note: Estimation with Bridge Kit requires a private key to create adapters
   */
  async estimateTransfer(
    amount: bigint,
    privateKey: string,
    from: string = 'Ethereum_Sepolia',
    to: string = 'Arc_Testnet'
  ): Promise<{
    gasFees: any;
    protocolFees: any;
  }> {
    try {
      const amountFormatted = (Number(amount) / 1_000_000).toFixed(6);

      // Create adapter for estimation
      const adapter = createViemAdapterFromPrivateKey({
        privateKey: privateKey as `0x${string}`,
      });

      const estimate = await this.kit.estimate({
        from: { adapter, chain: from as any },
        to: { adapter, chain: to as any },
        amount: amountFormatted,
        config: {
          transferSpeed: 'SLOW',
        },
      });

      return {
        gasFees: estimate.gasFees,
        protocolFees: estimate.fees,
      };
    } catch (error) {
      throw new TransferFailedError(
        `Failed to estimate transfer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
