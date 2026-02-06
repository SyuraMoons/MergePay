'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk';
import {
  createCircleUser,
  createCircleUserToken,
  createWalletWithPin,
  listCircleWallets,
  getCircleWalletBalance,
  createCircleTransaction,
  type CircleWallet,
  type TokenBalance,
} from '@/services/api/circle';

// ============================================
// TYPES
// ============================================

interface CircleUserAuth {
  userId: string;
  userToken: string;
  encryptionKey: string;
}

interface UseCircleUserWalletReturn {
  // State
  auth: CircleUserAuth | null;
  wallets: CircleWallet[];
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // User Management
  registerUser: (userId?: string) => Promise<void>;
  loginUser: (userId: string) => Promise<void>;
  logout: () => void;

  // Wallet Management
  createWallets: (blockchains?: string[]) => Promise<void>;
  refreshWallets: () => Promise<void>;
  getWalletBalance: (walletId: string) => Promise<TokenBalance[]>;

  // Transactions
  sendTransaction: (params: {
    walletId: string;
    destinationAddress: string;
    amount: string;
    tokenId?: string;
    blockchain?: string;
    tokenAddress?: string;
    feeLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  }) => Promise<void>;

  // SDK Instance
  sdk: W3SSdk | null;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for Circle User-Controlled Wallets
 * Uses challenge-based authentication (no private keys)
 */
export function useCircleUserWallet(): UseCircleUserWalletReturn {
  const [auth, setAuth] = useState<CircleUserAuth | null>(null);
  const [wallets, setWallets] = useState<CircleWallet[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sdkRef = useRef<W3SSdk | null>(null);

  // Initialize W3S SDK
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;

    if (!appId) {
      console.warn('Circle App ID not configured. Please set NEXT_PUBLIC_CIRCLE_APP_ID in .env');
      setError('Circle App ID not configured');
      return;
    }

    try {
      sdkRef.current = new W3SSdk();
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize W3S SDK:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize SDK');
    }
  }, []);

  // Set authentication when auth changes
  useEffect(() => {
    if (sdkRef.current && auth) {
      sdkRef.current.setAppSettings({
        appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID!,
      });

      sdkRef.current.setAuthentication({
        userToken: auth.userToken,
        encryptionKey: auth.encryptionKey,
      });
    }
  }, [auth]);

  /**
   * Execute challenge using W3S SDK
   */
  const executeChallenge = useCallback((challengeId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!sdkRef.current) {
        reject(new Error('SDK not initialized'));
        return;
      }

      sdkRef.current.execute(challengeId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }, []);

  /**
   * Register new user in Circle
   */
  const registerUser = useCallback(async (userId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Create user
      const userResponse = await createCircleUser({ userId });
      const createdUserId = userResponse.data.userId;

      // 2. Generate user token
      const tokenResponse = await createCircleUserToken({ userId: createdUserId });

      // 3. Save auth credentials
      setAuth({
        userId: createdUserId,
        userToken: tokenResponse.data.userToken,
        encryptionKey: tokenResponse.data.encryptionKey,
      });

      // Store in localStorage for persistence
      localStorage.setItem('circle_user_id', createdUserId);

    } catch (err) {
      console.error('User registration failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to register user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login existing user
   */
  const loginUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate fresh user token
      const tokenResponse = await createCircleUserToken({ userId });

      setAuth({
        userId,
        userToken: tokenResponse.data.userToken,
        encryptionKey: tokenResponse.data.encryptionKey,
      });

      // Store in localStorage
      localStorage.setItem('circle_user_id', userId);

      // Load user's wallets
      await refreshWallets();

    } catch (err) {
      console.error('User login failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    setAuth(null);
    setWallets([]);
    setError(null);
    localStorage.removeItem('circle_user_id');
  }, []);

  /**
   * Create wallets with PIN setup
   */
  const createWallets = useCallback(async (blockchains?: string[]) => {
    if (!auth) {
      throw new Error('Not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request challenge from backend
      const response = await createWalletWithPin({
        userToken: auth.userToken,
        blockchains: blockchains || ['ETH-SEPOLIA', 'ARB-SEPOLIA', 'BASE-SEPOLIA'],
        accountType: 'EOA',
      });

      // Execute challenge (user sets PIN and wallets are created)
      await executeChallenge(response.data.challengeId);

      // Refresh wallets list
      await refreshWallets();

    } catch (err) {
      console.error('Wallet creation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create wallets');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, executeChallenge]);

  /**
   * Refresh wallets list
   */
  const refreshWallets = useCallback(async () => {
    if (!auth) {
      return;
    }

    try {
      const response = await listCircleWallets({ userToken: auth.userToken });
      setWallets(response.data.wallets);
    } catch (err) {
      console.error('Failed to refresh wallets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wallets');
    }
  }, [auth]);

  /**
   * Get wallet balance
   */
  const getWalletBalance = useCallback(async (walletId: string): Promise<TokenBalance[]> => {
    if (!auth) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await getCircleWalletBalance({
        userToken: auth.userToken,
        walletId,
      });
      return response.data.balances;
    } catch (err) {
      console.error('Failed to get balance:', err);
      throw err;
    }
  }, [auth]);

  /**
   * Send transaction
   */
  const sendTransaction = useCallback(async (params: {
    walletId: string;
    destinationAddress: string;
    amount: string;
    tokenId?: string;
    blockchain?: string;
    tokenAddress?: string;
    feeLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  }) => {
    if (!auth) {
      throw new Error('Not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request transaction challenge from backend
      const response = await createCircleTransaction({
        userToken: auth.userToken,
        ...params,
      });

      // Execute challenge (user signs with PIN)
      const result = await executeChallenge(response.data.challengeId);

      return result;

    } catch (err) {
      console.error('Transaction failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to send transaction');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, executeChallenge]);

  // Auto-login if userId exists in localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('circle_user_id');
    if (storedUserId && !auth && isInitialized) {
      loginUser(storedUserId).catch(err => {
        console.error('Auto-login failed:', err);
        localStorage.removeItem('circle_user_id');
      });
    }
  }, [isInitialized, auth, loginUser]);

  return {
    auth,
    wallets,
    isInitialized,
    isLoading,
    error,
    registerUser,
    loginUser,
    logout,
    createWallets,
    refreshWallets,
    getWalletBalance,
    sendTransaction,
    sdk: sdkRef.current,
  };
}
