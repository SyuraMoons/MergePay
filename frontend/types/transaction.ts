export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'bridge';
  from: string;
  to: string;
  amount: string;
  token: string;
  chain: string;
  chainId: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  hash?: string;
}
