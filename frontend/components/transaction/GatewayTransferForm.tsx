'use client';

import { useState, useEffect } from 'react';
import { useGateway } from '@/hooks/useGateway';
import { GatewayChain } from '@/types/gateway';

const CHAINS: { id: GatewayChain; name: string }[] = [
  { id: 'sepolia', name: 'Ethereum Sepolia' },
  { id: 'arc', name: 'Arc Testnet' },
  { id: 'base', name: 'Base Sepolia' },
  { id: 'avalanche', name: 'Avalanche Fuji' },
];

export function GatewayTransferForm() {
  const { balance, loading, error, fetchBalance, transfer } = useGateway();

  // Form State
  const [privateKey, setPrivateKey] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [destinationChain, setDestinationChain] = useState<GatewayChain>('base');
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // Debounced balance fetch when private key is entered
  useEffect(() => {
    const timer = setTimeout(() => {
      if (privateKey.length >= 64) {
        // Assume valid key length, try fetching balance
        fetchBalance(privateKey);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [privateKey, fetchBalance]);

  const handleTransfer = async () => {
    if (!privateKey || !amount || !recipient) return;

    setTransferSuccess(null);
    try {
      const result = await transfer({
        amount: (parseFloat(amount) * 1_000_000).toString(), // Convert to USDC units (6 decimals)
        destinationChain,
        recipient,
        privateKey,
      });
      setTransferSuccess(result.mintHash);
      // Refresh balance
      fetchBalance(privateKey);
    } catch (e) {
      // Error is handled by hook
    }
  };

  const humanBalance = balance
    ? (Number(balance.totalBalance) / 1_000_000).toFixed(2)
    : '---';

  return (
    <div className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            C
          </div>
          Circle Gateway Transfer
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Aggregate funds from all chains and send instantly.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Private Key (Demo Purpose) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sender Wallet Private Key (Demo)
          </label>
          <input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-2 focus:ring-[#F4673B]/20 outline-none transition-all text-sm font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Required because the backend signs the aggregated burn intents.
          </p>
        </div>

        {/* Balance Display */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-800 font-medium">Unified Balance</span>
            <span className="text-2xl font-bold text-blue-900">
              {loading && !balance ? 'Loading...' : `$${humanBalance} USDC`}
            </span>
          </div>
          {balance && (
            <div className="mt-2 text-xs text-blue-600 flex gap-2 flex-wrap">
              {balance.balances.map((b) => (
                <span key={b.chain} className="bg-white/50 px-2 py-1 rounded">
                  {b.chain}: {(Number(b.balance) / 1_000_000).toFixed(2)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Transfer Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USDC)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-2 focus:ring-[#F4673B]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Destination Chain</label>
            <select
              value={destinationChain}
              onChange={(e) => setDestinationChain(e.target.value as GatewayChain)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-2 focus:ring-[#F4673B]/20 outline-none transition-all bg-white"
            >
              {CHAINS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F4673B] focus:ring-2 focus:ring-[#F4673B]/20 outline-none transition-all font-mono text-sm"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* Success Message */}
        {transferSuccess && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 break-all">
            <strong>Success!</strong> Mint Hash: {transferSuccess}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleTransfer}
          disabled={loading || !privateKey || !amount || !recipient}
          className="w-full py-4 bg-gradient-to-r from-[#F4673B] to-[#FF8F6B] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-[#F4673B]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing Transfer...' : 'Pay with Unified Balance'}
        </button>
      </div>
    </div>
  );
}
