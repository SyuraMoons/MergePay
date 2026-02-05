# Quick Start - Arc Treasury Hub API

Get up and running in 5 minutes.

---

## 1. Install Dependencies

```bash
cd crosschain-transfer
npm install
```

---

## 2. Start Server

```bash
npm run server
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║        Arc Treasury Hub API Server                            ║
║        http://localhost:4000                                    ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 3. Test It Works

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "arc-treasury-hub",
  "version": "1.0.0"
}
```

✅ **Backend is running!**

---

## 4. Use in Frontend

### Setup (one-time)

```bash
cd frontend
pnpm dev
```

### Make API Calls

```typescript
import { executeCctpTransfer } from '@/services/api/transfer';

const handleTransfer = async () => {
  const result = await executeCctpTransfer({
    amount: 10,
    recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    privateKey: '0x...', // ⚠️ Demo only!
  });

  console.log('Success:', result.success);
  console.log('Explorer:', result.explorerUrls);
};
```

---

## 5. Available Features

### CCTP Transfers
```typescript
import { executeCctpTransfer } from '@/services/api/transfer';
```

### Gateway Instant Transfers
```typescript
import { transferViaGateway } from '@/services/api/gateway';
```

### Treasury Automation
```typescript
import { configureTreasuryPolicy } from '@/services/api/treasury';
```

### Circle Wallets
```typescript
import { createUserToken, initializeWallet } from '@/services/api/circle';
```

---

## Common Commands

```bash
# Start API server
npm run server

# Start in watch mode (auto-reload)
npm run dev

# Run original CLI
npm run cli

# Type check
npm run type-check
```

---

## Environment Variables (Optional)

Create `.env` file:

```bash
# Optional - for Circle User-Controlled Wallets
CIRCLE_API_KEY=your_key_here

# Optional - custom port
PORT=4000
```

**Note:** Server works without CIRCLE_API_KEY (Circle features disabled).

---

## Endpoints

**Full list:** See `API_REFERENCE.md`

**Quick reference:**
- `POST /api/transfer/cctp` - CCTP transfer
- `POST /api/gateway/transfer` - Gateway transfer
- `POST /api/treasury/policy/configure` - Setup policy
- `POST /api/circle/users/token` - Create user token
- `GET /health` - Health check

---

## Troubleshooting

### Port 4000 already in use
```bash
lsof -ti:4000 | xargs kill -9
npm run server
```

### Frontend can't connect
1. Check backend is running: `curl http://localhost:4000/health`
2. Check frontend .env.local: `NEXT_PUBLIC_API_URL=http://localhost:4000/api`

### Circle endpoints return errors
- **Normal:** Circle features require `CIRCLE_API_KEY` in `.env`
- Other endpoints work without it

---

## Next Steps

1. ✅ Backend running
2. 🔲 Build frontend UI components
3. 🔲 Integrate API calls
4. 🔲 Test end-to-end flows

---

## Need Help?

- **API Docs:** `API_REFERENCE.md`
- **Full Guide:** `BACKEND_MIGRATION_COMPLETE.md`
- **Checklist:** `../IMPLEMENTATION_CHECKLIST.md`

**You're ready to build! 🚀**
