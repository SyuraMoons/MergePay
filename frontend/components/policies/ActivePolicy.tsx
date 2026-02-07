'use client';

import { useState } from 'react';
import { executeTreasuryPolicy } from '@/services/api/treasury';
import { PriceRangeChart } from '@/components/vaults/PriceRangeChart';
import { RobotIcon, AutoPilotIcon, VaultIcon, TrophyIcon, StarIcon } from '@/components/ui/icons/PolicyIcons';

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

// Mock Data for Visuals (In real app, fetch based on policy params)
const mockChartData = {
  lowerRange: 2845.20,
  currentPrice: 3124.50,
  upperRange: 3450.80,
};

const mockAgent = {
  name: 'Liquidity Optimizer',
  ens: 'liq-optimizer.eth',
  trophies: 92,
  stars: 76,
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
    // Private key functionality
    const keyToUse = privateKey || 'mock-private-key-for-testing';

    try {
      setIsExecuting(true);
      setError(null);

      const isMock = !privateKey || privateKey.includes('mock');

      if (isMock) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Mock execution successful');
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm ${policy.autoMode ? 'bg-purple-50' : 'bg-blue-50'
            }`}>
            {policy.autoMode
              ? <AutoPilotIcon className="w-8 h-8 opacity-80" />
              : <VaultIcon className="w-8 h-8 opacity-80" />
            }
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {policy.autoMode ? 'AI Auto-Pilot' : 'Manual Strategy'}
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full border border-green-200">
                Active
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {policy.autoMode
                ? 'AI agent is optimizing yield across pools'
                : `Fixed allocation to ${policy.vaultAddress.slice(0, 6)}...${policy.vaultAddress.slice(-4)}`}
            </p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          Configure Policy
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chart & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="glass-card p-1">
            <PriceRangeChart
              lowerRange={mockChartData.lowerRange}
              currentPrice={mockChartData.currentPrice}
              upperRange={mockChartData.upperRange}
            />
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Yield</p>
              <p className="text-2xl font-bold text-green-600">+$1,240.50</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                +12.5% this week
              </p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Current APY</p>
              <p className="text-2xl font-bold text-[#F4673B]">18.2%</p>
              <p className="text-xs text-gray-500 mt-1">
                Variable rate
              </p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cooldown</p>
              <p className="text-2xl font-bold text-gray-700">
                {Math.floor(policy.cooldownPeriod / 3600)}h
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Rebalance frequency
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Execution & Details */}
        <div className="space-y-6">
          {/* Agent Card (if Auto) */}
          {policy.autoMode && (
            <div className="glass-card p-6 border-2 border-[#F4673B]/10 bg-gradient-to-br from-[#F4673B]/5 to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] transform translate-x-4 -translate-y-4">
                <RobotIcon className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold text-[#F4673B] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AutoPilotIcon className="w-4 h-4" />
                  Managed By
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-gray-100">
                    <RobotIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg leading-tight">{mockAgent.name}</p>
                    <p className="text-sm text-gray-500 font-mono mt-0.5">{mockAgent.ens}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-lg border border-yellow-200/50">
                    <TrophyIcon className="w-3.5 h-3.5" /> {mockAgent.trophies} Wins
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200/50">
                    <StarIcon className="w-3.5 h-3.5" /> {mockAgent.stars} Rating
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Execution Control */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span>Policy Execution</span>
              {canExecute && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Trigger Threshold</span>
                  <span className="font-bold text-gray-900">
                    {policy.balanceThreshold} USDC
                  </span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${canExecute ? 'bg-green-500 w-full' : 'bg-[#F4673B] w-[45%]'}`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                  {canExecute
                    ? <><span className="text-green-600 font-medium">Ready</span> Threshold reached</>
                    : <><span className="text-orange-600 font-medium">Pending</span> accumulating balance...</>}
                </p>
              </div>
            </div>

            {canExecute ? (
              <div className="space-y-3 animate-fade-in">
                {!showPrivateKeyInput ? (
                  <button
                    onClick={() => setShowPrivateKeyInput(true)}
                    className="w-full py-3.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-200 transform hover:-translate-y-0.5"
                  >
                    Execute Strategy 🚀
                  </button>
                ) : (
                  <div className="space-y-3 animate-fade-in-up bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Enter Private Key (Optional)</p>
                    <input
                      type="password"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="Enter key or leave empty"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setShowPrivateKeyInput(false)}
                        className="px-4 py-2 bg-white text-gray-600 font-medium rounded-lg hover:bg-gray-50 border border-gray-200 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExecute}
                        disabled={isExecuting}
                        className="flex-1 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 text-sm shadow-md"
                      >
                        {isExecuting ? 'Signing...' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button disabled className="w-full py-3.5 bg-gray-100 text-gray-400 font-medium rounded-xl cursor-not-allowed border border-gray-200">
                Conditions Not Met
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 animate-shake">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
