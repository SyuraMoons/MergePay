import { circleClient } from '../config/circle-wallets.js';
import { v4 as uuidv4 } from 'uuid';

export class CircleWalletService {
  private checkClient() {
    if (!circleClient) {
      throw new Error('Circle client not initialized - CIRCLE_API_KEY is required');
    }
  }

  /**
   * Generate user token for wallet authentication
   */
  async createUserToken(userId?: string) {
    this.checkClient();

    const finalUserId = userId || uuidv4();

    console.log(`Generating token for user: ${finalUserId}`);

    const response = await circleClient!.createUserToken({
      userId: finalUserId,
    });

    return {
      userId: finalUserId,
      userToken: response.data?.userToken || '',
      encryptionKey: response.data?.encryptionKey || '',
    };
  }

  /**
   * Initialize wallet by creating PIN challenge
   */
  async initializeWallet(userId: string, userToken: string, blockchains?: string[]) {
    this.checkClient();

    console.log(`Initializing wallet for user: ${userId}`);

    const response = await circleClient!.createUserPin({
      userToken,
      idempotencyKey: uuidv4(),
    });

    return {
      challengeId: response.data?.challengeId || '',
      success: !!response.data?.challengeId,
    };
  }

  /**
   * Execute wallet transfer
   * TODO: Implement actual transfer logic - this is a stub from the original backend
   */
  async executeTransfer(params: {
    userId: string;
    userToken: string;
    amount: string;
    destinationAddress: string;
    tokenId?: string;
  }) {
    console.log(`Executing transfer for user: ${params.userId}`);
    console.log(`Amount: ${params.amount}, Destination: ${params.destinationAddress}`);

    // TODO: Implement actual transfer using Circle SDK
    // This was a stub in the original /backend implementation
    return {
      success: false,
      error: 'Transfer implementation pending - stub from original backend',
    };
  }

  /**
   * Get user's wallets
   */
  async getUserWallets(userId: string) {
    this.checkClient();

    const response = await circleClient!.listWallets({
      userId,
    });

    return {
      wallets: response.data?.wallets || [],
    };
  }
}
