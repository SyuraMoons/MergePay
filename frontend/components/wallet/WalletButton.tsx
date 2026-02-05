'use client';

import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { WalletModal } from './WalletModal';

export function WalletButton() {
  const { activeWallet, wallets } = useWalletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F4673B] to-[#FF8F6B] text-white font-medium text-sm hover:shadow-lg hover:shadow-[#F4673B]/25 transition-all duration-200 hover:scale-[1.02]"
      >
        {activeWallet ? (
          <>
            {/* Wallet icon */}
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <span>{truncateAddress(activeWallet.address)}</span>
            {wallets.length > 1 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                +{wallets.length - 1}
              </span>
            )}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Connect Wallet</span>
          </>
        )}
      </button>

      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
