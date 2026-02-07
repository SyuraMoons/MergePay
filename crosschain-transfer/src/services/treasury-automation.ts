import { privateKeyToAccount } from 'viem/accounts';
import {
  createWalletClient,
  createPublicClient,
  http,
  type Address,
} from 'viem';
import { arcTestnet } from '../config/contracts.js';
import { MERGE_TREASURY_ADDRESS, MERGE_TREASURY_ABI } from '../config/treasury-automation.js';

/**
 * Treasury Automation Service
 * Handles policy configuration and execution
 */
export class TreasuryAutomationService {
  /**
   * Configure treasury policy
   */
  async configurePolicy(params: {
    balanceThreshold: number;     // USDC amount
    useUSYC: boolean;             // true = USYC Yield, false = manual vault
    vaultAddress?: Address;        // Required if useUSYC = false
    cooldownPeriod: number;        // Seconds between executions
    privateKey: `0x${string}`;
  }) {
    const account = privateKeyToAccount(params.privateKey);

    const walletClient = createWalletClient({
      chain: arcTestnet,
      account,
      transport: http(arcTestnet.rpcUrls.default.http[0]),
    });

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(arcTestnet.rpcUrls.default.http[0]),
    });

    // Validate inputs
    if (!params.useUSYC && !params.vaultAddress) {
      throw new Error('Vault address required for manual mode');
    }

    // Convert threshold to smallest unit
    const thresholdInSmallestUnit = BigInt(Math.floor(params.balanceThreshold * 1_000_000));

    const hash = await walletClient.writeContract({
      address: MERGE_TREASURY_ADDRESS,
      abi: MERGE_TREASURY_ABI,
      functionName: 'configureTreasuryPolicy',
      args: [
        thresholdInSmallestUnit,
        params.useUSYC,
        params.vaultAddress || '0x0000000000000000000000000000000000000000',
        BigInt(params.cooldownPeriod),
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      transactionHash: hash,
      status: receipt.status === 'success' ? 'success' : 'failed',
    };
  }

  /**
   * Execute treasury policy for a user
   */
  async executePolicy(params: {
    userAddress: Address;
    privateKey: `0x${string}`;
  }) {
    const account = privateKeyToAccount(params.privateKey);

    const walletClient = createWalletClient({
      chain: arcTestnet,
      account,
      transport: http(arcTestnet.rpcUrls.default.http[0]),
    });

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(arcTestnet.rpcUrls.default.http[0]),
    });

    const hash = await walletClient.writeContract({
      address: MERGE_TREASURY_ADDRESS,
      abi: MERGE_TREASURY_ABI,
      functionName: 'executeTreasuryPolicy',
      args: [params.userAddress],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      transactionHash: hash,
      status: receipt.status === 'success' ? 'success' : 'failed',
      executed: receipt.status === 'success',
    };
  }

  /**
   * Get user's policy configuration
   */
  async getUserPolicy(userAddress: Address) {
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(arcTestnet.rpcUrls.default.http[0]),
    });

    const policy = await publicClient.readContract({
      address: MERGE_TREASURY_ADDRESS,
      abi: MERGE_TREASURY_ABI,
      functionName: 'getUserPolicy',
      args: [userAddress],
    }) as any;

    return {
      balanceThreshold: Number(policy.balanceThreshold) / 1_000_000,
      enabled: policy.enabled,
      useUSYC: policy.useUSYC,
      vaultAddress: policy.vaultAddress,
      lastExecutionTime: Number(policy.lastExecutionTime),
      cooldownPeriod: Number(policy.cooldownPeriod),
    };
  }

  /**
   * Check if policy can be executed
   */
  async canExecutePolicy(userAddress: Address) {
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(arcTestnet.rpcUrls.default.http[0]),
    });

    const result = await publicClient.readContract({
      address: MERGE_TREASURY_ADDRESS,
      abi: MERGE_TREASURY_ABI,
      functionName: 'canExecutePolicy',
      args: [userAddress],
    }) as any;

    return {
      canExecute: result[0],
      reason: result[1],
    };
  }

  /**
   * Get pool information
   */
  async getPoolInfo(poolIndex: number) {
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(arcTestnet.rpcUrls.default.http[0]),
    });

    const pool = await publicClient.readContract({
      address: MERGE_TREASURY_ADDRESS,
      abi: MERGE_TREASURY_ABI,
      functionName: 'availablePools',
      args: [BigInt(poolIndex)],
    }) as any;

    return {
      poolAddress: pool.poolAddress,
      poolName: pool.poolName,
      lastAPY: Number(pool.lastAPY) / 100, // Convert basis points to percentage
      lastUpdateTime: Number(pool.lastUpdateTime),
      active: pool.active,
    };
  }

  /**
   * Get user's balance in treasury
   */
  async getUserBalance(userAddress: Address) {
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(arcTestnet.rpcUrls.default.http[0]),
    });

    const balance = await publicClient.readContract({
      address: MERGE_TREASURY_ADDRESS,
      abi: MERGE_TREASURY_ABI,
      functionName: 'userBalances',
      args: [userAddress],
    }) as bigint;

    return {
      balance: Number(balance) / 1_000_000,
      balanceRaw: balance,
    };
  }
}
