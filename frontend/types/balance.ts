export interface ChainBalance {
  chainId: string;
  chainName: string;
  balance: number;
  symbol: string;
  iconUrl: string;
}

export interface BalanceState {
  totalBalance: number;
  chains: ChainBalance[];
  lastUpdated: Date;
  isLoading: boolean;
}

export interface WebSocketMessage {
  type: 'balance_update' | 'connection' | 'error';
  data?: Partial<BalanceState>;
  error?: string;
}
