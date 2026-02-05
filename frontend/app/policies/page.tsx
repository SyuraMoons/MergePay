'use client';

import { useState, useEffect } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { PolicyCard } from '@/components/policies/PolicyCard';
import { CreatePolicyModal } from '@/components/policies/CreatePolicyModal';
import { PoolsInfo } from '@/components/policies/PoolsInfo';
import { getTreasuryPolicy, canExecuteTreasuryPolicy } from '@/services/api/treasury';

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

export default function PoliciesPage() {
  const { wallets } = useWalletContext();
  const activeWallet = wallets.find(w => w.isActive);

  const [policy, setPolicy] = useState<TreasuryPolicy | null>(null);
  const [canExecute, setCanExecute] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeWallet?.address) {
      loadPolicy();
    }
  }, [activeWallet?.address]);

  const loadPolicy = async () => {
    if (!activeWallet?.address) return;

    try {
      setIsLoading(true);
      setError(null);

      const policyData = await getTreasuryPolicy(activeWallet.address);
      setPolicy(policyData);

      const execStatus = await canExecuteTreasuryPolicy(activeWallet.address);
      setCanExecute(execStatus.canExecute);
    } catch (err) {
      console.error('Failed to load policy:', err);
      setError(err instanceof Error ? err.message : 'Failed to load policy');
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeWallet) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center glass-card p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
            <span className="text-2xl">🔐</span>
          </div>
          <p className="text-gray-900 font-medium">No Wallet Connected</p>
          <p className="text-gray-500 text-sm mt-2">Please connect a wallet to manage policies</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8 animate-pulse">
          <div className="h-40 bg-gray-200/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treasury Policies</h1>
          <p className="text-gray-500 mt-1">Automate your treasury management with policy-based rules</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-[#F4673B] text-white rounded-xl font-medium hover:bg-[#E55A30] transition-colors"
        >
          {policy ? 'Update Policy' : 'Create Policy'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Policy Card or Empty State */}
      {policy && policy.enabled ? (
        <PolicyCard
          policy={policy}
          canExecute={canExecute}
          onRefresh={loadPolicy}
        />
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#F4673B]/10 to-[#FF8A65]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Policy</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create a treasury policy to automatically manage your USDC based on balance thresholds
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-3 bg-[#F4673B] text-white rounded-xl font-medium hover:bg-[#E55A30] transition-colors"
          >
            Create Your First Policy
          </button>
        </div>
      )}

      {/* Pools Information */}
      <PoolsInfo />

      {/* Create/Update Policy Modal */}
      {showCreateModal && (
        <CreatePolicyModal
          existingPolicy={policy || undefined}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPolicy();
          }}
        />
      )}
    </div>
  );
}
