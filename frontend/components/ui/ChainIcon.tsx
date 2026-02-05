import Image from 'next/image';

interface ChainIconProps {
  chainId: string;
  chainName: string;
  size?: number;
}

const chainIcons: Record<string, string> = {
  base: '🔵',
  arbitrum: '🔷',
  optimism: '🔴',
  polygon: '🟣',
  sui: '💧',
};

export function ChainIcon({ chainId, chainName, size = 24 }: ChainIconProps) {
  const emoji = chainIcons[chainId.toLowerCase()] || '⚪';

  return (
    <div
      className="flex items-center justify-center rounded-full bg-gray-100"
      style={{ width: size, height: size, fontSize: size * 0.6 }}
      title={chainName}
    >
      {emoji}
    </div>
  );
}
