/**
 * CCTP Service - Handles burn, attestation, and mint operations
 *
 * This service implements the CCTP V2 flow:
 * 1. Burn USDC on source chain using depositForBurn
 * 2. Poll for attestation from Circle API
 * 3. Mint USDC on destination chain using receiveMessage
 */

import { privateKeyToAccount } from 'viem/accounts';
import {
  createWalletClient,
  createPublicClient,
  http,
  type Hash,
  type Address,
} from 'viem';
import { sepolia } from 'viem/chains';
import { decodeEventLog, encodePacked, type Log } from 'viem';

import {
  SEPOLIA,
  ARC,
  CIRCLE_API,
  CCTP_CONFIG,
  arcTestnet,
} from '../config/contracts.js';
import {
  BurnParams,
  BurnResult,
  MintParams,
  MintResult,
  TransferResult,
  TransferProgressCallback,
  TransferStatus,
  TransferFailedError,
} from '../types/index.js';
import { pollWithBackoff } from '../utils/polling.js';

/**
 * ERC20 ABI for USDC approval
 */
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * TokenMessengerV2 ABI for CCTP burn
 *
 * CCTP V2 requires 7 parameters for depositForBurn:
 * - amount: uint256
 * - destinationDomain: uint32
 * - mintRecipient: bytes32
 * - burnToken: address
 * - destinationCaller: bytes32
 * - maxFee: uint256 (V2 addition - max fee for Fast Transfer)
 * - minFinalityThreshold: uint32 (V2 addition - finality level: 1000=Fast, 2000=Standard)
 */
const TOKEN_MESSENGER_ABI = [
  {
    name: 'depositForBurn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
      { name: 'destinationCaller', type: 'bytes32' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'minFinalityThreshold', type: 'uint32' },
    ],
    outputs: [{ name: '', type: 'uint64' }],
  },
  {
    name: 'DepositForBurn',
    type: 'event',
    inputs: [
      { name: 'nonce', type: 'uint64', indexed: true },
      { name: 'burnToken', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256' },
      { name: 'depositer', type: 'address', indexed: true },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'destinationCaller', type: 'bytes32' },
      { name: 'message', type: 'bytes' },
    ],
  },
] as const;

/**
 * MessageTransmitterV2 ABI for CCTP mint
 */
const MESSAGE_TRANSMITTER_ABI = [
  {
    name: 'receiveMessage',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'UsedNonce',
    type: 'event',
    inputs: [
      { name: 'nonce', type: 'uint64', indexed: true },
      { name: 'sourceDomain', type: 'uint32', indexed: true },
    ],
  },
] as const;

/**
 * CCTP Service class
 */
export class CCTPService {
  private onProgress?: TransferProgressCallback;

