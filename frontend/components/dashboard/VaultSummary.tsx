'use client';

import { useEffect, useState } from 'react';
import { getTreasuryPolicy } from '@/services/api/treasury';
import { useWalletContext } from '@/contexts/WalletContext';
import { RobotIcon, TrophyIcon } from '@/components/ui/icons/PolicyIcons';
import { VaultStrategyIcon } from '@/components/ui/icons/DashboardIcons';
import Link from 'next/link';

export function VaultSummary() {
  const { activeWallet } = useWalletContext();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!activeWallet) return;
      try {
        await new Promise(r => setTimeout(r, 800));
        try {
          const data = await getTreasuryPolicy(activeWallet.address);
          setPolicy(data);
        } catch {
          setPolicy({
            enabled: true,
            balanceThreshold: 1000,
            autoMode: true,
            vaultAddress: '0x123...abc'
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeWallet]);

  if (loading) {
    return <div className="glass-card p-6 h-full animate-pulse bg-gray-100/50"></div>;
  }

  if (!activeWallet || !policy || !policy.enabled) {
    return (
      <div className="glass-card p-6 h-full flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <VaultStrategyIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">No Active Vaults</h3>
          <p className="text-sm text-gray-500">Automate your treasury yield.</p>
        </div>
        <Link href="/policies" className="text-sm font-bold text-[#F4673B] hover:underline">
          Create Policy &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 h-full flex flex-col justify-between relative overflow-hidden group">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4673B]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#F4673B]/10"></div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="shadow-lg shadow-[#F4673B]/20 rounded-xl">
            <VaultStrategyIcon className="w-12 h-12" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Active Vault</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-green-600">Running Strategy</span>
            </div>
          </div>
        </div>

        {/* APY Badge */}
        <div className="bg-green-50 px-3 py-1.5 rounded-full border border-green-100 flex items-center gap-1">
          <TrophyIcon className="w-4 h-4 text-green-600" />
          <span className="text-sm font-bold text-green-700">12.4% APY</span>
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col justify-end">
        <div className="flex items-center justify-between text-sm p-3 bg-gray-50/80 rounded-xl border border-gray-100">
          <span className="text-gray-500 font-medium">Managed By</span>
          <div className="flex items-center gap-1.5">
            <RobotIcon className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-700">Auto-Pilot Agent</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm p-3 bg-gray-50/80 rounded-xl border border-gray-100">
          <span className="text-gray-500 font-medium">Balance Threshold</span>
          <span className="font-mono font-bold text-gray-900">
            &gt; ${policy.balanceThreshold?.toLocaleString()} USDC
          </span>
        </div>

        <div className="pt-2">
          <Link href="/policies" className="block w-full py-3 text-center bg-[#F4673B] hover:bg-[#E55A30] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg shadow-[#F4673B]/20 text-sm">
            Manage Strategy
          </Link>
        </div>
      </div>
    </div>
  );
}
