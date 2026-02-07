import type { Address } from 'viem';

export const MERGE_TREASURY_ADDRESS: Address = '0x601cdf656dcde14d92174dfa283c8c51b1ad2b3d' as const;

export const MERGE_TREASURY_ABI = [
  {
    name: 'configureTreasuryPolicy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'balanceThreshold', type: 'uint256' },
      { name: 'useUSYC', type: 'bool' },
      { name: 'vaultAddress', type: 'address' },
      { name: 'cooldownPeriod', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'executeTreasuryPolicy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'executed', type: 'bool' }],
  },
  {
    name: 'getUserPolicy',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'balanceThreshold', type: 'uint256' },
          { name: 'enabled', type: 'bool' },
          { name: 'useUSYC', type: 'bool' },
          { name: 'vaultAddress', type: 'address' },
          { name: 'lastExecutionTime', type: 'uint256' },
          { name: 'cooldownPeriod', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'canExecutePolicy',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'canExecute', type: 'bool' },
      { name: 'reason', type: 'string' },
    ],
  },
  {
    name: 'availablePools',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'poolAddress', type: 'address' },
          { name: 'poolName', type: 'string' },
          { name: 'lastAPY', type: 'uint256' },
          { name: 'lastUpdateTime', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'userBalances',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'disablePolicy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'poolCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
