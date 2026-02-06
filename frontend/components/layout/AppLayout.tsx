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
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-screen z-30">
        <Sidebar />
      </div>

      {/* Main content area with left margin for sidebar */}
      <div className="flex-1 flex flex-col ml-20">
        {/* Fixed Header with Wallet Button */}
        <header className="fixed top-0 right-0 left-20 h-16 px-8 flex items-center justify-end border-b border-gray-100/50 backdrop-blur-sm z-20 bg-gradient-to-r from-[#FDF5F0]/80 via-[#F8F4F1]/80 to-[#EDE8E4]/80">
          <WalletButton />
        </header>

        {/* Main Content with top padding for fixed header */}
        <main className="flex-1 p-8 overflow-auto mt-16">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

