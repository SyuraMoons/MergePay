'use client';

import { useState, useCallback } from 'react';
import {
  toPasskeyTransport,
  toWebAuthnCredential,
  toModularTransport,
  toCircleSmartAccount,
  WebAuthnMode,
} from '@circle-fin/modular-wallets-core';
import { createPublicClient } from 'viem';
import { createBundlerClient, toWebAuthnAccount } from 'viem/account-abstraction';
import { baseSepolia, arbitrumSepolia, optimismSepolia, polygonAmoy } from 'viem/chains';
import type { CircleWalletCredential, CircleSmartAccountInfo } from '@/types/wallet';

// Circle client configuration from environment
const CIRCLE_CLIENT_KEY = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY || '';
const CIRCLE_CLIENT_URL = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_URL || '';

// Supported testnet chains for Circle Modular Wallets
const CIRCLE_CHAINS = {
  baseSepolia: { chain: baseSepolia, path: '/baseSepolia' },
  arbitrumSepolia: { chain: arbitrumSepolia, path: '/arbitrumSepolia' },
  optimismSepolia: { chain: optimismSepolia, path: '/optimismSepolia' },
  polygonAmoy: { chain: polygonAmoy, path: '/polygonAmoy' },
} as const;

type CircleChainKey = keyof typeof CIRCLE_CHAINS;

interface UseCircleWalletReturn {
  // State
  credential: CircleWalletCredential | null;
  smartAccount: CircleSmartAccountInfo | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (username: string) => Promise<void>;
  login: (username: string) => Promise<void>;
  disconnect: () => void;
  switchChain: (chainKey: CircleChainKey) => Promise<void>;

  // Helpers
  isConfigured: boolean;
}

export function useCircleWallet(): UseCircleWalletReturn {
  const [credential, setCredential] = useState<CircleWalletCredential | null>(null);
  const [smartAccount, setSmartAccount] = useState<CircleSmartAccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChain, setCurrentChain] = useState<CircleChainKey>('baseSepolia');

  const isConfigured = Boolean(CIRCLE_CLIENT_KEY && CIRCLE_CLIENT_URL);

  const createSmartAccountForChain = useCallback(async (
    webAuthnCredential: Awaited<ReturnType<typeof toWebAuthnCredential>>,
    chainKey: CircleChainKey
  ) => {
    const chainConfig = CIRCLE_CHAINS[chainKey];

    // Create modular transport for the chain
    const modularTransport = toModularTransport(
      CIRCLE_CLIENT_URL + chainConfig.path,
      CIRCLE_CLIENT_KEY
    );

    // Create public client
    const client = createPublicClient({
      chain: chainConfig.chain,
      transport: modularTransport,
    });

    // Create Circle smart account
    const account = await toCircleSmartAccount({
      client,
      owner: toWebAuthnAccount({ credential: webAuthnCredential }),
    });

    // Create bundler client for gasless transactions
    const bundlerClient = createBundlerClient({
      account,
      chain: chainConfig.chain,
      transport: modularTransport,
    });

    return {
      address: account.address,
      chainId: chainConfig.chain.id,
      chainName: chainConfig.chain.name,
      bundlerClient,
    };
  }, []);

  const register = useCallback(async (username: string) => {
    if (!isConfigured) {
      setError('Circle credentials not configured. Please add NEXT_PUBLIC_CIRCLE_CLIENT_KEY and NEXT_PUBLIC_CIRCLE_CLIENT_URL to .env');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create passkey transport
      const passkeyTransport = toPasskeyTransport(CIRCLE_CLIENT_URL, CIRCLE_CLIENT_KEY);

      // Register new passkey
      const webAuthnCredential = await toWebAuthnCredential({
        transport: passkeyTransport,
        mode: WebAuthnMode.Register,
        username,
      });

      // Store credential info
      setCredential({
        id: webAuthnCredential.id,
        publicKey: webAuthnCredential.publicKey,
        username,
      });

      // Create smart account on default chain
      const accountInfo = await createSmartAccountForChain(webAuthnCredential, currentChain);
      setSmartAccount({
        address: accountInfo.address,
        chainId: accountInfo.chainId,
        chainName: accountInfo.chainName,
      });

    } catch (err) {
      console.error('Circle wallet registration failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to register passkey');
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, currentChain, createSmartAccountForChain]);

  const login = useCallback(async (username: string) => {
    if (!isConfigured) {
      setError('Circle credentials not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create passkey transport
      const passkeyTransport = toPasskeyTransport(CIRCLE_CLIENT_URL, CIRCLE_CLIENT_KEY);

      // Login with existing passkey
      const webAuthnCredential = await toWebAuthnCredential({
        transport: passkeyTransport,
        mode: WebAuthnMode.Login,
        username,
      });

      // Store credential info
      setCredential({
        id: webAuthnCredential.id,
        publicKey: webAuthnCredential.publicKey,
        username,
      });

      // Create smart account on default chain
      const accountInfo = await createSmartAccountForChain(webAuthnCredential, currentChain);
      setSmartAccount({
        address: accountInfo.address,
        chainId: accountInfo.chainId,
        chainName: accountInfo.chainName,
      });

    } catch (err) {
      console.error('Circle wallet login failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to login with passkey');
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, currentChain, createSmartAccountForChain]);

  const disconnect = useCallback(() => {
    setCredential(null);
    setSmartAccount(null);
    setError(null);
  }, []);

  const switchChain = useCallback(async (chainKey: CircleChainKey) => {
    if (!credential) {
      setError('No credential available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Re-create credential from stored info (need to re-authenticate)
      const passkeyTransport = toPasskeyTransport(CIRCLE_CLIENT_URL, CIRCLE_CLIENT_KEY);
      const webAuthnCredential = await toWebAuthnCredential({
        transport: passkeyTransport,
        mode: WebAuthnMode.Login,
        username: credential.username,
      });

      const accountInfo = await createSmartAccountForChain(webAuthnCredential, chainKey);
      setSmartAccount({
        address: accountInfo.address,
        chainId: accountInfo.chainId,
        chainName: accountInfo.chainName,
      });
      setCurrentChain(chainKey);

    } catch (err) {
      console.error('Chain switch failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch chain');
    } finally {
      setIsLoading(false);
    }
  }, [credential, createSmartAccountForChain]);

  return {
    credential,
    smartAccount,
    isLoading,
    error,
    register,
    login,
    disconnect,
    switchChain,
    isConfigured,
  };
}
