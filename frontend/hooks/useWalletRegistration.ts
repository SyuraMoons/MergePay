'use client';

import { useState, useCallback, useEffect } from 'react';
import { type Address } from 'viem';
import {
  registerWallet,
  getUserWallets,
  getAggregatedBalance,
  getUserIdBalance,
  isWalletRegistered,
  formatUSDC,
} from '@/services/contracts/mergeTreasury';
import { useCircleUserWallet } from './useCircleUserWallet';
import type { CircleWallet } from '@/services/api/circle';

// ============================================
// TYPES
// ============================================

export interface WalletRegistrationStatus {
  wallet: CircleWallet;
  isRegistered: boolean;
  isRegistering: boolean;
  error: string | null;
}

export interface AggregatedBalanceData {
  totalBalance: bigint;
  totalBalanceFormatted: string;
  treasuryBalance: bigint;
  treasuryBalanceFormatted: string;
  registeredWallets: Address[];
}

interface UseWalletRegistrationReturn {
  // State
  walletStatuses: WalletRegistrationStatus[];
  aggregatedBalance: AggregatedBalanceData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  registerCircleWallet: (wallet: CircleWallet) => Promise<void>;
  registerAllWallets: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  checkRegistrationStatus: () => Promise<void>;

  // Computed
  unregisteredWallets: CircleWallet[];
  registeredCount: number;
  totalWalletsCount: number;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for managing Circle wallet registration to MergeTreasury
 * Combines Circle User-Controlled Wallets with on-chain registration
 */
export function useWalletRegistration(): UseWalletRegistrationReturn {
  const { auth, wallets: circleWallets, isLoading: circleLoading } = useCircleUserWallet();

  const [walletStatuses, setWalletStatuses] = useState<WalletRegistrationStatus[]>([]);
  const [aggregatedBalance, setAggregatedBalance] = useState<AggregatedBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check registration status for all Circle wallets
   */
  const checkRegistrationStatus = useCallback(async () => {
    if (!circleWallets || circleWallets.length === 0) {
      setWalletStatuses([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const statuses = await Promise.all(
        circleWallets.map(async (wallet) => {
          try {
            const { isRegistered } = await isWalletRegistered(wallet.address as Address);

            return {
              wallet,
              isRegistered,
              isRegistering: false,
              error: null,
            };
          } catch (err) {
            console.error(`Failed to check registration for ${wallet.address}:`, err);
            return {
              wallet,
              isRegistered: false,
              isRegistering: false,
              error: err instanceof Error ? err.message : 'Failed to check registration',
            };
          }
        })
      );

      setWalletStatuses(statuses);
    } catch (err) {
      console.error('Failed to check wallet registration status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check registration status');
    } finally {
      setIsLoading(false);
    }
  }, [circleWallets]);

  /**
   * Register a single Circle wallet to MergeTreasury
   */
  const registerCircleWallet = useCallback(async (wallet: CircleWallet) => {
    if (!auth) {
      throw new Error('Not authenticated');
    }

    // Mark wallet as registering
    setWalletStatuses(prev =>
      prev.map(status =>
        status.wallet.id === wallet.id
          ? { ...status, isRegistering: true, error: null }
          : status
      )
    );

    try {
      const walletAddress = wallet.address as Address;

      // Check if already registered
      const { isRegistered: alreadyRegistered } = await isWalletRegistered(walletAddress);
      if (alreadyRegistered) {
        throw new Error('Wallet already registered');
      }

      // Register wallet on-chain
      // Note: This requires the wallet to sign the transaction
      // For Circle wallets, we need to use Circle SDK to sign
      const txHash = await registerWallet(
        auth.userId,
        walletAddress,
        walletAddress // Signer must be the wallet owner
      );

      console.log('Wallet registered! Transaction:', txHash);

      // Update status
      setWalletStatuses(prev =>
        prev.map(status =>
          status.wallet.id === wallet.id
            ? { ...status, isRegistered: true, isRegistering: false }
            : status
        )
      );

      // Refresh balances after registration
      await refreshBalances();

    } catch (err) {
      console.error('Wallet registration failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';

      setWalletStatuses(prev =>
        prev.map(status =>
          status.wallet.id === wallet.id
            ? { ...status, isRegistering: false, error: errorMessage }
            : status
        )
      );

      throw err;
    }
  }, [auth]);

  /**
   * Register all unregistered Circle wallets
   */
  const registerAllWallets = useCallback(async () => {
    const unregistered = walletStatuses.filter(status => !status.isRegistered);

    if (unregistered.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const results = await Promise.allSettled(
      unregistered.map(status => registerCircleWallet(status.wallet))
    );

    // Check for failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      const failureReasons = failures
        .map(f => (f as PromiseRejectedResult).reason?.message || 'Unknown error')
        .join(', ');
      setError(`Some registrations failed: ${failureReasons}`);
    }

    setIsLoading(false);
  }, [walletStatuses, registerCircleWallet]);

  /**
   * Refresh aggregated balance data
   */
  const refreshBalances = useCallback(async () => {
    if (!auth) {
      setAggregatedBalance(null);
      return;
    }

    try {
      const [totalBalance, treasuryBalance, registeredWalletAddresses] = await Promise.all([
        getAggregatedBalance(auth.userId),
        getUserIdBalance(auth.userId),
        getUserWallets(auth.userId),
      ]);

      setAggregatedBalance({
        totalBalance,
        totalBalanceFormatted: formatUSDC(totalBalance),
        treasuryBalance,
        treasuryBalanceFormatted: formatUSDC(treasuryBalance),
        registeredWallets: registeredWalletAddresses,
      });
    } catch (err) {
      console.error('Failed to refresh balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh balances');
    }
  }, [auth]);

  // Auto-check registration status when Circle wallets change
  useEffect(() => {
    if (circleWallets.length > 0) {
      checkRegistrationStatus();
    }
  }, [circleWallets, checkRegistrationStatus]);

  // Auto-refresh balances when auth or wallet statuses change
  useEffect(() => {
    if (auth && walletStatuses.some(s => s.isRegistered)) {
      refreshBalances();
    }
  }, [auth, walletStatuses, refreshBalances]);

  // Computed values
  const unregisteredWallets = walletStatuses
    .filter(status => !status.isRegistered)
    .map(status => status.wallet);

  const registeredCount = walletStatuses.filter(s => s.isRegistered).length;
  const totalWalletsCount = circleWallets.length;

  return {
    walletStatuses,
    aggregatedBalance,
    isLoading: isLoading || circleLoading,
    error,
    registerCircleWallet,
    registerAllWallets,
    refreshBalances,
    checkRegistrationStatus,
    unregisteredWallets,
    registeredCount,
    totalWalletsCount,
  };
}
