'use client';

import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { configureTreasuryPolicy, type TreasuryPolicyRequest } from '@/services/api/treasury';
import { RobotIcon, VaultIcon, StarIcon, TrophyIcon, ChartIcon } from '@/components/ui/icons/PolicyIcons';

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

const FEATURED_VAULTS = [
  { name: 'Aave V3 USDC', address: '0x123...abc', apy: '4.5%' },
  { name: 'Compound USDC', address: '0x456...def', apy: '3.8%' },
  { name: 'Yearn USDC', address: '0x789...ghi', apy: '5.2%' },
];

export function CreatePolicyModal({ existingPolicy, onClose, onSuccess }: CreatePolicyModalProps) {
  const { wallets } = useWalletContext();
  const [step, setStep] = useState(1);
  const [selectedWallets, setSelectedWallets] = useState<string[]>(
    wallets.filter(w => w.isActive).map(w => w.address)
  );

  const [formData, setFormData] = useState({
    threshold: existingPolicy?.balanceThreshold || 1000,
    mode: existingPolicy?.autoMode ? 'auto' : 'manual',
    vaultAddress: existingPolicy?.vaultAddress || '',
    allowUSDCPool: existingPolicy?.allowUSDCPool ?? true,
    allowUSDTPool: existingPolicy?.allowUSDTPool ?? true,
    cooldownPeriod: existingPolicy ? existingPolicy.cooldownPeriod / 3600 : 1,
    privateKey: '',
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
        await new Promise(resolve => setTimeout(resolve, 1500));
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

  return (
    <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-scale-in">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {existingPolicy ? 'Update Policy' : 'Create Policy'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Indicator - Minimal */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${step >= i ? 'bg-[#F4673B]' : 'bg-gray-100'}`} />
            ))}
          </div>

          <form id="policy-form" onSubmit={handleSubmit}>
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
                            {selectedWallets.includes(wallet.address) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
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

            {step === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Trigger Threshold (USDC)</label>
                  <input
                    type="number"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-0 outline-none transition-colors font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Strategy Mode</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.mode === 'auto' ? 'border-[#F4673B] bg-orange-50/20' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="mode" value="auto" checked={formData.mode === 'auto'} onChange={(e) => setFormData({ ...formData, mode: e.target.value })} className="hidden" />
                      <div className="mb-3 text-[#F4673B]"><RobotIcon className="w-6 h-6" /></div>
                      <p className="font-bold text-gray-900 text-sm">Auto-Pilot</p>
                      <p className="text-xs text-gray-500 mt-1">AI managed reallocation</p>
                    </label>
                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.mode === 'manual' ? 'border-[#F4673B] bg-orange-50/20' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="mode" value="manual" checked={formData.mode === 'manual'} onChange={(e) => setFormData({ ...formData, mode: e.target.value })} className="hidden" />
                      <div className="mb-3 text-gray-400"><VaultIcon className="w-6 h-6" /></div>
                      <p className="font-bold text-gray-900 text-sm">Manual</p>
                      <p className="text-xs text-gray-500 mt-1">Fixed vault address</p>
                    </label>
                  </div>

                  {/* Preview Section */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    {formData.mode === 'auto' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[#F4673B] font-bold text-sm uppercase tracking-wide">
                          <StarIcon className="w-4 h-4" /> AI Strategy Preview
                        </div>
                        <p className="text-sm text-gray-600">The agent will actively monitor yields on <strong>Aave</strong>, <strong>Compound</strong>, and <strong>Curve</strong>.</p>
                        <div className="flex gap-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase">Est. APY</p>
                            <p className="text-lg font-bold text-gray-900">~12-18%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase">Risk</p>
                            <p className="text-lg font-bold text-green-600">Low</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Input Vault Address</label>
                        <input
                          type="text"
                          value={formData.vaultAddress}
                          onChange={(e) => setFormData({ ...formData, vaultAddress: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#F4673B] text-sm font-mono"
                          placeholder="0x..."
                        />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">Featured Vaults</p>
                          <div className="flex gap-2 flex-wrap">
                            {FEATURED_VAULTS.map(vault => (
                              <button
                                type="button"
                                key={vault.address}
                                onClick={() => setFormData({ ...formData, vaultAddress: vault.address })}
                                className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:border-[#F4673B] hover:text-[#F4673B] transition-colors"
                              >
                                {vault.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 relative overflow-hidden">
                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <TrophyIcon className="w-32 h-32" />
                  </div>

                  <h3 className="font-bold text-xl text-gray-900 mb-6 relative z-10">Policy Overview</h3>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 relative z-10">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Trigger @</p>
                      <p className="text-lg font-bold text-gray-900">{formData.threshold} USDC</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Cooldown</p>
                      <p className="text-lg font-bold text-gray-900">{formData.cooldownPeriod}h</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 col-span-2">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Strategy</p>
                      <div className="flex items-center gap-2">
                        {formData.mode === 'auto' ? <RobotIcon className="w-4 h-4 text-[#F4673B]" /> : <VaultIcon className="w-4 h-4 text-gray-500" />}
                        <p className="font-bold text-gray-900">{formData.mode === 'auto' ? 'AI Auto-Pilot (Compound/Aave/Curve)' : `Manual Vault (${formData.vaultAddress.slice(0, 6)}...)`}</p>
                      </div>
                      {formData.mode === 'auto' && (
                        <div className="mt-2 pt-2 border-t border-gray-50 flex gap-3">
                          <span className="text-xs font-semibold text-green-600">Est. 12-18% APY</span>
                          <span className="text-xs font-semibold text-gray-500">Risk: Low</span>
                        </div>
                      )}
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

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Sign Transaction (Optional)</label>
                  <input
                    type="password"
                    value={formData.privateKey}
                    onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F4673B] outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
                    placeholder="Enter private key (leave empty for mock)"
                  />
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
              disabled={isSubmitting}
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
