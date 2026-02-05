# MergePay v6.0 - Implementation Plan

> **Agentic Cross-Chain Payment Protocol with Dual-Interface Design**
>
> **Target**: 3 Prize Tracks (LI.FI $2K + Arc $2.5K + Uniswap $5K = $9.5K)
>
> **Timeline**: 4 Weeks (Hackathon Sprint)

---

## Executive Summary

MergePay v6.0 aggregates fragmented USDC across wallets and networks into unified financial operations through **two parallel interfaces**:

1. **Voiceflow Agent** (Conversational AI) - Natural language commands
2. **Direct UI** (Traditional Web) - Forms, buttons, visual dashboards

**Core Features**:
- Cross-Chain Payment (aggregate from multiple chains → pay to destination)
- Yield Strategy Deposit (pool funds → stake in Uniswap v4)
- Token Swap (exchange across chains)

**RWA Innovation**: Borrow against tokenized invoices on Arc when treasury is low

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERACTION LAYER                      │
├──────────────────────────────┬──────────────────────────────────┤
│   VOICEFLOW AGENT            │   DIRECT UI (React)              │
│   "Pay $100 to 0xabc"        │   [Forms] [Buttons] [Charts]     │
│   Natural Language           │   Visual Controls                │
└──────────────┬───────────────┴──────────────┬───────────────────┘
               │                              │
               v                              v
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API LAYER                          │
│   ┌────────────────────────────────────────────────────────┐   │
│   │  POST /api/payments/aggregate                          │   │
│   │  POST /api/yield/deposit                               │   │
│   │  POST /api/swap                                        │   │
│   │  POST /api/rwa/borrow                                  │   │
│   └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
               │
               v
┌─────────────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER                             │
│  ├── Circle Gateway (Balance Reading)                           │
│  ├── LI.FI SDK (Cross-Chain Routing)                            │
│  ├── Uniswap v4 SDK (Yield Management)                          │
│  └── Arc Blockchain (RWA Operations)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Pages Breakdown

### 2.1 Traditional UI Pages

#### Page 1: Landing Page (`/`)

**Components**:
- `<Hero>` - Tagline: "One Balance. Three Chains. Zero Complexity."
- `<DualInterfacePreview>` - Split screen showing chat vs UI
- `<UseCaseGrid>` - Payment, Yield, Swap cards
- `<PrizeTrackBadges>` - LI.FI, Arc, Uniswap logos
- `<ConnectWalletButton>`

**State**: None (static)

---

#### Page 2: Dashboard (`/app`)

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│ SIDEBAR          │  MAIN CONTENT                            │
│ ├── Dashboard    │  ┌────────────────────────────────────┐  │
│ ├── Payments     │  │  AGGREGATED BALANCE                │  │
│ ├── Yield        │  │  $150.00 USDC                      │  │
│ ├── Swap         │  │  [Quick Pay] [Deposit]             │  │
│ ├── RWA          │  └────────────────────────────────────┘  │
│ └── Chat         │  ┌────────────────────────────────────┐  │
│                  │  │  BREAKDOWN                         │  │
│ [Voice Mode]     │  │  Base      $50                     │  │
│ [Disconnect]     │  │  Arbitrum  $70                     │  │
│                  │  │  Optimism  $30                     │  │
│                  │  └────────────────────────────────────┘  │
│                  │  ┌────────────────────────────────────┐  │
│                  │  │  YIELD POSITIONS                   │  │
│                  │  │  Uniswap v4: $200 (12% APY)        │  │
│                  │  └────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Components**:
- `<AggregatedBalanceCard>` - Total balance across all chains
- `<BalanceBreakdownTable>` - Per-chain balances
- `<YieldPositionCard>` - Active Uniswap positions
- `<QuickActionButtons>` - Pay, Deposit, Swap shortcuts
- `<VoiceModeTrigger>` - Opens Voiceflow chat

