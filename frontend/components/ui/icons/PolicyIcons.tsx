import React from 'react';

// Common defs for gradients
export const IconGradients = () => (
  <defs>
    <linearGradient id="coral-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F4673B" />
      <stop offset="100%" stopColor="#FF8A65" />
    </linearGradient>
    <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#3B82F6" />
      <stop offset="100%" stopColor="#60A5FA" />
    </linearGradient>
    <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#8B5CF6" />
      <stop offset="100%" stopColor="#A78BFA" />
    </linearGradient>
    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F59E0B" />
      <stop offset="100%" stopColor="#FCD34D" />
    </linearGradient>
  </defs>
);

export const RobotIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="url(#purple-gradient)" strokeWidth="1.5">
    <IconGradients />
    <rect x="3" y="11" width="18" height="10" rx="2" stroke="url(#purple-gradient)" strokeWidth="2" fill="url(#purple-gradient)" fillOpacity="0.1" />
    <circle cx="12" cy="5" r="2" stroke="url(#purple-gradient)" strokeWidth="2" />
    <path d="M12 7v4" stroke="url(#purple-gradient)" strokeWidth="2" />
    <line x1="8" y1="16" x2="16" y2="16" />
    <circle cx="9" cy="14" r="1" fill="currentColor" />
    <circle cx="15" cy="14" r="1" fill="currentColor" />
  </svg>
);

export const VaultIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="url(#blue-gradient)" strokeWidth="1.5">
    <IconGradients />
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="url(#blue-gradient)" strokeWidth="2" fill="url(#blue-gradient)" fillOpacity="0.05" />
    <circle cx="12" cy="12" r="5" stroke="url(#blue-gradient)" strokeWidth="2" />
    <path d="M12 7v2" strokeLinecap="round" />
    <path d="M12 15v2" strokeLinecap="round" />
    <path d="M17 12h-2" strokeLinecap="round" />
    <path d="M9 12h-2" strokeLinecap="round" />
  </svg>
);

export const TrophyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <IconGradients />
    <path d="M8 21h8m-4-9v9m-8-3h16M6 4h12a2 2 0 012 2v2a5 5 0 01-5 5H9a5 5 0 01-5-5V6a2 2 0 012-2z"
      stroke="url(#gold-gradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="url(#gold-gradient)"
      fillOpacity="0.15" />
  </svg>
);

export const StarIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <IconGradients />
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      stroke="url(#purple-gradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="url(#purple-gradient)"
      fillOpacity="0.15" />
  </svg>
);

export const AutoPilotIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <IconGradients />
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#coral-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
