import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routers
import transferRoutes from './api/routes/transfer.js';
import gatewayRoutes from './api/routes/gateway.js';
import treasuryRoutes from './api/routes/treasury.js';
import walletRoutes from './api/routes/wallet.js';
import circleRoutes from './api/routes/circle.js';

// Import middleware
import { errorHandler } from './api/middleware/error-handler.js';
import { requestLogger } from './api/middleware/logger.js';
import { apiKeyAuth } from './api/middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Authentication (exclude health check)
app.use('/api', apiKeyAuth);

// Routes
app.use('/api/transfer', transferRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/circle', circleRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'arc-treasury-hub',
    version: '1.0.0',
  });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        Arc Treasury Hub API Server                            ║
║        http://localhost:${PORT}                                    ║
╚═══════════════════════════════════════════════════════════════╝

Available endpoints:
  POST   /api/transfer/cctp           - Execute CCTP transfer
  POST   /api/transfer/cctp/resume    - Resume interrupted transfer
  GET    /api/transfer/cctp/status/:txHash

  POST   /api/gateway/deposit         - Deposit to Gateway
  POST   /api/gateway/transfer        - Instant cross-chain transfer
  GET    /api/gateway/balance         - Check unified balance

  POST   /api/treasury/policy/configure       - Setup policy
  GET    /api/treasury/policy/:address        - Get policy status
  POST   /api/treasury/policy/execute         - Execute policy
  GET    /api/treasury/policy/can-execute/:address
  GET    /api/treasury/pools                  - View available pools

  POST   /api/circle/users/token      - Generate user token
  POST   /api/circle/wallets/initialize   - Initialize wallet
  POST   /api/circle/wallets/transfer     - Execute wallet transfer
  GET    /api/circle/wallets/:userId      - Get user's wallets

  GET    /api/wallet/status           - Wallet balances
  GET    /api/wallet/balances/:address

  GET    /health                      - Health check
  `);
});

export default app;