**State**:
```typescript
{
  balances: { chain: string, amount: number }[],
  yieldPositions: YieldPosition[],
  isLoading: boolean
}
```

---

#### Page 3: Payment Flow (`/app/payments`)

**Step 1: Input**
```
┌───────────────────────────────────────┐
│  PAY TO                               │
│  ┌─────────────────────────────────┐  │
│  │ 0x... or name.eth               │  │
│  └─────────────────────────────────┘  │
│                                       │
│  AMOUNT                               │
│  ┌─────────────────────────────────┐  │
│  │ $100.00         USDC ▼          │  │
│  └─────────────────────────────────┘  │
│  Available: $150.00                   │
│                                       │
│  [Calculate Route]                    │
└───────────────────────────────────────┘
```

**Step 2: Route Preview**
```
┌───────────────────────────────────────┐
│  OPTIMAL ROUTE (via LI.FI)            │
│  ┌─────────────────────────────────┐  │
│  │  Source Chains:                 │  │
│  │  Base      $50  ─┐              │  │
│  │  Arbitrum  $50  ─┴─> Arc        │  │
│  │                                 │  │
│  │  Bridge: Stargate + Across      │  │
│  │  Fees: $0.25                    │  │
│  │  Time: ~2 min                   │  │
│  └─────────────────────────────────┘  │
│                                       │
│  [Confirm Payment]                    │
└───────────────────────────────────────┘
```

