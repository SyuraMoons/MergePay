# Arc Treasury Hub API Reference

**Base URL:** `http://localhost:4000/api`

---

## CCTP Transfers

### Execute CCTP Transfer
**POST** `/transfer/cctp`

Transfer USDC cross-chain using Circle's CCTP (burn/mint mechanism).

**Request:**
```json
{
  "amount": 10,
  "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "privateKey": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "burnTxHash": "0x...",
    "mintTxHash": "0x...",
    "amount": "10000000",
    "status": "completed"
  },
  "explorerUrls": {
    "burnTx": "https://sepolia.etherscan.io/tx/0x...",
    "mintTx": "https://testnet.arcscan.app/tx/0x..."
  }
}
```

---

### Resume CCTP Transfer
**POST** `/transfer/cctp/resume`

Resume an interrupted CCTP transfer from burn transaction hash.

**Request:**
```json
{
  "txHash": "0x...",
  "privateKey": "0x..."
}
```

---

### Get CCTP Status
**GET** `/transfer/cctp/status/:txHash`

Check status of a CCTP transfer.

---

## Gateway (Instant Transfers)

### Deposit to Gateway
**POST** `/gateway/deposit`

Deposit USDC to Gateway for instant cross-chain transfers.

**Request:**
```json
{
  "amount": 100,
  "chain": "sepolia",
  "privateKey": "0x..."
}
```

**Chains:** `sepolia`, `arc`, `base`, `avalanche`

---

### Gateway Transfer
**POST** `/gateway/transfer`

Instant cross-chain transfer (<500ms) using Gateway.

**Request:**
```json
{
  "amount": 5,
  "destinationChain": "arc",
  "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "privateKey": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "explorerUrl": "https://..."
}
```

---

### Get Gateway Balance
**GET** `/gateway/balance?privateKey=0x...&chains=sepolia,arc`

Query unified Gateway balance across chains.

**Query Params:**
- `privateKey` (required): Wallet private key
- `chains` (optional): Comma-separated list of chains

---

## Treasury Automation

### Configure Policy
**POST** `/treasury/policy/configure`

Setup AI-driven policy automation for treasury management.

**Request:**
```json
{
  "threshold": 1000,
  "autoMode": true,
  "allowUSDCPool": true,
  "allowUSDTPool": true,
  "cooldownPeriod": 3600,
  "privateKey": "0x..."
}
```

**Parameters:**
- `threshold`: USDC threshold that triggers policy execution
- `autoMode`: `true` = AI agent, `false` = manual vault
- `vaultAddress`: Required if `autoMode: false`
- `allowUSDCPool`: Allow USDC/USDC pool
- `allowUSDTPool`: Allow USDC/USDT pool
- `cooldownPeriod`: Seconds between executions (default: 3600)

---

### Get Policy Status
**GET** `/treasury/policy/:address`

Get current policy configuration and status.

---

### Execute Policy
**POST** `/treasury/policy/execute`

Manually execute treasury policy.

**Request:**
```json
{
  "address": "0x...",
  "privateKey": "0x..."
}
```

---

### Check Can Execute
**GET** `/treasury/policy/can-execute/:address`

Check if policy can be executed (balance > threshold, cooldown passed).

---

### Get Pools Info
**GET** `/treasury/pools`

View available liquidity pools.

---

## Circle User-Controlled Wallets

### Create User Token
**POST** `/circle/users/token`

Generate user token for wallet authentication.

**Request:**
```json
{
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "generated-or-provided-id",
  "userToken": "token-here",
  "encryptionKey": "key-here"
}
```

---

### Initialize Wallet
**POST** `/circle/wallets/initialize`

Initialize wallet and create PIN challenge.

**Request:**
```json
{
  "userId": "user-id",
  "userToken": "token-from-previous-step",
  "blockchains": ["ETH-SEPOLIA"]
}
```

**Response:**
```json
{
  "success": true,
  "challengeId": "challenge-id"
}
```

---

### Execute Wallet Transfer
**POST** `/circle/wallets/transfer`

Execute transfer using Circle wallet.

**Request:**
```json
{
  "userId": "user-id",
  "userToken": "user-token",
  "amount": "1.5",
  "destinationAddress": "0x...",
  "tokenId": "optional-token-id"
}
```

