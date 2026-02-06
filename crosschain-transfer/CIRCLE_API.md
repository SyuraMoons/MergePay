# Circle User-Controlled Wallets API Reference

**Base URL:** `http://localhost:4000/api/circle`

This API provides endpoints for Circle User-Controlled Wallets integration. All operations use Circle's challenge-based flow (no private keys needed).

---

## 🔐 Authentication Flow

Circle uses a **challenge-based authentication** where sensitive operations return a `challengeId` that must be executed on the frontend using the W3S SDK.

### Flow Overview

```
1. Backend creates challenge  →  challengeId
2. Frontend executes challenge  →  W3SSdk.execute(challengeId)
3. User signs with PIN  →  Transaction executed
```

---

## 📚 API Endpoints

### **User Management**

#### Create User
**POST** `/users`

Create a new user in Circle's system.

**Request:**
```json
{
  "userId": "user-123"  // Optional: auto-generated if not provided
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "circleUserId": "a1b2c3d4-...",
    "pinStatus": "UNSET",
    "status": "ENABLED"
  }
}
```

---

#### Get User
**GET** `/users/:userId`

Get user details and status.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "pinStatus": "ENABLED",
    "status": "ENABLED",
    "createDate": "2024-01-15T10:30:00Z"
  }
}
```

---

#### Create User Token
**POST** `/users/token`

Generate a user session token (expires in 60 minutes).

**Request:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "userToken": "eyJhbGciOiJSUzI1NiIs...",
    "encryptionKey": "..."
  }
}
```

**Frontend Usage:**
```javascript
// Use userToken and encryptionKey with W3S SDK
sdk.setAuthentication({
  userToken: result.data.userToken,
  encryptionKey: result.data.encryptionKey
});
```

---

### **Wallet Creation**

#### Create Wallet with PIN
**POST** `/wallets/create-with-pin`

Create wallets and set up PIN in one step (recommended for new users).

**Request:**
```json
{
  "userToken": "eyJhbGciOiJSUzI1NiIs...",
  "blockchains": ["ETH-SEPOLIA", "ARB-SEPOLIA", "BASE-SEPOLIA"],
  "accountType": "EOA"  // Optional: "EOA" or "SCA" (default: "EOA")
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "challengeId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "success": true
  },
  "message": "Execute this challengeId on the frontend using W3S SDK"
}
```

**Frontend Execution:**
```javascript
sdk.execute(challengeId, (error, result) => {
  if (error) {
    console.error('Failed:', error.message);
  } else {
    console.log('Wallets created! User has set PIN.');
  }
});
```

---

#### Create Additional Wallet
**POST** `/wallets/create`

Create additional wallets after PIN is already set.

**Request:**
```json
{
  "userToken": "eyJhbGciOiJSUzI1NiIs...",
  "blockchains": ["OP-SEPOLIA"],
  "accountType": "EOA"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "challengeId": "a1b2c3d4-...",
    "success": true
  }
}
```

---

### **Wallet Queries**

#### List Wallets (by userToken)
**POST** `/wallets/list`

Get all wallets for a user.

**Request:**
```json
{
  "userToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wallets": [
      {
        "id": "wallet-id-1",
        "state": "LIVE",
        "walletSetId": "...",
        "custodyType": "ENDUSER",
        "userId": "user-123",
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
        "blockchain": "ETH-SEPOLIA",
        "accountType": "EOA",
        "updateDate": "2024-01-15T10:30:00Z",
        "createDate": "2024-01-15T10:30:00Z"
      },
      {
        "id": "wallet-id-2",
        "address": "0x...",
        "blockchain": "ARB-SEPOLIA",
        ...
      }
    ]
  }
}
```

---

#### Get User Wallets (by userId)
**GET** `/wallets/:userId`

Get wallets for a user by their userId.

**Response:**
```json
{
  "success": true,
  "data": {
    "wallets": [...]
  }
}
```

---

#### Get Wallet Balance
**POST** `/wallets/balance`

Get token balances for a specific wallet.

