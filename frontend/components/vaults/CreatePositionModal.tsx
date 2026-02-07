'use client';

import { useState } from 'react';

interface Strategy {
  name: string;
  description: string;
  lowerRange: number;
  currentPrice: number;
  upperRange: number;
  estimatedAPY: number;
  estimatedFees: number;
  riskLevel: 'Low' | 'Balanced' | 'High';
  aiSummary: string;
}

interface CreatePositionModalProps {
  strategy: Strategy;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePositionModal({ strategy, onClose, onSuccess }: CreatePositionModalProps) {
  const [amount, setAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const estimatedYield = amount ? (parseFloat(amount) * strategy.estimatedAPY / 100 / 365).toFixed(2) : '0.00';
  const estimatedMonthlyYield = amount ? (parseFloat(amount) * strategy.estimatedAPY / 100 / 12).toFixed(2) : '0.00';

  const handleCreate = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      setIsCreating(true);
      // TODO: Implement actual position creation
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated delay
      onSuccess();
    } catch (error) {
      console.error('Failed to create position:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Create Position</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">{strategy.name}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Strategy Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#F4673B]/5 to-[#FF8A65]/5 border border-[#F4673B]/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Lower Range</p>
                <p className="font-semibold text-gray-900">${strategy.lowerRange.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Current</p>
                <p className="font-semibold text-[#F4673B]">${strategy.currentPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Upper Range</p>
                <p className="font-semibold text-gray-900">${strategy.upperRange.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount (USDC)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 pr-20 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F4673B] text-lg font-medium"
              />
              <button
                onClick={() => setAmount('10000')} // Mock max
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Estimated Returns */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Estimated Returns</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-green-50">
                <p className="text-xs text-gray-500 mb-1">Daily Yield</p>
                <p className="text-xl font-bold text-green-600">${estimatedYield}</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50">
                <p className="text-xs text-gray-500 mb-1">Monthly Yield</p>
                <p className="text-xl font-bold text-blue-600">${estimatedMonthlyYield}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <span className="text-sm text-gray-600">Expected APY</span>
              <span className="font-semibold text-green-600">{strategy.estimatedAPY}%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <span className="text-sm text-gray-600">Risk Level</span>
              <span className="font-semibold text-amber-600">{strategy.riskLevel}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-900">Impermanent Loss Risk</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Providing liquidity involves risk. If the price moves outside your range, you may experience impermanent loss.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!amount || parseFloat(amount) <= 0 || isCreating}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#F4673B] to-[#FF8A65] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#F4673B]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isCreating ? 'Creating...' : 'Create Position'}
          </button>
        </div>
      </div>
    </div>
  );
}
