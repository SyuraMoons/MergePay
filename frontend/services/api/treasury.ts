import { apiClient } from './client';

// ============================================
// TREASURY POLICY TYPES (aligned with MergeTreasury.sol)
// ============================================

export interface TreasuryPolicyRequest {
  threshold: number;
  useUSYC: boolean;          // true = USYC yield mode, false = manual vault
  vaultAddress?: string;     // Required when useUSYC = false
  cooldownPeriod?: number;   // Seconds between executions
  sourceWallets?: string[];
}

export interface TreasuryPolicyResponse {
  balanceThreshold: number;
  enabled: boolean;
  useUSYC: boolean;          // true = USYC mode, false = manual vault
  vaultAddress: string;
  lastExecutionTime: number;
  cooldownPeriod: number;
}

export interface ExecutionStatusResponse {
  canExecute: boolean;
  reason?: string;
}

// ============================================
// USYC POSITION TYPES
// ============================================

export interface USYCPosition {
  principal: number;         // Original USDC deposited
  usycShares: number;        // Current USYC share balance
  currentValue: number;      // Current USDC value of shares
  yieldAccrued: number;      // Yield earned in USDC
}

// ============================================
// TREASURY POLICY FUNCTIONS
// ============================================

export async function configureTreasuryPolicy(request: TreasuryPolicyRequest): Promise<void> {
  return apiClient.post('/treasury/policy/configure', request);
}

export async function getTreasuryPolicy(address: string): Promise<TreasuryPolicyResponse> {
  return apiClient.get<TreasuryPolicyResponse>(`/treasury/policy/${address}`);
}

export async function executeTreasuryPolicy(address: string): Promise<void> {
  return apiClient.post('/treasury/policy/execute', { address });
}

export async function canExecuteTreasuryPolicy(address: string): Promise<ExecutionStatusResponse> {
  return apiClient.get<ExecutionStatusResponse>(`/treasury/policy/can-execute/${address}`);
}

// ============================================
// USYC POSITION FUNCTIONS
// ============================================

export async function getUserUSYCPosition(address: string): Promise<USYCPosition> {
  return apiClient.get<USYCPosition>(`/treasury/usyc/position/${address}`);
}

export async function claimUSYCYield(address: string): Promise<void> {
  return apiClient.post('/treasury/usyc/claim', { address });
}

export async function withdrawFromUSYC(address: string, amount: number): Promise<void> {
  return apiClient.post('/treasury/usyc/withdraw', { address, amount });
}
