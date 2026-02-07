'use client';

import { useState } from 'react';
import { executeTreasuryPolicy } from '@/services/api/treasury';
import { PriceRangeChart } from '@/components/vaults/PriceRangeChart';
import { RobotIcon, AutoPilotIcon, VaultIcon, TrophyIcon, ChartIcon, ClockIcon } from '@/components/ui/icons/PolicyIcons';

interface TreasuryPolicy {
  balanceThreshold: number;
  enabled: boolean;
  autoMode: boolean;
  vaultAddress: string;
  allowUSDCPool: boolean;
  allowUSDTPool: boolean;
  lastExecutionTime: number;
  cooldownPeriod: number;
}

// Mock Data
const mockChartData = {
  lowerRange: 2845.20,
  currentPrice: 3124.50,
  upperRange: 3450.80,
};

interface ActivePolicyProps {
  policy: TreasuryPolicy;
  canExecute: boolean;
  onRefresh: () => void;
  onEdit: () => void;
}

export function ActivePolicy({ policy, canExecute, onRefresh, onEdit }: ActivePolicyProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [showPrivateKeyInput, setShowPrivateKeyInput] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    const keyToUse = privateKey || 'mock-private-key-for-testing';
    try {
      setIsExecuting(true);
      setError(null);
      const isMock = !privateKey || privateKey.includes('mock');
      if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        await executeTreasuryPolicy('0x...', keyToUse);
      }
      setShowPrivateKeyInput(false);
      setPrivateKey('');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Minimalist */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[#F4673B]">
            {policy.autoMode ? <AutoPilotIcon className="w-6 h-6" /> : <VaultIcon className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {policy.autoMode ? 'Auto-Pilot Strategy' : 'Manual Allocation'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#F4673B] animate-pulse"></span>
              <span className="text-xs font-medium text-[#F4673B] uppercase tracking-wide">Active</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {policy.autoMode ? 'Managed by LiquidityAI' : 'Fixed Vault'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="text-sm font-medium text-gray-500 hover:text-[#F4673B] transition-colors"
        >
          Configure
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Performance Metrics */}
        <div className="lg:col-span-1 space-y-4">
          {/* APY Card */}
          <div className="glass-card p-5 border-l-4 border-l-[#F4673B]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current APY</span>
              <ChartIcon className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-3xl font-bold text-gray-900">18.2%</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">+2.4% this week</p>
          </div>

          {/* Yield Card */}
          <div className="glass-card p-5 border-l-4 border-l-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Yield</span>
              <TrophyIcon className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-3xl font-bold text-gray-900">$1,240</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Lifetime earnings</p>
          </div>

          {/* Rebalance Info */}
          <div className="glass-card p-4 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2 text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Next Rebalance</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{Math.floor(policy.cooldownPeriod / 3600)}h</span>
          </div>
        </div>

        {/* Center/Right: Chart & Execution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Container - Ultra Clean */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-900">Price Range & Position</h3>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">USDC / ETH</span>
            </div>
            <div className="h-auto">
              <PriceRangeChart
                lowerRange={mockChartData.lowerRange}
                currentPrice={mockChartData.currentPrice}
                upperRange={mockChartData.upperRange}
              />
            </div>
          </div>

          {/* Execution Control - Minimalist */}
          <div className="glass-card p-6 border border-[#F4673B]/20">
            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="flex justify-between text-xs font-medium mb-2">
                  <span className="text-gray-500">Threshold Progress</span>
                  <span className="text-gray-900">{policy.balanceThreshold.toLocaleString()} USDC</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${canExecute ? 'bg-[#F4673B]' : 'bg-gray-300'}`}
                    style={{ width: canExecute ? '100%' : '65%' }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {canExecute ? 'Threshold met. Ready to execute.' : 'Accumulating funds...'}
                </p>
              </div>

              {canExecute ? (
                !showPrivateKeyInput ? (
                  <button
                    onClick={() => setShowPrivateKeyInput(true)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#F4673B] text-white text-sm font-bold rounded-lg hover:bg-[#E55A30] transition-colors shadow-sm"
                  >
                    Execute Now
                  </button>
                ) : (
                  <div className="flex w-full sm:w-auto gap-2">
                    <input
                      type="password"
                      placeholder="Private Key"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      className="w-full sm:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#F4673B]"
                    />
                    <button
                      onClick={handleExecute}
                      disabled={isExecuting}
                      className="px-4 py-2 bg-[#F4673B] text-white text-xs font-bold rounded-lg hover:bg-[#E55A30]"
                    >
                      {isExecuting ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowPrivateKeyInput(false)}
                      className="px-3 py-2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                )
              ) : (
                <button disabled className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-400 text-sm font-bold rounded-lg cursor-not-allowed">
                  Pending
                </button>
              )}
            </div>

            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
