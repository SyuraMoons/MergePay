import React from 'react';

export function AIAgentIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="agentGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F4673B" />
          <stop offset="100%" stopColor="#FF8A65" />
        </linearGradient>
        <filter id="glow" x="-4" y="-4" width="48" height="48" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#glow)">
        <rect width="40" height="40" rx="12" fill="url(#agentGradient)" />
        <path d="M12 20C12 15.5817 15.5817 12 20 12C24.4183 12 28 15.5817 28 20V25C28 26.6569 26.6569 28 25 28H15C13.3431 28 12 26.6569 12 25V20Z" fill="white" fillOpacity="0.9" />
        <circle cx="16.5" cy="19.5" r="1.5" fill="#F4673B" />
        <circle cx="23.5" cy="19.5" r="1.5" fill="#F4673B" />
        <path d="M18 24H22" stroke="#F4673B" strokeWidth="1.5" strokeLinecap="round" />
        {/* Antennas */}
        <path d="M20 12V9" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="7.5" r="1.5" fill="white" />
      </g>
    </svg>
  );
}

export function VaultStrategyIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vaultGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F4673B" />
          <stop offset="100%" stopColor="#FF8A65" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#vaultGradient)" />
      {/* Vault Door Design */}
      <circle cx="20" cy="20" r="8" stroke="white" strokeWidth="2.5" strokeOpacity="0.9" />
      <circle cx="20" cy="20" r="3" fill="white" fillOpacity="0.9" />
      <path d="M20 12V8M28 20H32M20 28V32M12 20H8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M25.657 14.343L28.485 11.515M25.657 25.657L28.485 28.485M14.343 25.657L11.515 28.485M14.343 14.343L11.515 11.515" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
    </svg>
  );
}