**Step 3: Execution Progress**
```
┌───────────────────────────────────────┐
│  PAYMENT IN PROGRESS                  │
│  ┌─────────────────────────────────┐  │
│  │  [✓] Route calculated           │  │
│  │  [◐] Bridging from Base...      │  │
│  │  [◐] Bridging from Arbitrum...  │  │
│  │  [ ] Settlement on Arc          │  │
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

**Components**:
- `<PaymentForm>` - Recipient + amount inputs
- `<RoutePreview>` - Shows LI.FI routing plan
- `<MultiSourceCard>` - Displays which chains contribute
- `<ProgressStepper>` - Track bridge execution
- `<SuccessScreen>` - Confirmation + explorer link

**State**:
```typescript
{
  recipient: string,
  amount: number,
  route: LifiRoute | null,
  executionStatus: {
    step: 'input' | 'preview' | 'executing' | 'success',
    bridges: BridgeStatus[]
  }
}
```

---

#### Page 4: Yield Management (`/app/yield`)

**Layout**:
```
┌───────────────────────────────────────────────────────────┐
│  AVAILABLE STRATEGIES                                     │
│  ┌────────────────────┐  ┌────────────────────┐          │
│  │ Uniswap v4 Pool    │  │ Restaking          │          │
│  │ 12% APY            │  │ 8% APY             │          │
│  │ Low IL Risk        │  │ High Risk          │          │
│  │ [Deposit]          │  │ [Deposit]          │          │
│  └────────────────────┘  └────────────────────┘          │
│                                                           │
│  YOUR POSITIONS                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Uniswap v4 USDC/USDT Pool                           │ │
│  │ Deposited: $200  |  Current Value: $205             │ │
│  │ APY: 12%         |  P&L: +$5 (+2.5%)                │ │
│  │ ┌────────┐ ┌────────┐ ┌────────┐                   │ │
│  │ │Withdraw│ │Add More│ │Rebalance│                  │ │
│  │ └────────┘ └────────┘ └────────┘                   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  [Aggregate & Deposit]                                    │
└───────────────────────────────────────────────────────────┘
```

**Components**:
- `<StrategyCard>` - Shows APY, risk, protocol
- `<PositionCard>` - Active deposits with P&L
- `<AggregateDepositModal>` - Select chains to pool from
- `<RebalanceButton>` - Trigger auto-rebalance

**State**:
```typescript
{
  strategies: YieldStrategy[],
  positions: YieldPosition[],
  aggregationPlan: { chain: string, amount: number }[]
}
```

---

#### Page 5: Token Swap (`/app/swap`)

**Layout**:
```
┌───────────────────────────────────────┐
│  FROM                                 │
│  ┌─────────────────────────────────┐  │
│  │ $80.00   USDC ▼   Multi-Chain   │  │
│  └─────────────────────────────────┘  │
│  Sources: Base $50 + Arbitrum $30     │
│                                       │
│  TO                                   │
│  ┌─────────────────────────────────┐  │
│  │ $79.70   USDT ▼   Optimism      │  │
│  └─────────────────────────────────┘  │
│                                       │
│  Rate: 1 USDC = 0.9996 USDT           │
│  Fees: $0.30                          │
│                                       │
│  [Execute Swap]                       │
└───────────────────────────────────────┘
```

**Components**:
- `<SwapForm>` - From/To token selectors
- `<MultiChainSourceSelect>` - Choose source chains
- `<RouteInfo>` - Shows LI.FI swap path
- `<ExecuteButton>`

**State**:
```typescript
{
  fromToken: Token,
  toToken: Token,
  amount: number,
  sources: { chain: string, amount: number }[],
  quote: SwapQuote | null
}
```

---

#### Page 6: RWA Dashboard (`/app/rwa`)

**Layout**:
```
┌───────────────────────────────────────────────────────────┐
│  COLLATERAL                                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Tokenized Invoice #1234                             │ │
│  │ Face Value: $10,000  |  Maturity: 30 days           │ │
│  │ LTV: 70%             |  Max Borrow: $7,000          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  BORROWED                                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Outstanding: $2,000                                  │ │
│  │ Interest Rate: 5% APR                                │ │
│  │ Health Factor: 3.5x (Safe)                           │ │
│  │ ┌────────┐ ┌────────┐                               │ │
│  │ │Borrow  │ │Repay   │                               │ │
│  │ └────────┘ └────────┘                               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  AUTO-REPAY FROM YIELD: [Toggle ON]                      │
└───────────────────────────────────────────────────────────┘
```

**Components**:
- `<CollateralCard>` - Shows RWA details
- `<BorrowCard>` - Debt position + health factor
- `<AutoRepayToggle>` - Enable/disable auto-repayment
- `<BorrowModal>`, `<RepayModal>`

**State**:
```typescript
{
  collateral: RWAAsset[],
  borrowPosition: {
    borrowed: number,
    healthFactor: number,
    interestRate: number
  },
  autoRepay: boolean
}
```

---

### 2.2 Voiceflow Chat Interface

**Embedded in**: `/app/chat` page OR floating chat widget on all pages

**Layout**:
```
┌───────────────────────────────────────┐
│  MergePay AI Assistant                │
├───────────────────────────────────────┤
│                                       │
│  Agent: Hi! I can help with payments, │
│         yield deposits, or swaps.     │
│         What would you like to do?    │
│                                       │
│  You: Pay $100 to 0xabc on Base      │
│                                       │
│  Agent: Scanning balances...          │
│         • Base: $50                   │
│         • Arbitrum: $70               │
│                                       │
│         I'll use Base $50 + Arbitrum  │
│         $50. Fees: $0.25. Confirm?    │
│                                       │
│  [Confirm] [Cancel]                   │
│                                       │
└───────────────────────────────────────┘
```

**Voiceflow Configuration**:
- **Intents**: Payment, Yield Deposit, Swap, Borrow, Balance Query
- **Entities**: Amount, Recipient, Chain, Token
- **Actions**: Call backend APIs, format responses
- **Confirmations**: Always require explicit "yes" before execution

**Integration**:
- Voiceflow Webchat SDK embedded in React
- Backend handles actual blockchain operations
- Chat sends structured commands to API

---

## 3. Database Schema

### 3.1 PostgreSQL Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  chain VARCHAR(50) NOT NULL,
  address VARCHAR(100) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  connected_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, chain, address)
);

-- Balance Cache
CREATE TABLE balance_cache (
  wallet_id UUID REFERENCES wallets(id),
  balance_usdc DECIMAL(18, 6),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (wallet_id)
);

-- Transactions (All types: payment, yield, swap)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL, -- 'payment' | 'yield_deposit' | 'swap' | 'rwa_borrow'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'executing' | 'completed' | 'failed'
  
  -- Common fields
  amount DECIMAL(18, 6),
  execution_plan JSONB NOT NULL, -- LI.FI route or aggregation plan
  total_fees DECIMAL(18, 6),
  
  -- Type-specific fields (nullable)
  recipient VARCHAR(100), -- For payments
  token_in VARCHAR(10), -- For swaps
  token_out VARCHAR(10), -- For swaps
  strategy_id UUID, -- For yield deposits
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Bridge Operations (sub-transactions)
CREATE TABLE bridge_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  source_chain VARCHAR(50),
  destination_chain VARCHAR(50),
  amount DECIMAL(18, 6),
  bridge_provider VARCHAR(50), -- 'stargate' | 'across' | 'lifi'
  bridge_tx_hash VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Yield Strategies (available options)
CREATE TABLE yield_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  protocol VARCHAR(50), -- 'uniswap_v4' | 'restaking'
  chain VARCHAR(50),
  apy DECIMAL(5, 2),
  risk_level VARCHAR(20), -- 'low' | 'medium' | 'high'
  is_active BOOLEAN DEFAULT true
);

-- User Yield Positions
CREATE TABLE yield_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  strategy_id UUID REFERENCES yield_strategies(id),
  deposited_amount DECIMAL(18, 6),
  current_value DECIMAL(18, 6),
  entry_timestamp TIMESTAMP DEFAULT NOW(),
  last_rebalance_at TIMESTAMP,
  auto_rebalance BOOLEAN DEFAULT false
);

-- RWA Collateral
CREATE TABLE rwa_collateral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  asset_type VARCHAR(50), -- 'invoice' | 'real_estate' | 'bond'
  face_value DECIMAL(18, 2),
  maturity_date DATE,
  ltv_ratio DECIMAL(5, 2), -- 70.00 for 70%
  arc_token_id VARCHAR(100), -- On-chain token ID
  created_at TIMESTAMP DEFAULT NOW()
);

-- RWA Borrow Positions
CREATE TABLE rwa_borrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  collateral_id UUID REFERENCES rwa_collateral(id),
  borrowed_amount DECIMAL(18, 6),
  interest_rate DECIMAL(5, 2), -- Annual rate
  health_factor DECIMAL(5, 2),
  auto_repay_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  repaid_at TIMESTAMP
);

-- Voiceflow Conversation Logs
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  sender VARCHAR(20), -- 'user' | 'agent'
  intent VARCHAR(50), -- Detected intent
  action_taken JSONB, -- API call details
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### 3.2 Redis Cache Structure

```
# Balance aggregation cache
balance:user:{user_id}:total   -> "150.00" (TTL: 30s)
balance:user:{user_id}:breakdown -> JSON of per-chain balances (TTL: 30s)

