'use client';

import { GatewayTransferForm } from '@/components/transaction/GatewayTransferForm';
import { UnifiedBalanceOverview } from '@/components/transaction/UnifiedBalanceOverview';

export default function TransactionPage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Transaction Center
        </h1>
        <p className="text-gray-500 max-w-2xl">
          Manage your unified balance and execute cross-chain transfers instantly using Circle Gateway.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Balance Overview */}
        <div className="lg:col-span-1 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <UnifiedBalanceOverview />

          {/* Quick Tip Card */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-xl">💡</span>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 text-sm mb-1">Did you know?</h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  All your USDC across supported chains is treated as a single unified balance. You can pay anyone on any chain without bridging first.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transfer Form */}
        <div className="lg:col-span-2">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <GatewayTransferForm />
          </div>
        </div>
      </div>
    </div>
  );
}
