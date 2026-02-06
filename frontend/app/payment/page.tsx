'use client';

import { GatewayTransferForm } from '@/components/transaction/GatewayTransferForm';

export default function PayPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Transaction
        </h1>
        {/* <p className="text-gray-500">
          Pay anyone, on any chain, using your aggregated Circle Gateway balance.
        </p> */}
      </div>

      {/* Gateway Form */}
      <div
        className="flex justify-center py-6 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <GatewayTransferForm />
      </div>
    </div>
  );
}
