'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GatewayChain } from '@/types/gateway';

interface SourceChain {
  chainId: number;
  name: string;
  iconColor: string;
  balance: number;
  gatewayKey: GatewayChain;
}

export interface WalletGroup {
  id: string;
  name: string;
  type: 'eoa' | 'smart';
  chains: SourceChain[];
}

interface AddSourceModalProps {
  onClose: () => void;
  onAdd: (selected: { walletId: string, chainId: number, name: string, balance: number, color: string }[]) => void;
  currentSelection: string[]; // array of composite keys "walletId:chainId"
  availableWallets: WalletGroup[];
}

export function AddSourceModal({ onClose, onAdd, currentSelection, availableWallets }: AddSourceModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentSelection));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const toggleSelection = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelected(next);
  };

  const handleConfirm = () => {
    const result: any[] = [];
    availableWallets.forEach(w => {
      w.chains.forEach(c => {
        const key = `${w.id}:${c.chainId}`;
        if (selected.has(key)) {
          result.push({
            walletId: w.id,
            chainId: c.chainId,
            name: c.name,
            balance: c.balance,
            color: c.iconColor,
            key
          });
        }
      });
    });
    onAdd(result);
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-lg text-gray-900">Select Funding Sources</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {availableWallets.map(wallet => (
            <div key={wallet.id} className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 sticky top-0 bg-white/95 backdrop-blur py-1 z-10">
                {wallet.type === 'smart' ? '🤖' : '🦊'} {wallet.name}
              </h4>
              <div className="space-y-2">
                {wallet.chains.map(chain => {
                  const key = `${wallet.id}:${chain.chainId}`;
                  const isChecked = selected.has(key);
                  return (
                    <label
                      key={key}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all group hover:shadow-md ${isChecked
                        ? 'bg-orange-50 border-[#F4673B] shadow-sm'
                        : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelection(key)}
                            className="peer sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isChecked
                            ? 'bg-[#F4673B] border-[#F4673B]'
                            : 'border-gray-300 group-hover:border-gray-400 bg-white'
                            }`}>
                            {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </div>

                        <div className={`w-8 h-8 ${chain.iconColor} rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                          {chain.name[0]}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isChecked ? 'text-gray-900' : 'text-gray-700'}`}>{chain.name}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            Avail: <span className="text-gray-900">${chain.balance.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isChecked && <span className="text-[#F4673B] text-xs font-bold bg-[#F4673B]/10 px-2 py-1 rounded-lg">Selected</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/80 backdrop-blur flex justify-end gap-3 z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-[#F4673B] text-white font-bold rounded-xl shadow-lg shadow-[#F4673B]/20 hover:shadow-[#F4673B]/40 hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2"
          >
            Confirm Selection
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{selected.size}</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
