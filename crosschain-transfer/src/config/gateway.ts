/**
 * Circle Gateway Configuration
 *
 * Gateway allows creating a unified USDC balance across multiple chains
 * with instant cross-chain transfers (<500ms)
 *
 * Official Gateway Documentation:
 * - https://developers.circle.com/gateway/overview
 * - https://developers.circle.com/gateway/reference/contract-addresses
 */

/**
 * Gateway Chain Domain Mappings (Testnet)
 */
export const GATEWAY_DOMAINS = {
  sepolia: 0,
  arc: 26,
  base: 6,
  avalanche: 1,
} as const;

/**
 * Gateway Wallet Contract Addresses (Testnet)
 * This contract holds the unified USDC balance
 */
export const GATEWAY_WALLET = {
  sepolia: '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as const,
  arc: '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as const,
  base: '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as const,
  avalanche: '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as const,
} as const;

/**
 * Gateway Minter Contract Addresses (Testnet)
 * This contract handles instant minting on destination chain
 */
export const GATEWAY_MINTER = {
  sepolia: '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B' as const,
  arc: '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B' as const,
  base: '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B' as const,
  avalanche: '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B' as const,
} as const;

/**
 * Gateway API Configuration (Testnet)
 */
export const GATEWAY_API = {
  baseUrl: 'https://gateway-api-testnet.circle.com',
  balances: '/v1/balances',
  transfer: '/v1/transfer',
} as const;

/**
 * Gateway Configuration Constants
 */
export const GATEWAY_CONFIG = {
  // Minimum deposit amount (to cover fees)
  minDepositAmount: 2_010_000n, // 2.01 USDC (6 decimals)
  // Default max fee for Gateway transfers (in USDC smallest unit)
  defaultMaxFee: 2_010_000n, // 2.01 USDC
  // Block confirmations required before balance is available
  confirmations: {
    sepolia: 65, // ~13-19 minutes
    arc: 1, // Varies based on network
    base: 65, // ~13-19 minutes
    avalanche: 1, // ~8 seconds
  },
  // Transfer timeout (milliseconds)
  transferTimeout: 60000, // 1 minute
} as const;

/**
 * Supported chains for Gateway
 */
export type GatewayChain = keyof typeof GATEWAY_DOMAINS;

/**
 * EIP-712 Domain for Gateway signatures
 */
export const GATEWAY_EIP712_DOMAIN = {
  name: 'GatewayWallet',
  version: '1',
} as const;
