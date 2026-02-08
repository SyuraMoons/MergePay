import { useAccount } from 'wagmi';
import { ChainBalanceRow } from '@/components/dashboard/ChainBalanceRow';
import { WalletBalanceIcon } from '@/components/ui/icons/TransactionIcons';
import { useEffect, useState } from 'react';
import { mockBalances as initialMockBalances, calculateTotalBalance } from '@/lib/mockData';
import { MockBalanceService } from '@/services/mockData';
import { ChainBalance } from '@/types/balance';

export function UnifiedBalanceOverview() {
  const { isConnected } = useAccount();

  const [currentBalances, setCurrentBalances] = useState<ChainBalance[]>(initialMockBalances);

  useEffect(() => {
    // Initial fetch
    setCurrentBalances(MockBalanceService.getBalances());

    // Listen for updates
    const handleUpdate = () => {
      setCurrentBalances(MockBalanceService.getBalances());
    };

    window.addEventListener('mock-balance-update', handleUpdate);
    return () => window.removeEventListener('mock-balance-update', handleUpdate);
  }, []);

  const totalBalance = calculateTotalBalance(currentBalances);

  if (!isConnected) {
    return (
      <div className="space-y-6 relative overflow-hidden">
        {/* Blurry Background Layer - Simulates the connected view */}
        <div className="opacity-50 blur-sm pointer-events-none select-none grayscale-[0.5]">
          <div className="glass-card p-6 bg-gradient-to-br from-white to-gray-50">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Connected Balance</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-300">
                $0.00
              </span>
              <span className="text-sm text-gray-400 font-medium">USD</span>
            </div>
            <p className="text-xs text-gray-300 mt-2">
              Aggregated across {initialMockBalances.length} supported chains
            </p>
          </div>

          <div className="space-y-3 mt-6">
            <h3 className="text-sm font-semibold text-gray-400 px-2">Chain Breakdown</h3>
            <div className="space-y-2 opacity-50">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl w-full"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Clean Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/50 text-center max-w-xs mx-auto transform transition-all hover:scale-105">
            <div className="w-12 h-12 bg-[#F4673B]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Connect Wallet</h3>
            <p className="text-xs text-gray-500 mb-0">View your cross-chain portfolio.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Balance Card style */}
      <div className="glass-card p-6 bg-gradient-to-br from-white to-gray-50">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Connected Balance</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-gray-500 font-medium">USD</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Aggregated across {initialMockBalances.length} supported chains
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 px-2">Chain Breakdown</h3>
        <div className="space-y-2">
          {currentBalances.map((chain) => (
            <ChainBalanceRow
              key={chain.chainId}
              chain={chain}
              isUpdating={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
