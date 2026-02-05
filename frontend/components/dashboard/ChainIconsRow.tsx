'use client';

import { ChainBalance } from '@/types/balance';
import Image from 'next/image';

interface ChainIconsRowProps {
  chains: ChainBalance[];
  onChainClick?: (chainId: string) => void;
}

// Chain icon URLs - using local assets from ui directory
const chainData: Record<string, { color: string; iconUrl: string }> = {
  base: {
    color: '#0052FF',
    iconUrl: '/ui/base-logo.png'
  },
  arbitrum: {
    color: '#28A0F0',
    iconUrl: '/ui/arbitrum-arb-logo.png'
  },
  optimism: {
    color: '#FF0420',
    iconUrl: '/ui/optimism-ethereum-op-logo.png'
  },
  polygon: {
    color: '#8247E5',
    iconUrl: 'https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/matic.svg'
  },
  sui: {
    color: '#4DA2FF',
    iconUrl: 'https://raw.githubusercontent.com/MystenLabs/sui/main/docs/static/img/sui-logo.svg'
  },
};

export function ChainIconsRow({ chains, onChainClick }: ChainIconsRowProps) {
  return (
    <div className="flex items-center justify-start gap-3">
      {chains.map((chain) => {
        const data = chainData[chain.chainId.toLowerCase()];

        return (
          <button
            key={chain.chainId}
            onClick={() => onChainClick?.(chain.chainId)}
            className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 hover:bg-white transition-all duration-200 border border-gray-100"
          >
            {/* Chain Icon */}
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: data?.color + '15' }}
            >
              {data?.iconUrl ? (
                <Image
                  src={data.iconUrl}
                  alt={chain.chainName}
                  width={18}
                  height={18}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-xs" style={{ color: data?.color }}>●</span>
              )}
            </div>

            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              {chain.chainName}
            </span>

            <span className="text-sm text-gray-400">
              ${chain.balance.toFixed(0)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
