/**
 * Wallet Service for CCTP Transfers
 *
 * This service provides wallet operations using viem:
 * - Private key to wallet conversion
 * - Balance checking on both chains (Sepolia and Arc)
 * - Address validation
 */

import { privateKeyToAccount, type Address } from 'viem/accounts';
import {
  createWalletClient,
  createPublicClient,
  http,
} from 'viem';
import { sepolia } from 'viem/chains';

import { SEPOLIA, ARC, arcTestnet } from '../config/contracts.js';

/**
 * Wallet balance info
 */
export interface WalletBalance {
  address: Address;
  usdcBalance: bigint;
  ethBalance: bigint;
}

/**
 * Wallet Service
 *
 * Provides wallet operations for CCTP transfers using viem.
 * Uses raw private keys for signing transactions.
 */
export class WalletService {
  constructor() {}

  /**
   * Get address from private key
   */
  getAddressFromPrivateKey(privateKey: string): Address {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    return account.address;
  }

  /**
   * Get USDC balance on Sepolia
   */
  async getUSDCBalanceOnSepolia(address: Address): Promise<bigint> {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA.rpc),
    });

    const balance = await publicClient.readContract({
      address: SEPOLIA.usdc,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [address],
    });

    return balance as bigint;
  }

  /**
   * Get USDC balance on Arc
   */
  async getUSDCBalanceOnArc(address: Address): Promise<bigint> {
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(ARC.rpc),
    });

    const balance = await publicClient.readContract({
      address: ARC.usdc,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [address],
    });

    return balance as bigint;
  }

  /**
   * Get native ETH balance on Sepolia
   */
  async getNativeBalanceOnSepolia(address: Address): Promise<bigint> {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA.rpc),
    });

    return await publicClient.getBalance({ address });
  }

  /**
   * Get native ETH balance on Arc
   */
  async getNativeBalanceOnArc(address: Address): Promise<bigint> {
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(ARC.rpc),
    });

    return await publicClient.getBalance({ address });
  }

  /**
   * Get complete wallet balances on both chains
   */
  async getWalletBalances(address: Address): Promise<WalletBalance> {
    const [usdcSepolia, usdcArc, ethSepolia, ethArc] = await Promise.all([
      this.getUSDCBalanceOnSepolia(address),
      this.getUSDCBalanceOnArc(address),
      this.getNativeBalanceOnSepolia(address),
      this.getNativeBalanceOnArc(address),
    ]);

    return {
      address,
      usdcBalance: usdcSepolia,
      ethBalance: ethSepolia,
    };
  }

  /**
   * Format balance for display
   */
  formatUSDC(balance: bigint): string {
    // USDC has 6 decimals
    const value = Number(balance) / 1_000_000;
    return `$${value.toFixed(2)} USDC`;
  }

  /**
   * Format ETH balance for display
   */
  formatETH(balance: bigint): string {
    // ETH has 18 decimals
    const value = Number(balance) / 1_000_000_000_000_000_000;
    return `${value.toFixed(4)} ETH`;
  }

  /**
   * Validate address format
   */
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

/**
 * Utility function to create a wallet service
 */
export function createWalletService(): WalletService {
  return new WalletService();
}
