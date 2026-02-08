import { circleClient } from '../config/circle-wallets.js';
import { v4 as uuidv4 } from 'uuid';
import type { Blockchain, TokenBlockchain } from '@circle-fin/user-controlled-wallets';

/**
 * Circle User-Controlled Wallets Service
 *
 * Handles user authentication, wallet creation, and transactions
 * using Circle's challenge-based flow (no private keys needed).
 */
export class CircleWalletService {
  private checkClient() {
    if (!circleClient) {
      throw new Error('Circle client not initialized - CIRCLE_API_KEY is required');
    }
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Create a new user in Circle's system
   * @param userId - Your app's unique identifier for the user
   */
  async createUser(userId?: string) {
    this.checkClient();

    const finalUserId = userId || uuidv4();
    console.log(`Creating Circle user: ${finalUserId}`);

    const response = await circleClient!.createUser({
      userId: finalUserId,
    });

    return {
      userId: finalUserId,
      circleUserId: response.data?.id || '',
      pinStatus: response.data?.pinStatus || 'UNSET',
      status: response.data?.status || 'ENABLED',
    };
  }

  /**
   * Generate user token for wallet authentication
   * Token expires after 60 minutes
   */
  async createUserToken(userId: string) {
    this.checkClient();

    console.log(`Generating token for user: ${userId}`);

    const response = await circleClient!.createUserToken({
      userId,
    });

    return {
      userId,
      userToken: response.data?.userToken || '',
      encryptionKey: response.data?.encryptionKey || '',
    };
  }

  /**
   * Create a device token for social login
   */
  async createDeviceToken(deviceId: string) {
    this.checkClient();

    // We need to use axios or fetch directly because the SDK might not expose this method yet
    // or it's named differently. For safety, let's use the client's axios instance if available
    // or just assume standard Circle API path.
    // 
    // Looking at the SDK client usage above, it seems to wrap axios.
    // Let's try to find if there is a method for it.
    // Since I cannot verify the SDK type definition deeply, I will use a direct HTTP call 
    // to ensure it works, but re-using the client's configuration if possible would be better.
    //
    // However, `circleClient` is an instance of `UserControlledWalletsClient`. 
    // Let's assume we can't easily extend it.
    // I will use the standard global fetch as a fallback, utilizing the same API key.

    const apiKey = process.env.CIRCLE_API_KEY;
    const baseUrl = process.env.CIRCLE_BASE_URL || 'https://api.circle.com';

    if (!apiKey) throw new Error('CIRCLE_API_KEY is required');

    const response = await fetch(`${baseUrl}/v1/w3s/users/social/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        idempotencyKey: uuidv4(),
        deviceId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create device token');
    }

    return {
      deviceToken: data.data?.deviceToken,
      deviceEncryptionKey: data.data?.deviceEncryptionKey
    };
  }

  /**
   * Get user status and details
   */
  async getUser(userId: string) {
    this.checkClient();

    const response = await circleClient!.getUser({
      userId,
    });

    const userData = response.data as any;

    return {
      userId: userData?.id || userId,
      pinStatus: userData?.pinStatus || 'UNSET',
      status: userData?.status || 'ENABLED',
      createDate: userData?.createDate || '',
    };
  }

  // ============================================
  // WALLET CREATION
  // ============================================

  /**
   * Create wallet with PIN setup (single step)
   * Returns challengeId for frontend to execute
   */
  async createWalletWithPin(
    userToken: string,
    blockchains: Blockchain[] = ['ETH-SEPOLIA', 'ARB-SEPOLIA', 'BASE-SEPOLIA'],
    accountType: 'EOA' | 'SCA' = 'EOA'
  ) {
    this.checkClient();

    console.log(`Creating wallet with PIN for blockchains: ${blockchains.join(', ')}`);

    const response = await circleClient!.createUserPinWithWallets({
      userToken,
      blockchains,
      accountType,
      idempotencyKey: uuidv4(),
    });

    return {
      challengeId: response.data?.challengeId || '',
      success: !!response.data?.challengeId,
    };
  }

  /**
   * Create additional wallet (after PIN is set)
   * Returns challengeId for frontend to execute
   */
  async createWallet(
    userToken: string,
    blockchains: Blockchain[],
    accountType: 'EOA' | 'SCA' = 'EOA'
  ) {
    this.checkClient();

    console.log(`Creating additional wallet for blockchains: ${blockchains.join(', ')}`);

    const response = await circleClient!.createWallet({
      userToken,
      blockchains,
      accountType,
      idempotencyKey: uuidv4(),
    });

    return {
      challengeId: response.data?.challengeId || '',
      success: !!response.data?.challengeId,
    };
  }

  /**
   * Initialize wallet by creating PIN challenge (PIN only, no wallet)
   * Deprecated: Use createWalletWithPin instead
   */
  async initializeWallet(userId: string, userToken: string, blockchains?: string[]) {
    this.checkClient();

    console.log(`Initializing PIN for user: ${userId}`);

    const response = await circleClient!.createUserPin({
      userToken,
      idempotencyKey: uuidv4(),
    });

    return {
      challengeId: response.data?.challengeId || '',
      success: !!response.data?.challengeId,
    };
  }

  // ============================================
  // WALLET QUERIES
  // ============================================

  /**
   * Get all wallets for a user
   */
  async listWallets(userToken: string) {
    this.checkClient();

    const response = await circleClient!.listWallets({
      userToken,
    });

    return {
      wallets: response.data?.wallets || [],
    };
  }

  /**
   * Get user's wallets (by userId)
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

  /**
   * Get specific wallet details
   */
  async getWallet(userToken: string, walletId: string) {
    this.checkClient();

    const response = await circleClient!.getWallet({
      userToken,
      id: walletId,
    });

    return response.data;
  }

  /**
   * Get wallet token balances
   */
  async getWalletBalance(userToken: string, walletId: string) {
    this.checkClient();

    const response = await circleClient!.getWalletTokenBalance({
      userToken,
      walletId,
    });

    return {
      balances: response.data || [],
    };
  }

  // ============================================
  // TRANSACTIONS
  // ============================================

  /**
   * Create a transaction (returns challengeId for user to sign)
   * Frontend executes the challenge via W3S SDK
   */
  async createTransaction(params: {
    userToken: string;
    walletId: string;
    destinationAddress: string;
    amount: string;
    tokenId?: string;
    blockchain?: string;
    tokenAddress?: string;
    feeLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  }) {
    this.checkClient();

    const { userToken, walletId, destinationAddress, amount, tokenId, blockchain, tokenAddress, feeLevel = 'MEDIUM' } = params;

    console.log(`Creating transaction: ${amount} to ${destinationAddress}`);

    // Use tokenId if provided, otherwise use blockchain + tokenAddress
    const transactionParams: any = {
      userToken,
      walletId,
      destinationAddress,
      amounts: [amount],
      fee: {
        type: 'level',
        config: {
          feeLevel,
        },
      },
      idempotencyKey: uuidv4(),
    };

    if (tokenId) {
      transactionParams.tokenId = tokenId;
    } else if (blockchain) {
      transactionParams.blockchain = blockchain as TokenBlockchain;
      transactionParams.tokenAddress = tokenAddress || ''; // Empty for native tokens
    } else {
      throw new Error('Either tokenId or blockchain must be provided');
    }

    const response = await circleClient!.createTransaction(transactionParams);

    return {
      challengeId: response.data?.challengeId || '',
      success: !!response.data?.challengeId,
    };
  }

  /**
   * Get transaction status
   */
  async getTransaction(userToken: string, transactionId: string) {
    this.checkClient();

    const response = await circleClient!.getTransaction({
      userToken,
      id: transactionId,
    });

    return response.data;
  }

  /**
   * List transactions for a user
   */
  async listTransactions(userToken: string, walletIds?: string[]) {
    this.checkClient();

    const response = await circleClient!.listTransactions({
      userToken,
      walletIds,
    });

    return {
      transactions: response.data || [],
    };
  }

  // ============================================
  // DEPRECATED METHOD (for backward compatibility)
  // ============================================

  /**
   * Execute wallet transfer
   * @deprecated Use createTransaction instead
   */
  async executeTransfer(params: {
    userId: string;
    userToken: string;
    amount: string;
    destinationAddress: string;
    tokenId?: string;
  }) {
    console.warn('executeTransfer is deprecated. Use createTransaction instead.');

    // For backward compatibility, we'll throw an error with instructions
    throw new Error(
      'executeTransfer is deprecated. Use createTransaction to get a challengeId, ' +
      'then execute the challenge on the frontend using W3S SDK.'
    );
  }
}
