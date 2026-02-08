'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { ConnectedWallet, WalletContextType } from '@/types/wallet';

const WalletContext = createContext<WalletContextType | null>(null);

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [wallets, setWallets] = useState<ConnectedWallet[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find the currently active wallet
  const activeWallet = useMemo(() => {
    return wallets.find(w => w.isActive) || null;
  }, [wallets]);

  const addWallet = useCallback((wallet: ConnectedWallet) => {
    setWallets(prev => {
      // Check if wallet already exists
      const exists = prev.some(w => w.id === wallet.id);
      if (exists) {
        // Update existing wallet
        return prev.map(w => w.id === wallet.id ? wallet : w);
      }
      // Add new wallet, set as active if first wallet
      const isFirst = prev.length === 0;
      return [...prev, { ...wallet, isActive: isFirst }];
    });
    setError(null);
  }, []);

  const removeWallet = useCallback((walletId: string) => {
    setWallets(prev => {
      const filtered = prev.filter(w => w.id !== walletId);
      // If removed wallet was active, set first remaining as active
      const wasActive = prev.find(w => w.id === walletId)?.isActive;
      if (wasActive && filtered.length > 0) {
        filtered[0].isActive = true;
      }
      return filtered;
    });
  }, []);

  const setActiveWallet = useCallback((walletId: string) => {
    setWallets(prev => prev.map(w => ({
      ...w,
      isActive: w.id === walletId,
    })));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const disconnectAll = useCallback(() => {
    setWallets([]);
    setError(null);
  }, []);

  const addMockWallet = useCallback(() => {
    const mockWallets = [
      {
        id: 'mock-1',
        type: 'evm' as const,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        chainId: 8453,
        chainName: 'Base',
        label: 'Demo Wallet (Base)',
        isActive: false,
        connector: 'metamask',
      },
      {
        id: 'mock-2',
        type: 'evm' as const,
        address: '0x1234567890123456789012345678901234567890',
        chainId: 42161,
        chainName: 'Arbitrum',
        label: 'Demo Wallet (Arb)',
        isActive: false,
        connector: 'walletconnect',
      },
      {
        id: 'mock-3',
        type: 'evm' as const,
        address: '0x9876543210987654321098765432109876543210',
        chainId: 137,
        chainName: 'Polygon',
        label: 'Demo Wallet (Poly)',
        isActive: false,
        connector: 'metamask',
      }
    ];

    setWallets(prev => {
      // Find next available mock wallet
      const nextMock = mockWallets.find(m => !prev.some(p => p.address === m.address));

      if (!nextMock) return prev; // All mocks added

      return [...prev, { ...nextMock, isActive: prev.length === 0 }];
    });
  }, []);

  const value: WalletContextType = useMemo(() => ({
    wallets,
    activeWallet,
    isConnecting,
    error,
    addWallet,
    removeWallet,
    setActiveWallet,
    clearError,
    disconnectAll,
    addMockWallet,
  }), [wallets, activeWallet, isConnecting, error, addWallet, removeWallet, setActiveWallet, clearError, disconnectAll, addMockWallet]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export { WalletContext };
