import { apiClient } from './client';

export async function getWalletStatus(privateKey: string) {
  const params = new URLSearchParams({ privateKey });
  return apiClient.get(`/wallet/status?${params}`);
}

export async function getWalletBalances(address: string) {
  return apiClient.get(`/wallet/balances/${address}`);
}
