'use client';

import { useState } from 'react';
import { executeTreasuryPolicy, claimUSYCYield, type TreasuryPolicyResponse, type USYCPosition } from '@/services/api/treasury';

interface ActivePolicyProps {
  policy: TreasuryPolicyResponse;
  usycPosition: USYCPosition | null;
  canExecute: boolean;
  onRefresh: () => void;
  onEdit: () => void;
}

/**
 * ActivePolicy - Displays active treasury policy
 * Supports both USYC yield mode and Manual vault mode
 * Color palette: Orange (#F4673B), White Bone (#FDF5F0), White
 */
export function ActivePolicy({ policy, usycPosition, canExecute, onRefresh, onEdit }: ActivePolicyProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    try {
      setIsExecuting(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 2000));
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClaimYield = async () => {
    try {
      setIsClaiming(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 1500));
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed');
    } finally {
      setIsClaiming(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatHours = (seconds: number) => {
    return Math.floor(seconds / 3600);
  };

  const truncateAddress = (address: string) => {
    if (!address) return '—';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#F4673B]/10 to-[#FF8A65]/10 rounded-xl border border-[#F4673B]/20">
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
            <h2 className="text-lg font-bold text-gray-900">
              {policy.useUSYC ? 'USYC Yield Mode' : 'Manual Vault Mode'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#F4673B] animate-pulse"></span>
              <span className="text-xs font-medium text-[#F4673B] uppercase tracking-wide">Active</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {policy.useUSYC ? '~5% APY from US Treasuries' : `Sending to ${truncateAddress(policy.vaultAddress)}`}
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

        {/* Left: Metrics Cards */}
        <div className="lg:col-span-1 space-y-4">
          {policy.useUSYC && usycPosition ? (
            /* USYC Mode: Show position metrics */
            <>
              {/* Principal */}
              <div className="glass-card p-5 border-l-4 border-l-gray-200">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Principal</span>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(usycPosition.principal)}</p>
                <p className="text-xs text-gray-500 mt-1">Original deposit</p>
              </div>

              {/* Current Value */}
              <div className="glass-card p-5 border-l-4 border-l-[#F4673B]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Value</span>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(usycPosition.currentValue)}</p>
                <p className="text-xs text-[#F4673B] mt-1 font-medium">
                  +{formatCurrency(usycPosition.yieldAccrued)} earned
                </p>
              </div>

              {/* Yield Earned with Claim */}
              <div className="glass-card p-5 border-l-4 border-l-[#FF8A65]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Yield</span>
                <p className="text-2xl font-bold text-[#F4673B] mt-1">{formatCurrency(usycPosition.yieldAccrued)}</p>
                <button
                  onClick={handleClaimYield}
                  disabled={isClaiming || usycPosition.yieldAccrued === 0}
                  className="mt-3 w-full px-4 py-2 bg-[#FDF5F0] text-[#F4673B] text-sm font-bold rounded-lg hover:bg-[#F4673B]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#F4673B]/20"
                >
                  {isClaiming ? 'Claiming...' : 'Claim Yield'}
                </button>
              </div>
            </>
          ) : (
            /* Manual Vault Mode: Show vault info */
            <>
              {/* Threshold */}
              <div className="glass-card p-5 border-l-4 border-l-[#F4673B]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Threshold</span>
                <p className="text-2xl font-bold text-gray-900 mt-2">{policy.balanceThreshold.toLocaleString()} USDC</p>
                <p className="text-xs text-gray-500 mt-1">Excess above this is transferred</p>
              </div>

              {/* Vault Address */}
              <div className="glass-card p-5 border-l-4 border-l-gray-200">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Destination Vault</span>
                <p className="text-lg font-bold text-gray-900 mt-2 font-mono">{truncateAddress(policy.vaultAddress)}</p>
                <a
                  href={`https://etherscan.io/address/${policy.vaultAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#F4673B] hover:underline mt-1 inline-flex items-center gap-1"
                >
                  View on Etherscan
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* Cooldown */}
              <div className="glass-card p-5 border-l-4 border-l-gray-200">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cooldown</span>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatHours(policy.cooldownPeriod)}h</p>
                <p className="text-xs text-gray-500 mt-1">Between executions</p>
              </div>
            </>
          )}
        </div>

        {/* Right: Policy Details & Execution */}
        <div className="lg:col-span-2 space-y-6">

          {/* Policy Configuration Summary */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Policy Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#FDF5F0] rounded-xl border border-[#F4673B]/10">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Trigger Threshold</p>
                <p className="text-lg font-bold text-gray-900">{policy.balanceThreshold.toLocaleString()} USDC</p>
              </div>
              <div className="p-4 bg-[#FDF5F0] rounded-xl border border-[#F4673B]/10">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Cooldown Period</p>
                <p className="text-lg font-bold text-gray-900">{formatHours(policy.cooldownPeriod)} hours</p>
              </div>
              <div className="p-4 bg-[#FDF5F0] rounded-xl col-span-2 border border-[#F4673B]/10">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Strategy</p>
                <div className="flex items-center gap-2">
                  {policy.useUSYC ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-[#F4673B]/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#F4673B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="8" />
                          <path d="M12 8v4m0 4v0" strokeLinecap="round" />
                        </svg>
                      </div>
                      <span className="font-bold text-gray-900">Circle USYC Yield</span>
                      <span className="text-xs text-[#F4673B] font-semibold">~5% APY</span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full bg-[#F4673B]/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <span className="font-bold text-gray-900">Manual Vault</span>
                      <span className="text-xs text-gray-500 font-mono">{truncateAddress(policy.vaultAddress)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Manual Vault: Transfer History (mock) */}
          {!policy.useUSYC && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Recent Transfers</h3>
                <span className="text-xs text-gray-400">Last 7 days</span>
              </div>
              <div className="space-y-3">
                {/* Mock transfer entries */}
                <div className="flex items-center justify-between p-3 bg-[#FDF5F0] rounded-xl border border-[#F4673B]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#F4673B]/20">
                      <svg className="w-4 h-4 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">500 USDC</p>
                      <p className="text-xs text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#F4673B]">Completed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#FDF5F0] rounded-xl border border-[#F4673B]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#F4673B]/20">
                      <svg className="w-4 h-4 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">1,250 USDC</p>
                      <p className="text-xs text-gray-400">1 day ago</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#F4673B]">Completed</span>
                </div>
              </div>
            </div>
          )}

          {/* Execution Control */}
          <div className="glass-card p-6 border border-[#F4673B]/20">
            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="flex justify-between text-xs font-medium mb-2">
                  <span className="text-gray-500">Threshold Progress</span>
                  <span className="text-gray-900">{policy.balanceThreshold.toLocaleString()} USDC</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${canExecute ? 'bg-gradient-to-r from-[#F4673B] to-[#FF8A65]' : 'bg-gray-300'}`}
                    style={{ width: canExecute ? '100%' : '65%' }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {canExecute
                    ? (policy.useUSYC ? 'Ready to deposit to USYC.' : 'Ready to transfer to vault.')
                    : 'Accumulating funds...'}
                </p>
              </div>

              <button
                onClick={handleExecute}
                disabled={!canExecute || isExecuting}
                className={`w-full sm:w-auto px-6 py-3 text-sm font-bold rounded-xl transition-all ${canExecute
                    ? 'bg-gradient-to-r from-[#F4673B] to-[#FF8A65] text-white hover:shadow-lg hover:-translate-y-0.5'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {isExecuting ? 'Executing...' : canExecute ? (policy.useUSYC ? 'Deposit to USYC' : 'Transfer to Vault') : 'Pending'}
              </button>
            </div>

            {error && <p className="text-xs text-[#F4673B] mt-3">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
