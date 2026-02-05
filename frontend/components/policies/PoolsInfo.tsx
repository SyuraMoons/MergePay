'use client';

import { useState, useEffect } from 'react';
import { getPoolsInfo } from '@/services/api/treasury';

interface Pool {
  poolAddress: string;
  poolName: string;
  lastAPY: number;
  lastUpdateTime: number;
  active: boolean;
}

export function PoolsInfo() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const poolsData = await getPoolsInfo();
      setPools(poolsData);
    } catch (err) {
      console.error('Failed to load pools:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pools');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Yield Pools</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-200/50 rounded-xl"></div>
          <div className="h-20 bg-gray-200/50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Yield Pools</h3>
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Available Yield Pools</h3>
        <button
          onClick={loadPools}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh pools"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {pools.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No pools available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pools.map((pool, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-gray-200 hover:border-[#F4673B] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{pool.poolName}</h4>
                    {pool.active ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-mono mb-2">
                    {truncateAddress(pool.poolAddress)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last updated: {formatTimestamp(pool.lastUpdateTime)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#F4673B]">
                    {pool.lastAPY.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-500">APY</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
