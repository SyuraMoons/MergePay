'use client';

import { useState } from 'react';
import { executeTreasuryPolicy } from '@/services/api/treasury';

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

interface PolicyCardProps {
  policy: TreasuryPolicy;
  canExecute: boolean;
  onRefresh: () => void;
}

export function PolicyCard({ policy, canExecute, onRefresh }: PolicyCardProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [showPrivateKeyInput, setShowPrivateKeyInput] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!privateKey) {
      setError('Private key is required');
      return;
    }

    try {
      setIsExecuting(true);
      setError(null);

      // Get user address from wallet context - for now using a placeholder
      const userAddress = '0x...'; // TODO: Get from wallet context

      await executeTreasuryPolicy(userAddress, privateKey);

      setShowPrivateKeyInput(false);
      setPrivateKey('');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Active Policy</h2>
          <p className="text-sm text-gray-500 mt-1">
            {policy.autoMode ? 'Auto Mode - AI selects best pool' : 'Manual Mode - Fixed vault'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Active
          </span>
        </div>
      </div>

      {/* Policy Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Threshold */}
        <div className="p-4 rounded-xl bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Balance Threshold</p>
          <p className="text-lg font-semibold text-gray-900">
            {policy.balanceThreshold.toLocaleString()} USDC
          </p>
        </div>

        {/* Cooldown */}
        <div className="p-4 rounded-xl bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Cooldown Period</p>
          <p className="text-lg font-semibold text-gray-900">
            {Math.floor(policy.cooldownPeriod / 3600)}h
          </p>
        </div>

        {/* Vault Address (if manual mode) */}
        {!policy.autoMode && (
          <div className="col-span-2 p-4 rounded-xl bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Vault Address</p>
            <p className="text-sm font-mono text-gray-900">
              {truncateAddress(policy.vaultAddress)}
            </p>
          </div>
        )}

        {/* Allowed Pools (if auto mode) */}
        {policy.autoMode && (
          <div className="col-span-2 p-4 rounded-xl bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Allowed Pools</p>
            <div className="flex gap-2">
              {policy.allowUSDCPool && (
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  USDC/USDC
                </span>
              )}
              {policy.allowUSDTPool && (
                <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  USDC/USDT
                </span>
              )}
            </div>
          </div>
        )}

        {/* Last Execution */}
        <div className="col-span-2 p-4 rounded-xl bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Last Executed</p>
          <p className="text-sm text-gray-900">
            {formatTimestamp(policy.lastExecutionTime)}
          </p>
        </div>
      </div>

      {/* Execution Status */}
      {canExecute && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-900">Ready to Execute</p>
          </div>
          <p className="text-xs text-green-700">
            Your balance has reached the threshold. You can execute the policy now.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Private Key Input (when executing) */}
      {showPrivateKeyInput && (
        <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 space-y-3">
          <p className="text-sm text-yellow-900 font-medium">⚠️ Private Key Required</p>
          <input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="Enter your private key"
            className="w-full px-4 py-2 rounded-lg border border-yellow-300 focus:outline-none focus:ring-2 focus:ring-[#F4673B]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleExecute}
              disabled={isExecuting || !privateKey}
              className="flex-1 px-4 py-2 bg-[#F4673B] text-white rounded-lg font-medium hover:bg-[#E55A30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExecuting ? 'Executing...' : 'Confirm Execute'}
            </button>
            <button
              onClick={() => {
                setShowPrivateKeyInput(false);
                setPrivateKey('');
                setError(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowPrivateKeyInput(true)}
          disabled={!canExecute || showPrivateKeyInput}
          className="flex-1 px-4 py-3 bg-[#F4673B] text-white rounded-xl font-medium hover:bg-[#E55A30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Execute Policy
        </button>
        <button
          onClick={onRefresh}
          className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
