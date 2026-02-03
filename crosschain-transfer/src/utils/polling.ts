/**
 * Polling utilities with exponential backoff
 *
 * Used for waiting on async operations like attestation generation
 */

import { AttestationTimeoutError } from '../types/index.js';

/**
 * Polling configuration
 */
export interface PollingConfig {
  /** Initial delay between polls (ms) */
  initialDelay?: number;
  /** Maximum delay between polls (ms) */
  maxDelay?: number;
  /** Exponential backoff multiplier */
  backoffMultiplier?: number;
  /** Maximum number of polling attempts */
  maxAttempts?: number;
  /** Total timeout (ms) */
  timeout?: number;
}

/**
 * Default polling configuration
 */
const DEFAULT_CONFIG: Required<PollingConfig> = {
  initialDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 1.5,
  maxAttempts: 60, // At 2s initial, 30s max, this covers ~5 minutes
  timeout: 300000, // 5 minutes
};

/**
 * Poll a function with exponential backoff
 *
 * @param fn - Async function to poll. Should return truthy value when done, or falsy to continue polling
 * @param config - Polling configuration
 * @returns The result from the polling function
 * @throws AttestationTimeoutError if timeout is reached
 */
export async function pollWithBackoff<T>(
  fn: () => Promise<T | null | undefined>,
  config: PollingConfig = {}
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let currentDelay = cfg.initialDelay;
  let attempts = 0;
  const startTime = Date.now();

  while (attempts < cfg.maxAttempts) {
    // Check timeout
    if (Date.now() - startTime > cfg.timeout) {
      throw new AttestationTimeoutError('timeout');
    }

    attempts++;

    try {
      const result = await fn();

      // If we got a truthy result, we're done
      if (result !== null && result !== undefined) {
        return result;
      }
    } catch (error) {
      // If the function throws, check if it's a retryable error
      // For now, we'll rethrow any errors
      throw error;
    }

    // Wait before next poll with exponential backoff
    await sleep(currentDelay);

    // Increase delay for next iteration (capped at maxDelay)
    currentDelay = Math.min(currentDelay * cfg.backoffMultiplier, cfg.maxDelay);
  }

  // If we've exhausted all attempts
  throw new AttestationTimeoutError('max_attempts');
}

/**
 * Simple delay/sleep function
 *
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
