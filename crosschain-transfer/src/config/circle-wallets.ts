import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';

const circleApiKey = process.env.CIRCLE_API_KEY;

// Circle client is optional - only initialize if API key is provided
// This allows the server to start even without Circle credentials
let circleClientInstance: ReturnType<typeof initiateUserControlledWalletsClient> | null = null;

if (circleApiKey) {
  circleClientInstance = initiateUserControlledWalletsClient({
    apiKey: circleApiKey,
  });
  console.log('✅ Circle User-Controlled Wallets client initialized');
} else {
  console.warn('⚠️  CIRCLE_API_KEY not found - Circle wallet features will be disabled');
}

export const circleClient = circleClientInstance;
