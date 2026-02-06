import { createPublicClient, createWalletClient, custom, http, type Address, type Hash } from 'viem';
import { baseSepolia, arbitrumSepolia, optimismSepolia, polygonAmoy } from 'viem/chains';
import MergeTreasuryABI from '@/lib/contracts/MergeTreasury.json';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface RegisteredWallet {
  address: Address;
  blockchain: string;
  isRegistered: boolean;
}

export interface AggregatedBalanceInfo {
  userId: string;
  totalBalance: bigint;
  wallets: RegisteredWallet[];
}

// ============================================
// CONFIGURATION
// ============================================

const MERGE_TREASURY_ADDRESS = (process.env.NEXT_PUBLIC_MERGE_TREASURY_ADDRESS || '') as Address;

// Default to Base Sepolia for MergeTreasury deployment
const DEFAULT_CHAIN = baseSepolia;

// ============================================
// CLIENT SETUP
// ============================================

/**
 * Get public client for reading contract data
 */
export function getPublicClient(chainId?: number) {
  const chain = chainId === arbitrumSepolia.id ? arbitrumSepolia
    : chainId === optimismSepolia.id ? optimismSepolia
    : chainId === polygonAmoy.id ? polygonAmoy
    : DEFAULT_CHAIN;

  return createPublicClient({
    chain,
    transport: http(),
  });
}

/**
 * Get wallet client for signing transactions
 */
export function getWalletClient(chainId?: number) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found');
  }

  const chain = chainId === arbitrumSepolia.id ? arbitrumSepolia
    : chainId === optimismSepolia.id ? optimismSepolia
    : chainId === polygonAmoy.id ? polygonAmoy
    : DEFAULT_CHAIN;

  return createWalletClient({
    chain,
    transport: custom(window.ethereum),
  });
}

// ============================================
// MULTI-WALLET AGGREGATION FUNCTIONS
// ============================================

/**
 * Register a wallet to a userId
 * @param userId Circle user ID (will be hashed to bytes32)
 * @param walletAddress Wallet address to register
 * @param signerAddress Address that will sign the transaction (must match walletAddress)
 */
export async function registerWallet(
  userId: string,
  walletAddress: Address,
  signerAddress: Address
): Promise<Hash> {
  if (walletAddress.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error('Signer must be the wallet owner');
  }

  const walletClient = getWalletClient();

  // Hash userId to bytes32
  const userIdHash = hashUserId(userId);

  const hash = await walletClient.writeContract({
    address: MERGE_TREASURY_ADDRESS,
    abi: MergeTreasuryABI.abi,
    functionName: 'registerWallet',
    args: [userIdHash, walletAddress],
    account: signerAddress,
  });

  return hash;
}

/**
 * Get all wallets registered to a userId
 */
export async function getUserWallets(userId: string): Promise<Address[]> {
  const publicClient = getPublicClient();
  const userIdHash = hashUserId(userId);

  const wallets = await publicClient.readContract({
    address: MERGE_TREASURY_ADDRESS,
    abi: MergeTreasuryABI.abi,
    functionName: 'getUserWallets',
    args: [userIdHash],
  }) as Address[];

  return wallets;
}

/**
 * Get aggregated balance for a userId
 * Returns sum of treasury balance + available allowance from linked wallets
 */
export async function getAggregatedBalance(userId: string): Promise<bigint> {
  const publicClient = getPublicClient();
  const userIdHash = hashUserId(userId);

  const balance = await publicClient.readContract({
    address: MERGE_TREASURY_ADDRESS,
    abi: MergeTreasuryABI.abi,
    functionName: 'getAggregatedBalance',
    args: [userIdHash],
  }) as bigint;

  return balance;
}

/**
 * Check if a wallet is registered to a userId
 */
export async function isWalletRegistered(walletAddress: Address): Promise<{ isRegistered: boolean; userId: string | null }> {
  const publicClient = getPublicClient();

  try {
    const userIdHash = await publicClient.readContract({
      address: MERGE_TREASURY_ADDRESS,
      abi: MergeTreasuryABI.abi,
      functionName: 'walletToUser',
      args: [walletAddress],
    }) as `0x${string}`;

    // bytes32(0) means not registered
    const isRegistered = userIdHash !== '0x0000000000000000000000000000000000000000000000000000000000000000';

    return {
      isRegistered,
      userId: isRegistered ? userIdHash : null,
    };
  } catch (error) {
    console.error('Error checking wallet registration:', error);
    return { isRegistered: false, userId: null };
  }
}

/**
 * Get balance for a specific userId from the treasury
 */
export async function getUserIdBalance(userId: string): Promise<bigint> {
  const publicClient = getPublicClient();
  const userIdHash = hashUserId(userId);

  const balance = await publicClient.readContract({
    address: MERGE_TREASURY_ADDRESS,
    abi: MergeTreasuryABI.abi,
    functionName: 'userIdBalances',
    args: [userIdHash],
  }) as bigint;

  return balance;
}

/**
 * Pull funds from a wallet to the treasury
 * Requires USDC approval from the wallet first
 */
export async function pullFunds(
  walletAddress: Address,
  amount: bigint,
  signerAddress: Address
): Promise<Hash> {
  if (walletAddress.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error('Signer must be the wallet owner');
  }

  const walletClient = getWalletClient();

  const hash = await walletClient.writeContract({
    address: MERGE_TREASURY_ADDRESS,
    abi: MergeTreasuryABI.abi,
    functionName: 'pullFunds',
    args: [walletAddress, amount],
    account: signerAddress,
  });

  return hash;
}

/**
 * Withdraw from userId balance
 * Only wallets registered to this userId can withdraw
 */
export async function withdrawByUserId(
  userId: string,
  amount: bigint,
  destinationAddress: Address,
  signerAddress: Address
): Promise<Hash> {
  const walletClient = getWalletClient();
  const userIdHash = hashUserId(userId);

  const hash = await walletClient.writeContract({
    address: MERGE_TREASURY_ADDRESS,
    abi: MergeTreasuryABI.abi,
    functionName: 'withdrawByUserId',
    args: [userIdHash, amount, destinationAddress],
    account: signerAddress,
  });

  return hash;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Hash userId to bytes32 for contract calls
 * Uses keccak256 to convert string userId to bytes32
 */
export function hashUserId(userId: string): `0x${string}` {
  if (!userId) {
    throw new Error('userId is required');
  }

  // Use viem's keccak256 to hash the userId string
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);

  // Convert to hex string
  const hexString = Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Use keccak256 from viem
  const { keccak256 } = require('viem');
  return keccak256(`0x${hexString}`);
}

/**
 * Format balance from wei to human-readable USDC
 * USDC has 6 decimals
 */
export function formatUSDC(amount: bigint): string {
  const value = Number(amount) / 1e6;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/**
 * Parse USDC amount to wei
 */
export function parseUSDC(amount: string): bigint {
  const value = parseFloat(amount);
  return BigInt(Math.floor(value * 1e6));
}

/**
 * Get contract address
 */
export function getMergeTreasuryAddress(): Address {
  if (!MERGE_TREASURY_ADDRESS) {
    throw new Error('NEXT_PUBLIC_MERGE_TREASURY_ADDRESS not configured');
  }
  return MERGE_TREASURY_ADDRESS;
}
