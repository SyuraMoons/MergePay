import { ChainBalance } from '@/types/balance';

export const mockBalances: ChainBalance[] = [
  {
    chainId: 'base',
    chainName: 'Base',
    balance: 3432.50,
    symbol: 'USDC',
    iconUrl: '/chains/base.svg',
  },
  {
    chainId: 'arbitrum',
    chainName: 'Arbitrum',
    balance: 4000.00,
    symbol: 'USDC',
    iconUrl: '/chains/arbitrum.svg',
  },
  {
    chainId: 'polygon',
    chainName: 'Polygon',
    balance: 3000.00,
    symbol: 'USDC',
    iconUrl: '/chains/polygon.svg',
  },
];

export const calculateTotalBalance = (chains: ChainBalance[]): number => {
  return chains.reduce((total, chain) => total + chain.balance, 0);
};
