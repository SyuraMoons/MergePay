/**
 * Type definitions for CCTP Cross-Chain Transfer
 */

/**
 * Transfer status enum
 */
export enum TransferStatus {
  Pending = 'pending',
  Burning = 'burning',
  AwaitingAttestation = 'awaiting_attestation',
  AttestationReceived = 'attestation_received',
  Minting = 'minting',
  Completed = 'completed',
  Failed = 'failed',
}

/**
 * Burn parameters for depositForBurn
 */
export interface BurnParams {
  /** Amount in USDC smallest units (6 decimals) */
  amount: bigint;
  /** Recipient address on destination chain (as bytes32 padded address) */
  mintRecipient: string;
  /** Who is allowed to call receiveMessage on destination (0x0...0 for anyone) */
  destinationCaller: string;
  /** Private key for signing transactions */
  privateKey: string;
}

/**
 * Result of burning USDC on source chain
 */
export interface BurnResult {
  /** Transaction hash of approval transaction */
  approveHash: string;
  /** Transaction hash of burn transaction */
  burnHash: string;
  /** The nonce for tracking the message */
  nonce?: bigint;
}

/**
 * Mint parameters for receiveMessage
 */
export interface MintParams {
  /** Atestation signature from Circle API */
  attestation: string;
  /** The encoded message from the burn event */
  message: string;
  /** Private key for signing transactions */
  privateKey: string;
}

/**
 * Result of minting USDC on destination chain
 */
export interface MintResult {
  /** Transaction hash of mint transaction */
  mintHash: string;
}

/**
 * Complete transfer result
 */
export interface TransferResult {
  /** Burn transaction hash */
  burnHash: string;
  /** Attestation from Circle */
  attestation: string;
  /** Mint transaction hash */
  mintHash: string;
  /** Source chain */
  sourceChain: string;
  /** Destination chain */
  destinationChain: string;
  /** Amount transferred (in USDC) */
  amount: bigint;
}

/**
 * Error types
 */
export class CCTPError extends Error {
  constructor(
    message: string,
    public code?: string,
    public txHash?: string
  ) {
    super(message);
    this.name = 'CCTPError';
  }
}

export class AttestationTimeoutError extends CCTPError {
  constructor(txHash: string) {
    super(`Attestation timeout for transaction ${txHash}`, 'ATTESTATION_TIMEOUT', txHash);
    this.name = 'AttestationTimeoutError';
  }
}

export class TransferFailedError extends CCTPError {
  constructor(message: string, txHash?: string) {
    super(message, 'TRANSFER_FAILED', txHash);
    this.name = 'TransferFailedError';
  }
}

/**
 * Event log types for tracking
 */
export interface TransferEvent {
  timestamp: number;
  status: TransferStatus;
  message: string;
  txHash?: string;
}

/**
 * Transfer progress callback type
 */
export type TransferProgressCallback = (event: TransferEvent) => void;
