'use client';

interface TransactionItemProps {
  type: 'send' | 'receive' | 'bridge';
  from: string;
  to: string;
  amount: string;
  token: string;
  chain: string;
  chainId: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  hash?: string;
}

export function TransactionItem({
  type,
  from,
  to,
  amount,
  token,
  chain,
  status,
  timestamp,
  hash,
}: TransactionItemProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'send':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
      case 'receive':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        );
      case 'bridge':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
    }
  };

  const getStatusBadge = () => {
    const baseClasses = "px-2 py-1 rounded-lg text-xs font-medium";
    switch (status) {
      case 'completed':
        return <span className={`${baseClasses} bg-green-50 text-green-700`}>Completed</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-50 text-yellow-700`}>Pending</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-50 text-red-700`}>Failed</span>;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'send':
        return 'text-red-500 bg-red-50';
      case 'receive':
        return 'text-green-500 bg-green-50';
      case 'bridge':
        return 'text-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50/50 transition-colors">
      {/* Type Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor()}`}>
        {getTypeIcon()}
      </div>

      {/* Transaction Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-900 capitalize">{type}</p>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{truncateAddress(from)}</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span>{truncateAddress(to)}</span>
        </div>
      </div>

      {/* Amount & Chain */}
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">
          {type === 'send' ? '-' : '+'}{amount} {token}
        </p>
        <p className="text-xs text-gray-500">{chain}</p>
      </div>

      {/* Timestamp */}
      <div className="text-right min-w-[60px]">
        <p className="text-xs text-gray-400">{getRelativeTime(timestamp)}</p>
      </div>

      {/* View Details */}
      {hash && (
        <button
          onClick={() => window.open(`https://etherscan.io/tx/${hash}`, '_blank')}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          title="View on Explorer"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      )}
    </div>
  );
}
