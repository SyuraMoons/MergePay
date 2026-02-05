# Circle Gateway Implementation

## Overview

This implementation adds **Circle Gateway** support alongside the existing **CCTP** functionality, giving users two options for cross-chain USDC transfers.

## What's Been Implemented

### 1. Gateway Configuration (`src/config/gateway.ts`)
- Gateway Wallet and Minter contract addresses (testnet)
- Domain mappings for supported chains (Sepolia, Arc, Base, Avalanche)
- Gateway API endpoints
- Configuration constants (fees, minimums, confirmations)

### 2. Gateway Types (`src/types/gateway.ts`)
- `GatewayDepositParams` - Deposit to Gateway
- `GatewayBalanceResponse` - Unified balance across chains
- `GatewayTransferParams` - Instant cross-chain transfer
- Custom error types for Gateway operations

### 3. Gateway Service (`src/services/gateway.ts`)
Three core operations:

#### a. `depositToGateway()`
- Deposits USDC to Gateway on a specific chain
- Creates unified balance available across chains
- Minimum deposit: 2.01 USDC

#### b. `getGatewayBalance()`
- Queries unified Gateway balance via Circle API
- Returns total balance and per-chain breakdown

#### c. `transferGatewayBalance()`
- Instant cross-chain transfer (<500ms)
- Pulls from multiple source chains
- Uses EIP-712 signatures for burn intents
- Calls `gatewayMint()` on destination

### 4. Balance Aggregator (`src/services/balance-aggregator.ts`)
Smart routing logic:
- `getOptimalTransferRoute()` - Determines best source chains to pull from
- Minimizes number of source chains (lower fees)
- Prefers chains with higher balances

### 5. Orchestrator Updates (`src/services/orchestrator.ts`)
New methods added:
- `depositToGateway()` - Wrapper for Gateway deposits
- `getGatewayBalance()` - Get unified balance
- `transferViaGateway()` - Execute Gateway transfer with auto-routing

### 6. CLI Commands (`src/index.ts`)
New commands:

```bash
# Deposit to Gateway
npm start gateway-deposit <amount> <chain>
npm start gateway-deposit 10 sepolia

# Check Gateway balance
npm start gateway-balance

# Instant Gateway transfer
npm start gateway-transfer <amount> <destination> <recipient>
npm start gateway-transfer 5 arc 0x1234...
```

## CCTP vs Gateway: When to Use Each

### Use CCTP When:
✅ Clear source and destination chains
✅ Simple one-time transfer
✅ Lower fees preferred
✅ Don't need unified balance

**Example:**
```bash
npm start transfer 10  # Sepolia → Arc (5-10 seconds)
```

### Use Gateway When:
✅ Want unified balance across multiple chains
✅ Need instant transfers (<500ms)
✅ Don't know destination chain yet
✅ Want to pool funds from multiple chains

**Example:**
```bash
# Step 1: Deposit to Gateway
npm start gateway-deposit 10 sepolia
npm start gateway-deposit 5 arc

# Step 2: Wait for confirmations (~15-20 min for Sepolia)

# Step 3: Check unified balance
npm start gateway-balance
# Total: 15 USDC across 2 chains

# Step 4: Instant transfer to any chain
npm start gateway-transfer 5 base 0xRecipient
# Completes in <500ms
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         CLI (index.ts)                      │
│  Commands: transfer, gateway-*              │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│     Orchestrator (orchestrator.ts)          │
│  - transferSepoliaToArc (CCTP)             │
│  - depositToGateway                         │
│  - getGatewayBalance                        │
│  - transferViaGateway                       │
└─────────────────────────────────────────────┘
         ↓                            ↓
┌──────────────────┐       ┌──────────────────┐
│  CCTPService     │       │  GatewayService  │
│  (cctp.ts)       │       │  (gateway.ts)    │
│                  │       │                  │
│  - burn          │       │  - deposit       │
│  - attestation   │       │  - balance       │
│  - mint          │       │  - transfer      │
└──────────────────┘       └──────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  BalanceAggregator   │
                          │  Smart routing logic │
                          └──────────────────────┘
```

## Implementation Status

### ✅ Completed
- [x] Gateway configuration
- [x] Gateway types
- [x] Gateway service (deposit, balance, transfer)
- [x] Balance aggregator (smart routing)
- [x] Orchestrator integration
- [x] CLI commands
- [x] Documentation

### ⚠️ Known Limitations

