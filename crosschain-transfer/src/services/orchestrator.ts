/**
 * Transfer Orchestrator - High-level transfer coordination
 *
 * This orchestrator combines CCTP and Wallet services to provide
 * a simple interface for cross-chain USDC transfers.
 */

import { BridgeKitService } from './bridge-kit.js';
import { GatewayService } from './gateway.js';
import { BalanceAggregator } from './balance-aggregator.js';
import { WalletService, createWalletService, type WalletBalance } from './wallet.js';
import { TreasuryAutomationService } from './treasury-automation.js';
import { SEPOLIA, ARC } from '../config/contracts.js';
import type { GatewayChain } from '../config/gateway.js';
import type {
  TransferProgressCallback,
  TransferResult,
  TransferEvent,
  GatewayTransferResult,
  GatewayDepositResult,
  GatewayBalanceResponse,
} from '../types/index.js';
import type { Address } from 'viem';

/**
 * Transfer mode
 */
export type TransferMode = 'cctp' | 'gateway';

/**
 * Transfer parameters
 */
export interface TransferParams {
  /** Transfer mode (CCTP or Gateway) - defaults to CCTP */
  mode?: TransferMode;
  /** Amount to transfer (in USDC, not smallest units) */
  amount: number;
  /** Recipient address on destination chain */
  recipient: string;
  /** Private key for signing transactions */
  privateKey: string;
  /** Optional progress callback */
  onProgress?: TransferProgressCallback;
  /** Source chains (for Gateway mode) */
  sourceChains?: GatewayChain[];
  /** Destination chain (for Gateway mode) */
  destinationChain?: GatewayChain;
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
  private bridgeKitService: BridgeKitService;
  private gatewayService: GatewayService;
  private balanceAggregator: BalanceAggregator;
  private walletService: WalletService;
  private treasuryAutomationService: TreasuryAutomationService;
  private progress: TransferEvent[] = [];

