/**
 * Type definitions for Circle Gateway
 */

import type { Address } from 'viem';
import type { GatewayChain } from '../config/gateway.js';

/**
 * Gateway deposit parameters
 */
export interface GatewayDepositParams {
  /** Amount in USDC smallest units (6 decimals) */
  amount: bigint;
  /** Chain to deposit on */
  chain: GatewayChain;
  /** Private key for signing transactions */
  privateKey: string;
}

/**
 * Gateway deposit result
 */
export interface GatewayDepositResult {
  /** Approval transaction hash (if approval was needed) */
  approveHash?: string;
  /** Deposit transaction hash */
  depositHash: string;
  /** Chain deposited on */
  chain: GatewayChain;
  /** Amount deposited */
  amount: bigint;
}

/**
 * Gateway balance for a single domain
 */
export interface GatewayDomainBalance {
  /** Domain ID */
  domain: number;
  /** Chain name */
  chain: GatewayChain;
  /** Balance in USDC smallest units */
  balance: bigint;
}

/**
 * Gateway balance response
 */
export interface GatewayBalanceResponse {
  /** Wallet address */
  address: Address;
  /** Total balance across all domains */
  totalBalance: bigint;
  /** Balance per domain */
  balances: GatewayDomainBalance[];
}

/**
 * Source chain specification for Gateway transfer
 */
export interface GatewaySourceChain {
  /** Chain to pull from */
  chain: GatewayChain;
  /** Domain ID */
  domain: number;
  /** Amount to pull from this chain */
  amount: bigint;
}

/**
 * Burn intent for Gateway transfer (EIP-712 signature)
 */
export interface GatewayBurnIntent {
  /** Maximum block height for this intent */
  maxBlockHeight: bigint;
  /** Maximum fee willing to pay */
  maxFee: bigint;
  /** Transfer specification */
  spec: GatewayTransferSpec;
}

/**
 * Transfer specification (nested in BurnIntent)
 */
export interface GatewayTransferSpec {
  /** Recipient address */
  recipient: Address;
  /** Amount to transfer */
  amount: bigint;
  /** Source domain */
  srcDomain: number;
  /** Destination domain */
  dstDomain: number;
}

/**
 * Gateway transfer parameters
 */
export interface GatewayTransferParams {
  /** Total amount to transfer */
  amount: bigint;
  /** Source chains to pull from */
  sourceChains: GatewaySourceChain[];
  /** Destination chain */
  destinationChain: GatewayChain;
  /** Recipient address */
  recipient: Address;
  /** Private key for signing */
  privateKey: string;
}

/**
 * Gateway transfer result
 */
export interface GatewayTransferResult {
  /** Burn transaction hashes per source chain */
  burnHashes: Map<GatewayChain, string>;
  /** Attestation from Gateway API */
  attestation: string;
  /** Mint transaction hash on destination */
  mintHash: string;
  /** Total amount transferred */
  amount: bigint;
  /** Source chains used */
  sourceChains: GatewayChain[];
  /** Destination chain */
  destinationChain: GatewayChain;
}

/**
 * Gateway API attestation response
 */
export interface GatewayAttestationResponse {
  /** Attestation signature */
  attestation: string;
  /** Status */
  status: 'pending' | 'complete';
}

/**
 * Gateway errors
 */
export class GatewayError extends Error {
  constructor(
    message: string,
    public code?: string,
    public chain?: GatewayChain
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

export class GatewayInsufficientBalanceError extends GatewayError {
  constructor(chain: GatewayChain, required: bigint, available: bigint) {
    super(
      `Insufficient balance on ${chain}: required ${required}, available ${available}`,
      'INSUFFICIENT_BALANCE',
      chain
    );
    this.name = 'GatewayInsufficientBalanceError';
  }
}

export class GatewayDepositTooSmallError extends GatewayError {
  constructor(amount: bigint, minimum: bigint) {
    super(
      `Deposit amount ${amount} is below minimum ${minimum}`,
      'DEPOSIT_TOO_SMALL'
    );
    this.name = 'GatewayDepositTooSmallError';
  }
}

export class GatewayTransferFailedError extends GatewayError {
  constructor(message: string, chain?: GatewayChain) {
    super(message, 'TRANSFER_FAILED', chain);
    this.name = 'GatewayTransferFailedError';
  }
}
