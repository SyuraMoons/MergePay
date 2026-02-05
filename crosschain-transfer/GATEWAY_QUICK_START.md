# Gateway Quick Start Guide

## Setup (One-Time)

1. **Get API Key** from https://circle.com/en/developers

2. **Add to .env file:**
   ```bash
   CIRCLE_GATEWAY_API_KEY=your_api_key_here
   ```

3. **Get Testnet Tokens:**
   - USDC: https://faucet.circle.com/
   - Sepolia ETH: https://sepoliafaucet.com/
   - Arc ETH: https://faucet.arc.dev/

## Commands

### Check Balance
```bash
npm start gateway-balance
```

Shows your unified USDC balance across all supported chains.

### Deposit USDC
```bash
npm start gateway-deposit <amount> <chain>
```

**Example:**
```bash
npm start gateway-deposit 10 sepolia
```

Creates a unified balance. Wait 13-19 minutes for confirmations.

### Transfer (Instant)
```bash
npm start gateway-transfer <amount> <destination-chain> <recipient>
```

**Example:**
```bash
npm start gateway-transfer 5 arc 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

Transfer completes in <1 second after initial deposit confirmations.

## Full Workflow Example

```bash
# 1. Deposit USDC to Gateway
npm start gateway-deposit 10 sepolia

# 2. Wait 15-20 minutes for blockchain confirmations

# 3. Check balance
npm start gateway-balance

# 4. Transfer instantly to Arc
npm start gateway-transfer 5 arc 0xYourAddress

# 5. Check balance again
npm start gateway-balance
```

## Supported Chains

- `sepolia` - Ethereum Sepolia Testnet (domain: 0)
- `arc` - Arc Testnet (domain: 6)

## Key Differences: Gateway vs CCTP

| Feature | Gateway | CCTP |
|---------|---------|------|
| **Speed** | <1 second | 13-20 minutes |
| **Setup** | Deposit first | Direct transfer |
| **Balance** | Unified across chains | Per-chain |
| **Cost** | Single gas fee | Two gas fees |
| **Best For** | Frequent transfers | One-time transfers |

## Troubleshooting

### "CIRCLE_GATEWAY_API_KEY not set"
- Add API key to `.env` file
- Get from: https://circle.com/en/developers

### "Failed to query Gateway balance: Not Found"
- This error should now be fixed
- Make sure you have the latest code
- Verify API key is correct

### "Insufficient balance"
- Deposit USDC first with `gateway-deposit`
- Wait for confirmations (13-19 minutes)
- Check balance with `gateway-balance`

### Transfer shows "pending"
- Initial deposit requires blockchain confirmations
- Wait 13-19 minutes after first deposit
- Subsequent transfers are instant

## What Changed?

All Gateway API integration issues have been fixed:

✅ Balance queries now use correct API endpoint (POST with auth)
✅ Transfer requests use correct body structure
✅ CLI shows "Gateway" header for gateway commands
✅ Destination contract uses GATEWAY_MINTER (not GATEWAY_WALLET)

## Documentation

- [Circle Gateway Docs](https://developers.circle.com/gateway/concepts/technical-guide)
- [Gateway API Reference](https://developers.circle.com/api-reference/gateway)
- [Get API Key](https://circle.com/en/developers)
