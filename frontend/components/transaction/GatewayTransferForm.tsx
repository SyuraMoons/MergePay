'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { GatewayChain } from '@/types/gateway';
import { useWalletContext } from '@/contexts/WalletContext';
import { TransferIcon } from '@/components/ui/icons/TransactionIcons';
import { AddSourceModal } from './AddSourceModal';

const CHAINS: { id: GatewayChain; name: string }[] = [
  { id: 'sepolia', name: 'Ethereum Sepolia' },
  { id: 'arc', name: 'Arc Testnet' },
  { id: 'base', name: 'Base Sepolia' },
  { id: 'avalanche', name: 'Avalanche Fuji' },
  { id: 'optimism', name: 'Optimism Sepolia' },
  { id: 'arbitrum', name: 'Arbitrum Sepolia' },
  { id: 'sepolia', name: 'Ethereum Sepolia' },
  { id: 'arc', name: 'Arc Testnet' },
  { id: 'base', name: 'Base Sepolia' },
  { id: 'avalanche', name: 'Avalanche Fuji' },
  { id: 'optimism', name: 'Optimism Sepolia' },
  { id: 'arbitrum', name: 'Arbitrum Sepolia' },
  { id: 'polygon', name: 'Polygon Amoy' },
];

const CHAIN_CONFIG: Record<string, { name: string; color: string }> = {
  sepolia: { name: 'Ethereum Sepolia', color: 'bg-blue-500' },
  arc: { name: 'Arc Testnet', color: 'bg-purple-500' },
  base: { name: 'Base Sepolia', color: 'bg-blue-600' },
  avalanche: { name: 'Avalanche Fuji', color: 'bg-red-500' },
  optimism: { name: 'Optimism Sepolia', color: 'bg-red-600' },
  arbitrum: { name: 'Arbitrum Sepolia', color: 'bg-indigo-500' },
  polygon: { name: 'Polygon Amoy', color: 'bg-purple-600' },
};

