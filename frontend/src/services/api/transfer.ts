import { apiClient } from './client';

export interface CctpTransferRequest {
  amount: number;
  recipient: string;
  privateKey: string;
}

export interface CctpTransferResponse {
  success: boolean;
  result?: {
    burnTxHash: string;
    mintTxHash: string;
    amount: string;
    status: 'completed' | 'failed';
  };
  explorerUrls?: {
    burnTx?: string;
    mintTx?: string;
  };
  error?: string;
}

export async function executeCctpTransfer(
  request: CctpTransferRequest
): Promise<CctpTransferResponse> {
  return apiClient.post('/transfer/cctp', request);
}

export async function resumeCctpTransfer(
  txHash: string,
  privateKey: string
): Promise<CctpTransferResponse> {
  return apiClient.post('/transfer/cctp/resume', { txHash, privateKey });
}

export async function getCctpStatus(txHash: string) {
  return apiClient.get(`/transfer/cctp/status/${txHash}`);
}
