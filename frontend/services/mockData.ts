import { Transaction } from '@/types/transaction';

export const MOCK_TRANSACTIONS = [
  {
    id: '1',
    type: 'receive' as const,
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    amount: '150.00',
    token: 'USDC',
    chain: 'Base',
    chainId: 8453,
    status: 'completed' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    hash: '0x123...abc',
  },
  {
    id: '2',
    type: 'send' as const,
    from: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    amount: '50.00',
    token: 'USDC',
    chain: 'Arbitrum',
    chainId: 42161,
    status: 'completed' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    hash: '0x456...def',
  },
  {
    id: '3',
    type: 'bridge' as const,
    from: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    amount: '200.00',
    token: 'USDC',
    chain: 'Base -> Optimism',
    chainId: 8453,
    status: 'pending' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    hash: '0x789...ghi',
  },
  {
    id: '4',
    type: 'send' as const,
    from: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    to: '0x1234567890123456789012345678901234567890',
    amount: '75.50',
    token: 'USDC',
    chain: 'Polygon',
    chainId: 137,
    status: 'failed' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    hash: '0xabc...xyz',
  },
  {
    id: '5',
    type: 'receive' as const,
    from: '0x9876543210987654321098765432109876543210',
    to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    amount: '300.00',
    token: 'USDC',
    chain: 'Base',
    chainId: 8453,
    status: 'completed' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    hash: '0xdef...123',
  },
];
