'use client';

import { useAccount } from 'wagmi';
import { useBalance } from 'wagmi';
import { supportedChains } from '@/lib/wagmi.config';
import { ChainBalanceRow } from '@/components/dashboard/ChainBalanceRow';
import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';

// Helper component to fetch and display individual chain balance
function BalanceRow({ chain, onBalanceUpdate }: { chain: typeof supportedChains[0], onBalanceUpdate: (chainId: number, val: number) => void }) {
  const { address } = useAccount();
  const { data, isLoading } = useBalance({
    address,
    chainId: chain.id,
  });

  const formattedBalance = data ? parseFloat(formatUnits(data.value, data.decimals)) : 0;

  useEffect(() => {
    if (data) {
      onBalanceUpdate(chain.id, formattedBalance);
    }
  }, [data, chain.id, formattedBalance, onBalanceUpdate]);

  if (!address) return null;

  return (
    <ChainBalanceRow
      chain={{
        chainId: chain.id.toString(),
        chainName: chain.name,
        balance: formattedBalance,
        symbol: data?.symbol || chain.nativeCurrency.symbol,
        iconUrl: '', // TODO: Add icons
      }}
      isUpdating={isLoading}
    />
  );
}

export function UnifiedBalanceOverview() {
  const { address, isConnected } = useAccount();
  const [balances, setBalances] = useState<Record<number, number>>({});

  const totalBalance = Object.values(balances).reduce((acc, val) => acc + val, 0);

  const handleBalanceUpdate = (chainId: number, val: number) => {
    setBalances(prev => {
      if (prev[chainId] === val) return prev;
      return { ...prev, [chainId]: val };
    });
  };

  if (!isConnected) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Connect Wallet</h3>
        <p className="text-gray-500 text-sm">Connect your wallet to view aggregated balances across chains.</p>
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
            ${totalBalance.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500 font-medium">USD (Est.)</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Aggregated across {supportedChains.length} supported chains
        </p>
      </div>

      {/* Chain Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 px-2">Chain Breakdown</h3>
        <div className="space-y-2">
          {supportedChains.map((chain) => (
            <BalanceRow
              key={chain.id}
              chain={chain}
              onBalanceUpdate={handleBalanceUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