# LI.FI route cache
route:{source_chains_hash}:{destination}:{amount} -> JSON route (TTL: 60s)

# Session keys (Yellow Network)
session:{user_id}:key -> session_key_hash (TTL: 1 hour)
```

---

## 4. API Endpoints

```
POST   /api/auth/connect          # Connect wallet, create user session
POST   /api/auth/disconnect       # Disconnect wallet

GET    /api/balances              # Get aggregated balance
GET    /api/balances/breakdown    # Get per-chain breakdown

POST   /api/payments/calculate    # Calculate optimal route
POST   /api/payments/execute      # Execute cross-chain payment
GET    /api/payments/status/:id   # Poll payment status

GET    /api/yield/strategies      # List available yield options
POST   /api/yield/deposit         # Aggregate & deposit to strategy
POST   /api/yield/withdraw        # Withdraw from position
POST   /api/yield/rebalance       # Trigger rebalance

POST   /api/swap/quote            # Get swap quote
POST   /api/swap/execute          # Execute token swap

GET    /api/rwa/collateral        # Get user's RWA assets
POST   /api/rwa/borrow            # Borrow against collateral
POST   /api/rwa/repay             # Repay borrowed amount
GET    /api/rwa/health            # Get health factor

POST   /api/voiceflow/message     # Relay chat message to Voiceflow
POST   /api/voiceflow/action      # Execute agent-requested action
```

---

## 5. Smart Contracts

### 5.1 Contracts to Build

#### Contract 1: PaymentAggregator.sol (on Arc)
```solidity
// Receives funds from multiple bridges
// Consolidates into single payment to merchant

