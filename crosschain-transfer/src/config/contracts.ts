/**
 * CCTP Contract Addresses and Chain Configurations
 *
 * Contract addresses from Circle's official documentation:
 * - CCTP: https://developers.circle.com/cctp/references/contract-addresses
 * - USDC: https://developers.circle.com/stablecoins/usdc-contract-addresses
 */

import { defineChain } from 'viem';

/**
 * Custom Arc Testnet chain definition for viem
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
});

/**
 * Ethereum Sepolia Configuration
 */
export const SEPOLIA = {
  chainId: 11155111,
  domain: 0,
  rpc: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/',
  explorer: 'https://sepolia.etherscan.io',
  // USDC on Ethereum Sepolia
  usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const,
  // CCTP V2 Contracts (Testnet)
  tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as const,
  messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as const,
} as const;

/**
 * Arc Testnet Configuration
 */
export const ARC = {
  chainId: 5042002,
  domain: 26,
  rpc: 'https://rpc.testnet.arc.network',
  explorer: 'https://testnet.arcscan.app',
  // USDC on Arc Testnet
  usdc: '0x3600000000000000000000000000000000000000' as const,
  // CCTP V2 Contracts (Testnet)
  tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as const,
  messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as const,
} as const;

/**
 * Circle API Configuration
 */
export const CIRCLE_API = {
  baseUrl: 'https://iris-api-sandbox.circle.com/v1',
  attestations: '/attestations',
} as const;

/**
 * CCTP Configuration Constants
 */
export const CCTP_CONFIG = {
  // Max fee for Fast Transfer (in USDC smallest unit, 6 decimals)
  // 0.0005 USDC = 500 base units
  defaultMaxFee: 500n,
  // Finality threshold for Standard Transfer
  // 1000 = Fast Transfer (not supported on all chains)
  // 2000 = Standard Transfer (supported on all chains, including Arc)
  standardFinalityThreshold: 2000,
  // Default destination caller (zero address = anyone can call)
  defaultDestinationCaller: '0x0000000000000000000000000000000000000000' as const,
  // Attestation polling timeout (milliseconds)
  attestationTimeout: 300000, // 5 minutes
  // Attestation polling interval (milliseconds)
  attestationPollInterval: 2000,
} as const;
