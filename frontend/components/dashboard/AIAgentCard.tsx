'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Message {
  type: 'user' | 'agent';
  text: string;
  timestamp?: string;
}

import { AIAgentIcon } from '@/components/ui/icons/DashboardIcons';
import { mockBalances, calculateTotalBalance } from '@/lib/mockData';

interface AIAgentCardProps {
  isConnected?: boolean;
}



export function AIAgentCard({ isConnected = true }: AIAgentCardProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { type: 'agent', text: 'Hello! I am your Treasury AI. How can I assist you today?', timestamp: 'Now' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: userMsg, timestamp: 'Now' }]);
    setIsTyping(true);

    // Process command
    setTimeout(() => {
      let responseText = "I'm sorry, I didn't understand that command. Try asking about 'balance', 'yield', or 'transfers'.";
      const lowerInput = userMsg.toLowerCase();

      if (lowerInput.includes('balance') || lowerInput.includes('saldo')) {
        const total = calculateTotalBalance(mockBalances);
        const networks = mockBalances.map(c => c.chainName).join(', ');
        responseText = `Your current unified balance is **$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC** across ${mockBalances.length} networks (${networks}).`;
      }
      else if (lowerInput.includes('transfer') || lowerInput.includes('kirim') || lowerInput.includes('send') || lowerInput.includes('pay')) {
        responseText = "Navigating to Transaction Center. You can execute gas-abstracted transfers there.";
        router.push('/transaction');
      }
      else if (lowerInput.includes('yield') || lowerInput.includes('policy') || lowerInput.includes('earn') || lowerInput.includes('invest')) {
        responseText = "You are currently earning **~5% APY** via Circle USYC. I can help you adjust your treasury thresholds in the Policies page.";
        // Optional: navigating to policies could be added here if desired, but sticking to info for now.
      }
      else if (lowerInput.includes('history') || lowerInput.includes('transaction') || lowerInput.includes('last')) {
        responseText = "Your last transaction was a **$500 USDC** transfer to *0x71C...9A23* on Base. Status: **Confirmed**.";
      }
      else if (lowerInput.includes('help') || lowerInput.includes('menu')) {
        responseText = "I can help with:\n1. Check **Balance**\n2. **Transfer** funds\n3. Check **Yield** status\n4. View **History**";
      }
      else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        responseText = "Hello! I'm ready to manage your cross-chain treasury. What would you like to do?";
      }

      setMessages(prev => [...prev, { type: 'agent', text: responseText, timestamp: 'Now' }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="glass-card p-5 animate-fade-in-up h-full flex flex-col justify-between relative overflow-hidden group border-t-4 border-t-[#F4673B] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ animationDelay: '0.05s' }}>
      {/* Background Gradient Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F4673B]/5 to-[#FF8A65]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#F4673B]/10"></div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="shadow-lg shadow-[#F4673B]/20 rounded-xl">
          <AIAgentIcon className="w-10 h-10" />
        </div>
        <div>
          <span className="font-bold text-gray-900 text-sm">AI Assistant</span>
          <div className="flex items-center gap-1">
            {isConnected ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-600 font-medium">Online</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-2 bg-gray-100 rounded-full">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-xs text-gray-500 font-medium px-4">
            Connect wallet to ask about your portfolio
          </p>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-[150px] pr-1 custom-scrollbar">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs ${msg.type === 'user'
                    ? 'bg-[#F4673B]/10 text-[#F4673B] font-medium rounded-br-sm'
                    : 'bg-gray-50 text-gray-700 rounded-bl-sm border border-gray-100'
                    }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-50 px-3 py-2 rounded-2xl rounded-bl-sm border border-gray-100 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="relative mt-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI..."
              className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F4673B]/20 transition-all"
            />
            <button
              onClick={handleSend}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#F4673B] rounded-lg flex items-center justify-center hover:bg-[#E55A30] transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