contract PaymentAggregator {
    mapping(bytes32 => Payment) public payments;
    
    struct Payment {
        address recipient;
        uint256 expectedAmount;
        uint256 receivedAmount;
        uint8 sourcesCount;
        uint8 sourcesReceived;
        bool completed;
    }
    
    function initPayment(
        bytes32 paymentId,
        address recipient,
        uint256 amount,
        uint8 sources
    ) external;
    
    function receiveFunds(bytes32 paymentId) external payable;
    
    function completePay ment(bytes32 paymentId) external;
}
```

#### Contract 2: YieldStrategyManager.sol (on Arc)
```solidity
// Manages Uniswap v4 deposits
// Handles auto-rebalancing

import "@uniswap/v4-core/contracts/interfaces/IPoolManager.sol";

contract YieldStrategyManager {
    IPoolManager public poolManager;
    
    struct Position {
        address user;
        uint256 liquidity;
        uint256 entryTimestamp;
        bool autoRebalance;
    }
    
    function depositToPool(
        uint256 amount,
        bool enableAutoRebalance
    ) external returns (uint256 positionId);
    
    function withdraw(uint256 positionId) external;
    
    function rebalance(uint256 positionId) external;
}
```

#### Contract 3: RWABorrowing.sol (on Arc)
```solidity
// Borrow against tokenized invoices
// Auto-repay from yield earnings

