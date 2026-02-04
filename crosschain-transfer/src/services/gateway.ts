/**
 * Gateway Service - Handles unified cross-chain USDC balance
 *
 * This service implements Circle Gateway:
 * 1. Deposit USDC to create unified balance
 * 2. Query unified balance across chains
 * 3. Transfer instantly across chains (<500ms)
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

import { SEPOLIA, ARC, arcTestnet } from '../config/contracts.js';
import {
  GATEWAY_WALLET,
  GATEWAY_MINTER,
  GATEWAY_DOMAINS,
  GATEWAY_API,
  GATEWAY_CONFIG,
  GATEWAY_EIP712_DOMAIN,
  type GatewayChain,
} from '../config/gateway.js';
import {
  GatewayDepositParams,
  GatewayDepositResult,
  GatewayBalanceResponse,
  GatewayDomainBalance,
  GatewayTransferParams,
  GatewayTransferResult,
  GatewaySourceChain,
  GatewayBurnIntent,
  GatewayTransferSpec,
  GatewayError,
  GatewayDepositTooSmallError,
  GatewayTransferFailedError,
} from '../types/gateway.js';

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
 * Gateway Wallet ABI
 */
const GATEWAY_WALLET_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'srcDomain', type: 'uint32' },
    ],
    outputs: [],
  },
] as const;

/**
 * Gateway Minter ABI
 */
