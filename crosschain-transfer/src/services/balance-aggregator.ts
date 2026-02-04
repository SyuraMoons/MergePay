/**
 * Balance Aggregator Service
 *
 * Provides smart routing logic for Gateway transfers:
 * - Determines optimal source chains to pull from
 * - Minimizes number of source chains (lower fees)
 * - Prefers chains with higher balances
 */

import type { Address } from 'viem';
import type { GatewayChain } from '../config/gateway.js';
import {
  GatewayBalanceResponse,
  GatewaySourceChain,
  GatewayInsufficientBalanceError,
} from '../types/gateway.js';
import { GatewayService } from './gateway.js';

/**
 * Transfer route recommendation
 */
export interface TransferRoute {
  /** Source chains to pull from */
  sourceChains: GatewaySourceChain[];
  /** Total amount being transferred */
  totalAmount: bigint;
  /** Number of source chains used */
  numSources: number;
  /** Estimated total fees */
  estimatedFees: bigint;
}

/**
 * Balance Aggregator Service
 */
export class BalanceAggregator {
  private gatewayService: GatewayService;

  constructor() {
    this.gatewayService = new GatewayService();
  }

  /**
   * Get optimal transfer route for a Gateway transfer
   *
   * Strategy:
   * 1. Sort chains by balance (descending)
   * 2. Use fewest chains possible
   * 3. Prefer larger balances first
   */
  async getOptimalTransferRoute(
    amount: bigint,
    destinationChain: GatewayChain,
    address: Address,
    availableChains: GatewayChain[] = ['sepolia', 'arc']
  ): Promise<TransferRoute> {
    // Get current balances
    const balanceResponse = await this.gatewayService.getGatewayBalance(
      address,
      availableChains
    );

    // Filter out destination chain (can't pull from destination)
    const sourceBalances = balanceResponse.balances.filter(
      (b) => b.chain !== destinationChain && b.balance > 0n
    );

    // Check if total balance is sufficient
    const totalAvailable = sourceBalances.reduce((sum, b) => sum + b.balance, 0n);
    if (totalAvailable < amount) {
      throw new GatewayInsufficientBalanceError(
        'all-chains' as GatewayChain,
        amount,
        totalAvailable
      );
    }

    // Sort by balance (descending) - prefer larger balances
    sourceBalances.sort((a, b) => (a.balance > b.balance ? -1 : 1));

    // Build source chain list (greedy approach - use largest balances first)
    const sourceChains: GatewaySourceChain[] = [];
    let remaining = amount;

    for (const balance of sourceBalances) {
      if (remaining === 0n) break;

      const amountFromThisChain = remaining > balance.balance ? balance.balance : remaining;

      sourceChains.push({
        chain: balance.chain,
        domain: balance.domain,
        amount: amountFromThisChain,
      });

      remaining -= amountFromThisChain;
    }

    // Estimate fees (Gateway charges per transfer, not per source chain)
    // For simplicity, we assume a flat fee per transfer
    const estimatedFees = 2_010_000n; // ~2.01 USDC per Gateway transfer

    return {
      sourceChains,
      totalAmount: amount,
      numSources: sourceChains.length,
      estimatedFees,
    };
  }

  /**
   * Get unified balance summary
   */
  async getBalanceSummary(
    address: Address,
    chains: GatewayChain[] = ['sepolia', 'arc']
  ): Promise<GatewayBalanceResponse> {
    return this.gatewayService.getGatewayBalance(address, chains);
  }
}
