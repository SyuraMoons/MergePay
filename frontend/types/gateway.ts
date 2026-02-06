export type GatewayChain = 'sepolia' | 'arc' | 'base' | 'avalanche';

export interface GatewayDomainBalance {
  domain: number;
  chain: GatewayChain;
  balance: string; // BigInt serialized as string
}

export interface GatewayBalanceResponse {
  address: string;
  totalBalance: string; // BigInt serialized as string
  balances: GatewayDomainBalance[];
}

export interface GatewayTransferParams {
  amount: string; // BigInt serialized as string
  destinationChain: GatewayChain;
  recipient: string;
  privateKey: string; // Required by backend currently
}

export interface GatewayTransferResult {
  burnHashes: Record<string, string>;
  attestation: string;
  mintHash: string;
  amount: string;
  sourceChains: GatewayChain[];
  destinationChain: GatewayChain;
}