  constructor(onProgress?: TransferProgressCallback) {
    this.onProgress = onProgress;
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
   * Convert address to bytes32 format
   * Pads address with leading zeros to make it 32 bytes (64 hex chars)
   */
  private addressToBytes32(address: Address): `0x${string}` {
    // Remove 0x prefix and pad with leading zeros to 64 hex characters (32 bytes)
    const addressWithoutPrefix = address.toLowerCase().slice(2);
    const paddedAddress = addressWithoutPrefix.padStart(64, '0');
    return `0x${paddedAddress}` as `0x${string}`;
  }

  /**
   * Burn USDC on Ethereum Sepolia
   */
  async burnUSDConSepolia(params: BurnParams): Promise<BurnResult> {
    this.emit(TransferStatus.Burning, 'Approving USDC spend...');

    const account = privateKeyToAccount(params.privateKey as `0x${string}`);

    // Create wallet client for Sepolia
    const walletClient = createWalletClient({
      chain: sepolia,
      account,
      transport: http(SEPOLIA.rpc),
    });

    // Create public client for reading
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA.rpc),
    });

    try {
      // Step 1: Check existing allowance
      this.emit(TransferStatus.Burning, 'Checking USDC allowance...');
      const allowance = (await publicClient.readContract({
        address: SEPOLIA.usdc,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [account.address, SEPOLIA.tokenMessenger],
      })) as bigint;

      // Step 2: Approve if needed
      let approveHash: Hash | undefined;
      if (allowance < params.amount) {
        this.emit(TransferStatus.Burning, 'Approving USDC for CCTP...');

        const hash = await walletClient.writeContract({
          address: SEPOLIA.usdc,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [SEPOLIA.tokenMessenger, params.amount],
        });

        approveHash = hash;
        this.emit(TransferStatus.Burning, 'Approval submitted', hash);

        // Wait for approval confirmation
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Step 3: Deposit for burn (CCTP V2)
      this.emit(TransferStatus.Burning, 'Burning USDC on Ethereum Sepolia...');

      const burnHash = await walletClient.writeContract({
        address: SEPOLIA.tokenMessenger,
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: [
          params.amount,
          ARC.domain, // Arc Testnet domain
          this.addressToBytes32(params.mintRecipient as Address),
          SEPOLIA.usdc, // burnToken
          this.addressToBytes32(params.destinationCaller as Address),
          CCTP_CONFIG.defaultMaxFee, // maxFee (V2 parameter)
          CCTP_CONFIG.standardFinalityThreshold, // minFinalityThreshold (V2 parameter - 2000 for Standard)
        ],
      });

      this.emit(TransferStatus.Burning, 'Burn transaction submitted', burnHash);

      // Wait for burn confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: burnHash });

      // Extract message from event logs
      const message = this.extractMessageFromLogs(receipt.logs);

      this.emit(TransferStatus.AwaitingAttestation, 'Waiting for Circle attestation...', burnHash);

      return {
        approveHash: approveHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
        burnHash,
        nonce: message ? this.extractNonceFromLogs(receipt.logs) : undefined,
      };
    } catch (error) {
      this.emit(
        TransferStatus.Failed,
        `Burn failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new TransferFailedError(
        `Failed to burn USDC: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract message from DepositForBurn event logs
   */
  private extractMessageFromLogs(logs: readonly Log[]): string {
    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: TOKEN_MESSENGER_ABI,
          data: log.data,
          topics: log.topics as any,
        });

        if (decoded.eventName === 'DepositForBurn' && 'message' in decoded.args) {
          return decoded.args.message as string;
        }
      } catch {
        // Skip logs that don't match the event
        continue;
      }
    }
    throw new TransferFailedError('Could not extract message from burn transaction logs');
  }

  /**
   * Extract nonce from DepositForBurn event logs
   */
  private extractNonceFromLogs(logs: readonly Log[]): bigint | undefined {
    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: TOKEN_MESSENGER_ABI,
          data: log.data,
          topics: log.topics as any,
        });

        if (decoded.eventName === 'DepositForBurn' && 'nonce' in decoded.args) {
          return BigInt(decoded.args.nonce);
        }
      } catch {
        continue;
      }
    }
    return undefined;
  }

  /**
   * Get attestation from Circle API with polling
   */
  async getAttestation(burnTxHash: string): Promise<{ attestation: string; message: string }> {
    this.emit(TransferStatus.AwaitingAttestation, 'Polling Circle API for attestation...');

    try {
      // First, get the message from the transaction
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(SEPOLIA.rpc),
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: burnTxHash as Hash });
      const message = this.extractMessageFromLogs(receipt.logs);

      // Poll for attestation
      const attestation = await pollWithBackoff(
        async () => {
          const response = await fetch(`${CIRCLE_API.baseUrl}${CIRCLE_API.attestations}/${burnTxHash}`);

          // 404 means not ready yet, continue polling
          if (response.status === 404) {
            return null;
          }

          if (!response.ok) {
            throw new TransferFailedError(`Circle API error: ${response.statusText}`);
          }

          const data = await response.json();

          // Check if attestation is complete
          if (data.status === 'complete') {
            return data.attestation as string;
          }

          // Still pending
          return null;
        },
        {
          initialDelay: CCTP_CONFIG.attestationPollInterval,
          timeout: CCTP_CONFIG.attestationTimeout,
          maxAttempts: 60,
        }
      );

      this.emit(TransferStatus.AttestationReceived, 'Attestation received from Circle');

      return { attestation, message };
    } catch (error) {
      this.emit(
        TransferStatus.Failed,
        `Attestation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new TransferFailedError(
        `Failed to get attestation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Mint USDC on Arc Testnet
   */
  async mintUSDConArc(params: MintParams): Promise<MintResult> {
    this.emit(TransferStatus.Minting, 'Minting USDC on Arc Testnet...');

    const account = privateKeyToAccount(params.privateKey as `0x${string}`);

    const walletClient = createWalletClient({
      chain: arcTestnet,
      account,
      transport: http(ARC.rpc),
    });

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(ARC.rpc),
    });

    try {
      const mintHash = await walletClient.writeContract({
        address: ARC.messageTransmitter,
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: 'receiveMessage',
        args: [params.message as `0x${string}`, params.attestation as `0x${string}`],
      });

      this.emit(TransferStatus.Minting, 'Mint transaction submitted', mintHash);

      // Wait for mint confirmation
      await publicClient.waitForTransactionReceipt({ hash: mintHash });

      return { mintHash };
    } catch (error) {
      this.emit(
        TransferStatus.Failed,
        `Mint failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new TransferFailedError(
        `Failed to mint USDC: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute complete transfer from Sepolia to Arc
   */
  async transferSepoliaToArc(
    amount: bigint,
    mintRecipient: Address,
    privateKey: string
  ): Promise<TransferResult> {
    try {
      // Step 1: Burn USDC on Sepolia
      const burnResult = await this.burnUSDConSepolia({
        amount,
        mintRecipient,
        destinationCaller: CCTP_CONFIG.defaultDestinationCaller,
        privateKey,
      });

      // Step 2: Get attestation
      const { attestation, message } = await this.getAttestation(burnResult.burnHash);

      // Step 3: Mint USDC on Arc
      const mintResult = await this.mintUSDConArc({
        attestation,
        message,
        privateKey,
      });

      this.emit(TransferStatus.Completed, 'Transfer complete!');

      return {
        burnHash: burnResult.burnHash,
        attestation,
        mintHash: mintResult.mintHash,
        sourceChain: 'sepolia',
        destinationChain: 'arc',
        amount,
      };
    } catch (error) {
      this.emit(
        TransferStatus.Failed,
        `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }
}
