import { apiClient } from './client';

export interface TreasuryPolicyRequest {
  threshold: number;
  autoMode: boolean;
  vaultAddress?: string;
  allowUSDCPool?: boolean;
  allowUSDTPool?: boolean;
  cooldownPeriod?: number;
  privateKey: string;
}

export async function configureTreasuryPolicy(request: TreasuryPolicyRequest) {
  return apiClient.post('/treasury/policy/configure', request);
}

export async function getTreasuryPolicy(address: string) {
  return apiClient.get(`/treasury/policy/${address}`);
}

export async function executeTreasuryPolicy(address: string, privateKey: string) {
  return apiClient.post('/treasury/policy/execute', { address, privateKey });
}

export async function canExecuteTreasuryPolicy(address: string) {
  return apiClient.get(`/treasury/policy/can-execute/${address}`);
}

export async function getPoolsInfo() {
  return apiClient.get('/treasury/pools');
}
