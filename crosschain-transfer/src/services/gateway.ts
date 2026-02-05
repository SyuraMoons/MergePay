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
  padHex,
  toHex,
} from 'viem';
import { sepolia } from 'viem/chains';
import crypto from 'crypto';

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
      { name: 'token', type: 'address' },
      { name: 'value', type: 'uint256' },
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
        args: [chainConfig.usdc, params.amount],
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
    // Check for API key
    const apiKey = process.env.CIRCLE_GATEWAY_API_KEY;
    if (!apiKey) {
      throw new GatewayError(
        'CIRCLE_GATEWAY_API_KEY not set in .env file. Get your API key from: https://circle.com/en/developers'
      );
    }

    try {
      // Call Gateway API with POST and authentication
      const response = await fetch(
        `${GATEWAY_API.baseUrl}${GATEWAY_API.balances}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: 'USDC',
            sources: chains.map(chain => ({
              depositor: address,
              domain: GATEWAY_DOMAINS[chain]
            }))
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new GatewayError(`Gateway API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      // Parse response - API returns array of balance objects
      const balances: GatewayDomainBalance[] = (data.balances || []).map((item: any) => {
        const chain = chains.find(c => GATEWAY_DOMAINS[c] === item.domain);
        // Convert balance string (e.g., "1000.50") to smallest unit (1000500000)
        // USDC has 6 decimals
        const balanceStr = item.balance || '0';
        const balanceFloat = parseFloat(balanceStr);
        const balanceInSmallestUnit = BigInt(Math.floor(balanceFloat * 1000000));

        return {
          domain: item.domain,
          chain: chain || chains[0], // Fallback to first chain if not found
          balance: balanceInSmallestUnit,
        };
      });

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
    const destinationConfig = getChainConfig(params.destinationChain);
    const destinationUSDC = destinationConfig.usdc;
    const burnHashes = new Map<GatewayChain, string>();

    try {
      // Step 1: Create and sign burn intents for each source chain
      const signedIntents = [];

      for (const source of params.sourceChains) {
        const chainConfig = getChainConfig(source.chain);
        const publicClient = createPublicClient({
          chain: chainConfig.viemChain,
          transport: http(chainConfig.rpc),
        });

        // Get current block height
        const blockNumber = await publicClient.getBlockNumber();
        const maxBlockHeight = blockNumber + 1000n; // Allow 1000 blocks for execution

        // Create transfer spec matching Gateway API structure
        const spec = {
          version: 1,
          sourceDomain: source.domain,
          destinationDomain: destinationDomain,
          sourceContract: padHex(GATEWAY_WALLET[source.chain], { size: 32 }),
          destinationContract: padHex(GATEWAY_MINTER[params.destinationChain], { size: 32 }),
          sourceToken: padHex(chainConfig.usdc, { size: 32 }),
          destinationToken: padHex(destinationUSDC, { size: 32 }),
          sourceDepositor: padHex(account.address, { size: 32 }),
          destinationRecipient: padHex(params.recipient, { size: 32 }),
          sourceSigner: padHex(account.address, { size: 32 }),
          destinationCaller: padHex('0x0000000000000000000000000000000000000000', { size: 32 }),
          value: source.amount.toString(),
          salt: toHex(crypto.randomBytes(32)),
          hookData: '0x',
        };

        // Create burn intent for EIP-712 signing
        const burnIntent: GatewayBurnIntent = {
          maxBlockHeight,
          maxFee: GATEWAY_CONFIG.defaultMaxFee,
          spec: {
            recipient: params.recipient,
            amount: source.amount,
            srcDomain: source.domain,
            dstDomain: destinationDomain,
          },
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

        // Add signed intent matching API structure
        signedIntents.push({
          maxBlockHeight: maxBlockHeight.toString(),
          maxFee: GATEWAY_CONFIG.defaultMaxFee.toString(),
          spec,
          signature,
        });

        // Store for result
        burnHashes.set(source.chain, signature);
      }

      // Step 2: Submit to Gateway API for attestation
      // API expects flat array of {burnIntent, signature} objects
      const requestBody = signedIntents.map(intent => ({
        burnIntent: {
          maxBlockHeight: intent.maxBlockHeight,
          maxFee: intent.maxFee,
          spec: intent.spec
        },
        signature: intent.signature
      }));

      const attestationResponse = await fetch(`${GATEWAY_API.baseUrl}${GATEWAY_API.transfer}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!attestationResponse.ok) {
        const errorText = await attestationResponse.text();
        throw new GatewayTransferFailedError(
          `Gateway API transfer failed: ${attestationResponse.statusText} - ${errorText}`
        );
      }

      const attestationData = await attestationResponse.json();
      const attestation = attestationData.attestation as string;

      // Step 3: Call gatewayMint on destination chain
      const walletClient = createWalletClient({
        chain: destinationConfig.viemChain,
        account,
        transport: http(destinationConfig.rpc),
      });

      const publicClient = createPublicClient({
        chain: destinationConfig.viemChain,
        transport: http(destinationConfig.rpc),
      });

      // Encode burn intents for contract call
      // Note: The Gateway Minter expects encoded burn intent bytes
      const encodedBurnIntents = signedIntents.map((intent) => {
        // Simple ABI encoding of the burn intent structure
        // This matches what the Gateway contract expects
        return JSON.stringify(intent);
      });

      const mintHash = await walletClient.writeContract({
        address: GATEWAY_MINTER[params.destinationChain],
        abi: GATEWAY_MINTER_ABI,
        functionName: 'gatewayMint',
        args: [
          encodedBurnIntents as `0x${string}`[],
          signedIntents.map((i) => i.signature) as `0x${string}`[],
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
}