contract RWABorrowing {
    struct Collateral {
        uint256 faceValue;
        uint256 maturity;
        uint256 ltvRatio;
        address owner;
    }
    
    struct Loan {
        uint256 borrowed;
        uint256 interestRate;
        uint256 healthFactor;
        bool autoRepayEnabled;
    }
    
    function depositCollateral(
        uint256 tokenId,
        uint256 faceValue,
        uint256 maturity
    ) external;
    
    function borrow(uint256 collateralId, uint256 amount) external;
    
    function repay(uint256 loanId, uint256 amount) external;
    
    function enableAutoRepay(uint256 loanId) external;
}
```

---

## 6. Integration Checklist

### LI.FI SDK Integration
- [ ] Install `@lifi/sdk`
- [ ] Configure supported chains (Base, Arbitrum, Optimism, Arc)
- [ ] Implement multi-source route calculation
- [ ] Handle transaction signing and execution
- [ ] Poll bridge status for completion
- [ ] Log routing decisions for agent explanations

### Circle Gateway SDK
- [ ] Obtain API keys
- [ ] Implement balance aggregation across networks
- [ ] Cache balances in Redis (30-second TTL)
- [ ] WebSocket push for real-time updates

### Uniswap v4 SDK
- [ ] Deploy custom hook on Arc testnet
- [ ] Integrate position management functions
- [ ] Implement auto-rebalancing logic
- [ ] Calculate APY and IL metrics

### Arc Blockchain
- [ ] Setup Arc RPC endpoint
- [ ] Deploy smart contracts to Arc testnet
- [ ] Implement RWA token minting (for collateral)
- [ ] Test borrowing/repayment flows

### Voiceflow
- [ ] Create Voiceflow workspace
- [ ] Define intents (Payment, Yield, Swap, Borrow, Query)
- [ ] Configure entity extraction (amount, recipient, chain)
- [ ] Set up API integration (call backend endpoints)
- [ ] Add confirmation flows before execution
- [ ] Embed Voiceflow webchat widget

---

## 7. 4-Week Sprint Timeline

### Week 1: Foundation

| Day | Frontend | Backend | Smart Contracts |
|-----|----------|---------|-----------------|
| **Mon** | Init Next.js, TailwindCSS, routing | Init Express, Prisma, DB schema | Init Foundry, setup Arc testnet |
| **Tue** | Landing page, wallet connection | Auth endpoints, Circle SDK setup | PaymentAggregator.sol draft |
| **Wed** | Dashboard layout, balance display | Balance aggregation API | Deploy contracts to testnet |
| **Thu** | Sidebar navigation, basic routing | Redis cache, WebSocket setup | Write deployment scripts |
| **Fri** | Review & testing | LI.FI SDK integration start | Unit tests for contracts |

**Deliverables Week 1**:
- ✅ Working dev environment
- ✅ Wallet connection functional
- ✅ Balance aggregation working
- ✅ Contracts deployed to Arc testnet

---

### Week 2: Core Features

| Day | Frontend | Backend | Smart Contracts |
|-----|----------|---------|-----------------|
| **Mon** | Payment form (step 1: input) | Payment calculation API | YieldStrategyManager.sol |
| **Tue** | Route preview (step 2) | LI.FI route execution | Uniswap v4 hook integration |
| **Wed** | Progress tracker (step 3) | Bridge status polling | RWABorrowing.sol |
| **Thu** | Yield deposit UI | Yield deposit API | Test all contracts |
| **Fri** | Swap UI | Swap API | Security audit prep |

**Deliverables Week 2**:
- ✅ Payment flow working end-to-end
- ✅ Yield deposit functional
- ✅ Token swap operational
- ✅ All 3 smart contracts deployed

---

### Week 3: AI Agent & RWA

| Day | Frontend | Backend | Voiceflow |
|-----|----------|---------|-----------|
| **Mon** | Chat widget integration | Voiceflow webhook setup | Create workspace, define intents |
| **Tue** | Voice mode UI | Agent action handlers | Payment intent + entity extraction |
| **Wed** | RWA dashboard | RWA borrow/repay API | Yield intent + confirmation flow |
| **Thu** | Auto-repay toggle | Auto-repay cron job | Swap intent + multi-turn dialogs |
| **Fri** | Polish chat UX | Error handling | Test all intents |

**Deliverables Week 3**:
- ✅ Voiceflow agent functional
- ✅ RWA borrowing working
- ✅ Auto-repay from yield enabled
- ✅ Both interfaces tested

---

### Week 4: Polish & Demo

| Day | All Team Tasks |
|-----|----|
| **Mon** | UI polish, animations, responsive design |
| **Tue** | End-to-end testing (both interfaces) |
| **Wed** | Video demo recording (show LI.FI, Arc, Uniswap features) |
| **Thu** | Documentation, README, deployment |
| **Fri** | Final review, submission |

**Deliverables Week 4**:
- ✅ Production-ready app
- ✅ Demo video showcasing 3 prize tracks
- ✅ GitHub repo with documentation
- ✅ Submitted to hackathon

---

## 8. Verification Plan

### Automated Tests

#### Backend API Tests
```bash
# Run from apps/api directory
npm run test

# Tests:
# - POST /api/payments/calculate returns valid LI.FI route
# - POST /api/yield/deposit aggregates from multiple chains
# - GET /api/balances returns correct sum
# - RWA health factor calculation is accurate
```

#### Smart Contract Tests
```bash
cd packages/contracts
forge test -vvv

