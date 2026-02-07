'use client';

import { GatewayTransferForm } from '@/components/transaction/GatewayTransferForm';
import { UnifiedBalanceOverview } from '@/components/transaction/UnifiedBalanceOverview';
import { useAccount } from 'wagmi';
import { WalletBalanceIcon, TransferIcon, CrossChainIcon } from '@/components/ui/icons/TransactionIcons';
import { WalletButton } from '@/components/wallet/WalletButton';

export default function TransactionPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in-up">
        <div className="relative">
          <div className="absolute inset-0 bg-[#F4673B]/20 blur-3xl rounded-full"></div>
          <div className="relative glass-card p-12 border border-white/40 shadow-2xl max-w-2xl mx-auto backdrop-blur-xl">
            <div className="flex justify-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                <WalletBalanceIcon className="w-8 h-8 text-[#F4673B]" />
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center shadow-lg z-10 scale-110">
                <TransferIcon className="w-8 h-8 text-[#0052FF]" />
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6">
                <CrossChainIcon className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Unified Transaction Center
            </h1>
            <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              Experience the power of chain abstraction. Connect your wallet to manage balances and execute seamless cross-chain payments.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* We reuse the WalletButton logic but styled strictly as a large CTA if possible, 
                   or just guide the user. Since WalletButton is a specific component, 
                   we can try to wrap it or just provide a visual cue. 
                   Actually, importing WalletButton here works perfectly. */}
              <div className="transform scale-110">
                <WalletButton />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <div className="glass-card p-6 text-left">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <WalletBalanceIcon className="w-5 h-5 text-[#F4673B]" />
              Unified Balance
            </h3>
            <p className="text-sm text-gray-500">View your aggregated net worth across all supported chains in one dashboard.</p>
          </div>
          <div className="glass-card p-6 text-left">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <TransferIcon className="w-5 h-5 text-[#0052FF]" />
              Instant Pay
            </h3>
            <p className="text-sm text-gray-500">Send USDC to any address on any chain without bridging manually.</p>
          </div>
          <div className="glass-card p-6 text-left">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CrossChainIcon className="w-5 h-5 text-purple-600" />
              Gas Abstracted
            </h3>
            <p className="text-sm text-gray-500">Pay gas fees in USDC automatically with Circle's Gas Station network.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Transaction Center
        </h1>
        <p className="text-gray-500 max-w-2xl">
          Manage your unified balance and execute cross-chain transfers instantly using Circle Gateway.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Balance Overview */}
        <div className="lg:col-span-1 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <UnifiedBalanceOverview />
        </div>

        {/* Right Column: Transfer Form */}
        <div className="lg:col-span-2">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <GatewayTransferForm />
          </div>
        </div>
      </div>
    </div>
  );
}
