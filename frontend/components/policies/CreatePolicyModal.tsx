'use client';

import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { configureTreasuryPolicy, type TreasuryPolicyRequest } from '@/services/api/treasury';
import { RobotIcon, VaultIcon, AutoPilotIcon } from '@/components/ui/icons/PolicyIcons';

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
  const [step, setStep] = useState(1);

  // Initialize with active wallet selected by default
  const [selectedWallets, setSelectedWallets] = useState<string[]>(
    wallets.filter(w => w.isActive).map(w => w.address)
  );

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

  const handleWalletToggle = (address: string) => {
    setSelectedWallets(prev =>
      prev.includes(address)
        ? prev.filter(a => a !== address)
        : [...prev, address]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isMock = !formData.privateKey;
    const keyToUse = formData.privateKey || 'mock-private-key-for-testing';

    try {
      setIsSubmitting(true);
      setError(null);

      const request: TreasuryPolicyRequest = {
        threshold: formData.threshold,
        autoMode: formData.mode === 'auto',
        vaultAddress: formData.mode === 'manual' ? formData.vaultAddress : undefined,
        allowUSDCPool: formData.allowUSDCPool,
        allowUSDTPool: formData.allowUSDTPool,
        cooldownPeriod: formData.cooldownPeriod * 3600,
        sourceWallets: selectedWallets,
        privateKey: keyToUse,
      };

      if (isMock) {
        // Simulate API delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Skip actual API call for mock testing
        console.log('Mock policy creation successful');
      } else {
        await configureTreasuryPolicy(request);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">

        {/* Header with Steps */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {existingPolicy ? 'Update Policy' : 'Create Treasury Policy'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between px-2">
            {[
              { num: 1, label: 'Select Wallets' },
              { num: 2, label: 'Configure Rules' },
              { num: 3, label: 'Review & Sign' }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${step >= s.num ? 'bg-[#F4673B] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                  {s.num}
                </div>
                <span className={`ml-2 text-sm font-medium ${step >= s.num ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                  {s.label}
                </span>
                {idx < 2 && (
                  <div className={`w-12 h-0.5 mx-4 ${step > s.num ? 'bg-[#F4673B]' : 'bg-gray-100'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          <form id="policy-form" onSubmit={handleSubmit}>

            {/* Step 1: Select Wallets */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                  <p className="text-sm text-blue-800">
                    Select the source wallets you want to aggregate funds from. The policy will monitor these wallets and automatically sweep funds when thresholds are met.
                  </p>
                </div>

                <div className="space-y-3">
                  {wallets.map(wallet => (
                    <label
                      key={wallet.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedWallets.includes(wallet.address)
                        ? 'border-[#F4673B] bg-[#F4673B]/5'
                        : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedWallets.includes(wallet.address)
                        ? 'bg-[#F4673B] border-[#F4673B]'
                        : 'border-gray-300 bg-white'
                        }`}>
                        {selectedWallets.includes(wallet.address) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedWallets.includes(wallet.address)}
                        onChange={() => handleWalletToggle(wallet.address)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {wallet.label || 'Connected Wallet'}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 uppercase">
                            {wallet.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-mono mt-0.5">
                          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        </p>
                      </div>
                    </label>
                  ))}

                  {wallets.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No wallets connected. Please connect a wallet first.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Configure Rules */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in-up">
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
                    Trigger policy when total aggregated balance reaches this amount
                  </p>
                </div>

                {/* Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Policy Mode
                  </label>
                  <div className="space-y-3">
                    <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${formData.mode === 'auto' ? 'border-[#F4673B] bg-[#F4673B]/5' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input
                        type="radio"
                        name="mode"
                        value="auto"
                        checked={formData.mode === 'auto'}
                        onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                        className="mt-1 accent-[#F4673B]"
                      />
                      <div className="p-2 bg-white rounded-lg border border-gray-100 shrink-0">
                        <RobotIcon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Auto Mode (AI Agent)</p>
                        <p className="text-sm text-gray-500 mt-1">
                          AI automatically selects and rebalances between best yield pools
                        </p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${formData.mode === 'manual' ? 'border-[#F4673B] bg-[#F4673B]/5' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input
                        type="radio"
                        name="mode"
                        value="manual"
                        checked={formData.mode === 'manual'}
                        onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                        className="mt-1 accent-[#F4673B]"
                      />
                      <div className="p-2 bg-white rounded-lg border border-gray-100 shrink-0">
                        <VaultIcon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Manual Mode</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Fixed allocation to a specific vault address
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Vault Address (Manual Mode) */}
                {formData.mode === 'manual' && (
                  <div className="animate-fade-in-up">
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
                  <div className="animate-fade-in-up">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Allowed Pools
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.allowUSDCPool}
                          onChange={(e) => setFormData({ ...formData, allowUSDCPool: e.target.checked })}
                          className="accent-[#F4673B]"
                        />
                        <span className="text-sm text-gray-900">USDC/USDC Pool</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.allowUSDTPool}
                          onChange={(e) => setFormData({ ...formData, allowUSDTPool: e.target.checked })}
                          className="accent-[#F4673B]"
                        />
                        <span className="text-sm text-gray-900">USDC/USDT Pool</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review & Sign */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Summary Card */}
                <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Policy Summary</h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Source Wallets</p>
                      <p className="font-medium text-gray-900">{selectedWallets.length} selected</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Trigger Threshold</p>
                      <p className="font-medium text-gray-900">{formData.threshold} USDC</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Mode</p>
                      <p className="font-medium text-gray-900 capitalize">{formData.mode}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cooldown</p>
                      <p className="font-medium text-gray-900">{formData.cooldownPeriod} hours</p>
                    </div>
                  </div>
                </div>

                {/* Private Key Input */}
                <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                  <label className="flex items-center gap-2 text-sm font-medium text-yellow-900 mb-2">
                    <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Private Key (Optional for Testing)
                  </label>
                  <input
                    type="password"
                    value={formData.privateKey}
                    onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-yellow-300 focus:outline-none focus:ring-2 focus:ring-[#F4673B] bg-white"
                    placeholder="Enter any key or leave empty for testing"
                  />
                  <p className="text-xs text-yellow-700 mt-2">
                    For testing purposes, any input will be accepted. In production, this would securely sign the transaction.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 animate-shake">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-2xl">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={step === 1 && selectedWallets.length === 0}
              className="flex-1 px-6 py-3 bg-[#F4673B] text-white rounded-xl font-medium hover:bg-[#E55A30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-orange-200"
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              form="policy-form"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#F4673B] to-[#FF8A65] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              {isSubmitting ? 'Creating Policy...' : 'Confirm & Create Policy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
