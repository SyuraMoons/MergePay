import { apiClient } from './client';

export interface TreasuryPolicyRequest {
  threshold: number;
  autoMode: boolean;
  vaultAddress?: string;
  allowUSDCPool?: boolean;
  allowUSDTPool?: boolean;
  cooldownPeriod?: number;
  sourceWallets?: string[];
  privateKey: string;
}

interface TreasuryPolicyResponse {
  balanceThreshold: number;
  enabled: boolean;
  autoMode: boolean;
  vaultAddress: string;
  allowUSDCPool: boolean;
  allowUSDTPool: boolean;
  lastExecutionTime: number;
  cooldownPeriod: number;
}

interface ExecutionStatusResponse {
  canExecute: boolean;
  reason?: string;
}

export async function configureTreasuryPolicy(request: TreasuryPolicyRequest): Promise<void> {
  return apiClient.post('/treasury/policy/configure', request);
}

export async function getTreasuryPolicy(address: string): Promise<TreasuryPolicyResponse> {
  return apiClient.get<TreasuryPolicyResponse>(`/treasury/policy/${address}`);
}

export async function executeTreasuryPolicy(address: string, privateKey: string): Promise<void> {
  return apiClient.post('/treasury/policy/execute', { address, privateKey });
}

export async function canExecuteTreasuryPolicy(address: string): Promise<ExecutionStatusResponse> {
  return apiClient.get<ExecutionStatusResponse>(`/treasury/policy/can-execute/${address}`);
}

export async function getPoolsInfo(): Promise<any> {
  return apiClient.get('/treasury/pools');
}
