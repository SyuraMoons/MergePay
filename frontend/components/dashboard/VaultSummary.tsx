'use client';

import { useEffect, useState } from 'react';
import { getTreasuryPolicy, type TreasuryPolicyResponse } from '@/services/api/treasury';
import { useWalletContext } from '@/contexts/WalletContext';
import Link from 'next/link';

export function VaultSummary() {
  const { activeWallet } = useWalletContext();
  // Initialize with null to show loading state
  const [policy, setPolicy] = useState<TreasuryPolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!activeWallet) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Try to fetch real policy
        try {
          const data = await getTreasuryPolicy(activeWallet.address);
          setPolicy(data);
        } catch (e) {
          console.warn('Backend policy fetch failed, using mock data for demo', e);
          // Fallback mock data
          // Fallback mock data with sessionStorage check for Demo persistence
          if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('demo_policy_active');
            const storedData = sessionStorage.getItem('demo_policy_data');

            if (stored === 'true' && storedData) {
              setPolicy(JSON.parse(storedData));
            } else {
              // Default to NO persistence/empty for the first time
              setPolicy({
                balanceThreshold: 1000,
                enabled: false, // Start disabled!
                useUSYC: true,
                vaultAddress: '',
                lastExecutionTime: 0,
                cooldownPeriod: 24 * 3600
              });
            }
          } else {
            setPolicy(null);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Listen for mock updates
    const handleStorageChange = () => load();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, [activeWallet]);

  if (loading) {
    return (
      <div className="glass-card p-6 h-full animate-pulse flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-10 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // No active wallet or no policy enabled
  if (!activeWallet || !policy || !policy.enabled) {
    return (
      <div className="glass-card p-6 h-full flex flex-col items-center justify-center text-center space-y-4 group hover:border-[#F4673B]/30 transition-colors">
        <div className="w-16 h-16 bg-[#FDF5F0] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <svg className="w-8 h-8 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Treasury Yield</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-[200px] mx-auto">
            Automate your idle USDC with USYC or custom vaults.
          </p>
        </div>
        <Link
          href="/policies"
          className="px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors hover:-translate-y-0.5 transform shadow-lg"
        >
          Create Policy
        </Link>
      </div>
    );
  }

  // Active Policy Display
  return (
    <div className="glass-card p-6 h-full flex flex-col justify-between relative overflow-hidden group border-t-4 border-t-[#F4673B] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#F4673B]/5 to-[#FF8A65]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#F4673B]/10"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FDF5F0] rounded-xl border border-[#F4673B]/10 shadow-sm">
            {policy.useUSYC ? (
              <svg className="w-6 h-6 text-[#F4673B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v2m0 8v2" strokeLinecap="round" />
                <path d="M9.5 10.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 1.38-1.12 2.5-2.5 2.5" strokeLinecap="round" />
                <path d="M9.5 13.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Active Strategy</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#F4673B] animate-pulse"></span>
              <span className="text-xs font-medium text-[#F4673B]">Running</span>
            </div>
          </div>
        </div>

        {/* APY Badge (Only for USYC) */}
        {policy.useUSYC && (
          <div className="bg-[#FDF5F0] px-3 py-1.5 rounded-xl border border-[#F4673B]/10 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-sm font-bold text-[#F4673B]">~5% APY</span>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="space-y-4 flex-1 flex flex-col justify-end relative z-10">
        <div className="flex items-center justify-between text-sm p-3 bg-white/50 rounded-xl border border-gray-100 hover:border-[#F4673B]/20 transition-colors">
          <span className="text-gray-500 font-medium">Type</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900">
              {policy.useUSYC ? 'Circle USYC Yield' : 'Manual Vault'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm p-3 bg-white/50 rounded-xl border border-gray-100 hover:border-[#F4673B]/20 transition-colors">
          <span className="text-gray-500 font-medium">Trigger</span>
          <span className="font-mono font-bold text-gray-900">
            &gt; {policy.balanceThreshold?.toLocaleString()} USDC
          </span>
        </div>

        <Link
          href="/policies"
          className="block w-full py-3 text-center bg-gradient-to-r from-[#F4673B] to-[#FF8A65] hover:shadow-lg hover:shadow-orange-200 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm"
        >
          Manage Policy
        </Link>
      </div>
    </div>
  );
}
