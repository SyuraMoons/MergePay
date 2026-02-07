'use client';

import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { WalletModal } from '@/components/wallet/WalletModal';
import { useDisconnect } from 'wagmi';
import { useEvmWallet } from '@/hooks/useEvmWallet';
import { useCircleWallet } from '@/hooks/useCircleWallet';

export default function WalletsPage() {
  const { wallets, activeWallet, setActiveWallet, removeWallet } = useWalletContext();
  const { disconnect: evmDisconnect } = useEvmWallet();
  const { disconnect: circleDisconnect } = useCircleWallet();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);

  const handleRemoveWallet = (walletId: string, walletType: string) => {
    removeWallet(walletId);

    if (walletType === 'evm') {
      evmDisconnect();
    } else if (walletType === 'circle') {
      circleDisconnect();
    }

    if (wallets.length <= 1) {
      wagmiDisconnect();
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getWalletTypeLabel = (type: string, connector?: string) => {
    if (type === 'circle') return 'Circle Smart Wallet';
    if (connector === 'walletConnect') return 'WalletConnect';
    return 'MetaMask';
  };

  const getWalletIcon = (type: string, connector?: string) => {
    if (type === 'circle') {
      return (
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
      );
    }

    if (connector === 'walletConnect') {
      return (
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3B99FC] to-[#2980D9] flex items-center justify-center shadow-lg shadow-[#3B99FC]/25">
          <span className="text-white text-lg font-bold">WC</span>
        </div>
      );
    }

    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F6851B] to-[#E2761B] flex items-center justify-center shadow-lg shadow-[#F6851B]/25">
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Management</h1>
          <p className="text-gray-500 mt-1">Manage your connected wallets across multiple chains</p>
        </div>
        <button
          onClick={() => setShowAddWallet(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F4673B] to-[#FF8A65] text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-[#F4673B]/25 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Wallet
        </button>
      </div>

      {/* Aggregated Balance Overview */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-500">Aggregated Balance</h2>
          <span className="text-xs text-gray-400">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''} connected</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-gray-900">$0.00</span>
          <span className="text-sm text-gray-400">USD</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Balance calculation coming soon</p>
      </div>

      {/* Wallet List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Connected Wallets</h2>

        {wallets.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Wallets Connected</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Connect your first wallet to start aggregating balances across multiple chains
            </p>
            <button
              onClick={() => setShowAddWallet(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#F4673B] to-[#FF8A65] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#F4673B]/25 transition-all"
            >
              Connect Your First Wallet
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className={`glass-card overflow-hidden transition-all ${wallet.isActive ? 'ring-2 ring-[#F4673B] ring-offset-2' : ''
                  }`}
              >
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    {getWalletIcon(wallet.type, wallet.connector)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {getWalletTypeLabel(wallet.type, wallet.connector)}
                        </span>
                        {wallet.isActive && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-[#F4673B] text-white rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-gray-600 font-mono">
                          {truncateAddress(wallet.address)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(wallet.address)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Copy address"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      {wallet.chainName && (
                        <p className="text-xs text-gray-400 mt-1">{wallet.chainName}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedWallet(expandedWallet === wallet.id ? null : wallet.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="View details"
                      >
                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedWallet === wallet.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Actions */}
                {expandedWallet === wallet.id && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex flex-wrap gap-3">
                      {!wallet.isActive && (
                        <button
                          onClick={() => setActiveWallet(wallet.id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Set as Active
                        </button>
                      )}
                      <button
                        onClick={() => window.open(`https://etherscan.io/address/${wallet.address}`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View on Explorer
                      </button>
                      <button
                        onClick={() => handleRemoveWallet(wallet.id, wallet.type)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Tips Section */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">💡 Tips</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-[#F4673B]">•</span>
            <span>The <strong>active wallet</strong> is used for signing transactions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#F4673B]">•</span>
            <span>Connect multiple wallets to aggregate balances across chains</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#F4673B]">•</span>
            <span>Circle Smart Wallets provide gasless transactions on supported networks</span>
          </li>
        </ul>
      </div>

      {/* Add Wallet Modal */}
      {showAddWallet && (
        <WalletModal
          isOpen={showAddWallet}
          onClose={() => setShowAddWallet(false)}
        />
      )}
    </div>
  );
}
