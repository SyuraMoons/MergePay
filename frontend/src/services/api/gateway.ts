import { apiClient } from './client';

export type GatewayChain = 'sepolia' | 'arc' | 'base' | 'avalanche';

export interface GatewayTransferRequest {
  amount: number;
  destinationChain: GatewayChain;
  recipient: string;
  privateKey: string;
}

export interface GatewayDepositRequest {
  amount: number;
  chain: GatewayChain;
  privateKey: string;
}

export async function depositToGateway(request: GatewayDepositRequest) {
  return apiClient.post('/gateway/deposit', request);
}

export async function transferViaGateway(request: GatewayTransferRequest) {
  return apiClient.post('/gateway/transfer', request);
}

export async function getGatewayBalance(
  privateKey: string,
  chains?: GatewayChain[]
) {
  const params = new URLSearchParams({ privateKey });
  if (chains) params.append('chains', chains.join(','));
  return apiClient.get(`/gateway/balance?${params}`);
}
