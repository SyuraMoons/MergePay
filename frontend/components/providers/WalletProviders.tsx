'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { WagmiProvider, useAccount, useReconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi.config';
import { WalletProvider, useWalletContext } from '@/contexts/WalletContext';
import { getChainById } from '@/lib/wagmi.config';

// Create a client for React Query - must be outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

interface WalletProvidersProps {
  children: ReactNode;
}

// Auto-reconnect wallet on mount
function WalletReconnect() {
  const { reconnect } = useReconnect();

  useEffect(() => {
    // Auto-reconnect wallet from storage on mount
    reconnect();
  }, [reconnect]);

  return null;
}

// Sync Wagmi state with WalletContext
function WalletSync({ children }: { children: ReactNode }) {
  const { address, chainId, isConnected, connector } = useAccount();
  const { addWallet, wallets, setActiveWallet } = useWalletContext();

  useEffect(() => {
    if (isConnected && address) {
      const chain = chainId ? getChainById(chainId) : undefined;
      const walletId = `evm-${address}`;
      const walletExists = wallets.some(w => w.id === walletId);

      if (!walletExists) {
        // Add new wallet with active state
        addWallet({
          id: walletId,
          type: 'evm',
          address,
          chainId,
          chainName: chain?.name,
          label: connector?.name || 'EVM Wallet',
          isActive: true,
          connector: connector?.id,
        });
      } else {
        // Update existing wallet's active state
        const currentWallet = wallets.find(w => w.id === walletId);
        if (currentWallet && !currentWallet.isActive) {
          setActiveWallet(walletId);
        }
      }
    }
  }, [isConnected, address, chainId, connector, addWallet, wallets, setActiveWallet]);

  return <>{children}</>;
}

export function WalletProviders({ children }: WalletProvidersProps) {
  // Prevent hydration mismatch by only rendering on client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <WalletReconnect />
          <WalletSync>
            {children}
          </WalletSync>
        </WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
