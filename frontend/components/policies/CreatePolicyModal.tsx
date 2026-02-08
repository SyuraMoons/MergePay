'use client';

import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { configureTreasuryPolicy, type TreasuryPolicyRequest, type TreasuryPolicyResponse } from '@/services/api/treasury';

interface CreatePolicyModalProps {
  existingPolicy?: TreasuryPolicyResponse;
  onClose: () => void;
  onSuccess: (newPolicy: TreasuryPolicyResponse) => void;
}

export function CreatePolicyModal({ existingPolicy, onClose, onSuccess }: CreatePolicyModalProps) {
  const { wallets } = useWalletContext();
  const [step, setStep] = useState(1);
  const [selectedWallets, setSelectedWallets] = useState<string[]>(
    wallets.filter(w => w.isActive).map(w => w.address)
  );

  const [formData, setFormData] = useState({
    threshold: existingPolicy?.balanceThreshold || 1000,
    useUSYC: existingPolicy?.useUSYC ?? true,
    vaultAddress: existingPolicy?.vaultAddress || '',
    cooldownPeriod: existingPolicy ? existingPolicy.cooldownPeriod / 3600 : 24,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWalletToggle = (address: string) => {
    setSelectedWallets(prev =>
      prev.includes(address) ? prev.filter(a => a !== address) : [...prev, address]
    );
  };

  const handleSelectAllWallets = () => {
    if (selectedWallets.length === wallets.length) {
      setSelectedWallets([]);
    } else {
      setSelectedWallets(wallets.map(w => w.address));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const request: TreasuryPolicyRequest = {
        threshold: formData.threshold,
        useUSYC: formData.useUSYC,
        vaultAddress: !formData.useUSYC ? formData.vaultAddress : undefined,
        cooldownPeriod: formData.cooldownPeriod * 3600,
        sourceWallets: selectedWallets,
      };

      // Mock for demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create the policy response to pass back
      const newPolicy: TreasuryPolicyResponse = {
        balanceThreshold: formData.threshold,
        enabled: true,
        useUSYC: formData.useUSYC,
        vaultAddress: formData.vaultAddress || '',
        lastExecutionTime: Date.now() / 1000,
        cooldownPeriod: formData.cooldownPeriod * 3600,
      };

      // Mock Persistence for Demo
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('demo_policy_active', 'true');
        sessionStorage.setItem('demo_policy_data', JSON.stringify(newPolicy));
        // Force a storage event for other components to pick up
        window.dispatchEvent(new Event('storage'));
      }

      onSuccess(newPolicy);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-scale-in">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {existingPolicy ? 'Update Policy' : 'Create Policy'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${step >= i ? 'bg-[#F4673B]' : 'bg-gray-100'}`} />
            ))}
          </div>

          <form id="policy-form" onSubmit={handleSubmit}>
            {/* Step 1: Select Wallets */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Select Source Wallets</h3>
                      <p className="text-sm text-gray-500">Assets will be aggregated from these sources.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSelectAllWallets}
                      className="text-xs font-bold text-[#F4673B] hover:text-[#E55A30] transition-colors"
                    >
                      {selectedWallets.length === wallets.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {wallets.map(wallet => (
                      <label key={wallet.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border border-gray-300 flex items-center justify-center transition-colors ${selectedWallets.includes(wallet.address) ? 'bg-[#F4673B] border-[#F4673B]' : 'bg-white'}`}>
                            {selectedWallets.includes(wallet.address) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{wallet.label || 'Wallet'}</p>
                            <p className="text-xs text-gray-400 font-mono">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
                          </div>
                        </div>
                        <input type="checkbox" className="hidden" checked={selectedWallets.includes(wallet.address)} onChange={() => handleWalletToggle(wallet.address)} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Configure Strategy */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Threshold */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Trigger Threshold (USDC)</label>
                  <input
                    type="number"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-0 outline-none transition-colors font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Excess above this threshold will be deposited to yield</p>
                </div>

                {/* Strategy Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Yield Strategy</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* USYC Mode */}
                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.useUSYC ? 'border-[#F4673B] bg-orange-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="mode" checked={formData.useUSYC} onChange={() => setFormData({ ...formData, useUSYC: true })} className="hidden" />
                      <div className="mb-3">
                        <svg className={`w-6 h-6 ${formData.useUSYC ? 'text-[#F4673B]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v2m0 8v2" strokeLinecap="round" />
                          <path d="M9.5 10.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 1.38-1.12 2.5-2.5 2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <p className="font-bold text-gray-900 text-sm">Circle USYC</p>
                      <p className="text-xs text-gray-500 mt-1">~5% APY • US Treasuries</p>
                    </label>

                    {/* Manual Mode */}
                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${!formData.useUSYC ? 'border-[#F4673B] bg-orange-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="mode" checked={!formData.useUSYC} onChange={() => setFormData({ ...formData, useUSYC: false })} className="hidden" />
                      <div className="mb-3">
                        <svg className={`w-6 h-6 ${!formData.useUSYC ? 'text-[#F4673B]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <p className="font-bold text-gray-900 text-sm">Custom Vault</p>
                      <p className="text-xs text-gray-500 mt-1">Send to your vault</p>
                    </label>
                  </div>

                  {/* Strategy Preview */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    {formData.useUSYC ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[#F4673B] font-bold text-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Recommended Strategy
                        </div>
                        <p className="text-sm text-gray-600">
                          Circle USYC invests in short-duration US Treasury securities. Very low risk with stable ~5% APY.
                        </p>
                        <div className="flex gap-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase">Est. APY</p>
                            <p className="text-lg font-bold text-gray-900">~5%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase">Risk</p>
                            <p className="text-lg font-bold text-[#F4673B]">Very Low</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Vault Address</label>
                        <input
                          type="text"
                          value={formData.vaultAddress}
                          onChange={(e) => setFormData({ ...formData, vaultAddress: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#F4673B] text-sm font-mono"
                          placeholder="0x..."
                        />
                        <p className="text-xs text-gray-400">Enter the address where excess funds will be sent.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cooldown */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Cooldown Period (hours)</label>
                  <input
                    type="number"
                    value={formData.cooldownPeriod}
                    onChange={(e) => setFormData({ ...formData, cooldownPeriod: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-0 outline-none transition-colors font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Minimum time between policy executions</p>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-bold text-xl text-gray-900 mb-6">Policy Summary</h3>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Trigger @</p>
                      <p className="text-lg font-bold text-gray-900">{formData.threshold.toLocaleString()} USDC</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Cooldown</p>
                      <p className="text-lg font-bold text-gray-900">{formData.cooldownPeriod}h</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 col-span-2">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Strategy</p>
                      <div className="flex items-center gap-2">
                        {formData.useUSYC ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-[#F4673B]/10 flex items-center justify-center">
                              <svg className="w-4 h-4 text-[#F4673B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="8" />
                              </svg>
                            </div>
                            <p className="font-bold text-gray-900">Circle USYC Yield</p>
                            <span className="text-xs text-green-600 font-semibold">~5% APY</span>
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <p className="font-bold text-gray-900">Manual Vault</p>
                            <span className="text-xs text-gray-500 font-mono">{formData.vaultAddress.slice(0, 10)}...</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 col-span-2">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-2">Source Wallets ({selectedWallets.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedWallets.slice(0, 3).map(addr => (
                          <span key={addr} className="px-2 py-1 bg-gray-50 rounded text-xs font-mono text-gray-500 border border-gray-100">
                            {addr.slice(0, 6)}...
                          </span>
                        ))}
                        {selectedWallets.length > 3 && <span className="text-xs text-gray-400 pt-1">+{selectedWallets.length - 3} more</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <div className="flex-1 flex gap-3 justify-end">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-white transition-colors">
                Back
              </button>
            )}
            <button
              onClick={step < 3 ? () => setStep(s => s + 1) : (e) => handleSubmit(e as any)}
              disabled={isSubmitting || (step === 2 && !formData.useUSYC && !formData.vaultAddress)}
              className="px-8 py-2.5 bg-[#F4673B] text-white rounded-lg font-bold hover:bg-[#E55A30] transition-colors shadow-sm disabled:opacity-50"
            >
              {step < 3 ? 'Next' : (isSubmitting ? 'Creating...' : 'Create Policy')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
