'use client';

import { useState, useEffect } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { ActivePolicy } from '@/components/policies/ActivePolicy';
import { VaultIcon } from '@/components/ui/icons/PolicyIcons';
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
      let policyData;
      try {
        policyData = await getTreasuryPolicy(activeWallet.address);
      } catch (e) {
        console.warn('Backend policy fetch failed, using mock data for demo', e);
        policyData = {
          balanceThreshold: 1000,
          enabled: true,
          autoMode: true,
          vaultAddress: '0x123...abc',
          allowUSDCPool: true,
          allowUSDTPool: true,
          lastExecutionTime: Date.now() / 1000 - 3600,
          cooldownPeriod: 24 * 3600
        };
      }
      setPolicy(policyData);
      const execStatus = await canExecuteTreasuryPolicy(activeWallet.address).catch(() => ({ canExecute: true }));
      setCanExecute(execStatus.canExecute);
    } catch (err) {
      console.error('Failed to load policy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we should show the locked state (no wallet connected)
  const isLocked = !activeWallet;

  // Mock policy for locked state visualization
  const lockedPolicy: TreasuryPolicy = {
    balanceThreshold: 5000,
    enabled: true,
    autoMode: true,
    vaultAddress: '0x...',
    allowUSDCPool: true,
    allowUSDTPool: true,
    lastExecutionTime: Date.now(),
    cooldownPeriod: 86400
  };

  if (isLoading && activeWallet) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8 animate-pulse">
          <div className="h-40 bg-gray-200/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold to-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Treasury Policies
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Automate your idle assets with smart yield strategies using Circle Gateway.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-[#F4673B] to-[#FF8A65] text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {policy ? 'Update Policy' : 'Create New Policy'}
        </button>
      </div>

      {error && (
        <div className="glass-card p-4 border border-red-200 bg-red-50/50 text-red-600 rounded-xl">
          <p>{error}</p>
        </div>
      )}

      {/* Main Content */}
      {/* Main Content */}
      <div className="animate-fade-in-up relative" style={{ animationDelay: '0.1s' }}>
        {/* Locked State Overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20">
            <div className="text-center p-8 bg-white/90 shadow-2xl rounded-2xl border border-orange-100 max-w-md mx-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#F4673B] to-[#FF8A65] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Connect to Manage Policies</h3>
              <p className="text-gray-500 mb-6 text-sm">Unlock the full power of MergePay's automated treasury management strategies.</p>
              {/* Note: The physical button in Header handles connection, but we can add a pointer here if needed. 
                  Since we don't have direct access to 'connect' function here easily without context passthrough, 
                  we'll rely on the global header button or add a specific connector triggers if needed. 
                  For now, a visual prompt is good. */}
              <div className="text-sm font-semibold text-[#F4673B]">Please connect your wallet in the top right</div>
            </div>
          </div>
        )}

        {(policy && policy.enabled) || isLocked ? (
          <div className={isLocked ? 'blur-sm select-none pointer-events-none opacity-50 grayscale-[0.5]' : ''}>
            <ActivePolicy
              policy={isLocked ? lockedPolicy : policy!}
              canExecute={isLocked ? false : canExecute}
              onRefresh={loadPolicy}
              onEdit={() => setShowCreateModal(true)}
            />
          </div>
        ) : (
          <div className="glass-card p-16 text-center border-2 border-dashed border-gray-200 hover:border-[#F4673B]/30 transition-colors group">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <VaultIcon className="w-12 h-12 text-[#F4673B]" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Active Policy</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg leading-relaxed">
              Create a treasury policy to automatically sweep idle USDC into high-yield vaults when thresholds are met.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-xl hover:shadow-2xl hover:-translate-y-1 transform"
            >
              Create Your First Policy
            </button>
          </div>
        )}
      </div>

      {/* Pools Info Section */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <PoolsInfo />
      </div>

      {/* Modal */}
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
