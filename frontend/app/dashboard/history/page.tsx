'use client';

import { useState } from 'react';
import { TransactionItem } from '@/components/history/TransactionItem';
import { TransactionFilters, FilterState } from '@/components/history/TransactionFilters';

// Mock transaction data
const mockTransactions = [
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
    chain: 'Base → Optimism',
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

export default function HistoryPage() {
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    status: 'all',
  });

  const filteredTransactions = mockTransactions.filter((tx) => {
    if (filters.type !== 'all' && tx.type !== filters.type) return false;
    if (filters.status !== 'all' && tx.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-gray-500 mt-1">View and track all your transactions across chains</p>
      </div>

      {/* Filters */}
      <TransactionFilters onFilterChange={setFilters} />

      {/* Transaction List */}
      <div className="glass-card p-5">
        {filteredTransactions.length > 0 ? (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => (
              <TransactionItem key={tx.id} {...tx} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">No transactions found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Pagination placeholder */}
      {filteredTransactions.length > 0 && (
        <div className="flex justify-center">
          <button className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-[#F4673B] transition-colors">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
