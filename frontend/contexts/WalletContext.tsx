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

  const value: WalletContextType = useMemo(() => ({
    wallets,
    activeWallet,
    isConnecting,
    error,
    addWallet,
    removeWallet,
    setActiveWallet,
    clearError,
  }), [wallets, activeWallet, isConnecting, error, addWallet, removeWallet, setActiveWallet, clearError]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export { WalletContext };
