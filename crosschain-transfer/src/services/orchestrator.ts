/**
 * Transfer Orchestrator - High-level transfer coordination
 *
 * This orchestrator combines CCTP and Wallet services to provide
 * a simple interface for cross-chain USDC transfers.
 */

import { CCTPService } from './cctp.js';
import { WalletService, createWalletService } from './wallet.js';
import { SEPOLIA, ARC } from '../config/contracts.js';
import type {
  TransferProgressCallback,
  TransferResult,
  TransferEvent,
  WalletBalance,
} from '../types/index.js';

/**
 * Transfer parameters
 */
export interface TransferParams {
  /** Amount to transfer (in USDC, not smallest units) */
  amount: number;
  /** Recipient address on destination chain */
  recipient: string;
  /** Private key for signing transactions */
  privateKey: string;
  /** Optional progress callback */
  onProgress?: TransferProgressCallback;
}

/**
 * Transfer options
 */
export interface TransferOptions {
  /** Skip confirmation prompts (for programmatic use) */
  skipConfirm?: boolean;
  /** Dry run - validate without executing */
  dryRun?: boolean;
}

/**
 * Orchestrator result
 */
export interface OrchestratorResult {
  success: boolean;
  result?: TransferResult;
  error?: string;
  explorerUrls?: {
    burnTx?: string;
    mintTx?: string;
  };
}

/**
 * Transfer Orchestrator Service
 */
export class TransferOrchestrator {
  private cctpService: CCTPService;
  private walletService: WalletService;
  private progress: TransferEvent[] = [];

  constructor() {
    this.cctpService = new CCTPService(this.trackProgress.bind(this));
    this.walletService = createWalletService();
  }

  /**
   * Track transfer progress
   */
  private trackProgress(event: TransferEvent): void {
    this.progress.push(event);
    console.log(`[${event.status}] ${event.message}${event.txHash ? ` (tx: ${event.txHash})` : ''}`);
  }

  /**
   * Get transfer progress history
   */
  getProgress(): TransferEvent[] {
    return [...this.progress];
  }

  /**
   * Validate transfer parameters
   */
  private async validateParams(params: TransferParams): Promise<{
    valid: boolean;
    error?: string;
    balance?: WalletBalance;
  }> {
    const walletService = createWalletService();

    // Validate address format
    if (!walletService.isValidAddress(params.recipient)) {
      return {
        valid: false,
        error: `Invalid recipient address: ${params.recipient}`,
      };
    }

    // Validate amount
    if (params.amount <= 0) {
      return {
        valid: false,
        error: 'Amount must be greater than 0',
      };
    }

    // Check wallet balance
    const address = walletService.getAddressFromPrivateKey(params.privateKey);
    const balance = await walletService.getWalletBalances(address);

    // Convert amount to smallest units (USDC has 6 decimals)
    const amountSmallest = BigInt(params.amount * 1_000_000);

    if (balance.usdcBalance < amountSmallest) {
      return {
        valid: false,
        error: `Insufficient USDC balance. Have: ${walletService.formatUSDC(balance.usdcBalance)}, Need: $${params.amount.toFixed(2)}`,
        balance,
      };
    }

    // Check for gas (need ETH for transaction fees)
    const minGasBalance = BigInt('100000000000000000'); // 0.1 ETH
    if (balance.ethBalance < minGasBalance) {
      return {
        valid: false,
        error: `Insufficient ETH for gas. Have: ${walletService.formatETH(balance.ethBalance)}, Need at least 0.1 ETH`,
        balance,
      };
    }

    return { valid: true, balance };
  }

