'use client';

import { ChainBalance } from '@/types/balance';

interface ChainBalanceRowProps {
  chain: ChainBalance;
  isUpdating?: boolean;
}

const chainColors: Record<string, string> = {
  base: '#0052FF',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',
  polygon: '#8247E5',
  sui: '#4DA2FF',
};

export function ChainBalanceRow({ chain, isUpdating = false }: ChainBalanceRowProps) {
  const color = chainColors[chain.chainId.toLowerCase()] || '#888888';

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-white/50 transition-all duration-200 group">
      <div className="flex items-center gap-3">
        {/* Chain color indicator */}
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />

        <div>
          <p className="font-medium text-gray-900">{chain.chainName}</p>
          {isUpdating && (
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-400">Syncing</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-right flex items-center gap-3">
        {/* Mini progress bar */}
        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              backgroundColor: color,
              width: `${Math.min((chain.balance / 50) * 100, 100)}%`
            }}
          />
        </div>

        <div>
          <p className="font-semibold text-gray-900">
            ${chain.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400">{chain.symbol}</p>
        </div>
      </div>
    </div>
  );
}
