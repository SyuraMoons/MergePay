'use client';

import { useState } from 'react';
import type { WalletRegistrationStatus } from '@/hooks/useWalletRegistration';

interface WalletRegistrationCardProps {
  status: WalletRegistrationStatus;
  onRegister: () => Promise<void>;
}

export function WalletRegistrationCard({ status, onRegister }: WalletRegistrationCardProps) {
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      await onRegister();
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  const { wallet, isRegistered, error } = status;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {wallet.blockchain}
            </h3>
            {isRegistered && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Registered
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1 font-mono">
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </p>

          <div className="mt-2 text-xs text-gray-500">
            <div>Account: {wallet.accountType}</div>
            <div>State: {wallet.state}</div>
          </div>

          {error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="ml-4">
          {!isRegistered && (
            <button
              onClick={handleRegister}
              disabled={isRegistering}
              className={`
                px-4 py-2 rounded-md text-sm font-medium
                ${isRegistering
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {isRegistering ? 'Registering...' : 'Register'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