export function GatewayTransferForm() {
  const { address, isConnected } = useAccount();

  // Form State
  const [mode, setMode] = useState<'transfer' | 'bridge'>('transfer');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [destinationChain, setDestinationChain] = useState<GatewayChain>('base');

  // Bridge Mode State
  // Bridge Mode State
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [sourceChains, setSourceChains] = useState<any[]>([]);

  // Fetch balances from backend
  const fetchBalances = async () => {
    if (!address) return;

    try {
      setIsLoadingBalances(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://mergepay-production.up.railway.app/api'}/gateway/balance?address=${address}`);
      const data = await response.json();

      if (data.success && data.result && data.result.balances) {
        const mappedSources = data.result.balances
          .filter((b: any) => BigInt(b.balance) > 0)
          .map((b: any) => {
            const config = CHAIN_CONFIG[b.chain] || { name: b.chain, color: 'bg-gray-500' };
            const balanceUSDC = Number(b.balance) / 1_000_000;
            return {
              id: b.chain,
              name: config.name,
              balance: balanceUSDC,
              amount: '', // Default to empty
              color: config.color
            };
          });

        // If we have sources, pre-fill the first one with a default amount if needed
        if (mappedSources.length > 0 && sourceChains.length === 0) {
          // For first load, maybe don't set amount, just show available
        }

        setSourceChains(mappedSources);
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchBalances();
    }
  }, [address]);

  const handleAddSources = (newSources: any[]) => {
    // Merge new sources, keeping existing amounts if possible
    setSourceChains(prev => {
      const existing = new Map(prev.map(p => [p.name, p]));
      return newSources.map(n => ({
        ...n,
        amount: existing.get(n.name)?.amount || ''
      }));
    });
    setShowSourceModal(false);
  };

  // Auto-fill recipient when switching to bridge mode
  useEffect(() => {
    if (mode === 'bridge' && address) {
      setRecipient(address);
    } else if (mode === 'transfer') {
      setRecipient('');
    }
  }, [mode, address]);

  // Status State
  const [status, setStatus] = useState<'idle' | 'signing' | 'processing' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async () => {
    if (!amount || !recipient || !isConnected) return;

    try {
      setError(null);
      setStatus('signing');

      // Simulate Wallet Signature
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStatus('processing');
      // Simulate CCTP / Backend Processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Success
      setTxHash(`0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`);
      setStatus('success');
      setAmount(''); // Reset form

    } catch (e) {
      console.error(e);
      setError('Transaction rejected or failed');
      setStatus('error');
    }
  };

  const resetState = () => {
    setStatus('idle');
    setTxHash(null);
    setError(null);
  };

  /* Disconnected state is now handled by the parent TransactionPage */

  return (
    <div className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-transparent">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0052FF]/10 flex items-center justify-center text-[#0052FF] font-bold shadow-sm">
            <TransferIcon className="w-5 h-5" />
          </div>
          Circle Gateway Transfer
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Pay anyone on any chain from your unified balance.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Mode Toggle Chips */}
        <div className="flex bg-gray-100/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setMode('transfer')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'transfer'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Transfer
          </button>
          <button
            onClick={() => setMode('bridge')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'bridge'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Bridge (Self)
          </button>
        </div>

        {/* Source Selection (Bridge Mode) */}
        {mode === 'bridge' ? (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">From Sources</span>
              <span className="text-xs text-[#F4673B] font-medium cursor-pointer hover:underline">+ Add Source</span>
            </div>

            {/* Compact Source Chips / Rows */}
            <div className="space-y-2">
              {isLoadingBalances ? (
                <div className="text-center py-4 text-gray-500 text-sm">Loading balances...</div>
              ) : sourceChains.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">No USDC balances found on support chains</div>
              ) : (
                sourceChains.map((source, idx) => (
                  <div key={idx} className={`flex items-center justify-between bg-white p-2 rounded-xl border border-gray-200 shadow-sm ${source.amount ? '' : 'opacity-80'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 ${source.color} rounded-full`}></div>
                      <span className="text-sm font-medium text-gray-700">{source.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Bal: {source.balance.toFixed(2)}</span>
                      <input
                        type="number"
                        className="w-24 text-right bg-gray-50 px-2 py-1 rounded-lg text-sm border-none focus:ring-1 focus:ring-[#F4673B]"
                        placeholder="0.00"
                        value={source.amount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSourceChains(prev => prev.map((p, i) => i === idx ? { ...p, amount: val } : p));
                          // Also update total amount
                          const total = sourceChains.reduce((sum, p, i) => {
                            const amt = i === idx ? val : p.amount;
                            return sum + (Number(amt) || 0);
                          }, 0);
                          setAmount(total > 0 ? total.toString() : '');
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Sender Info (Transfer Mode) */
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Paying From</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-mono text-sm font-medium text-gray-700">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">Connected</span>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount to Send (USDC)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={status !== 'idle' && status !== 'error'}
                className="w-full pl-4 pr-16 py-4 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-2 focus:ring-[#F4673B]/20 outline-none transition-all text-lg font-medium"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">USDC</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">To Chain</label>
              <select
                value={destinationChain}
                onChange={(e) => setDestinationChain(e.target.value as GatewayChain)}
                disabled={status !== 'idle' && status !== 'error'}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-2 focus:ring-[#F4673B]/20 outline-none transition-all bg-white"
              >
                {CHAINS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                disabled={status !== 'idle' && status !== 'error' || mode === 'bridge'}
                className={`w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-2 focus:ring-[#F4673B]/20 outline-none transition-all font-mono text-sm ${mode === 'bridge' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
              />
              {mode === 'bridge' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium pointer-events-none">
                  Self
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {status === 'signing' && (
          <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-xl border border-yellow-100 flex items-center gap-3 animate-pulse">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Please sign the transaction in your wallet...
          </div>
        )}

        {status === 'processing' && (
          <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-xl border border-blue-100 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Processing Gateway transfer... (Burning & Minting)
          </div>
        )}

        {status === 'success' && (
          <div className="p-4 bg-green-50 text-green-800 text-sm rounded-xl border border-green-100 break-all space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Transfer Successful!
            </div>
            <p className="text-xs text-green-700 font-mono">Hash: {txHash}</p>
            <button
              onClick={resetState}
              className="mt-2 text-xs font-semibold text-green-700 underline hover:text-green-800"
            >
              Send Another
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 bg-red-50 text-red-800 text-sm rounded-xl border border-red-100 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Action Button */}
        {status === 'idle' || status === 'error' ? (
          <button
            onClick={handleTransfer}
            disabled={!amount || !recipient}
            className="w-full py-4 bg-[#F4673B] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-[#F4673B]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Pay with Unified Balance
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Modals */}
      {showSourceModal && (
        <AddSourceModal
          onClose={() => setShowSourceModal(false)}
          onAdd={handleAddSources}
          currentSelection={[]} // Todo: pass actual selected keys
        />
      )}
    </div>
  );
}
