'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Message {
  type: 'user' | 'agent';
  text: string;
  timestamp?: string;
}

import { AIAgentIcon } from '@/components/ui/icons/DashboardIcons';

export function AIAgentCard() {
  const [messages] = useState<Message[]>([
    { type: 'user', text: 'My balance?', timestamp: '2m' },
    { type: 'agent', text: '$65.00 USDC', timestamp: 'Now' },
  ]);
  const [input, setInput] = useState('');

  return (
    <div className="glass-card p-5 animate-fade-in-up h-full flex flex-col justify-between" style={{ animationDelay: '0.05s' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="shadow-lg shadow-[#F4673B]/20 rounded-xl">
          <AIAgentIcon className="w-10 h-10" />
        </div>
        <div>
          <span className="font-bold text-gray-900 text-sm">AI Assistant</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-600 font-medium">Online</span>
          </div>
        </div>
      </div>

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
      </div>

      {/* Input */}
      <div className="relative mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI..."
          className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F4673B]/20 transition-all"
        />
        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#F4673B] rounded-lg flex items-center justify-center hover:bg-[#E55A30] transition-colors shadow-sm">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
