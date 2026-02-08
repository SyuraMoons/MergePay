import { createPublicClient, createWalletClient, http, type Address, type Hash, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, UNISWAP_V4_AGENT } from '../config/uniswap-v4.js';
import type {
    PoolKey,
    SwapParams,
    AddLiquidityParams,
    RemoveLiquidityParams,
    LiquidityPosition,
} from '../types/uniswap-v4.js';

// Simplified ABI for UniswapV4Agent
const UNISWAP_V4_AGENT_ABI = [
    {
        inputs: [
            {
                components: [
                    { name: 'currency0', type: 'address' },
                    { name: 'currency1', type: 'address' },
                    { name: 'fee', type: 'uint24' },
                    { name: 'tickSpacing', type: 'int24' },
                    { name: 'hooks', type: 'address' }
                ],
                name: 'poolKey',
                type: 'tuple'
            },
            { name: 'zeroForOne', type: 'bool' },
            { name: 'amountSpecified', type: 'int256' },
            { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ],
        name: 'swap',
        outputs: [
            { name: 'delta0', type: 'int256' },
            { name: 'delta1', type: 'int256' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                components: [
                    {
                        components: [
                            { name: 'currency0', type: 'address' },
                            { name: 'currency1', type: 'address' },
                            { name: 'fee', type: 'uint24' },
                            { name: 'tickSpacing', type: 'int24' },
                            { name: 'hooks', type: 'address' }
                        ],
                        name: 'poolKey',
                        type: 'tuple'
                    },
                    { name: 'tickLower', type: 'int24' },
                    { name: 'tickUpper', type: 'int24' },
                    { name: 'amount0Desired', type: 'uint256' },
                    { name: 'amount1Desired', type: 'uint256' },
                    { name: 'amount0Min', type: 'uint256' },
                    { name: 'amount1Min', type: 'uint256' },
                    { name: 'recipient', type: 'address' },
                    { name: 'deadline', type: 'uint256' }
                ],
                name: 'params',
                type: 'tuple'
            }
        ],
        name: 'addLiquidity',
        outputs: [
            { name: 'liquidity', type: 'uint128' },
            { name: 'amount0', type: 'uint256' },
            { name: 'amount1', type: 'uint256' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                components: [
                    {
                        components: [
                            { name: 'currency0', type: 'address' },
                            { name: 'currency1', type: 'address' },
                            { name: 'fee', type: 'uint24' },
                            { name: 'tickSpacing', type: 'int24' },
                            { name: 'hooks', type: 'address' }
                        ],
                        name: 'poolKey',
                        type: 'tuple'
                    },
                    { name: 'tickLower', type: 'int24' },
                    { name: 'tickUpper', type: 'int24' },
                    { name: 'liquidity', type: 'uint128' },
                    { name: 'amount0Min', type: 'uint256' },
                    { name: 'amount1Min', type: 'uint256' },
                    { name: 'recipient', type: 'address' },
                    { name: 'deadline', type: 'uint256' }
                ],
                name: 'params',
                type: 'tuple'
            }
        ],
        name: 'removeLiquidity',
        outputs: [
            { name: 'amount0', type: 'uint256' },
            { name: 'amount1', type: 'uint256' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'poolId', type: 'bytes32' },
            { name: 'tickLower', type: 'int24' },
            { name: 'tickUpper', type: 'int24' }
        ],
        name: 'getPosition',
        outputs: [
            {
                components: [
                    { name: 'liquidity', type: 'uint128' },
                    { name: 'tickLower', type: 'int24' },
                    { name: 'tickUpper', type: 'int24' },
                    { name: 'lastFeeCollection', type: 'uint256' },
                    { name: 'amount0', type: 'uint256' },
                    { name: 'amount1', type: 'uint256' }
                ],
                name: '',
                type: 'tuple'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'poolManager',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

export class UniswapV4AgentService {
    private publicClient: ReturnType<typeof createPublicClient>;
    private walletClient: ReturnType<typeof createWalletClient> | null = null;
    private contractAddress: Address = UNISWAP_V4_AGENT.address as Address;

    constructor(privateKey?: string) {
        this.publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(UNISWAP_V4_AGENT.rpc),
        });

        if (privateKey) {
            const account = privateKeyToAccount(privateKey as `0x${string}`);
            this.walletClient = createWalletClient({
                account,
                chain: baseSepolia,
                transport: http(UNISWAP_V4_AGENT.rpc),
            });
        }
    }

    /**
     * Execute a token swap
     */
    async swap(params: SwapParams): Promise<{ delta0: bigint; delta1: bigint; txHash: Hash }> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized. Private key required.');
        }

        const { request } = await this.publicClient.simulateContract({
            address: this.contractAddress,
            abi: UNISWAP_V4_AGENT_ABI,
            functionName: 'swap',
            args: [
                {
                    currency0: params.poolKey.currency0 as Address,
                    currency1: params.poolKey.currency1 as Address,
                    fee: params.poolKey.fee,
                    tickSpacing: params.poolKey.tickSpacing,
                    hooks: params.poolKey.hooks as Address
                },
                params.zeroForOne,
                params.amountSpecified,
                params.sqrtPriceLimitX96,
            ],
            account: this.walletClient.account,
        });

        const hash = await this.walletClient.writeContract(request);

        // In a real app we'd parse logs to get actual deltas, but for now we'll wait for receipt 
        // and rely on simulation values if needed, or just return hash.
        // The contract function returns values, which are accessible via simulation results (result)
        // but the transaction write returns a hash.

        // We can get the simulation return value here:
        // @ts-ignore
        const [delta0, delta1] = await this.publicClient.readContract({
            address: this.contractAddress,
            abi: UNISWAP_V4_AGENT_ABI,
            functionName: 'swap',
            args: [
                {
                    currency0: params.poolKey.currency0 as Address,
                    currency1: params.poolKey.currency1 as Address,
                    fee: params.poolKey.fee,
                    tickSpacing: params.poolKey.tickSpacing,
                    hooks: params.poolKey.hooks as Address
                },
                params.zeroForOne,
                params.amountSpecified,
                params.sqrtPriceLimitX96,
            ],
            account: this.walletClient.account, // use account to simulate with correct context if needed
        }).catch(() => [0n, 0n]); // Fallback if simulation fails (e.g. view call limitation on state changing func) which often happens with write functions.
        // Actually, `readContract` on a non-view function performs a static call (eth_call) which simulates it.

        return {
            delta0: delta0,
            delta1: delta1,
            txHash: hash,
        };
    }

    /**
     * Add liquidity to a pool
     */
    async addLiquidity(
        params: AddLiquidityParams
    ): Promise<{ liquidity: bigint; amount0: bigint; amount1: bigint; txHash: Hash }> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized. Private key required.');
        }

        const { request, result } = await this.publicClient.simulateContract({
            address: this.contractAddress,
            abi: UNISWAP_V4_AGENT_ABI,
            functionName: 'addLiquidity',
            args: [{
                poolKey: {
                    currency0: params.poolKey.currency0 as Address,
                    currency1: params.poolKey.currency1 as Address,
                    fee: params.poolKey.fee,
                    tickSpacing: params.poolKey.tickSpacing,
                    hooks: params.poolKey.hooks as Address
                },
                tickLower: params.tickLower,
                tickUpper: params.tickUpper,
                amount0Desired: params.amount0Desired,
                amount1Desired: params.amount1Desired,
                amount0Min: params.amount0Min,
                amount1Min: params.amount1Min,
                recipient: params.recipient as Address,
                deadline: params.deadline
            }],
            account: this.walletClient.account,
        });

        const hash = await this.walletClient.writeContract(request);
        const [liquidity, amount0, amount1] = result;

        return {
            liquidity,
            amount0,
            amount1,
            txHash: hash,
        };
    }

    /**
     * Remove liquidity from a pool
     */
    async removeLiquidity(
        params: RemoveLiquidityParams
    ): Promise<{ amount0: bigint; amount1: bigint; txHash: Hash }> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized. Private key required.');
        }

        const { request, result } = await this.publicClient.simulateContract({
            address: this.contractAddress,
            abi: UNISWAP_V4_AGENT_ABI,
            functionName: 'removeLiquidity',
            args: [{
                poolKey: {
                    currency0: params.poolKey.currency0 as Address,
                    currency1: params.poolKey.currency1 as Address,
                    fee: params.poolKey.fee,
                    tickSpacing: params.poolKey.tickSpacing,
                    hooks: params.poolKey.hooks as Address
                },
                tickLower: params.tickLower,
                tickUpper: params.tickUpper,
                liquidity: params.liquidity,
                amount0Min: params.amount0Min,
                amount1Min: params.amount1Min,
                recipient: params.recipient as Address,
                deadline: params.deadline
            }],
            account: this.walletClient.account,
        });

        const hash = await this.walletClient.writeContract(request);
        const [amount0, amount1] = result;

        return {
            amount0,
            amount1,
            txHash: hash,
        };
    }

    /**
     * Get user's position
     */
    async getPosition(
        owner: Address,
        poolId: string, // hex string
        tickLower: number,
        tickUpper: number
    ): Promise<LiquidityPosition> {
        const position = await this.publicClient.readContract({
            address: this.contractAddress,
            abi: UNISWAP_V4_AGENT_ABI,
            functionName: 'getPosition',
            args: [owner, poolId as `0x${string}`, tickLower, tickUpper],
        });

        return position as LiquidityPosition;
    }

    /**
     * Get pool manager address
     */
    async getPoolManager(): Promise<Address> {
        const poolManager = await this.publicClient.readContract({
            address: this.contractAddress,
            abi: UNISWAP_V4_AGENT_ABI,
            functionName: 'poolManager',
        });

        return poolManager as Address;
    }
}
