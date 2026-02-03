'use client';

import { useState, useEffect, useRef } from 'react';
import { BalanceState } from '@/types/balance';
import { WebSocketService } from '@/lib/websocket';
import { mockBalances, calculateTotalBalance } from '@/lib/mockData';

export function useBalanceWebSocket(url?: string, mockMode = true) {
  const [balances, setBalances] = useState<BalanceState>({
    totalBalance: 0,
    chains: [],
    lastUpdated: new Date(),
    isLoading: true,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    try {
      wsRef.current = new WebSocketService(url, mockMode);
      setIsConnected(true);

      const unsubscribe = wsRef.current.subscribe((data) => {
        setBalances(data);
        setError(null);
      });

      return () => {
        unsubscribe();
        wsRef.current?.disconnect();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnected(false);
    }
  }, [url, mockMode]);

  return { balances, isConnected, error };
}
