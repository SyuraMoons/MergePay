'use client';

import { TotalBalanceCard } from '@/components/dashboard/TotalBalanceCard';
import { BalanceBreakdown } from '@/components/dashboard/BalanceBreakdown';
import { ChainIconsRow } from '@/components/dashboard/ChainIconsRow';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { AIAgentCard } from '@/components/dashboard/AIAgentCard';
import { useBalanceWebSocket } from '@/hooks/useBalanceWebSocket';

export default function DashboardPage() {
  const { balances, isConnected, error } = useBalanceWebSocket(undefined, true);

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
        <div className="col-span-8 glass-card p-8 animate-pulse">
          <div className="h-40 bg-gray-200/50 rounded-2xl"></div>
        </div>
        <div className="col-span-4 glass-card p-6 animate-pulse">
          <div className="h-40 bg-gray-200/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left Column - Balance Card */}
        <div className="col-span-12 lg:col-span-7">
          <TotalBalanceCard
            totalBalance={balances.totalBalance}
            targetBalance={100}
            symbol="USDC"
            isUpdating={isConnected}
          />
        </div>

        {/* Right Column - AI Agent */}
        <div className="col-span-12 lg:col-span-5">
          <AIAgentCard />
        </div>
      </div>

      {/* Chain Icons Row - Compact */}
      <div className="glass-card px-5 py-3 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Networks</span>
          <ChainIconsRow
            chains={balances.chains}
            onChainClick={(chainId) => console.log('Clicked:', chainId)}
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left - Summary Breakdown */}
        <div className="col-span-12 lg:col-span-7">
          <BalanceBreakdown
            chains={balances.chains}
            isUpdating={isConnected}
          />
        </div>

        {/* Right - Summary Cards */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <SummaryCard
            title="Total Balance"
            value={`$${balances.totalBalance.toFixed(2)}`}
            subtitle="USDC"
            icon
            trend="up"
            trendValue="+2.5%"
          />
          <SummaryCard
            title="Last 7 Days"
            value="+$8.50"
            variant="chart"
          />
        </div>
      </div>

      {/* Recent Activity - Cleaner */}
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
          <button className="text-sm text-[#F4673B] hover:text-[#E55A30] font-medium">
            View All
          </button>
        </div>

        <div className="space-y-3">
          {/* Empty state */}
          <div className="flex items-center gap-4 py-3 px-4 rounded-xl bg-gray-50/50">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">No transactions yet</p>
              <p className="text-xs text-gray-400">Your activity will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
