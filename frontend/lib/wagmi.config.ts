import { http, createConfig } from 'wagmi';
import { base, baseSepolia, arbitrum, arbitrumSepolia, optimism, optimismSepolia, polygon, polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect project ID - user should replace with their own
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, arbitrum, arbitrumSepolia, optimism, optimismSepolia, polygon, polygonAmoy],
  connectors: [
    injected({
      shimDisconnect: false, // Changed to false - prevents connection issues
    }),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'MergePay',
        description: 'Chain-Abstracted Payment Solution',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://mergepay.app',
        icons: ['https://mergepay.app/icon.png'],
      },
      showQrModal: false, // Disable default modal - we'll use custom QR display
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [optimism.id]: http(),
    [optimismSepolia.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
  ssr: true,
  // Use default localStorage storage (more reliable for client-side)
  // Storage will be localStorage in browser, skipped during SSR
});

// Export chain configurations for easy access
export const supportedChains = [base, baseSepolia, arbitrum, arbitrumSepolia, optimism, optimismSepolia, polygon, polygonAmoy];

export function getChainById(chainId: number) {
  return supportedChains.find(chain => chain.id === chainId);
}
