'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { WalletButton } from '@/components/wallet/WalletButton';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header with Wallet Button */}
        <header className="h-16 px-8 flex items-center justify-end border-b border-gray-100 bg-white/50 backdrop-blur-sm">
          <WalletButton />
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

