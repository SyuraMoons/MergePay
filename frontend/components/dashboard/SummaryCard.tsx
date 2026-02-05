'use client';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'chart';
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
}: SummaryCardProps) {
  return (
    <div className="glass-card p-5 animate-fade-in-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-2 h-2 rounded-full bg-[#F4673B]" />
          )}
          <span className="text-sm text-gray-500">{title}</span>
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-600' :
              trend === 'down' ? 'bg-red-100 text-red-600' :
                'bg-gray-100 text-gray-600'
            }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {subtitle && (
          <span className="text-sm text-gray-400">{subtitle}</span>
        )}
      </div>

      {variant === 'chart' && (
        <div className="mt-4 flex items-end gap-1 h-12">
          {/* Mini bar chart visualization */}
          {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-gray-200 to-gray-100 rounded-sm transition-all duration-300 hover:from-[#F4673B] hover:to-[#FF8A65]"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
