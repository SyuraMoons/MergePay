'use client';

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import { useCallback, useMemo } from 'react';
import type { ConnectedWallet } from '@/types/wallet';
import { getChainById } from '@/lib/wagmi.config';

interface UseEvmWalletReturn {
  // State
  address: string | undefined;
  chainId: number | undefined;
  chainName: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  balance: string | undefined;

  // Connection
  connectMetaMask: () => Promise<void>;
  connectWalletConnect: () => Promise<void>;
  disconnect: () => void;

  // Chain management
  switchChain: (chainId: number) => Promise<void>;

  // Helpers
  connectors: { id: string; name: string }[];
  toConnectedWallet: () => ConnectedWallet | null;
}

export function useEvmWallet(): UseEvmWalletReturn {
  const { address, chainId, isConnected, connector } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchChain: wagmiSwitchChain } = useSwitchChain();

  // Get native balance
  const { data: balanceData } = useBalance({
    address,
  });

  const chain = chainId ? getChainById(chainId) : undefined;
  const chainName = chain?.name;

  const connectMetaMask = useCallback(async () => {
    const metaMaskConnector = connectors.find(
      c => c.id === 'injected' || c.name.toLowerCase().includes('metamask')
    );
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    }
  }, [connect, connectors]);

  const connectWalletConnect = useCallback(async () => {
    const wcConnector = connectors.find(c => c.id === 'walletConnect');
    if (wcConnector) {
      connect({ connector: wcConnector });
    }
  }, [connect, connectors]);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
  }, [wagmiDisconnect]);

  const switchChain = useCallback(async (newChainId: number) => {
    wagmiSwitchChain({ chainId: newChainId });
  }, [wagmiSwitchChain]);

  const toConnectedWallet = useCallback((): ConnectedWallet | null => {
    if (!isConnected || !address) return null;

    return {
      id: `evm-${address}`,
      type: 'evm',
      address,
      chainId,
      chainName,
      label: connector?.name || 'EVM Wallet',
      isActive: false,
      connector: connector?.id,
    };
  }, [isConnected, address, chainId, chainName, connector]);

  const availableConnectors = useMemo(() => {
    return connectors.map(c => ({ id: c.id, name: c.name }));
  }, [connectors]);

  return {
    address,
    chainId,
    chainName,
    isConnected,
    isConnecting: isPending,
    error: connectError?.message || null,
    balance: balanceData?.formatted,
    connectMetaMask,
    connectWalletConnect,
    disconnect,
    switchChain,
    connectors: availableConnectors,
    toConnectedWallet,
  };
}
