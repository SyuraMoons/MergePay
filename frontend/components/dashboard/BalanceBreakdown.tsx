'use client';

import { useState } from 'react';
import { ChainBalance } from '@/types/balance';
import { ChainBalanceRow } from './ChainBalanceRow';

interface BalanceBreakdownProps {
  chains: ChainBalance[];
  isUpdating?: boolean;
}

type TimeRange = 'daily' | 'weekly' | 'monthly';

export function BalanceBreakdown({ chains, isUpdating = false }: BalanceBreakdownProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Time range toggle */}
        <div className="flex items-center bg-gray-100 rounded-full p-1">
          {(['daily', 'weekly', 'monthly'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${timeRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="space-y-2 stagger-children">
          {chains.map((chain) => (
            <ChainBalanceRow
              key={chain.chainId}
              chain={chain}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
