'use client';

import { useWalletRegistration } from '@/hooks/useWalletRegistration';
import { useCircleUserWallet } from '@/hooks/useCircleUserWallet';
import { WalletRegistrationCard } from './WalletRegistrationCard';
import { AggregatedBalanceDisplay } from './AggregatedBalanceDisplay';

export function WalletRegistrationPanel() {
  const { auth, wallets: circleWallets, isLoading: circleLoading } = useCircleUserWallet();

  const {
    walletStatuses,
    aggregatedBalance,
    isLoading,
    error,
    registerCircleWallet,
    registerAllWallets,
    refreshBalances,
    unregisteredWallets,
    registeredCount,
    totalWalletsCount,
  } = useWalletRegistration();

  if (!auth) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50 text-center">
        <p className="text-gray-600">
          Please login with Circle to manage wallet registration
        </p>
      </div>
    );
  }

  if (circleLoading || (isLoading && walletStatuses.length === 0)) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (circleWallets.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50 text-center">
        <p className="text-gray-600 mb-4">
          No Circle wallets found. Create wallets first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Multi-Wallet Registration
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Register your Circle wallets to the MergeTreasury for aggregated balance tracking
          </p>
        </div>

        {unregisteredWallets.length > 0 && (
          <button
            onClick={registerAllWallets}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isLoading ? 'Registering...' : `Register All (${unregisteredWallets.length})`}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-red-600 mr-2">⚠️</span>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Aggregated Balance */}
      <AggregatedBalanceDisplay
        balanceData={aggregatedBalance}
        isLoading={isLoading}
        onRefresh={refreshBalances}
      />

      {/* Registration Status */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Registration Status
          </h2>
          <div className="text-sm text-gray-600">
            {registeredCount} of {totalWalletsCount} registered
          </div>
        </div>

        <div className="space-y-3">
          {walletStatuses.map((status) => (
            <WalletRegistrationCard
              key={status.wallet.id}
              status={status}
              onRegister={() => registerCircleWallet(status.wallet)}
            />
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-blue-600 mr-2">ℹ️</span>
          <div className="flex-1 text-sm text-blue-900">
            <h3 className="font-medium mb-1">How it works</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Register your Circle wallets to MergeTreasury contract</li>
              <li>View aggregated balance across all registered wallets</li>
              <li>Each wallet can be registered to only one userId</li>
              <li>Maximum {50} wallets per userId</li>
              <li>Only wallet owner can register their wallet</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
