'use client';

interface PriceRangeChartProps {
  lowerRange: number;
  currentPrice: number;
  upperRange: number;
}

export function PriceRangeChart({ lowerRange, currentPrice, upperRange }: PriceRangeChartProps) {
  // Calculate positions as percentages (clamped between 10-90 for visual margin)
  const range = upperRange - lowerRange;
  const rawPosition = ((currentPrice - lowerRange) / range) * 100;
  const currentPosition = Math.max(15, Math.min(85, rawPosition));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Price Range</h3>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#F4673B]"></span>
          <span className="text-sm text-gray-500">ETH/USDC</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative bg-gradient-to-b from-gray-50 to-white rounded-xl p-4">
        {/* SVG Chart */}
        <div className="relative h-40">
          <svg
            className="w-full h-full"
            viewBox="0 0 400 120"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F4673B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F4673B" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F4673B" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#F4673B" />
                <stop offset="100%" stopColor="#FF8A65" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Grid Lines - subtle */}
            <g stroke="rgba(0,0,0,0.03)" strokeWidth="1">
              <line x1="0" y1="30" x2="400" y2="30" />
              <line x1="0" y1="60" x2="400" y2="60" />
              <line x1="0" y1="90" x2="400" y2="90" />
            </g>

            {/* Area Chart Path - smoother curve */}
            <path
              d="M 0,85 
                 C 50,80 100,70 150,58 
                 C 200,46 250,40 300,42 
                 C 350,44 400,55 400,60
                 L 400,120 
                 L 0,120 
                 Z"
              fill="url(#areaGradient)"
            />

            {/* Line Chart - smoother curve */}
            <path
              d="M 0,85 
                 C 50,80 100,70 150,58 
                 C 200,46 250,40 300,42 
                 C 350,44 400,55 400,60"
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Current Price Dotted Line */}
            <line
              x1={currentPosition * 4}
              y1="10"
              x2={currentPosition * 4}
              y2="120"
              stroke="#F4673B"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.7"
            />

            {/* Current Price Dot */}
            <circle
              cx={currentPosition * 4}
              cy="42"
              r="5"
              fill="#F4673B"
              stroke="white"
              strokeWidth="2"
            />
          </svg>

          {/* Current Price Label - positioned nicely */}
          <div
            className="absolute top-2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
            style={{ left: `${currentPosition}%` }}
          >
            <span className="opacity-70">Current:</span> ${currentPrice.toLocaleString()}
          </div>
        </div>

        {/* Range Labels at bottom */}
        <div className="flex justify-between items-end pt-4 border-t border-gray-100 mt-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Lower Range</p>
            <p className="text-sm font-semibold text-gray-700">${lowerRange.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Current Price</p>
            <p className="text-sm font-bold text-[#F4673B]">${currentPrice.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Upper Range</p>
            <p className="text-sm font-semibold text-gray-700">${upperRange.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
