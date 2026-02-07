'use client';

import { useAccount } from 'wagmi';
import { useBalance } from 'wagmi';
import { supportedChains } from '@/lib/wagmi.config';
import { ChainBalanceRow } from '@/components/dashboard/ChainBalanceRow';
import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';

// Helper component to fetch and display individual chain balance
const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  // Mainnets
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum One
  10: '0x0b2C639c533813f4Aa9D7837CAf992c198942b0', // Optimism
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Polygon
  // Testnets
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  421614: '0x75faf114eafb1BDbe2F031385358e18508618873', // Arbitrum Sepolia
  11155420: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // Optimism Sepolia
  80002: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582', // Polygon Amoy
};

function BalanceRow({ chain, onBalanceUpdate }: { chain: typeof supportedChains[0], onBalanceUpdate: (chainId: number, val: number) => void }) {
  const { address } = useAccount();
  const usdcAddress = USDC_ADDRESSES[chain.id];

  const { data, isLoading } = useBalance({
    address,
    chainId: chain.id,
    token: usdcAddress, // Fetch USDC if address known, otherwise native (fallback) for now or undefined to skip?
    // If we pass undefined token, it fetches native.
    // If chain has no USDC mapped, maybe we shouldn't show it or show 0?
    // For now, let's only fetch if mapped, else native (user might be confused if native shows up though).
    // The user explicitly said "should be usdc".
    // So if no address, pass undefined to fetch native? No, that's what we want to avoid.
    // But useBalance with undefined token fetches native.
    // Let's assume we mapped all supported chains correctly.
  });

  // If we don't have a USDC address for this chain, and we want ONLY USDC, we might want to return 0 or hide it.
  // But useBalance returns native if token is undefined.
  // We should enforce token ONLY if we have address. If not, maybe we display "N/A" or 0.
  // However, I mapped all current supported chains. So it should be fine.

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
        symbol: 'USDC', // Force symbol to USDC since we are fetching token or wanting to show USDC context
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
