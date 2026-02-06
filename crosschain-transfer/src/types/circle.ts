/**
 * Circle User-Controlled Wallets Types
 *
 * TypeScript type definitions for Circle wallet operations
 */

import type { Blockchain } from '@circle-fin/user-controlled-wallets';

// ============================================
// USER TYPES
// ============================================

export interface CreateUserRequest {
  userId?: string;
}

export interface CreateUserResponse {
  success: boolean;
  data: {
    userId: string;
    circleUserId: string;
    pinStatus: 'ENABLED' | 'LOCKED' | 'UNSET';
    status: 'ENABLED' | 'DISABLED';
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

export interface GetUserResponse {
  success: boolean;
  data: {
    userId: string;
    pinStatus: 'ENABLED' | 'LOCKED' | 'UNSET';
    status: 'ENABLED' | 'DISABLED';
    createDate: string;
  };
}

// ============================================
// WALLET TYPES
// ============================================

export interface CreateWalletWithPinRequest {
  userToken: string;
  blockchains?: Blockchain[];
  accountType?: 'EOA' | 'SCA';
}

export interface CreateWalletRequest {
  userToken: string;
  blockchains: Blockchain[];
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

export interface WalletInfo {
  id: string;
  state: 'LIVE' | 'FROZEN';
  walletSetId: string;
  custodyType: 'DEVELOPER' | 'ENDUSER';
  userId: string;
  address: string;
  blockchain: string;
  accountType?: 'EOA' | 'SCA';
  updateDate: string;
  createDate: string;
}

export interface ListWalletsResponse {
  success: boolean;
  data: {
    wallets: WalletInfo[];
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

// ============================================
// TRANSACTION TYPES
// ============================================

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

export interface TransactionInfo {
  id: string;
  blockchain: string;
  tokenId: string;
  walletId: string;
  sourceAddress: string;
  destinationAddress: string;
  transactionType: 'OUTBOUND' | 'INBOUND';
  custodyType: 'DEVELOPER' | 'ENDUSER';
  state: 'INITIATED' | 'PENDING_RISK_SCREENING' | 'QUEUED' | 'SENT' | 'CONFIRMED' | 'COMPLETE' | 'FAILED' | 'CANCELLED' | 'DENIED';
  amounts: string[];
  nftTokenIds?: string[];
  txHash?: string;
  blockHash?: string;
  blockHeight?: number;
  networkFee?: string;
  firstConfirmDate?: string;
  operation: 'TRANSFER' | 'CONTRACT_EXECUTION';
  userId?: string;
  abiParameters?: any;
  feeLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  createDate: string;
  updateDate: string;
}

export interface GetTransactionStatusRequest {
  userToken: string;
  transactionId: string;
}

export interface GetTransactionStatusResponse {
  success: boolean;
  data: TransactionInfo;
}

export interface ListTransactionsRequest {
  userToken: string;
  walletIds?: string[];
}

export interface ListTransactionsResponse {
  success: boolean;
  data: {
    transactions: TransactionInfo[];
  };
}

// ============================================
// ERROR TYPES
// ============================================

export interface CircleErrorResponse {
  success: false;
  error: string;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isChallengeResponse(response: any): response is ChallengeResponse {
  return response.success && typeof response.data?.challengeId === 'string';
}

export function isErrorResponse(response: any): response is CircleErrorResponse {
  return response.success === false && typeof response.error === 'string';
}
