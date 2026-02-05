'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { useEvmWallet } from '@/hooks/useEvmWallet';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { WalletManager } from './WalletManager';
import Image from 'next/image';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'connect' | 'manage';

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('connect');
  const [circleUsername, setCircleUsername] = useState('');
  const [circleMode, setCircleMode] = useState<'register' | 'login'>('register');

  const { addWallet, wallets } = useWalletContext();

  // EVM Wallet
  const {
    isConnected: evmConnected,
    isConnecting: evmConnecting,
    error: evmError,
    address: evmAddress,
    chainId: evmChainId,
    chainName: evmChainName,
    connectMetaMask,
    connectWalletConnect,
    toConnectedWallet,
  } = useEvmWallet();

  // Circle Wallet
  const {
    smartAccount: circleAccount,
    isLoading: circleLoading,
    error: circleError,
    register: circleRegister,
    login: circleLogin,
    isConfigured: circleConfigured,
  } = useCircleWallet();

  // Add EVM wallet when connected
  useEffect(() => {
    if (evmConnected && evmAddress) {
      const wallet = toConnectedWallet();
      if (wallet) {
        addWallet(wallet);
      }
    }
  }, [evmConnected, evmAddress, addWallet, toConnectedWallet]);

  // Add Circle wallet when connected
  useEffect(() => {
    if (circleAccount) {
      addWallet({
        id: `circle-${circleAccount.address}`,
        type: 'circle',
        address: circleAccount.address,
        chainId: circleAccount.chainId,
        chainName: circleAccount.chainName,
        label: 'Circle Smart Wallet',
        isActive: false,
        connector: 'circle-passkey',
      });
    }
  }, [circleAccount, addWallet]);

  const handleCircleAuth = useCallback(async () => {
    if (!circleUsername.trim()) return;

    if (circleMode === 'register') {
      await circleRegister(circleUsername);
    } else {
      await circleLogin(circleUsername);
    }
  }, [circleUsername, circleMode, circleRegister, circleLogin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === 'connect' ? 'Connect Wallet' : 'Manage Wallets'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('connect')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'connect'
              ? 'text-[#F4673B] border-b-2 border-[#F4673B]'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Connect
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'manage'
              ? 'text-[#F4673B] border-b-2 border-[#F4673B]'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Manage ({wallets.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'connect' ? (
            <div className="space-y-6">
              {/* Circle Smart Wallet Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  Circle Smart Wallet
                  <span className="ml-auto text-xs text-gray-400">Passkey</span>
                </h3>

                {circleAccount ? (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-sm text-green-800">
                      Connected: {circleAccount.address.slice(0, 10)}...{circleAccount.address.slice(-8)}
                    </p>
                  </div>
                ) : !circleConfigured ? (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-600">
                      Circle Smart Wallet is not configured. Add Circle credentials to enable passkey authentication.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCircleMode('register')}
                        className={`flex-1 py-2 text-sm rounded-lg transition-colors ${circleMode === 'register'
                          ? 'bg-[#F4673B] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        Register
                      </button>
                      <button
                        onClick={() => setCircleMode('login')}
                        className={`flex-1 py-2 text-sm rounded-lg transition-colors ${circleMode === 'login'
                          ? 'bg-[#F4673B] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        Login
                      </button>
                    </div>

                    <input
                      type="text"
                      value={circleUsername}
                      onChange={(e) => setCircleUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-2 focus:ring-[#F4673B]/20 outline-none transition-all text-sm"
                    />

                    <button
                      onClick={handleCircleAuth}
                      disabled={circleLoading || !circleUsername.trim()}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {circleLoading ? 'Authenticating...' : circleMode === 'register' ? 'Create with Passkey' : 'Login with Passkey'}
                    </button>

                    {circleError && (
                      <p className="text-sm text-red-500">{circleError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs text-gray-500">or connect with</span>
                </div>
              </div>

              {/* EVM Wallets Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">EVM Wallets</h3>

                {evmConnected ? (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-sm text-green-800">
                      Connected: {evmAddress?.slice(0, 10)}...{evmAddress?.slice(-8)}
                      <span className="ml-2 text-green-600">({evmChainName})</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* MetaMask */}
                    <button
                      onClick={connectMetaMask}
                      disabled={evmConnecting}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#F4673B] hover:bg-[#F4673B]/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F6851B]/10 flex items-center justify-center">
                        <Image
                          src="/ui/metamask-icon.svg"
                          alt="MetaMask"
                          width={24}
                          height={24}
                          className="object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 group-hover:text-[#F4673B] transition-colors">MetaMask</p>
                        <p className="text-xs text-gray-500">Connect with browser extension</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-[#F4673B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* WalletConnect */}
                    <button
                      onClick={connectWalletConnect}
                      disabled={evmConnecting}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#F4673B] hover:bg-[#F4673B]/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#3B99FC]/10 flex items-center justify-center">
                        <Image
                          src="/ui/walletconnect-icon.svg"
                          alt="WalletConnect"
                          width={24}
                          height={24}
                          className="object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 group-hover:text-[#F4673B] transition-colors">WalletConnect</p>
                        <p className="text-xs text-gray-500">Scan with mobile wallet</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-[#F4673B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                {evmError && (
                  <p className="mt-2 text-sm text-red-500">{evmError}</p>
                )}
              </div>
            </div>
          ) : (
            <WalletManager />
          )}
        </div>
      </div>
    </div>
  );
}
