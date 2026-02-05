import { apiClient } from './client';

export interface CreateUserTokenRequest {
  userId?: string;
}

export interface CreateUserTokenResponse {
  success: boolean;
  userId: string;
  userToken: string;
  encryptionKey: string;
}

export interface InitializeWalletRequest {
  userId: string;
  userToken: string;
  blockchains?: string[];
}

export interface InitializeWalletResponse {
  success: boolean;
  challengeId: string;
}

export interface WalletTransferRequest {
  userId: string;
  userToken: string;
  amount: string;
  destinationAddress: string;
  tokenId?: string;
}

export async function createUserToken(
  request?: CreateUserTokenRequest
): Promise<CreateUserTokenResponse> {
  return apiClient.post('/circle/users/token', request || {});
}

export async function initializeWallet(
  request: InitializeWalletRequest
): Promise<InitializeWalletResponse> {
  return apiClient.post('/circle/wallets/initialize', request);
}

export async function executeWalletTransfer(request: WalletTransferRequest) {
  return apiClient.post('/circle/wallets/transfer', request);
}

export async function getUserWallets(userId: string) {
  return apiClient.get(`/circle/wallets/${userId}`);
}
