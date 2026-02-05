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
        <p className="text-gray-500">
          Send payments across any chain. We&apos;ll find the best route for you.
        </p>
      </div>

      {/* Widget Container */}
      <div
        className="flex justify-center py-6 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <LiFiWidgetWrapper />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#F4673B]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#F4673B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Best Rates</h3>
          </div>
          <p className="text-sm text-gray-500">
            Aggregates multiple bridges and DEXs to find the optimal route.
          </p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Secure</h3>
          </div>
          <p className="text-sm text-gray-500">
            Battle-tested bridges with multi-sig security and insurance.
          </p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Fast</h3>
          </div>
          <p className="text-sm text-gray-500">
            Most transfers complete in under 2 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