const GATEWAY_MINTER_ABI = [
  {
    name: 'gatewayMint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'burnIntents', type: 'bytes[]' },
      { name: 'signatures', type: 'bytes[]' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

/**
 * Get chain configuration
 */
function getChainConfig(chain: GatewayChain) {
  switch (chain) {
    case 'sepolia':
      return {
        viemChain: sepolia,
        rpc: SEPOLIA.rpc,
        usdc: SEPOLIA.usdc,
      };
    case 'arc':
      return {
        viemChain: arcTestnet,
        rpc: ARC.rpc,
        usdc: ARC.usdc,
      };
    default:
      throw new GatewayError(`Unsupported chain: ${chain}`);
  }
}

/**
 * Gateway Service class
 */
export class GatewayService {
  /**
   * Deposit USDC to Gateway on a specific chain
   *
   * Creates a unified balance that can be used across chains
   */
  async depositToGateway(params: GatewayDepositParams): Promise<GatewayDepositResult> {
    // Validate minimum deposit
    if (params.amount < GATEWAY_CONFIG.minDepositAmount) {
      throw new GatewayDepositTooSmallError(params.amount, GATEWAY_CONFIG.minDepositAmount);
    }

    const account = privateKeyToAccount(params.privateKey as `0x${string}`);
    const chainConfig = getChainConfig(params.chain);
    const domain = GATEWAY_DOMAINS[params.chain];
    const gatewayWallet = GATEWAY_WALLET[params.chain];

    // Create clients
    const walletClient = createWalletClient({
      chain: chainConfig.viemChain,
      account,
      transport: http(chainConfig.rpc),
    });

    const publicClient = createPublicClient({
      chain: chainConfig.viemChain,
      transport: http(chainConfig.rpc),
    });

    try {
      // Step 1: Check existing allowance
      const allowance = (await publicClient.readContract({
        address: chainConfig.usdc,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [account.address, gatewayWallet],
      })) as bigint;

      // Step 2: Approve if needed
      let approveHash: Hash | undefined;
      if (allowance < params.amount) {
        const hash = await walletClient.writeContract({
          address: chainConfig.usdc,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [gatewayWallet, params.amount],
        });

        approveHash = hash;
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Step 3: Deposit to Gateway
      const depositHash = await walletClient.writeContract({
        address: gatewayWallet,
        abi: GATEWAY_WALLET_ABI,
        functionName: 'deposit',
        args: [params.amount, domain],
      });

      // Wait for deposit confirmation
      await publicClient.waitForTransactionReceipt({ hash: depositHash });

      return {
        approveHash,
        depositHash,
        chain: params.chain,
        amount: params.amount,
      };
    } catch (error) {
      throw new GatewayTransferFailedError(
        `Failed to deposit to Gateway: ${error instanceof Error ? error.message : 'Unknown error'}`,
        params.chain
      );
    }
  }

  /**
   * Query Gateway balance across multiple domains
   *
   * Returns unified balance for a wallet address
   */
  async getGatewayBalance(
    address: Address,
    chains: GatewayChain[] = ['sepolia', 'arc']
  ): Promise<GatewayBalanceResponse> {
    const domains = chains.map((chain) => GATEWAY_DOMAINS[chain]);

    try {
      // Call Gateway API
      const response = await fetch(
        `${GATEWAY_API.baseUrl}${GATEWAY_API.balances}?address=${address}&domains=${domains.join(',')}`
      );

      if (!response.ok) {
        throw new GatewayError(`Gateway API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Parse balances
      const balances: GatewayDomainBalance[] = chains.map((chain, index) => ({
        domain: domains[index],
        chain,
        balance: BigInt(data.balances?.[domains[index]] || '0'),
      }));

      const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0n);

      return {
        address,
        totalBalance,
        balances,
      };
    } catch (error) {
      throw new GatewayError(
        `Failed to query Gateway balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Transfer Gateway balance instantly across chains
   *
   * Pulls from multiple source chains and mints on destination in <500ms
   */
  async transferGatewayBalance(
    params: GatewayTransferParams
  ): Promise<GatewayTransferResult> {
    const account = privateKeyToAccount(params.privateKey as `0x${string}`);
    const destinationDomain = GATEWAY_DOMAINS[params.destinationChain];
    const burnHashes = new Map<GatewayChain, string>();

    try {
      // Step 1: Create and sign burn intents for each source chain
      const burnIntents: string[] = [];
      const signatures: string[] = [];

      for (const source of params.sourceChains) {
        const chainConfig = getChainConfig(source.chain);
        const publicClient = createPublicClient({
          chain: chainConfig.viemChain,
          transport: http(chainConfig.rpc),
        });

        // Get current block height
        const blockNumber = await publicClient.getBlockNumber();
        const maxBlockHeight = blockNumber + 1000n; // Allow 1000 blocks for execution

        // Create transfer spec
        const transferSpec: GatewayTransferSpec = {
          recipient: params.recipient,
          amount: source.amount,
          srcDomain: source.domain,
          dstDomain: destinationDomain,
        };

        // Create burn intent
        const burnIntent: GatewayBurnIntent = {
          maxBlockHeight,
          maxFee: GATEWAY_CONFIG.defaultMaxFee,
          spec: transferSpec,
        };

        // Sign burn intent using EIP-712
        const signature = await account.signTypedData({
          domain: {
            name: GATEWAY_EIP712_DOMAIN.name,
            version: GATEWAY_EIP712_DOMAIN.version,
            chainId: chainConfig.viemChain.id,
            verifyingContract: GATEWAY_WALLET[source.chain],
          },
          types: {
            BurnIntent: [
              { name: 'maxBlockHeight', type: 'uint256' },
              { name: 'maxFee', type: 'uint256' },
              { name: 'spec', type: 'TransferSpec' },
            ],
            TransferSpec: [
              { name: 'recipient', type: 'address' },
              { name: 'amount', type: 'uint256' },
              { name: 'srcDomain', type: 'uint32' },
              { name: 'dstDomain', type: 'uint32' },
            ],
          },
          primaryType: 'BurnIntent',
          message: burnIntent,
        });

        // Encode burn intent for contract call
        const encodedBurnIntent = this.encodeBurnIntent(burnIntent);
        burnIntents.push(encodedBurnIntent);
        signatures.push(signature);

        // Store for result
        burnHashes.set(source.chain, signature); // Using signature as identifier
      }

      // Step 2: Submit to Gateway API for attestation
      const attestationResponse = await fetch(`${GATEWAY_API.baseUrl}${GATEWAY_API.transfer}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          burnIntents,
          signatures,
        }),
      });

      if (!attestationResponse.ok) {
        throw new GatewayTransferFailedError(
          `Gateway API transfer failed: ${attestationResponse.statusText}`
        );
      }

      const attestationData = await attestationResponse.json();
      const attestation = attestationData.attestation as string;

      // Step 3: Call gatewayMint on destination chain
      const destinationConfig = getChainConfig(params.destinationChain);
      const walletClient = createWalletClient({
        chain: destinationConfig.viemChain,
        account,
        transport: http(destinationConfig.rpc),
      });

      const publicClient = createPublicClient({
        chain: destinationConfig.viemChain,
        transport: http(destinationConfig.rpc),
      });

      const mintHash = await walletClient.writeContract({
        address: GATEWAY_MINTER[params.destinationChain],
        abi: GATEWAY_MINTER_ABI,
        functionName: 'gatewayMint',
        args: [
          burnIntents as `0x${string}`[],
          signatures as `0x${string}`[],
          attestation as `0x${string}`,
        ],
      });

      // Wait for mint confirmation
      await publicClient.waitForTransactionReceipt({ hash: mintHash });

      return {
        burnHashes,
        attestation,
        mintHash,
        amount: params.amount,
        sourceChains: params.sourceChains.map((s) => s.chain),
        destinationChain: params.destinationChain,
      };
    } catch (error) {
      throw new GatewayTransferFailedError(
        `Failed to transfer Gateway balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Encode burn intent for contract call
   * (Simplified encoding - adjust based on actual contract ABI requirements)
   */
  private encodeBurnIntent(burnIntent: GatewayBurnIntent): string {
    // This is a placeholder - actual encoding should match Gateway contract expectations
    // You may need to use viem's encodeAbiParameters or similar
    return '0x'; // TODO: Implement proper encoding
  }
}
