'use client';

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import { useCallback, useMemo, useEffect, useState } from 'react';
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
  connectMetaMask: () => Promise<{ success: boolean; error?: string }>;
  connectWalletConnect: () => Promise<{ success: boolean; error?: string }>;
  disconnect: () => void;

  // Chain management
  switchChain: (chainId: number) => Promise<void>;

  // Helpers
  connectors: { id: string; name: string }[];
  toConnectedWallet: () => ConnectedWallet | null;
}

export function useEvmWallet(): UseEvmWalletReturn {
  const { address, chainId, isConnected, connector, status } = useAccount();
  const { connect, connectors, isPending, error: connectError, pendingConnector } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchChain: wagmiSwitchChain } = useSwitchChain();
  const [localError, setLocalError] = useState<string | null>(null);

  // Get native balance
  const { data: balanceData } = useBalance({
    address,
  });

  const chain = chainId ? getChainById(chainId) : undefined;
  const chainName = chain?.name;

  // Clear local error when connection succeeds
  useEffect(() => {
    if (isConnected && address) {
      setLocalError(null);
    }
  }, [isConnected, address]);

  // Clear local error when wagmi error changes
  useEffect(() => {
    if (connectError) {
      setLocalError(connectError.message);
    }
  }, [connectError]);

  const connectMetaMask = useCallback(async () => {
    setLocalError(null);

    try {
      console.log('Attempting MetaMask connection...');
      console.log('Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));

      const metaMaskConnector = connectors.find(
        c => c.id === 'injected' || c.name.toLowerCase().includes('metamask')
      );

      if (!metaMaskConnector) {
        const errorMsg = 'MetaMask connector not found. Please install MetaMask extension.';
        setLocalError(errorMsg);
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log('Found connector:', metaMaskConnector.id, metaMaskConnector.name);
      console.log('Initiating connection...');

      // Initiate connection - this should trigger the MetaMask popup
      await connect({ connector: metaMaskConnector });

      console.log('Connection initiated successfully');

      // The popup should appear now
      // We'll wait for the user to approve/reject
      return { success: true };
    } catch (error) {
      console.error('MetaMask connection failed:', error);

      let errorMsg = 'Failed to connect to MetaMask';

      if (error instanceof Error) {
        // Handle common MetaMask errors
        if (error.message.includes('User rejected')) {
          errorMsg = 'Connection rejected by user';
        } else if (error.message.includes('Already processing')) {
          errorMsg = 'Please wait for the current connection to complete';
        } else if (error.message.includes('Chain not configured')) {
          errorMsg = 'Please add this network to MetaMask';
        } else {
          errorMsg = error.message;
        }
      }

      setLocalError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [connect, connectors]);

  const connectWalletConnect = useCallback(async () => {
    setLocalError(null);

    try {
      console.log('Attempting WalletConnect connection...');

      const wcConnector = connectors.find(c => c.id === 'walletConnect');

      if (!wcConnector) {
        const errorMsg = 'WalletConnect connector not found';
        setLocalError(errorMsg);
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log('Found WalletConnect connector');
      console.log('Initiating connection...');

      await connect({ connector: wcConnector });

      console.log('WalletConnect connection initiated');
      return { success: true };
    } catch (error) {
      console.error('WalletConnect connection failed:', error);

      let errorMsg = 'Failed to connect to WalletConnect';

      if (error instanceof Error) {
        errorMsg = error.message;
      }

      setLocalError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [connect, connectors]);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
    setLocalError(null);
  }, [wagmiDisconnect]);

  const switchChain = useCallback(async (newChainId: number) => {
    await wagmiSwitchChain({ chainId: newChainId });
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
      isActive: true, // This will be adjusted by the context logic
      connector: connector?.id,
    };
  }, [isConnected, address, chainId, chainName, connector]);

  const availableConnectors = useMemo(() => {
    return connectors.map(c => ({ id: c.id, name: c.name }));
  }, [connectors]);

  // Use wagmi error if available, otherwise use local error
  const displayError = connectError?.message || localError;

  return {
    address,
    chainId,
    chainName,
    isConnected,
    isConnecting: isPending,
    error: displayError,
    balance: balanceData?.formatted,
    connectMetaMask,
    connectWalletConnect,
    disconnect,
    switchChain,
    connectors: availableConnectors,
    toConnectedWallet,
  };
}
