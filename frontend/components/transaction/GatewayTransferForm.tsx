'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { GatewayChain } from '@/types/gateway';
import { useWalletContext } from '@/contexts/WalletContext';

const CHAINS: { id: GatewayChain; name: string }[] = [
  { id: 'sepolia', name: 'Ethereum Sepolia' },
  { id: 'arc', name: 'Arc Testnet' },
  { id: 'base', name: 'Base Sepolia' },
  { id: 'avalanche', name: 'Avalanche Fuji' },
  { id: 'optimism', name: 'Optimism Sepolia' },
  { id: 'arbitrum', name: 'Arbitrum Sepolia' },
  { id: 'polygon', name: 'Polygon Amoy' },
];

export function GatewayTransferForm() {
  const { address, isConnected } = useAccount();

  // Form State
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [destinationChain, setDestinationChain] = useState<GatewayChain>('base');

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

  if (!isConnected) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-3xl">
          💳
        </div>
        <h2 className="text-xl font-bold text-gray-900">Connect Wallet to Pay</h2>
        <p className="text-gray-500">
          Please connect your wallet to access the Circle Gateway Transfer feature.
        </p>
        {/* Wallet connection is handled globally/in header, so just guide user */}
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-transparent">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0052FF] flex items-center justify-center text-white font-bold text-sm shadow-md">
            C
          </div>
          Circle Gateway Transfer
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Pay anyone on any chain from your unified balance.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Sender Info */}
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
          {/* We rely on the unified balance overview on the left, so no need to show balance here technically,
                 but showing 'Available' is nice UX. Use a static placeholder or fetch if we want.
                 For now, keep it simple. */}
        </div>

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
                disabled={status !== 'idle' && status !== 'error'}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-2 focus:ring-[#F4673B]/20 outline-none transition-all font-mono text-sm"
              />
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
    </div>
  );
}
