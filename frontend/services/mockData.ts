import { Transaction } from '@/types/transaction';

export const MOCK_TRANSACTIONS: Transaction[] = [];

export const MockStorageService = {
  STORAGE_KEY: 'demo_mock_transactions',

  saveTransaction: (tx: Transaction) => {
    if (typeof window === 'undefined') return;

    const current = MockStorageService.getTransactions();
    const updated = [tx, ...current];
    sessionStorage.setItem(MockStorageService.STORAGE_KEY, JSON.stringify(updated));
    // Dispatch event for real-time UI updates
    window.dispatchEvent(new Event('mock-transaction-update'));
  },

  getTransactions: (): Transaction[] => {
    if (typeof window === 'undefined') return [];

    const stored = sessionStorage.getItem(MockStorageService.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(MockStorageService.STORAGE_KEY);
    window.dispatchEvent(new Event('mock-transaction-update'));
  }
};

import { ChainBalance } from '@/types/balance';
import { mockBalances } from '@/lib/mockData';

export const MockBalanceService = {
  STORAGE_KEY: 'demo_mock_balances',

  getBalances: (): ChainBalance[] => {
    if (typeof window === 'undefined') return mockBalances;

    const stored = sessionStorage.getItem(MockBalanceService.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // Initialize if not present
    sessionStorage.setItem(MockBalanceService.STORAGE_KEY, JSON.stringify(mockBalances));
    return mockBalances;
  },

  deductBalance: (amount: number, chainId?: string) => {
    if (typeof window === 'undefined') return;

    const currentBalances = MockBalanceService.getBalances();
    const deductAmount = Number(amount);

    let updatedBalances;

    if (chainId) {
      // Deduct from specific chain (e.g., standard transfer)
      updatedBalances = currentBalances.map(b => {
        if (b.chainId.toLowerCase() === chainId.toLowerCase()) {
          return { ...b, balance: Math.max(0, b.balance - deductAmount) };
        }
        return b;
      });
    } else {
      // Multi-Source Deduction (Bridge Mode)
      // Simplistic algo: Deduct proportionally or just from the first available for demo
      // Let's deduct from the one with most balance to be safe, or split.
      // For demo simplicity: Deduct from Arbitrum then Base then Polygon
      let remaining = deductAmount;
      updatedBalances = currentBalances.map(b => {
        if (remaining <= 0) return b;

        if (b.balance >= remaining) {
          const newBal = b.balance - remaining;
          remaining = 0;
          return { ...b, balance: newBal };
        } else {
          remaining -= b.balance;
          return { ...b, balance: 0 };
        }
      });
    }

    sessionStorage.setItem(MockBalanceService.STORAGE_KEY, JSON.stringify(updatedBalances));
    window.dispatchEvent(new Event('mock-balance-update'));
  },

  reset: () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(MockBalanceService.STORAGE_KEY);
    window.dispatchEvent(new Event('mock-balance-update'));
  }
};