**Request:**
```json
{
  "userToken": "eyJhbGciOiJSUzI1NiIs...",
  "walletId": "wallet-id-1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balances": [
      {
        "token": {
          "id": "token-id-1",
          "blockchain": "ETH-SEPOLIA",
          "name": "USD Coin",
          "symbol": "USDC",
          "decimals": 6,
          "isNative": false,
          "tokenAddress": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
        },
        "amount": "100.000000",
        "updateDate": "2024-01-15T10:30:00Z"
      },
      {
        "token": {
          "id": "native-eth-sepolia",
          "blockchain": "ETH-SEPOLIA",
          "name": "Ethereum",
          "symbol": "ETH",
          "decimals": 18,
          "isNative": true
        },
        "amount": "0.5",
        "updateDate": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### **Transactions**

#### Create Transaction
**POST** `/transactions/create`

Create a transaction (returns challengeId for user to sign).

**Request (with tokenId):**
```json
{
  "userToken": "eyJhbGciOiJSUzI1NiIs...",
  "walletId": "wallet-id-1",
  "destinationAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "amount": "10.50",
  "tokenId": "token-id-1",
  "feeLevel": "MEDIUM"  // Optional: "LOW", "MEDIUM", "HIGH"
}
```

**Request (with blockchain + tokenAddress for native token):**
```json
{
  "userToken": "eyJhbGciOiJSUzI1NiIs...",
  "walletId": "wallet-id-1",
  "destinationAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "amount": "0.1",
  "blockchain": "ETH-SEPOLIA",
  "tokenAddress": "",  // Empty for native token (ETH)
  "feeLevel": "MEDIUM"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "challengeId": "tx-challenge-123",
    "success": true
  },
  "message": "Execute this challengeId on the frontend using W3S SDK"
}
```

**Frontend Execution:**
```javascript
sdk.execute(challengeId, (error, result) => {
  if (error) {
    console.error('Transaction failed:', error.message);
  } else {
    console.log('Transaction sent!');
    console.log('Transaction ID:', result.data.id);
  }
});
```

---

#### Get Transaction Status
**POST** `/transactions/status`

Get details and status of a transaction.

**Request:**
```json
{
  "userToken": "eyJhbGciOiJSUzI1NiIs...",
  "transactionId": "tx-id-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tx-id-123",
    "blockchain": "ETH-SEPOLIA",
    "tokenId": "token-id-1",
    "walletId": "wallet-id-1",
    "sourceAddress": "0x...",
    "destinationAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "transactionType": "OUTBOUND",
    "custodyType": "ENDUSER",
    "state": "COMPLETE",
    "amounts": ["10.500000"],
    "txHash": "0xabc123...",
    "blockHash": "0xdef456...",
    "blockHeight": 1234567,
    "networkFee": "0.001",
    "operation": "TRANSFER",
    "feeLevel": "MEDIUM",
    "createDate": "2024-01-15T10:30:00Z",
    "updateDate": "2024-01-15T10:31:00Z"
  }
}
```

**Transaction States:**
- `INITIATED` - Transaction created
- `PENDING_RISK_SCREENING` - Being screened
- `QUEUED` - In queue
- `SENT` - Sent to blockchain
- `CONFIRMED` - Confirmed on blockchain
- `COMPLETE` - Fully completed
- `FAILED` - Failed
- `CANCELLED` - Cancelled
- `DENIED` - Denied by risk screening

---

#### List Transactions
**POST** `/transactions/list`

List all transactions for a user.

**Request:**
```json
{
  "userToken": "eyJhbGciOiJSUzI1NiIs...",
  "walletIds": ["wallet-id-1", "wallet-id-2"]  // Optional filter
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [...]
  }
}
```

---

## 🔄 Complete Flow Example

### New User Onboarding & Payment

```javascript
// 1. Create user
const user = await fetch('/api/circle/users', {
  method: 'POST',
  body: JSON.stringify({ userId: 'user-123' })
});

// 2. Get user token
const token = await fetch('/api/circle/users/token', {
  method: 'POST',
  body: JSON.stringify({ userId: 'user-123' })
});

// 3. Create wallets with PIN
const wallet = await fetch('/api/circle/wallets/create-with-pin', {
  method: 'POST',
  body: JSON.stringify({
    userToken: token.data.userToken,
    blockchains: ['ETH-SEPOLIA', 'ARB-SEPOLIA']
  })
});

// 4. Frontend: Execute challenge (user sets PIN)
sdk.setAuthentication({
  userToken: token.data.userToken,
  encryptionKey: token.data.encryptionKey
});

sdk.execute(wallet.data.challengeId, (error, result) => {
  if (!error) {
    console.log('Wallets created!');
    // Now user has wallets on Sepolia and Arbitrum
  }
});

// 5. Later: Create a payment
const tx = await fetch('/api/circle/transactions/create', {
  method: 'POST',
  body: JSON.stringify({
    userToken: token.data.userToken,
    walletId: 'wallet-id-1',
    destinationAddress: '0x...',
    amount: '10',
    tokenId: 'usdc-sepolia-token-id'
  })
});

// 6. Frontend: Execute transaction (user signs with PIN)
sdk.execute(tx.data.challengeId, (error, result) => {
  if (!error) {
    console.log('Payment sent!');
  }
});
```

---

## 🔒 Security Best Practices

1. **Never expose userToken in URLs** - Always send in request body
2. **Validate userToken on backend** - Check token validity before operations
3. **Use HTTPS in production** - Never send tokens over HTTP
4. **Store tokens securely** - Use secure storage in frontend (not localStorage for sensitive tokens)
5. **Refresh tokens** - UserTokens expire after 60 minutes, implement refresh logic
6. **Validate addresses** - Always validate blockchain addresses before creating transactions

---

## ⚠️ Error Handling

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Errors:**
- `Circle client not initialized - CIRCLE_API_KEY is required` - Missing API key
- `userToken is required` - Missing required parameter
- `Failed to create user` - Circle API error
- `Token expired` - UserToken expired (refresh needed)

---

## 🧪 Testing with Testnet

Use these testnets for development:
- **ETH-SEPOLIA** - Ethereum Sepolia
- **ARB-SEPOLIA** - Arbitrum Sepolia
- **BASE-SEPOLIA** - Base Sepolia
- **OP-SEPOLIA** - Optimism Sepolia
- **MATIC-AMOY** - Polygon Amoy

Get testnet USDC:
```bash
# After creating wallet, use Circle's faucet
# (SDK provides testnet token request methods)
```

---

## 📖 Additional Resources

- [Circle Developer Docs](https://developers.circle.com/wallets/user-controlled)
- [Web SDK Reference](https://developers.circle.com/wallets/user-controlled/web-sdk)
- [API Reference](https://developers.circle.com/api-reference/w3s/user-controlled-wallets)
