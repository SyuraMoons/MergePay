'use client';

interface Strategy {
  name: string;
  description: string;
  lowerRange: number;
  currentPrice: number;
  upperRange: number;
  estimatedAPY: number;
  estimatedFees: number;
  riskLevel: 'Low' | 'Balanced' | 'High';
  aiSummary: string;
}

interface StrategyRecommendationProps {
  strategy: Strategy;
  agentName: string;
  agentAvatar: string;
  agentEns: string;
  agentTrophies: number;
  agentStars: number;
  onCreatePosition: () => void;
}

export function StrategyRecommendation({
  strategy,
  agentName,
  agentAvatar,
  agentEns,
  agentTrophies,
  agentStars,
  onCreatePosition,
}: StrategyRecommendationProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'text-green-600';
      case 'Balanced':
        return 'text-amber-600';
      case 'High':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">AI Strategy Recommendation</h2>
        <p className="text-sm text-gray-500 mt-1">
          You classified as <span className="font-medium">Balanced</span> risk, here's our recommended CLMM strategy
        </p>
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex gap-6">
        {/* Agent Info - Left Side */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-5xl mb-3">
            {agentAvatar}
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-sm">{agentName}</p>
            <p className="text-xs text-[#F4673B]">{agentEns}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="flex items-center gap-0.5 text-xs text-gray-500">
                <span className="text-amber-500">🏆</span> {agentTrophies}
              </span>
              <span className="flex items-center gap-0.5 text-xs text-gray-500">
                <span className="text-amber-400">⭐</span> {agentStars}
              </span>
            </div>
          </div>
        </div>

        {/* Strategy Details - Right Side */}
        <div className="flex-1 space-y-4">
          {/* Strategy Name */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{strategy.name}</h3>
            <p className="text-sm text-gray-500">{strategy.description}</p>
          </div>

          {/* Price Range Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Lower Range</p>
              <p className="text-lg font-semibold text-gray-900">
                ${strategy.lowerRange.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Current Price</p>
              <p className="text-lg font-semibold text-gray-900">
                ${strategy.currentPrice.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Upper Range</p>
              <p className="text-lg font-semibold text-gray-900">
                ${strategy.upperRange.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <p className="text-xs text-gray-500 mb-1">Estimated APY</p>
              <p className="text-xl font-bold text-green-600">
                {strategy.estimatedAPY}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50">
              <p className="text-xs text-gray-500 mb-1">Estimated Fees</p>
              <p className="text-lg font-semibold text-blue-600">
                ${strategy.estimatedFees}/day
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50">
              <p className="text-xs text-gray-500 mb-1">Risk Level</p>
              <p className={`text-lg font-semibold ${getRiskColor(strategy.riskLevel)}`}>
                {strategy.riskLevel}
              </p>
            </div>
          </div>

          {/* AI Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">AI Analysis Summary</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {strategy.aiSummary}
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onCreatePosition}
        className="w-full py-4 bg-gradient-to-r from-[#F4673B] to-[#FF8A65] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#F4673B]/30 transition-all duration-200 transform hover:-translate-y-0.5"
      >
        Create Position
      </button>
    </div>
  );
}