  /**
   * Transfer USDC from Sepolia to Arc
   */
  async transferSepoliaToArc(
    params: TransferParams,
    options: TransferOptions = {}
  ): Promise<OrchestratorResult> {
    this.progress = []; // Reset progress

    try {
      console.log('\n=== Cross-Chain USDC Transfer: Sepolia → Arc ===\n');

      // Validate parameters
      console.log('Validating transfer parameters...');
      const validation = await this.validateParams(params);

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      console.log(`✓ Validated: ${this.walletService.formatUSDC(BigInt(params.amount * 1_000_000))}`);
      console.log(`✓ From: ${validation.balance?.address}`);
      console.log(`✓ To: ${params.recipient}`);

      if (options.dryRun) {
        return {
          success: true,
          error: 'Dry run completed successfully',
        };
      }

      // Confirmation prompt
      if (!options.skipConfirm) {
        console.log('\n⚠️  This will transfer USDC across chains.');
        console.log('   Make sure you have sufficient ETH for gas on both chains.\n');
        // In interactive mode, would prompt for confirmation here
        // For CLI automation, we'll proceed
      }

      // Execute transfer
      console.log('\n--- Starting Transfer ---\n');

      const result = await this.cctpService.transferSepoliaToArc(
        BigInt(params.amount * 1_000_000), // Convert to smallest units
        params.recipient as `0x${string}`,
        params.privateKey
      );

      // Success!
      console.log('\n=== Transfer Complete! ===\n');
      console.log(`Burn TX: ${SEPOLIA.explorer}/tx/${result.burnHash}`);
      console.log(`Mint TX: ${ARC.explorer}/tx/${result.mintHash}`);
      console.log(`Amount: $${(Number(result.amount) / 1_000_000).toFixed(2)} USDC\n`);

      return {
        success: true,
        result,
        explorerUrls: {
          burnTx: `${SEPOLIA.explorer}/tx/${result.burnHash}`,
          mintTx: `${ARC.explorer}/tx/${result.mintHash}`,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ Transfer failed: ${errorMessage}\n`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get wallet status
   */
  async getWalletStatus(privateKey: string): Promise<{
    address: string;
    balances: {
      sepolia: { usdc: string; eth: string };
      arc: { usdc: string; eth: string };
    };
  }> {
    const address = this.walletService.getAddressFromPrivateKey(privateKey);

    const [usdcSepolia, ethSepolia, usdcArc, ethArc] = await Promise.all([
      this.walletService.getUSDCBalanceOnSepolia(address),
      this.walletService.getNativeBalanceOnSepolia(address),
      this.walletService.getUSDCBalanceOnArc(address),
      this.walletService.getNativeBalanceOnArc(address),
    ]);

    return {
      address,
      balances: {
        sepolia: {
          usdc: this.walletService.formatUSDC(usdcSepolia),
          eth: this.walletService.formatETH(ethSepolia),
        },
        arc: {
          usdc: this.walletService.formatUSDC(usdcArc),
          eth: this.walletService.formatETH(ethArc),
        },
      },
    };
  }

  /**
   * Print wallet status
   */
  async printWalletStatus(privateKey: string): Promise<void> {
    const status = await this.getWalletStatus(privateKey);

    console.log('\n=== Wallet Status ===\n');
    console.log(`Address: ${status.address}\n`);
    console.log('Ethereum Sepolia:');
    console.log(`  USDC: ${status.balances.sepolia.usdc}`);
    console.log(`  ETH:  ${status.balances.sepolia.eth}\n`);
    console.log('Arc Testnet:');
    console.log(`  USDC: ${status.balances.arc.usdc}`);
    console.log(`  ETH:  ${status.balances.arc.eth}\n`);
  }

  /**
   * Resume a transfer from burn transaction hash
   * Useful if attestation polling was interrupted
   */
  async resumeFromBurn(burnTxHash: string, privateKey: string): Promise<OrchestratorResult> {
    this.progress = [];

    try {
      console.log('\n=== Resuming Transfer ===\n');
      console.log(`Burn TX: ${burnTxHash}\n`);

      // Get attestation
      console.log('Fetching attestation...');
      const { attestation, message } = await this.cctpService.getAttestation(burnTxHash);

      // Mint on Arc
      console.log('Minting on Arc...');
      const mintResult = await this.cctpService.mintUSDConArc({
        attestation,
        message,
        privateKey,
      });

      console.log('\n=== Transfer Complete! ===\n');
      console.log(`Mint TX: ${ARC.explorer}/tx/${mintResult.mintHash}\n`);

      return {
        success: true,
        result: {
          burnHash: burnTxHash,
          attestation,
          mintHash: mintResult.mintHash,
          sourceChain: 'sepolia',
          destinationChain: 'arc',
          amount: 0n, // Unknown from resume
        },
        explorerUrls: {
          burnTx: `${SEPOLIA.explorer}/tx/${burnTxHash}`,
          mintTx: `${ARC.explorer}/tx/${mintResult.mintHash}`,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ Resume failed: ${errorMessage}\n`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
