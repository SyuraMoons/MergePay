'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWalletContext } from '@/contexts/WalletContext';
import { useEvmWallet } from '@/hooks/useEvmWallet';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { WalletManager } from './WalletManager';
import { WalletConnectQRModal } from './WalletConnectQRModal';
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
  const [showQRModal, setShowQRModal] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState<string | null>(null); // Track which wallet is connecting

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset to connect tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('connect');
    }
  }, [isOpen]);

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

  // Add EVM wallet when connected (prevent duplicates by checking if already exists)
  useEffect(() => {
    if (evmConnected && evmAddress) {
      const wallet = toConnectedWallet();
      if (wallet) {
        addWallet(wallet); // addWallet already handles duplicate checking internally
      }
    }
  }, [evmConnected, evmAddress, addWallet, toConnectedWallet]);

  // Add Circle wallet when connected (prevent duplicates)
  useEffect(() => {
    if (circleAccount) {
      addWallet({
        id: `circle-${circleAccount.address}`,
        type: 'circle',
        address: circleAccount.address,
        chainId: circleAccount.chainId,
        chainName: circleAccount.chainName,
        label: 'Circle Smart Wallet',
        connector: 'circle-passkey',
      }); // addWallet already handles duplicate checking internally
    }
  }, [circleAccount, addWallet]);

  // Removed auto-close - let users close the modal manually or click outside

  const handleCircleAuth = useCallback(async () => {
    if (!circleUsername.trim()) return;

    if (circleMode === 'register') {
      await circleRegister(circleUsername);
    } else {
      await circleLogin(circleUsername);
    }
  }, [circleUsername, circleMode, circleRegister, circleLogin]);

  if (!isOpen) return null;

  // Use portal to render modal at document.body level to escape stacking context issues
  // from parent elements with backdrop-filter or transforms
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm modal-backdrop animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
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
                      onClick={async () => {
                        setIsConnectingWallet('metamask');
                        const result = await connectMetaMask();
                        if (!result.success) {
                          console.error('MetaMask connection failed:', result.error);
                          // You could show a toast notification here
                        }
                        setIsConnectingWallet(null);
                      }}
                      disabled={evmConnecting || isConnectingWallet === 'metamask'}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#F4673B] hover:bg-[#F4673B]/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F6851B]/10 flex items-center justify-center">
                        {(evmConnecting || isConnectingWallet === 'metamask') ? (
                          <svg className="w-5 h-5 text-[#F6851B] animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
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
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 group-hover:text-[#F4673B] transition-colors">
                          {(evmConnecting || isConnectingWallet === 'metamask') ? 'Connecting...' : 'MetaMask'}
                        </p>
                        <p className="text-xs text-gray-500">Connect with browser extension</p>
                      </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-[#F4673B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* WalletConnect */}
                    <button
                      onClick={() => setShowQRModal(true)}
                      disabled={isConnectingWallet === 'walletconnect'}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#F4673B] hover:bg-[#F4673B]/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#3B99FC]/10 flex items-center justify-center">
                        {isConnectingWallet === 'walletconnect' ? (
                          <svg className="w-5 h-5 text-[#3B99FC] animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
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
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 group-hover:text-[#F4673B] transition-colors">
                          {isConnectingWallet === 'walletconnect' ? 'Opening QR...' : 'WalletConnect'}
                        </p>
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
            <WalletManager onSwitchToConnectTab={() => setActiveTab('connect')} />
          )}
        </div>
      </div>

      {/* Custom WalletConnect QR Modal */}
      <WalletConnectQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>,
    document.body
  );
}
