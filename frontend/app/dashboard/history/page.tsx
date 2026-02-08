'use client';

import { useState } from 'react';
import { TransactionItem } from '@/components/history/TransactionItem';
import { TransactionFilters, FilterState } from '@/components/history/TransactionFilters';
import { useWalletContext } from '@/contexts/WalletContext';

import { MockStorageService } from '@/services/mockData';
import { useEffect } from 'react';

export default function HistoryPage() {
  const { activeWallet } = useWalletContext();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    status: 'all',
  });

  useEffect(() => {
    setTransactions(MockStorageService.getTransactions());

    const handleUpdate = () => {
      setTransactions(MockStorageService.getTransactions());
    };
    window.addEventListener('mock-transaction-update', handleUpdate);
    return () => window.removeEventListener('mock-transaction-update', handleUpdate);
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
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
        {!activeWallet ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Wallet Not Connected</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              Connect your wallet to view your transaction history across all supported chains.
            </p>
          </div>
        ) : filteredTransactions.length > 0 ? (
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
