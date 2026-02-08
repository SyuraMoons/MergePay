'use client';

import { TotalBalanceCard } from '@/components/dashboard/TotalBalanceCard';
import { ChainIconsRow } from '@/components/dashboard/ChainIconsRow';
import { useBalanceWebSocket } from '@/hooks/useBalanceWebSocket';
import { useWalletContext } from '@/contexts/WalletContext';
import { VaultSummary } from '@/components/dashboard/VaultSummary';
import { TransactionItem } from '@/components/history/TransactionItem';
import { AIAgentCard } from '@/components/dashboard/AIAgentCard';
import { MOCK_TRANSACTIONS } from '@/services/mockData';
import Link from 'next/link';

export default function DashboardPage() {
  const { activeWallet } = useWalletContext();
  const { balances, isConnected: isSocketConnected, error } = useBalanceWebSocket(undefined, true);

  // Use real wallet connection status for UI
  const isWalletConnected = !!activeWallet;

  const recentTransactions = MOCK_TRANSACTIONS.slice(0, 5);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center glass-card p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 font-medium">Failed to load balances</p>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (balances.isLoading) {
    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 glass-card p-8 animate-pulse">
          <div className="h-40 bg-gray-200/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row: Balance, Vault, AI Agent */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Total Balance (Wide) */}
        <div className="xl:col-span-5 flex flex-col">
          <TotalBalanceCard
            totalBalance={balances.totalBalance}
            targetBalance={100}
            symbol="USDC"
            isUpdating={isSocketConnected}
            isConnected={isWalletConnected}
          />
        </div>

        {/* Vault Summary (Medium) */}
        <div className="xl:col-span-4 flex flex-col">
          <VaultSummary />
        </div>

        {/* AI Chatbot (Narrow) */}
        <div className="xl:col-span-3 flex flex-col">
          <AIAgentCard isConnected={isWalletConnected} />
        </div>
      </div>

      {/* Middle Row: Networks Available */}
      <div className="glass-card px-6 py-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        {!isWalletConnected ? (
          <div className="flex items-center justify-center gap-2 text-gray-500 py-1">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Connect wallet to see available networks</span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Networks Available</span>
            </div>
            <div className="flex-1 overflow-x-auto">
              <ChainIconsRow
                chains={balances.chains}
                onChainClick={(chainId) => console.log('Clicked:', chainId)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Transaction Summary */}
      <div className="glass-card p-6 animate-fade-in-up space-y-4" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#F4673B]/10 rounded-lg">
              <svg className="w-5 h-5 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          </div>
          <Link href="/dashboard/history" className="text-sm font-medium text-[#F4673B] hover:text-[#E55A30] transition-colors flex items-center gap-1">
            View History
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-3">
          {!isWalletConnected ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Wallet not connected</p>
              <p className="text-xs text-gray-500 mt-1">Connect your wallet to view transactions</p>
            </div>
          ) : recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} {...tx} />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent transactions</p>
          )}
        </div>
      </div>
    </div>
  );
}
