'use client';

import type { WidgetConfig, ToAddress } from '@lifi/widget';
import { ChainType } from '@lifi/widget';
import dynamic from 'next/dynamic';

// Dynamically import LiFiWidget to avoid SSR issues
const LiFiWidget = dynamic(
  () => import('@lifi/widget').then((mod) => mod.LiFiWidget),
  {
    ssr: false,
    loading: () => <WidgetSkeleton />,
  }
);

// Widget skeleton for loading state
function WidgetSkeleton() {
  return (
    <div className="w-full max-w-[392px] mx-auto">
      <div className="glass-card p-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-24 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>

        {/* From section */}
        <div className="space-y-3 mb-4">
          <div className="h-4 w-12 bg-gray-200 rounded" />
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>

        {/* Swap icon */}
        <div className="flex justify-center py-2">
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
        </div>

        {/* To section */}
        <div className="space-y-3 mt-4">
          <div className="h-4 w-8 bg-gray-200 rounded" />
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>

        {/* Button skeleton */}
        <div className="mt-6">
          <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// MergePay themed widget configuration
const widgetConfig: Partial<WidgetConfig> = {
  variant: 'compact',
  subvariant: 'split',
  appearance: 'light',
  // Use external wallet management - MergePay handles wallet connection
  walletManagement: 'external',
  // Hide powered by to keep clean design
  hiddenUI: ['poweredBy'],
  // Disable non-EVM chains to avoid dependency conflicts with @mysten/sui
  chains: {
    deny: [],
    types: {
      allow: [ChainType.EVM],
    },
  },
  theme: {
    palette: {
      primary: { main: '#F4673B' },      // MergePay coral
      secondary: { main: '#FDF5F0' },    // MergePay background
    },
    shape: {
      borderRadius: 20,
      borderRadiusSecondary: 12,
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    },
    container: {
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.4)',
    },
  },
};

interface LiFiWidgetWrapperProps {
  /** Optional: Pre-fill destination address */
  toAddress?: ToAddress;
  /** Optional: Pre-fill amount */
  toAmount?: string;
}

export function LiFiWidgetWrapper({ toAddress, toAmount }: LiFiWidgetWrapperProps) {
  const config: Partial<WidgetConfig> = {
    ...widgetConfig,
    // Add destination if provided
    ...(toAddress && { toAddress }),
    ...(toAmount && { toAmount }),
  };

  return (
    <div className="lifi-widget-container">
      <LiFiWidget
        integrator="MergePay"
        config={config}
      />
    </div>
  );
}
