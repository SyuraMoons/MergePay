'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWalletContext } from '@/contexts/WalletContext';
import { useDisconnect } from 'wagmi';
import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/transaction', label: 'Transaction', icon: PayIcon },
  { href: '/policies', label: 'Policies', icon: PolicyIcon },
  { href: '/dashboard/history', label: 'History', icon: HistoryIcon },
  { href: '/dashboard/wallets', label: 'Wallets', icon: WalletIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeWallet, disconnectAll } = useWalletContext();
  const { disconnect } = useDisconnect();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDisconnect = () => {
    // Show confirmation dialog
    setShowConfirm(true);
  };

  const confirmDisconnect = () => {
    // Disconnect wagmi wallet
    disconnect();

    // Clear all wallets from context
    disconnectAll();

    setShowConfirm(false);
  };

  return (
    <aside className="w-20 h-full py-8 flex flex-col items-center bg-gradient-to-b from-[#FDF5F0] via-[#F8F4F1] to-[#EDE8E4]">
      {/* Logo */}
      <Link href="/dashboard" className="mb-10 hover:scale-105 transition-transform">
        <Logo className="w-12 h-12 shadow-lg rounded-2xl" />
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 ${isActive
                ? 'bg-[#F4673B]/10'
                : 'hover:bg-white/60'
                }`}
              title={item.label}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-[#F4673B]' : 'text-gray-400 hover:text-gray-600'
                  }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Bottom section - Disconnect button */}
      {activeWallet && (
        <button
          className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-red-100 transition-colors group"
          onClick={handleDisconnect}
          title="Disconnect all wallets"
        >
          <LogoutIcon className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
        </button>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Disconnect Wallets?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to disconnect all wallets? You'll need to reconnect them to use the app.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisconnect}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// Icon components
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

function PayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function PolicyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function VaultIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M7 5V3" />
      <path d="M17 5V3" />
      <path d="M7 19v2" />
      <path d="M17 19v2" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
