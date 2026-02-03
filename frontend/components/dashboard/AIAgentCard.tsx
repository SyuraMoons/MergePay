'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Message {
  type: 'user' | 'agent';
  text: string;
  timestamp?: string;
}

export function AIAgentCard() {
  const [messages] = useState<Message[]>([
    { type: 'user', text: 'What is my total balance?', timestamp: '2 mins ago' },
    { type: 'agent', text: 'You have $65.00 USDC across 3 chains', timestamp: 'Just now' },
  ]);
  const [input, setInput] = useState('');

  return (
    <div className="glass-card p-5 animate-fade-in-up h-full flex flex-col" style={{ animationDelay: '0.05s' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Image
            src="https://api.iconify.design/fluent:bot-sparkle-24-filled.svg?color=%23ffffff"
            alt="AI Agent"
            width={20}
            height={20}
            unoptimized
          />
        </div>
        <div>
          <span className="font-semibold text-gray-900 text-sm">AI Agent</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-gray-400">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 mb-4 min-h-[100px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${msg.type === 'user'
                  ? 'bg-gray-100 text-gray-900 rounded-br-md'
                  : 'bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm'
                }`}
            >
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="w-full px-4 py-2.5 pr-11 bg-gray-50 border-0 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F4673B]/20"
        />
        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#F4673B] rounded-lg flex items-center justify-center hover:bg-[#E55A30] transition-colors">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
