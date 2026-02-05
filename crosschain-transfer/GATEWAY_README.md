# Circle Gateway Integration - Quick Start

## What is Gateway?

Circle Gateway creates a **unified USDC balance** across multiple blockchain chains, allowing **instant cross-chain transfers** (<500ms) without waiting for attestations.

### Key Differences from CCTP

| Feature | CCTP | Gateway |
|---------|------|---------|
| Speed | 5-10 seconds | <500ms instant |
| Use Case | Point-to-point transfer | Unified balance across chains |
| Setup | None | Deposit + wait confirmations |
| Fees | Lower | ~2.01 USDC per transfer |
| Source Chains | 1 chain | Multiple chains in one transfer |

## Quick Start Guide

### 1. Setup
```bash
cd crosschain-transfer
npm install

# Create .env file
cp .env.example .env

# Add your private key to .env
echo "PRIVATE_KEY=0x..." >> .env
```

### 2. Get Testnet USDC
Visit: https://faucet.circle.com/
- Select Ethereum Sepolia
- Request USDC

### 3. Workflow: CCTP Transfer (Simple)

For simple point-to-point transfers, use CCTP:

```bash
# Transfer 5 USDC from Sepolia to Arc
npm start transfer 5

# Or specify recipient
npm start transfer 5 0xRecipientAddress
```

**Result:** Transfer completes in ~5-10 seconds

### 4. Workflow: Gateway Transfer (Instant)

For unified balance and instant transfers:

#### Step 1: Deposit to Gateway
```bash
# Deposit 10 USDC to Gateway on Sepolia
npm start gateway-deposit 10 sepolia
```

**Wait:** ~15-20 minutes for Sepolia confirmations

#### Step 2: Check Unified Balance
```bash
npm start gateway-balance
```

**Output:**
```
=== Gateway Balance ===

Address: 0xYourAddress
Total: $10.00 USDC

  sepolia: $10.00 USDC
  arc: $0.00 USDC
```

#### Step 3: Instant Transfer
```bash
# Transfer 5 USDC from unified balance to Arc
npm start gateway-transfer 5 arc 0xRecipientAddress
```

**Result:** Transfer completes in <500ms! 🚀

## CLI Commands Reference

### Gateway Commands

```bash
# Deposit USDC to Gateway on a chain
npm start gateway-deposit <amount> <chain>
npm start gateway-deposit 10 sepolia

# Check unified Gateway balance
npm start gateway-balance

# Instant cross-chain transfer from Gateway
npm start gateway-transfer <amount> <destination> <recipient>
npm start gateway-transfer 5 arc 0x1234...

# Short aliases also work
npm start gw-deposit 10 sepolia
npm start gw-balance
npm start gw-transfer 5 arc 0x1234...
```

### CCTP Commands (Existing)

```bash
# Simple CCTP transfer (Sepolia → Arc)
npm start transfer <amount>
npm start transfer 10

# With specific recipient
npm start transfer <amount> <recipient>
npm start transfer 10 0x1234...

# Resume interrupted transfer
npm start resume <burnTxHash>
```

### General Commands

```bash
# Check wallet balances
npm start

# Show help
npm start help
```

## Supported Chains

Gateway testnet supports:
- `sepolia` - Ethereum Sepolia
- `arc` - Arc Testnet
- `base` - Base Sepolia
- `avalanche` - Avalanche Fuji

## Important Notes

### Block Confirmations

After depositing to Gateway, wait for confirmations before balance is available:

| Chain | Confirmations | Time |
|-------|--------------|------|
| Ethereum Sepolia | 65 blocks | ~13-19 minutes |
| Arc Testnet | Varies | ~1 minute |
| Base Sepolia | 65 blocks | ~13-19 minutes |
| Avalanche Fuji | 1 block | ~8 seconds |

### Gateway Fees

- **Minimum deposit:** 2.01 USDC
- **Transfer fee:** ~2.01 USDC per Gateway transfer
- Fee covers instant minting on destination

### Single Address Only

Gateway creates a unified balance for **one address across multiple chains**.

**Works:**
```
Address 0xABC:
- 10 USDC on Sepolia
- 5 USDC on Arc
→ Gateway shows: 15 USDC total
```

**Does NOT work:**
```
Wallet A (0xABC): 10 USDC
Wallet B (0xDEF): 5 USDC
→ Cannot combine in Gateway
```

## Example Workflows

### Workflow 1: Pool Funds from Multiple Chains

