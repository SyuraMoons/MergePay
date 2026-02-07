'use client';

interface VaultPosition {
  id: string;
  poolName: string;
  chain: string;
  deposited: number;
  currentValue: number;
  apy: number;
  unclaimedYield: number;
}

interface VaultPositionCardProps {
  position: VaultPosition;
}

export function VaultPositionCard({ position }: VaultPositionCardProps) {
  const pnl = position.currentValue - position.deposited;
  const pnlPercent = ((pnl / position.deposited) * 100).toFixed(2);
  const isPositive = pnl >= 0;

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white hover:border-[#F4673B]/50 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Pool Token Icons */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
              {position.poolName.split('/')[0]?.charAt(0) || 'U'}
            </div>
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600 absolute -bottom-1 -right-1 border-2 border-white">
              {position.poolName.split('/')[1]?.charAt(0) || 'T'}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{position.poolName}</h3>
            <p className="text-xs text-gray-500">{position.chain}</p>
          </div>
        </div>

        {/* APY Badge */}
        <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
          {position.apy}% APY
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Deposited</p>
          <p className="text-lg font-semibold text-gray-900">
            ${position.deposited.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Current Value</p>
          <p className="text-lg font-semibold text-gray-900">
            ${position.currentValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* P&L and Unclaimed */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Unrealized P&L</p>
          <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{pnlPercent}% (${pnl.toFixed(2)})
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Unclaimed Yield</p>
          <p className="font-semibold text-[#F4673B]">
            ${position.unclaimedYield.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button className="flex-1 py-2 px-4 bg-[#F4673B] text-white text-sm font-medium rounded-lg hover:bg-[#E55A30] transition-colors">
          Deposit
        </button>
        <button className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
          Withdraw
        </button>
        <button className="py-2 px-4 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors">
          Claim
        </button>
      </div>
    </div>
  );
}
