// Wallet types for MergePay multi-wallet support

export type WalletType = 'circle' | 'evm';

export interface ConnectedWallet {
  id: string;
  type: WalletType;
  address: string;
  chainId?: number;
  chainName?: string;
  label?: string;
  isActive: boolean;
  connector?: string; // e.g., 'metamask', 'walletconnect', 'circle-passkey'
}

export interface WalletContextState {
  wallets: ConnectedWallet[];
  activeWallet: ConnectedWallet | null;
  isConnecting: boolean;
  error: string | null;
}

export interface WalletContextActions {
  addWallet: (wallet: ConnectedWallet) => void;
  removeWallet: (walletId: string) => void;
  setActiveWallet: (walletId: string) => void;
  clearError: () => void;
  disconnectAll: () => void;
  addMockWallet: () => void;
}

export type WalletContextType = WalletContextState & WalletContextActions;

// Circle Wallet specific types
export interface CircleWalletCredential {
  id: string;
  publicKey: string;
  username: string;
}

export interface CircleSmartAccountInfo {
  address: string;
  chainId: number;
  chainName: string;
}

// EVM Wallet connection options
export interface EvmConnectorOption {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

// Supported chains configuration
export const SUPPORTED_CHAINS = {
  base: { id: 8453, name: 'Base' },
  baseSepolia: { id: 84532, name: 'Base Sepolia' },
  arbitrum: { id: 42161, name: 'Arbitrum' },
  arbitrumSepolia: { id: 421614, name: 'Arbitrum Sepolia' },
  optimism: { id: 10, name: 'Optimism' },
  optimismSepolia: { id: 11155420, name: 'Optimism Sepolia' },
  polygon: { id: 137, name: 'Polygon' },
  polygonAmoy: { id: 80002, name: 'Polygon Amoy' },
} as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[keyof typeof SUPPORTED_CHAINS]['id'];
