'use client';

import { LiFiWidgetWrapper } from '@/components/pay/LiFiWidgetWrapper';

export default function PayPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pay
        </h1>
      </div>

      {/* Widget Container */}
      <div
        className="flex justify-center py-6 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <LiFiWidgetWrapper />
      </div>
    </div>
  );
}
