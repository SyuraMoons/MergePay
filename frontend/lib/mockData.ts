import { ChainBalance } from '@/types/balance';

export const mockBalances: ChainBalance[] = [
  {
    chainId: 'base',
    chainName: 'Base',
    balance: 20.0,
    symbol: 'USDC',
    iconUrl: '/chains/base.svg',
  },
  {
    chainId: 'arbitrum',
    chainName: 'Arbitrum',
    balance: 30.0,
    symbol: 'USDC',
    iconUrl: '/chains/arbitrum.svg',
  },
  {
    chainId: 'optimism',
    chainName: 'Optimism',
    balance: 15.0,
    symbol: 'USDC',
    iconUrl: '/chains/optimism.svg',
  },
];

export const calculateTotalBalance = (chains: ChainBalance[]): number => {
  return chains.reduce((total, chain) => total + chain.balance, 0);
};