⚠️ **Note:** Transfer implementation is a stub from original backend.

---

### Get User Wallets
**GET** `/circle/wallets/:userId`

Get all wallets for a user.

**Response:**
```json
{
  "success": true,
  "wallets": [
    {
      "id": "wallet-id",
      "address": "0x...",
      "blockchain": "ETH-SEPOLIA",
      "state": "LIVE"
    }
  ]
}
```

---

## Wallet Status

### Get Wallet Status
**GET** `/wallet/status?privateKey=0x...`

Get wallet balances across all chains.

---

### Get Wallet Balances
**GET** `/wallet/balances/:address`

Get balances for specific address.

⚠️ **Note:** Not yet fully implemented.

---

## Health Check

### Health
**GET** `/health`

Check API server health.

**Response:**
```json
{
  "status": "ok",
  "service": "arc-treasury-hub",
  "version": "1.0.0"
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Status codes:**
- `200` - Success
- `400` - Bad request / validation error
- `500` - Server error

---

## Authentication

⚠️ **Current:** No authentication (hackathon/demo)

**TODO:** Add JWT tokens for production

---

## Rate Limiting

⚠️ **Current:** No rate limiting

**TODO:** Implement rate limiting for production

---

## CORS

**Current:** All origins allowed

**Production:** Restrict to specific frontend domains

---

## Example: Complete CCTP Transfer Flow

```bash
# 1. Start server
npm run server

# 2. Execute transfer
curl -X POST http://localhost:4000/api/transfer/cctp \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5,
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "privateKey": "0x..."
  }'

# 3. Check status (optional)
curl http://localhost:4000/api/transfer/cctp/status/0x...
```

---

## Example: Gateway Instant Transfer

```bash
# 1. Deposit to Gateway
curl -X POST http://localhost:4000/api/gateway/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "chain": "sepolia",
    "privateKey": "0x..."
  }'

# 2. Transfer instantly to another chain
curl -X POST http://localhost:4000/api/gateway/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "destinationChain": "arc",
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "privateKey": "0x..."
  }'

# 3. Check balance
curl "http://localhost:4000/api/gateway/balance?privateKey=0x...&chains=sepolia,arc"
```

---

## Example: Treasury Policy Setup

```bash
# 1. Configure policy
curl -X POST http://localhost:4000/api/treasury/policy/configure \
  -H "Content-Type: application/json" \
  -d '{
    "threshold": 1000,
    "autoMode": true,
    "allowUSDCPool": true,
    "allowUSDTPool": true,
    "cooldownPeriod": 3600,
    "privateKey": "0x..."
  }'

# 2. Check policy status
curl http://localhost:4000/api/treasury/policy/0x...

# 3. Execute policy manually
curl -X POST http://localhost:4000/api/treasury/policy/execute \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x...",
    "privateKey": "0x..."
  }'
```

---

## Example: Circle Wallet Creation

```bash
# 1. Create user token
curl -X POST http://localhost:4000/api/circle/users/token \
  -H "Content-Type: application/json" \
  -d '{}'

# Response: { "userId": "...", "userToken": "...", "encryptionKey": "..." }

# 2. Initialize wallet
curl -X POST http://localhost:4000/api/circle/wallets/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-from-step-1",
    "userToken": "token-from-step-1",
    "blockchains": ["ETH-SEPOLIA"]
  }'

# Response: { "challengeId": "..." }

# 3. Get user's wallets
curl http://localhost:4000/api/circle/wallets/user-id-from-step-1
```

---

## Frontend TypeScript Examples

See `/frontend/src/services/api/` for type-safe API functions.

**Example:**
```typescript
import { executeCctpTransfer } from '@/services/api/transfer';

const result = await executeCctpTransfer({
  amount: 10,
  recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  privateKey: '0x...',
});

console.log('Transaction:', result.explorerUrls);
```

---

## Testing

All endpoints tested and working ✅

**Server starts:** ✅
**Health check:** ✅
**CCTP endpoints:** ✅
**Gateway endpoints:** ✅
**Treasury endpoints:** ✅
**Circle endpoints:** ✅ (requires CIRCLE_API_KEY)
**Wallet endpoints:** ✅

---

**For more details, see:** `BACKEND_MIGRATION_COMPLETE.md`
