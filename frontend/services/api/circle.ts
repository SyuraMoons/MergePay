import { apiClient } from './client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CreateUserRequest {
  userId?: string;
}

export interface CreateUserResponse {
  success: boolean;
  data: {
    userId: string;
    circleUserId: string;
    pinStatus: 'UNSET' | 'ENABLED';
    status: string;
  };
}

export interface CreateUserTokenRequest {
  userId: string;
}

export interface CreateUserTokenResponse {
  success: boolean;
  data: {
    userId: string;
    userToken: string;
    encryptionKey: string;
  };
}

export interface CreateWalletWithPinRequest {
  userToken: string;
  blockchains?: string[];
  accountType?: 'EOA' | 'SCA';
}

export interface ChallengeResponse {
  success: boolean;
  data: {
    challengeId: string;
    success: boolean;
  };
  message?: string;
}

export interface ListWalletsRequest {
  userToken: string;
}

export interface CircleWallet {
  id: string;
  state: string;
  walletSetId: string;
  custodyType: string;
  userId: string;
  address: string;
  blockchain: string;
  accountType: string;
  updateDate: string;
  createDate: string;
}

export interface ListWalletsResponse {
  success: boolean;
  data: {
    wallets: CircleWallet[];
  };
}

export interface GetWalletBalanceRequest {
  userToken: string;
  walletId: string;
}

export interface TokenBalance {
  token: {
    id: string;
    blockchain: string;
    name: string;
    symbol: string;
    decimals: number;
    isNative: boolean;
    tokenAddress?: string;
  };
  amount: string;
  updateDate: string;
}

export interface GetWalletBalanceResponse {
  success: boolean;
  data: {
    balances: TokenBalance[];
  };
}

export interface CreateTransactionRequest {
  userToken: string;
  walletId: string;
  destinationAddress: string;
  amount: string;
  tokenId?: string;
  blockchain?: string;
  tokenAddress?: string;
  feeLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Create a new Circle user
 */
export async function createCircleUser(request: CreateUserRequest = {}): Promise<CreateUserResponse> {
  return apiClient.post('/circle/users', request);
}

/**
 * Get Circle user details
 */
export async function getCircleUser(userId: string) {
  return apiClient.get(`/circle/users/${userId}`);
}

/**
 * Create user token (60 min expiry)
 */
export async function createCircleUserToken(request: CreateUserTokenRequest): Promise<CreateUserTokenResponse> {
  return apiClient.post('/circle/users/token', request);
}

// ============================================
// WALLET CREATION
// ============================================

/**
 * Create wallets with PIN setup (single step)
 * Returns challengeId for frontend to execute
 */
export async function createWalletWithPin(request: CreateWalletWithPinRequest): Promise<ChallengeResponse> {
  return apiClient.post('/circle/wallets/create-with-pin', request);
}

/**
 * Create additional wallet (after PIN is set)
 */
export async function createWallet(request: CreateWalletWithPinRequest): Promise<ChallengeResponse> {
  return apiClient.post('/circle/wallets/create', request);
}

// ============================================
// WALLET QUERIES
// ============================================

/**
 * Get all wallets for a user (by userToken)
 */
export async function listCircleWallets(request: ListWalletsRequest): Promise<ListWalletsResponse> {
  return apiClient.post('/circle/wallets/list', request);
}

/**
 * Get user's wallets (by userId)
 */
export async function getUserCircleWallets(userId: string): Promise<ListWalletsResponse> {
  return apiClient.get(`/circle/wallets/${userId}`);
}

/**
 * Get wallet token balance
 */
export async function getCircleWalletBalance(request: GetWalletBalanceRequest): Promise<GetWalletBalanceResponse> {
  return apiClient.post('/circle/wallets/balance', request);
}

// ============================================
// TRANSACTIONS
// ============================================

/**
 * Create a transaction (returns challengeId)
 */
export async function createCircleTransaction(request: CreateTransactionRequest): Promise<ChallengeResponse> {
  return apiClient.post('/circle/transactions/create', request);
}

/**
 * Get transaction status
 */
export async function getCircleTransactionStatus(userToken: string, transactionId: string) {
  return apiClient.post('/circle/transactions/status', { userToken, transactionId });
}

/**
 * List transactions
 */
export async function listCircleTransactions(userToken: string, walletIds?: string[]) {
  return apiClient.post('/circle/transactions/list', { userToken, walletIds });
}