```bash
# Deposit on multiple chains
npm start gateway-deposit 10 sepolia
npm start gateway-deposit 5 arc

# Wait for confirmations (~15-20 minutes for Sepolia)

# Check unified balance
npm start gateway-balance
# Total: $15.00 USDC

# Transfer all to Base instantly
npm start gateway-transfer 15 base 0xRecipient
```

### Workflow 2: Keep Liquidity Ready

```bash
# Deposit once
npm start gateway-deposit 20 sepolia

# Wait for confirmations

# Later: Instant transfers to any chain
npm start gateway-transfer 5 arc 0xAddr1
npm start gateway-transfer 3 base 0xAddr2
npm start gateway-transfer 7 avalanche 0xAddr3
# All transfers complete in <500ms each
```

### Workflow 3: Compare CCTP vs Gateway

```bash
# CCTP: Simple transfer (5-10 seconds)
time npm start transfer 5

# Gateway: Instant transfer (<500ms, after initial deposit)
npm start gateway-deposit 10 sepolia  # One-time setup
# ... wait for confirmations ...
time npm start gateway-transfer 5 arc 0xRecipient  # Instant!
```

## When to Use CCTP vs Gateway

### Use CCTP When:
✅ Simple one-time transfer
✅ Clear source and destination
✅ Lower fees preferred
✅ Don't need unified balance

### Use Gateway When:
✅ Need instant transfers
✅ Want unified balance across chains
✅ Don't know destination chain in advance
✅ Pooling from multiple chains
✅ High-frequency transfers

## Troubleshooting

### Error: "Deposit amount below minimum"
**Solution:**
```bash
# Minimum is 2.01 USDC
npm start gateway-deposit 3 sepolia
```

### Error: "Insufficient balance"
**Check balance:**
```bash
npm start gateway-balance
```

**Deposit more:**
```bash
npm start gateway-deposit 5 sepolia
```

### Balance shows $0 after deposit
**Reason:** Waiting for block confirmations

**Solution:** Wait ~15-20 minutes for Sepolia, then check again:
```bash
npm start gateway-balance
```

### Transfer seems slow
**Check if using correct mode:**

```bash
# Gateway transfer (instant)
npm start gateway-transfer 5 arc 0x...

# vs CCTP transfer (5-10 seconds)
npm start transfer 5
```

### "Failed to get attestation"
**Solutions:**
1. Wait a few seconds and retry
2. Check Circle Gateway API status
3. Verify chain and contract addresses

## Testing on Testnet

### Step 1: Get Testnet USDC
1. Visit: https://faucet.circle.com/
2. Select "Ethereum Sepolia"
3. Enter your wallet address
4. Request USDC

### Step 2: Test CCTP Transfer
```bash
npm start transfer 1
```
Expected: Transfer completes in ~5-10 seconds

### Step 3: Test Gateway Deposit
```bash
npm start gateway-deposit 3 sepolia
```
Expected:
- Approval tx (if needed)
- Deposit tx
- Wait message

### Step 4: Wait for Confirmations
**Wait ~15-20 minutes** for Sepolia confirmations

### Step 5: Check Gateway Balance
```bash
npm start gateway-balance
```
Expected: Shows deposited amount

### Step 6: Test Instant Transfer
```bash
npm start gateway-transfer 1 arc <your-address>
```
Expected: Transfer completes in <500ms

## Block Explorers

Monitor your transactions:

- **Ethereum Sepolia:** https://sepolia.etherscan.io
- **Arc Testnet:** https://testnet.arcscan.app
- **Base Sepolia:** https://sepolia.basescan.org
- **Avalanche Fuji:** https://testnet.snowtrace.io

## Additional Resources

- **Circle Gateway Docs:** https://developers.circle.com/gateway
- **Circle CCTP Docs:** https://developers.circle.com/cctp
- **USDC Faucet:** https://faucet.circle.com/

## Support

For implementation details, see:
- `GATEWAY_IMPLEMENTATION.md` - Technical implementation details
- `src/config/gateway.ts` - Gateway configuration
- `src/services/gateway.ts` - Gateway service code

## Summary

**CCTP:** Simple, direct transfers
```bash
npm start transfer 10  # Done in 5-10 seconds
```

**Gateway:** Unified balance, instant transfers
```bash
npm start gateway-deposit 10 sepolia    # One-time setup
npm start gateway-balance                # Check balance
npm start gateway-transfer 5 arc 0x...  # Instant (<500ms)
```

Choose the right tool for your use case! 🚀