  constructor() {
    this.bridgeKitService = new BridgeKitService(this.trackProgress.bind(this));
    this.gatewayService = new GatewayService();
    this.balanceAggregator = new BalanceAggregator();
    this.walletService = createWalletService();
    this.treasuryAutomationService = new TreasuryAutomationService();
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

    console.log('  - Validating address format...');
    // Validate address format
    if (!walletService.isValidAddress(params.recipient)) {
      return {
        valid: false,
        error: `Invalid recipient address: ${params.recipient}`,
      };
    }

    console.log('  - Validating amount...');
    // Validate amount
    if (params.amount <= 0) {
      return {
        valid: false,
        error: 'Amount must be greater than 0',
      };
    }

    console.log('  - Getting wallet address...');
    // Check wallet balance
    const address = walletService.getAddressFromPrivateKey(params.privateKey);
    console.log(`  - Wallet address: ${address}`);

    console.log('  - Fetching wallet balances (this may take a moment)...');
    try {
      const balance = await walletService.getWalletBalances(address);
      console.log(`  - USDC Balance: ${walletService.formatUSDC(balance.usdcBalance)}`);
      console.log(`  - ETH Balance: ${walletService.formatETH(balance.ethBalance)}`);

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
      // Testnet gas fees are much lower than mainnet - 0.001 ETH is sufficient
      const minGasBalance = BigInt('1000000000000000'); // 0.001 ETH
      if (balance.ethBalance < minGasBalance) {
        return {
          valid: false,
          error: `Insufficient ETH for gas. Have: ${walletService.formatETH(balance.ethBalance)}, Need at least 0.001 ETH`,
          balance,
        };
      }

      return { valid: true, balance };
    } catch (error) {
      console.error('  - Error fetching balances:', error);
      return {
        valid: false,
        error: `Failed to fetch wallet balances: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
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
        console.error(`\n❌ Validation failed: ${validation.error}\n`);
        return {
          success: false,
          error: validation.error,
        };
      }

      console.log(`✓ Validated: ${this.walletService.formatUSDC(BigInt(params.amount * 1_000_000))}`);
      console.log(`✓ From: ${validation.balance?.address}`);
      console.log(`✓ To: ${params.recipient}\n`);

      if (options.dryRun) {
        console.log('✓ Dry run completed successfully\n');
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

      // Execute transfer using Bridge Kit SDK
      console.log('--- Starting Transfer ---\n');
      console.log('ℹ️  Using Circle Bridge Kit SDK (automatic V2 API, built-in retry)\n');

      const result = await this.bridgeKitService.transferSepoliaToArc(
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
      console.error(`\n❌ Transfer failed: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        console.error(`\nStack trace:\n${error.stack}\n`);
      }

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
    try {
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
    } catch (error) {
      throw new Error(
        `Failed to fetch wallet status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Print wallet status
   */
  async printWalletStatus(privateKey: string): Promise<void> {
    try {
      const status = await this.getWalletStatus(privateKey);

      console.log('\n=== Wallet Status ===\n');
      console.log(`Address: ${status.address}\n`);
      console.log('Ethereum Sepolia:');
      console.log(`  USDC: ${status.balances.sepolia.usdc}`);
      console.log(`  ETH:  ${status.balances.sepolia.eth}\n`);
      console.log('Arc Testnet:');
      console.log(`  USDC: ${status.balances.arc.usdc}`);
      console.log(`  ETH:  ${status.balances.arc.eth}\n`);
    } catch (error) {
      throw new Error(
        `Failed to get wallet status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Resume a transfer from burn transaction hash
   * Note: With Bridge Kit, manual resume is generally not needed as the SDK
   * handles retries automatically. This method is kept for backward compatibility.
   */
  async resumeFromBurn(burnTxHash: string, privateKey: string): Promise<OrchestratorResult> {
    this.progress = [];

    try {
      console.log('\n=== Resuming Transfer ===\n');
      console.log(`Burn TX: ${burnTxHash}\n`);
      console.log('⚠️  Note: Bridge Kit handles retries automatically. Manual resume may not be needed.\n');

      // Bridge Kit doesn't support manual resume from burn hash
      // This would require using the lower-level CCTP provider directly
      console.error('❌ Manual resume from burn hash is not supported with Bridge Kit.');
      console.error('   Bridge Kit automatically handles attestation polling and retries.');
      console.error('   If the transfer failed, use the retry mechanism instead.\n');

      return {
        success: false,
        error: 'Manual resume not supported with Bridge Kit. Use automatic retry instead.',
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

  /**
   * Deposit USDC to Gateway (creates unified balance)
   */
  async depositToGateway(
    amount: number,
    chain: GatewayChain,
    privateKey: string
  ): Promise<{ success: boolean; result?: GatewayDepositResult; error?: string }> {
    try {
      console.log(`\n=== Depositing to Gateway on ${chain} ===\n`);

      const amountSmallest = BigInt(amount * 1_000_000);
      const result = await this.gatewayService.depositToGateway({
        amount: amountSmallest,
        chain,
        privateKey,
      });

      console.log(`\n✓ Deposit successful!`);
      console.log(`  Deposit TX: ${result.depositHash}`);
      console.log(`  Amount: $${amount.toFixed(2)} USDC`);
      console.log(`  Chain: ${chain}\n`);
      console.log(`⏳ Wait ~${this.getConfirmationTime(chain)} for confirmations before balance is available.\n`);

      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ Deposit failed: ${errorMessage}\n`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get Gateway balance across chains
   */
  async getGatewayBalance(
    privateKey: string,
    chains: GatewayChain[] = ['sepolia', 'arc']
  ): Promise<{ success: boolean; result?: GatewayBalanceResponse; error?: string }> {
    try {
      const address = this.walletService.getAddressFromPrivateKey(privateKey) as `0x${string}`;
      const result = await this.balanceAggregator.getBalanceSummary(address, chains);

      console.log('\n=== Gateway Balance ===\n');
      console.log(`Address: ${result.address}`);
      console.log(`Total: $${(Number(result.totalBalance) / 1_000_000).toFixed(2)} USDC\n`);

      for (const balance of result.balances) {
        const usdcAmount = Number(balance.balance) / 1_000_000;
        console.log(`  ${balance.chain}: $${usdcAmount.toFixed(2)} USDC`);
      }
      console.log('');

      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ Failed to get balance: ${errorMessage}\n`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Transfer using Gateway (instant cross-chain)
   */
  async transferViaGateway(
    amount: number,
    destinationChain: GatewayChain,
    recipient: string,
    privateKey: string,
    sourceChains?: GatewayChain[]
  ): Promise<{ success: boolean; result?: GatewayTransferResult; error?: string }> {
    try {
      console.log(`\n=== Gateway Transfer to ${destinationChain} ===\n`);

      const address = this.walletService.getAddressFromPrivateKey(privateKey) as `0x${string}`;
      const amountSmallest = BigInt(amount * 1_000_000);

      // Get optimal route if source chains not specified
      let route;
      if (!sourceChains) {
        console.log('Calculating optimal route...');
        route = await this.balanceAggregator.getOptimalTransferRoute(
          amountSmallest,
          destinationChain,
          address
        );

        console.log(`Using ${route.numSources} source chain(s):`);
        for (const source of route.sourceChains) {
          const srcAmount = Number(source.amount) / 1_000_000;
          console.log(`  - ${source.chain}: $${srcAmount.toFixed(2)}`);
        }
        console.log('');
      } else {
        // Use specified source chains
        const balanceResponse = await this.gatewayService.getGatewayBalance(
          address,
          sourceChains
        );

        route = {
          sourceChains: balanceResponse.balances
            .filter((b) => sourceChains.includes(b.chain) && b.balance > 0n)
            .map((b) => ({
              chain: b.chain,
              domain: b.domain,
              amount: b.balance > amountSmallest ? amountSmallest : b.balance,
            })),
          totalAmount: amountSmallest,
          numSources: sourceChains.length,
          estimatedFees: 2_010_000n,
        };
      }

      // Execute Gateway transfer
      console.log('Executing instant transfer...');
      const result = await this.gatewayService.transferGatewayBalance({
        amount: amountSmallest,
        sourceChains: route.sourceChains,
        destinationChain,
        recipient: recipient as `0x${string}`,
        privateKey,
      });

      console.log(`\n✓ Gateway Transfer Complete! (<500ms)\n`);
      console.log(`Mint TX: ${result.mintHash}`);
      console.log(`Amount: $${amount.toFixed(2)} USDC`);
      console.log(`Recipient: ${recipient}\n`);

      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ Gateway transfer failed: ${errorMessage}\n`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get confirmation time estimate for a chain
   */
  private getConfirmationTime(chain: GatewayChain): string {
    switch (chain) {
      case 'sepolia':
        return '13-19 minutes';
      case 'arc':
        return '~1 minute';
      case 'base':
        return '13-19 minutes';
      case 'avalanche':
        return '~8 seconds';
      default:
        return 'varies';
    }
  }

  // ========== Treasury Management Methods ==========

  /**
   * Configure treasury policy
   */
  async configurePolicy(params: {
    threshold: number;
    autoMode: boolean;
    vaultAddress?: Address;
    allowUSDCPool: boolean;
    allowUSDTPool: boolean;
    cooldownPeriod: number;
    privateKey: string;
  }): Promise<void> {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║         Treasury Policy Configuration                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log(`📋 Policy Settings:`);
    console.log(`   Threshold: ${params.threshold.toFixed(2)} USDC`);
    console.log(`   Mode: ${params.autoMode ? 'Auto (AI Agent)' : 'Manual (Vault)'}`);
    if (!params.autoMode && params.vaultAddress) {
      console.log(`   Vault Address: ${params.vaultAddress}`);
    }
    if (params.autoMode) {
      const pools = [];
      if (params.allowUSDCPool) pools.push('USDC/USDC');
      if (params.allowUSDTPool) pools.push('USDC/USDT');
      console.log(`   Allowed Pools: ${pools.join(', ')}`);
    }
    console.log(`   Cooldown: ${params.cooldownPeriod} seconds\n`);

    const result = await this.treasuryAutomationService.configurePolicy({
      balanceThreshold: params.threshold,
      autoMode: params.autoMode,
      vaultAddress: params.vaultAddress,
      allowUSDCPool: params.allowUSDCPool,
      allowUSDTPool: params.allowUSDTPool,
      cooldownPeriod: params.cooldownPeriod,
      privateKey: params.privateKey as `0x${string}`,
    });

    console.log(`✅ Policy configured successfully!`);
    console.log(`   Transaction: ${result.transactionHash}\n`);
  }

  /**
   * Get policy status
   */
  async getPolicyStatus(userAddress: Address): Promise<void> {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║              Treasury Policy Status                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const policy = await this.treasuryAutomationService.getUserPolicy(userAddress);
    const balance = await this.treasuryAutomationService.getUserBalance(userAddress);

    console.log(`Policy Status:`);
    console.log(`  Enabled: ${policy.enabled ? 'Yes' : 'No'}`);
    console.log(`  Mode: ${policy.autoMode ? 'Auto (AI Agent)' : 'Manual (Vault)'}`);
    console.log(`  Threshold: ${policy.balanceThreshold.toFixed(2)} USDC`);

    if (!policy.autoMode) {
      console.log(`  Vault Address: ${policy.vaultAddress}`);
    } else {
      const pools = [];
      if (policy.allowUSDCPool) pools.push('USDC/USDC');
      if (policy.allowUSDTPool) pools.push('USDC/USDT');
      console.log(`  Allowed Pools: ${pools.join(', ')}`);
    }

    console.log(`  Cooldown: ${policy.cooldownPeriod} seconds`);

    if (policy.lastExecutionTime > 0) {
      const date = new Date(policy.lastExecutionTime * 1000);
      console.log(`  Last Execution: ${date.toLocaleString()}`);
    } else {
      console.log(`  Last Execution: Never`);
    }

    console.log(`\nCurrent Balance:`);
    console.log(`  Treasury Balance: ${balance.balance.toFixed(2)} USDC`);
    if (balance.balance > policy.balanceThreshold) {
      const excess = balance.balance - policy.balanceThreshold;
      console.log(`  Excess Amount: ${excess.toFixed(2)} USDC (will be managed)\n`);
    } else {
      console.log(`  Below Threshold: ${(policy.balanceThreshold - balance.balance).toFixed(2)} USDC needed\n`);
    }
  }

  /**
   * Execute policy manually
   */
  async executePolicy(userAddress: Address, privateKey: string): Promise<void> {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║            Execute Treasury Policy                            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Check if can execute
    const canExecute = await this.treasuryAutomationService.canExecutePolicy(userAddress);

    if (!canExecute.canExecute) {
      console.log(`❌ Cannot execute policy: ${canExecute.reason}\n`);
      return;
    }

    console.log(`✅ Policy ready to execute!\n`);

    const result = await this.treasuryAutomationService.executePolicy({
      userAddress,
      privateKey: privateKey as `0x${string}`,
    });

    if (result.executed) {
      console.log(`✅ Policy executed successfully!`);
      console.log(`   Transaction: ${result.transactionHash}\n`);
    } else {
      console.log(`❌ Policy execution failed\n`);
    }
  }

  /**
   * Check if policy can execute
   */
  async checkPolicyStatus(userAddress: Address): Promise<void> {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           Policy Execution Check                              ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const canExecute = await this.treasuryAutomationService.canExecutePolicy(userAddress);
    const policy = await this.treasuryAutomationService.getUserPolicy(userAddress);
    const balance = await this.treasuryAutomationService.getUserBalance(userAddress);

    console.log(`Status: ${canExecute.canExecute ? '✅ Ready' : '❌ Not Ready'}`);
    console.log(`Reason: ${canExecute.reason}`);
    console.log(`\nDetails:`);
    console.log(`  Current Balance: ${balance.balance.toFixed(2)} USDC`);
    console.log(`  Threshold: ${policy.balanceThreshold.toFixed(2)} USDC`);
    if (balance.balance > policy.balanceThreshold) {
      console.log(`  Excess: ${(balance.balance - policy.balanceThreshold).toFixed(2)} USDC\n`);
    } else {
      console.log(`  Shortfall: ${(policy.balanceThreshold - balance.balance).toFixed(2)} USDC\n`);
    }
  }

  /**
   * Show available pools
   */
  async showPoolsInfo(): Promise<void> {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║          Available Liquidity Pools                            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
      // Get pool count (placeholder - in real implementation, get from contract)
      console.log(`Pool Information:\n`);

      // Try to get first two pools (USDC/USDC and USDC/USDT)
      for (let i = 0; i < 2; i++) {
        try {
          const pool = await this.treasuryAutomationService.getPoolInfo(i);
          console.log(`Pool ${i + 1}: ${pool.poolName}`);
          console.log(`  Address: ${pool.poolAddress}`);
          console.log(`  APY: ${pool.lastAPY.toFixed(2)}%`);
          console.log(`  Status: ${pool.active ? 'Active' : 'Inactive'}`);
          if (pool.lastUpdateTime > 0) {
            const date = new Date(pool.lastUpdateTime * 1000);
            console.log(`  Last Update: ${date.toLocaleString()}`);
          }
          console.log();
        } catch (error) {
          // Pool doesn't exist yet
          if (i === 0) {
            console.log(`No pools registered yet.\n`);
            console.log(`Pools will be registered by the contract owner.\n`);
          }
          break;
        }
      }
    } catch (error) {
      console.log(`Unable to fetch pool information.\n`);
      console.log(`Pools will be available after contract owner registers them.\n`);
    }
  }
}