# Tests:
# - PaymentAggregator receives from 2+ sources
# - YieldStrategyManager deposits to Uniswap v4
# - RWABorrowing calculates health factor correctly
# - Auto-repay triggers at threshold
```

### Manual Tests

#### Test 1: Cross-Chain Payment (Direct UI)
1. Open `/app/payments`
2. Enter recipient `0xTestAddress` and amount `$100`
3. Click "Calculate Route"
4. **Verify**: Route preview shows Base + Arbitrum sources
5. Click "Confirm Payment"
6. Sign transaction in MetaMask
7. **Verify**: Progress tracker updates in real-time
8. **Verify**: Transaction appears in history after ~2 min

#### Test 2: Cross-Chain Payment (Voiceflow)
1. Open `/app/chat`
2. Type: "Pay $100 to 0xTestAddress on Arc"
3. **Verify**: Agent responds with balance breakdown
4. **Verify**: Agent shows route plan (which chains used)
5. Type: "Confirm"
6. **Verify**: Agent triggers backend API
7. **Verify**: Same result as direct UI test

#### Test 3: Yield Deposit
1. Open `/app/yield`
2. Select "Uniswap v4 Pool"
3. Enter amount `$150`
4. **Verify**: Shows aggregation plan (Base $50 + Arb $70 + OP $30)
5. Click "Deposit"
6. **Verify**: Position appears in "Your Positions" section
7. **Verify**: APY and P&L displayed correctly

#### Test 4: RWA Borrow & Auto-Repay
1. Open `/app/rwa`
2. Click "Borrow" on collateral card
3. Enter amount `$2000`
4. **Verify**: Health factor updates
5. Toggle "Auto-Repay from Yield" ON
6. Simulate yield earnings (add balance manually)
7. **Verify**: Backend cron job repays debt automatically
8. **Verify**: Borrowed amount decreases

### Prize Track Verification

#### LI.FI Track ($2,000)
**Requirement**: AI agent uses LI.FI SDK programmatically
**Verification**:
1. Open chat, execute payment via agent
2. Check backend logs for `lifi.getRoutes()` call
3. Verify agent explains routing in natural language

#### Arc Track ($2,500)
**Requirement**: Agentic commerce with RWA
**Verification**:
1. Chat: "Borrow against my invoice"
2. Verify agent triggers RWA contract on Arc
3. Check Arc explorer for collateral transaction

#### Uniswap Track ($5,000)
**Requirement**: Agentic v4 position management
**Verification**:
1. Chat: "Deposit earnings to yield"
2. Verify agent deposits to Uniswap v4 pool
3. Trigger rebalance via agent command
4. Check position value on Arc

---

## 9. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| LI.FI API rate limits | High | Cache routes, implement fallback bridges |
| Arc testnet downtime | High | Use local fork for development |
| Voiceflow parsing errors | Medium | Add explicit confirmation for all actions |
| Bridge delays (>30 min) | Medium | Set user expectations, show real-time status |
| Smart contract audit needed | Low | Use OpenZeppelin libraries, get informal review |

---

## 10. Success Criteria

### Minimum Viable Product (MVP)
- [ ] User can connect 2+ wallets
- [ ] Aggregated balance displays correctly
- [ ] Cross-chain payment works via both UI and chat
- [ ] Yield deposit to Uniswap v4 functional
- [ ] RWA borrowing operational
- [ ] All 3 prize track features demonstrated in video

### Stretch Goals
- [ ] Mobile-responsive design
- [ ] Transaction history with filters
- [ ] Email notifications for completions
- [ ] Mainnet deployment ready (post-hackathon)

---

## Resources

- **LI.FI Docs**: https://docs.li.fi
- **Voiceflow Docs**: https://docs.voiceflow.com
- **Uniswap v4 Docs**: https://docs.uniswap.org/contracts/v4
- **Arc Blockchain**: [Documentation link TBD]
- **Circle Gateway**: https://developers.circle.com

---

> **Next Steps**: Review this plan, then proceed to Week 1 Sprint execution
