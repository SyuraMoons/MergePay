import { defineChain } from 'viem';

export const baseSepolia = defineChain({
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://sepolia.base.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'BaseScan',
            url: 'https://sepolia.basescan.org',
        },
    },
    testnet: true,
});

export const UNISWAP_V4_AGENT = {
    chainId: 84532,
    address: '0x3b9a588c763314233ba804d3a19067233a97349c' as const,
    poolManager: '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408' as const,
    rpc: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
} as const;
