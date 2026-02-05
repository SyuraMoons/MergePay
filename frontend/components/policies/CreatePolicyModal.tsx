'use client';

import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { configureTreasuryPolicy, type TreasuryPolicyRequest } from '@/services/api/treasury';

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

interface CreatePolicyModalProps {
  existingPolicy?: TreasuryPolicy;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePolicyModal({ existingPolicy, onClose, onSuccess }: CreatePolicyModalProps) {
  const { wallets } = useWalletContext();
  const activeWallet = wallets.find(w => w.isActive);

  const [formData, setFormData] = useState({
    threshold: existingPolicy?.balanceThreshold || 1000,
    mode: existingPolicy?.autoMode ? 'auto' : 'manual',
    vaultAddress: existingPolicy?.vaultAddress || '',
    allowUSDCPool: existingPolicy?.allowUSDCPool ?? true,
    allowUSDTPool: existingPolicy?.allowUSDTPool ?? true,
    cooldownPeriod: existingPolicy ? existingPolicy.cooldownPeriod / 3600 : 1, // Convert to hours
    privateKey: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.privateKey) {
      setError('Private key is required');
      return;
    }

    if (formData.mode === 'manual' && !formData.vaultAddress) {
      setError('Vault address is required for manual mode');
      return;
    }

    if (formData.mode === 'auto' && !formData.allowUSDCPool && !formData.allowUSDTPool) {
      setError('At least one pool must be allowed in auto mode');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const request: TreasuryPolicyRequest = {
        threshold: formData.threshold,
        autoMode: formData.mode === 'auto',
        vaultAddress: formData.mode === 'manual' ? formData.vaultAddress : undefined,
        allowUSDCPool: formData.allowUSDCPool,
        allowUSDTPool: formData.allowUSDTPool,
        cooldownPeriod: formData.cooldownPeriod * 3600, // Convert hours to seconds
        privateKey: formData.privateKey,
      };

      await configureTreasuryPolicy(request);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {existingPolicy ? 'Update Policy' : 'Create Treasury Policy'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-500 mt-2">
            Configure automated treasury management based on balance thresholds
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Balance Threshold (USDC)
            </label>
            <input
              type="number"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F4673B]"
              placeholder="1000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Policy will trigger when your balance reaches this amount
            </p>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Policy Mode
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#F4673B] transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="auto"
                  checked={formData.mode === 'auto'}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Auto Mode</p>
                  <p className="text-sm text-gray-500 mt-1">
                    AI agent automatically selects the best yield pool for your funds
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#F4673B] transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="manual"
                  checked={formData.mode === 'manual'}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Manual Mode</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Send funds to a specific vault address of your choice
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Vault Address (Manual Mode) */}
          {formData.mode === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vault Address
              </label>
              <input
                type="text"
                value={formData.vaultAddress}
                onChange={(e) => setFormData({ ...formData, vaultAddress: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F4673B] font-mono text-sm"
                placeholder="0x..."
              />
            </div>
          )}

          {/* Allowed Pools (Auto Mode) */}
          {formData.mode === 'auto' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Allowed Pools
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.allowUSDCPool}
                    onChange={(e) => setFormData({ ...formData, allowUSDCPool: e.target.checked })}
                  />
                  <span className="text-sm text-gray-900">USDC/USDC Pool</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.allowUSDTPool}
                    onChange={(e) => setFormData({ ...formData, allowUSDTPool: e.target.checked })}
                  />
                  <span className="text-sm text-gray-900">USDC/USDT Pool</span>
                </label>
              </div>
            </div>
          )}

          {/* Cooldown Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cooldown Period (hours)
            </label>
            <input
              type="number"
              value={formData.cooldownPeriod}
              onChange={(e) => setFormData({ ...formData, cooldownPeriod: Number(e.target.value) })}
              min="1"
              step="1"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F4673B]"
              placeholder="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum time between policy executions
            </p>
          </div>

          {/* Private Key */}
          <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
            <label className="block text-sm font-medium text-yellow-900 mb-2">
              ⚠️ Private Key (Required)
            </label>
            <input
              type="password"
              value={formData.privateKey}
              onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-yellow-300 focus:outline-none focus:ring-2 focus:ring-[#F4673B]"
              placeholder="Enter your private key"
            />
            <p className="text-xs text-yellow-700 mt-2">
              Your private key is required to sign the transaction. It will not be stored.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-[#F4673B] text-white rounded-xl font-medium hover:bg-[#E55A30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Configuring...' : existingPolicy ? 'Update Policy' : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
