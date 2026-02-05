'use client';

import { useWalletContext } from '@/contexts/WalletContext';
import { useEvmWallet } from '@/hooks/useEvmWallet';
import { useCircleWallet } from '@/hooks/useCircleWallet';

export function WalletManager() {
  const { wallets, activeWallet, setActiveWallet, removeWallet } = useWalletContext();
  const { disconnect: evmDisconnect } = useEvmWallet();
  const { disconnect: circleDisconnect } = useCircleWallet();

  const handleRemoveWallet = (walletId: string, walletType: string) => {
    // Disconnect based on wallet type
    if (walletType === 'evm') {
      evmDisconnect();
    } else if (walletType === 'circle') {
      circleDisconnect();
    }
    removeWallet(walletId);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const getWalletIcon = (type: string, connector?: string) => {
    if (type === 'circle') {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
          <span className="text-white text-sm font-bold">C</span>
        </div>
      );
    }

    if (connector === 'walletConnect') {
      return (
        <div className="w-8 h-8 rounded-lg bg-[#3B99FC]/10 flex items-center justify-center">
          <span className="text-[#3B99FC] text-sm font-bold">WC</span>
        </div>
      );
    }

    return (
      <div className="w-8 h-8 rounded-lg bg-[#F6851B]/10 flex items-center justify-center">
        <span className="text-[#F6851B] text-sm font-bold">MM</span>
      </div>
    );
  };

  if (wallets.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">No wallets connected</p>
        <p className="text-gray-400 text-sm mt-1">Connect a wallet to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {wallets.map((wallet) => (
        <div
          key={wallet.id}
          className={`relative p-4 rounded-xl border transition-all ${wallet.isActive
              ? 'border-[#F4673B] bg-[#F4673B]/5'
              : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <div className="flex items-center gap-3">
            {getWalletIcon(wallet.type, wallet.connector)}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 truncate">
                  {truncateAddress(wallet.address)}
                </p>
                {wallet.isActive && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-[#F4673B] text-white rounded-full">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{wallet.label}</span>
                {wallet.chainName && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">{wallet.chainName}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!wallet.isActive && (
                <button
                  onClick={() => setActiveWallet(wallet.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Set as active"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => handleRemoveWallet(wallet.id, wallet.type)}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors group"
                title="Remove wallet"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}

      <p className="text-xs text-gray-400 text-center pt-2">
        Click the checkmark to set a wallet as active for transactions
      </p>
    </div>
  );
}