1. **`encodeBurnIntent()` Placeholder**
   - `src/services/gateway.ts:383`
   - Currently returns `'0x'`
   - Needs proper encoding based on Gateway contract ABI
   - Use `viem`'s `encodeAbiParameters()` once exact structure is confirmed

2. **EIP-712 Signature Verification**
   - Implementation matches plan spec
   - May need adjustments based on actual Gateway API requirements
   - Test on testnet to verify

3. **Gateway API Integration**
   - Balance query endpoint implemented
   - Transfer attestation endpoint implemented
   - Real API responses may differ from assumptions

## Next Steps: Testing

### 1. Setup Environment
```bash
cd crosschain-transfer
npm install
cp .env.example .env
# Add PRIVATE_KEY to .env
```

### 2. Get Testnet USDC
- Visit: https://faucet.circle.com/
- Request USDC for Sepolia testnet

### 3. Test Gateway Deposit
```bash
npm start gateway-deposit 3 sepolia
```
Expected:
- Approval transaction (if needed)
- Deposit transaction
- Wait 15-20 minutes for Sepolia confirmations

### 4. Test Gateway Balance
```bash
npm start gateway-balance
```
Expected:
- Shows unified balance across chains
- After confirmations, should show deposited amount

### 5. Test Gateway Transfer
```bash
npm start gateway-transfer 1 arc <recipient-address>
```
Expected:
- Instant transfer (<500ms)
- USDC minted on Arc

### 6. Compare with CCTP
```bash
npm start transfer 1
```
Expected:
- Standard CCTP transfer (5-10 seconds)
- Works independently from Gateway

## File Structure

```
crosschain-transfer/
├── src/
│   ├── config/
│   │   ├── contracts.ts          # CCTP contracts (existing)
│   │   └── gateway.ts             # NEW: Gateway contracts
│   ├── services/
│   │   ├── cctp.ts               # Existing CCTP service
│   │   ├── gateway.ts             # NEW: Gateway service
│   │   ├── balance-aggregator.ts  # NEW: Smart routing
│   │   ├── orchestrator.ts       # UPDATED: Added Gateway methods
│   │   └── wallet.ts             # Existing wallet service
│   ├── types/
│   │   ├── index.ts              # UPDATED: Exports Gateway types
│   │   └── gateway.ts             # NEW: Gateway type definitions
│   └── index.ts                  # UPDATED: Added Gateway CLI commands
├── GATEWAY_IMPLEMENTATION.md     # This file
└── package.json
```

## Important Notes

### Block Confirmations Required
Before Gateway balance is available after deposit:
- **Ethereum Sepolia:** ~65 blocks (~13-19 minutes)
- **Arc Testnet:** Varies (~1 minute)
- **Avalanche Fuji:** 1 block (~8 seconds)
- **Base Sepolia:** ~65 blocks (~13-19 minutes)

### Gateway Fees
- Minimum deposit: **2.01 USDC**
- Transfer fee: ~**2.01 USDC** per Gateway transfer
- This fee covers instant minting on destination

### Address Limitation
Gateway only creates a unified balance for **ONE address across chains**.

**Works:**
- Same wallet (0xABC) has USDC on Sepolia and Arc
- Gateway combines into unified balance

**Does NOT work:**
- Different wallets (0xABC and 0xDEF)
- Cannot aggregate from different private keys

## Troubleshooting

### Error: "Deposit amount below minimum"
- Minimum deposit is 2.01 USDC
- Increase amount: `npm start gateway-deposit 3 sepolia`

### Error: "Insufficient balance"
- Check balance: `npm start gateway-balance`
- Deposit more: `npm start gateway-deposit <amount> <chain>`
- Wait for confirmations after deposit

### Error: "Failed to get attestation"
- Gateway API may be rate-limited
- Check Gateway API status
- Retry after a few seconds

### Transfer seems stuck
- Check transaction on block explorer
- Use burn hash to verify status
- Try resuming: `npm start resume <burnHash>`

## Support

For issues or questions:
1. Check Circle Gateway docs: https://developers.circle.com/gateway
2. Verify contract addresses match testnet
3. Check RPC endpoints are responsive
4. Review transaction on block explorers

## Key Differences: CCTP vs Gateway

| Feature | CCTP | Gateway |
|---------|------|---------|
| **Transfer Speed** | 5-10 seconds | <500ms instant |
| **Complexity** | Simple | More complex |
| **Use Case** | Point-to-point | Unified balance |
| **Source Chains** | 1 source chain | Multiple source chains |
| **Fees** | Lower | ~2.01 USDC per transfer |
| **Setup** | None | Deposit + wait confirmations |

Both remain available - choose based on your use case!
