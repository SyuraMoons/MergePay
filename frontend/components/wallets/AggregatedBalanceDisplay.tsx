'use client';

import type { AggregatedBalanceData } from '@/hooks/useWalletRegistration';

interface AggregatedBalanceDisplayProps {
  balanceData: AggregatedBalanceData | null;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export function AggregatedBalanceDisplay({
  balanceData,
  isLoading,
  onRefresh
}: AggregatedBalanceDisplayProps) {
  if (isLoading && !balanceData) {
    return (
      <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded w-64"></div>
        </div>
      </div>
    );
  }

  if (!balanceData) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50 text-center">
        <p className="text-gray-600">
          Register your wallets to see aggregated balance
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">
            Total Aggregated Balance
          </h2>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              ${balanceData.totalBalanceFormatted}
            </span>
            <span className="text-sm text-gray-600">USDC</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Treasury Balance</div>
              <div className="text-lg font-semibold text-gray-900">
                ${balanceData.treasuryBalanceFormatted}
              </div>
            </div>

            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Registered Wallets</div>
              <div className="text-lg font-semibold text-gray-900">
                {balanceData.registeredWallets.length}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                View registered wallet addresses
              </summary>
              <div className="mt-2 space-y-1">
                {balanceData.registeredWallets.map((address, index) => (
                  <div key={address} className="font-mono text-xs text-gray-700 bg-white p-2 rounded">
                    {index + 1}. {address}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="ml-4 px-3 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
          title="Refresh balance"
        >
          {isLoading ? '↻' : '⟳'}
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-600">
        <p>
          * Total balance includes treasury balance + available allowance from all registered wallets
        </p>
      </div>
    </div>
  );
}
