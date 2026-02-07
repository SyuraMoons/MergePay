import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api/client';
import {
  GatewayBalanceResponse,
  GatewayChain,
  GatewayTransferParams,
  GatewayTransferResult
} from '@/types/gateway';

interface UseGatewayReturn {
  balance: GatewayBalanceResponse | null;
  loading: boolean;
  error: string | null;
  fetchBalance: (privateKey: string, chains?: GatewayChain[]) => Promise<void>;
  transfer: (params: GatewayTransferParams) => Promise<GatewayTransferResult>;
}

export function useGateway(): UseGatewayReturn {
  const [balance, setBalance] = useState<GatewayBalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (privateKey: string, chains?: GatewayChain[]) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({ privateKey });
      if (chains) queryParams.append('chains', chains.join(','));

      const result = await apiClient.get<GatewayBalanceResponse>(
        `/gateway/balance?${queryParams.toString()}`
      );
      setBalance(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, []);

  const transfer = useCallback(async (params: GatewayTransferParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<GatewayTransferResult>('/gateway/transfer', params);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    balance,
    loading,
    error,
    fetchBalance,
    transfer,
  };
}
