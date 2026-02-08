'use client';

import { useEffect, useState } from 'react';

interface TotalBalanceCardProps {
  totalBalance: number;
  targetBalance?: number;
  symbol?: string;
  isUpdating?: boolean;
  isConnected?: boolean;
}

export function TotalBalanceCard({
  totalBalance,
  targetBalance = 100,
  symbol = 'USDC',
  isUpdating = false,
  isConnected = true,
}: TotalBalanceCardProps) {
  const [animatedBalance, setAnimatedBalance] = useState(totalBalance);
  const percentage = Math.min((totalBalance / targetBalance) * 100, 100);

  // Circular progress calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    // Animate balance change
    const duration = 500;
    const steps = 20;
    const increment = (totalBalance - animatedBalance) / steps;
    let current = animatedBalance;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      setAnimatedBalance(current);
      if (step >= steps) {
        setAnimatedBalance(totalBalance);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalBalance]);

  return (
    <div className="glass-card p-6 animate-fade-in-up h-full flex flex-col justify-between relative overflow-hidden group border-t-4 border-t-[#F4673B] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#F4673B]/5 to-[#FF8A65]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#F4673B]/10"></div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-3 z-10">
          <div className="p-3 bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-gray-900 font-bold">Wallet Disconnected</h3>
            <p className="text-xs text-gray-500 mt-1">Connect to see your balance</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Let's merge<br />your funds!
              </h2>

              <div className="mt-6 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-500">You have</span>
                  <span className="text-sm font-semibold text-[#F4673B]">
                    {percentage.toFixed(0)}% of target
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#F4673B] to-[#FF8A65] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex justify-between mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    ${animatedBalance.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400">
                    /${targetBalance} {symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Circular Progress */}
            <div className="relative flex items-center justify-center">
              <svg width="100" height="100" className="progress-ring">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#F3F4F6"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="progress-ring-circle"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F4673B" />
                    <stop offset="100%" stopColor="#FF8A65" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4673B] to-[#FF8A65] flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {isUpdating && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
              <span className="text-sm text-gray-500">Live balance sync</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
