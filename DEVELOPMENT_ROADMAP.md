# MergePay Development Roadmap

> **Total Estimasi: 12-16 Minggu (4 Sprints)**

---

## Team Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEAM BREAKDOWN                           │
├─────────────────┬───────────────────────────────────────────────┤
│ FRONTEND        │ 2 developers - Next.js, React, Web3 UI       │
│ BACKEND         │ 2 developers - Node.js, APIs, Integrations   │
│ SMART CONTRACTS │ 1-2 developers - Solidity, Move (Sui)        │
│ DEVOPS/INFRA    │ 1 developer - Cloud, CI/CD, Monitoring       │
└─────────────────┴───────────────────────────────────────────────┘
```

---

## SPRINT 0: Foundation (Minggu 1-2)

### Objective: Setup environment & basic infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                         SPRINT 0                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ALL TEAM] Project Setup                                       │
│  ├── Repository structure (monorepo dengan Turborepo/Nx)       │
│  ├── CI/CD pipeline (GitHub Actions)                           │
│  ├── Development environment (Docker Compose)                  │
│  └── Code standards (ESLint, Prettier, Husky)                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  FRONTEND                                                       │
│  ├── [ ] Init Next.js 14 project dengan App Router             │
│  ├── [ ] Setup TailwindCSS / design system                     │
│  ├── [ ] Wallet connection UI (WalletConnect, MetaMask)        │
│  └── [ ] Basic layout & navigation                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND                                                        │
│  ├── [ ] Init Node.js/Express atau Fastify server              │
│  ├── [ ] Database setup (PostgreSQL + Prisma ORM)              │
│  ├── [ ] Redis untuk caching & session                         │
│  └── [ ] API structure & documentation (OpenAPI/Swagger)       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  SMART CONTRACTS                                                │
│  ├── [ ] Hardhat/Foundry project setup                         │
│  ├── [ ] Deploy scripts untuk testnets                         │
│  └── [ ] Basic contract structure                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  DATABASE SCHEMA v1                                             │
│  ├── users (wallet_address, created_at, preferences)           │
│  ├── sessions (user_id, session_key, expires_at)               │
│  ├── transactions (id, user_id, status, amount, chains)        │
│  └── balances_cache (user_id, chain, balance, updated_at)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Deliverables Sprint 0:**
- Working dev environment untuk semua team
- Basic frontend dengan wallet connection
- API server running dengan health check
- Database schema deployed
- Testnet deployment workflow ready

---

## SPRINT 1: Balance Aggregation (Minggu 3-5)

### Objective: User bisa lihat unified balance dari semua chain

```
┌─────────────────────────────────────────────────────────────────┐
│                         SPRINT 1                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND (2 devs)                                              │
│  ├── [ ] Dashboard UI dengan balance display                   │
│  │   ├── Total unified balance (besar, prominent)              │
│  │   ├── Breakdown per chain (collapsible)                     │
│  │   └── Real-time balance updates (WebSocket)                 │
│  ├── [ ] Multi-wallet connection flow                          │
│  │   ├── Connect EVM wallets (MetaMask, WalletConnect)         │
│  │   ├── Connect Sui wallet                                    │
│  │   └── Wallet management UI (add/remove)                     │
│  └── [ ] Loading states & error handling                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND (2 devs)                                               │
│  ├── [ ] Circle Gateway Integration                            │
│  │   ├── API wrapper untuk Circle SDK                          │
│  │   ├── Balance query endpoint per chain                      │
│  │   └── Aggregation logic (sum across chains)                 │
│  ├── [ ] Balance Caching Layer                                 │
│  │   ├── Redis cache dengan TTL (30 detik)                     │
│  │   ├── Background refresh job                                │
│  │   └── WebSocket push untuk updates                          │
│  ├── [ ] ENS Resolution Service                                │
│  │   ├── Resolve .eth addresses                                │
│  │   └── Cache resolved addresses                              │
│  └── [ ] User wallet registry                                  │
│      ├── Store connected wallets per user                      │
│      └── Signature verification                                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  SMART CONTRACTS (1 dev)                                        │
│  ├── [ ] Research & document supported chains                  │
│  │   ├── Base, Arbitrum, Optimism contract addresses           │
│  │   └── USDC contract interfaces                              │
│  └── [ ] Prepare approval flow contracts (jika needed)         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  DATABASE                                                       │
│  ├── wallets (id, user_id, chain, address, is_primary)         │
│  ├── balance_snapshots (wallet_id, balance, timestamp)         │
│  └── ens_cache (name, resolved_address, expires_at)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Deliverables Sprint 1:**
- User bisa connect multiple wallets
- Dashboard menampilkan unified balance real-time
- Balance breakdown per chain visible
- ENS resolution working

---

## SPRINT 2: Smart Sourcing Engine (Minggu 6-9)

### Objective: Routing logic & payment execution

```
┌─────────────────────────────────────────────────────────────────┐
│                         SPRINT 2                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND (2 devs)                                              │
│  ├── [ ] Payment Flow UI                                       │
│  │   ├── "Pay" button dengan amount input                      │
│  │   ├── Recipient input (address atau ENS)                    │
│  │   ├── Route preview (show which chains akan dipakai)        │
│  │   └── Fee estimation display                                │
│  ├── [ ] Transaction Status UI                                 │
│  │   ├── Step-by-step progress indicator                       │
│  │   ├── Bridge status per chain                               │
│  │   └── Final confirmation screen                             │
│  └── [ ] Transaction History page                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND (2 devs) - CRITICAL PATH                               │
│  ├── [ ] Smart Sourcing Engine                                 │
│  │   ├── Route calculation algorithm                           │
│  │   │   ├── Input: amount, available balances                 │
│  │   │   ├── Fetch gas prices per chain                        │
│  │   │   ├── Fetch bridge fees (LI.FI API)                     │
│  │   │   ├── Calculate optimal split                           │
│  │   │   └── Output: execution plan                            │
│  │   └── Route optimization strategies                         │
│  │       ├── Lowest fee                                        │
│  │       ├── Fastest                                           │
│  │       └── Balanced                                          │
│  ├── [ ] LI.FI Integration                                     │
│  │   ├── Quote API integration                                 │
│  │   ├── Route API integration                                 │
│  │   ├── Transaction builder                                   │
│  │   └── Status polling                                        │
│  ├── [ ] Transaction Orchestrator                              │
│  │   ├── Create transaction record                             │
│  │   ├── Execute bridges in parallel                           │
│  │   ├── Monitor bridge completions                            │
│  │   └── Aggregate final status                                │
│  └── [ ] Webhook handlers untuk bridge callbacks               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  SMART CONTRACTS (1-2 devs)                                     │
│  ├── [ ] Payment Router Contract (on Arc)                      │
│  │   ├── Receive funds from multiple bridges                   │
│  │   ├── Aggregate into single transfer                        │
│  │   └── Emit events untuk confirmation                        │
│  ├── [ ] Approval Manager (per source chain)                   │
│  │   ├── Batch approval untuk multiple transfers               │
│  │   └── Spending limits                                       │
│  └── [ ] Deploy ke testnets:                                   │
│      ├── Base Sepolia                                          │
│      ├── Arbitrum Sepolia                                      │
│      └── Optimism Sepolia                                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  DATABASE                                                       │
│  ├── transactions                                               │
│  │   ├── id, user_id, recipient, amount, status                │
│  │   ├── execution_plan (JSON)                                 │
│  │   ├── created_at, completed_at                              │
│  │   └── total_fees                                            │
│  ├── bridge_operations                                         │
│  │   ├── transaction_id, source_chain, amount                  │
│  │   ├── bridge_provider, bridge_tx_hash                       │
│  │   └── status, started_at, completed_at                      │
│  └── route_cache (untuk optimize repeated routes)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Deliverables Sprint 2:**
- User bisa initiate payment
- System calculates optimal route
- Parallel bridge execution working
- Transaction tracking functional
- Smart contracts deployed on testnets

---

## SPRINT 3: UX Polish & Advanced Features (Minggu 10-13)

### Objective: Yellow Network integration, final polish, launch prep

```
┌─────────────────────────────────────────────────────────────────┐
│                         SPRINT 3                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND (2 devs)                                              │
│  ├── [ ] Yellow Network UX                                     │
│  │   ├── Session key signing flow                              │
│  │   ├── Instant confirmation UI                               │
│  │   └── Background settlement indicator                       │
│  ├── [ ] Advanced Features                                     │
│  │   ├── Recurring payments                                    │
│  │   ├── Payment links / QR codes                              │
│  │   └── Merchant dashboard (basic)                            │
│  ├── [ ] Mobile Responsive                                     │
│  ├── [ ] Error handling & edge cases                           │
│  └── [ ] Performance optimization                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND (2 devs)                                               │
│  ├── [ ] Yellow Network Integration                            │
│  │   ├── State channel setup                                   │
│  │   ├── Session key management                                │
│  │   ├── Off-chain payment recording                           │
│  │   └── Settlement reconciliation                             │
│  ├── [ ] Security Hardening                                    │
│  │   ├── Rate limiting                                         │
│  │   ├── Input validation                                      │
│  │   ├── Signature verification                                │
│  │   └── Audit logging                                         │
│  ├── [ ] Monitoring & Alerting                                 │
│  │   ├── Transaction success rate                              │
│  │   ├── Bridge latency tracking                               │
│  │   └── Error alerting                                        │
│  └── [ ] Analytics & Reporting                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  SMART CONTRACTS (1-2 devs)                                     │
│  ├── [ ] Uniswap v4 Hook (Optional - Post-MVP)                 │
│  │   ├── Auto-yield deposit hook                               │
│  │   ├── Threshold-based triggers                              │
│  │   └── Withdrawal mechanism                                  │
│  ├── [ ] Security Audit Preparation                            │
│  │   ├── Documentation                                         │
│  │   ├── Test coverage > 90%                                   │
│  │   └── Formal verification (optional)                        │
│  └── [ ] Mainnet deployment preparation                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  DATABASE                                                       │
│  ├── session_keys (user_id, key_hash, permissions, expires)    │
│  ├── state_channel_records (off-chain payment logs)            │
│  ├── analytics_events (for tracking)                           │
│  └── Backup & recovery procedures                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Deliverables Sprint 3:**
- Instant UX dengan Yellow Network
- Production-ready security
- Monitoring dashboard
- Mainnet deployment ready

---

## SPRINT 4: Launch & Iterate (Minggu 14-16)

### Objective: Mainnet launch, monitoring, iteration

```
┌─────────────────────────────────────────────────────────────────┐
│                         SPRINT 4                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ALL TEAM] Launch Checklist                                    │
│  ├── [ ] Smart contract audit completed                        │
│  ├── [ ] Security penetration testing                          │
│  ├── [ ] Load testing passed                                   │
│  ├── [ ] Mainnet contracts deployed                            │
│  ├── [ ] DNS & SSL configured                                  │
│  ├── [ ] Monitoring active                                     │
│  └── [ ] On-call rotation setup                                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  POST-LAUNCH                                                    │
│  ├── [ ] Monitor transaction success rates                     │
│  ├── [ ] Gather user feedback                                  │
│  ├── [ ] Fix critical bugs                                     │
│  ├── [ ] Optimize based on real data                           │
│  └── [ ] Plan v2 features                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        TECH STACK                               │
├─────────────────┬───────────────────────────────────────────────┤
│ FRONTEND        │ Next.js 14, React 18, TailwindCSS            │
│                 │ wagmi, viem, @web3modal, zustand              │
├─────────────────┼───────────────────────────────────────────────┤
│ BACKEND         │ Node.js, Fastify/Express, TypeScript          │
│                 │ Prisma ORM, Bull (job queues)                 │
├─────────────────┼───────────────────────────────────────────────┤
│ DATABASE        │ PostgreSQL (primary), Redis (cache/sessions)  │
├─────────────────┼───────────────────────────────────────────────┤
│ SMART CONTRACTS │ Solidity (EVM chains), Move (Sui)             │
│                 │ Foundry/Hardhat, OpenZeppelin                 │
├─────────────────┼───────────────────────────────────────────────┤
│ INFRASTRUCTURE  │ Vercel (frontend), Railway/AWS (backend)      │
│                 │ Alchemy/Infura (RPC), TheGraph (indexing)     │
├─────────────────┼───────────────────────────────────────────────┤
│ EXTERNAL APIs   │ Circle, LI.FI, Yellow Network, ENS            │
└─────────────────┴───────────────────────────────────────────────┘
```

---

## Folder Structure (Monorepo)

```
merge-pay/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   └── api/                    # Backend API
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   │   ├── circle/
│       │   │   ├── lifi/
│       │   │   ├── yellow/
│       │   │   └── sourcing-engine/
│       │   ├── jobs/
│       │   └── utils/
│       └── prisma/
│           └── schema.prisma
├── packages/
│   ├── contracts/              # Smart contracts
│   │   ├── src/
│   │   ├── test/
│   │   └── scripts/
│   ├── types/                  # Shared TypeScript types
│   └── config/                 # Shared configs
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Risk & Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRITICAL DEPENDENCIES                        │
├─────────────────────────────────────────────────────────────────┤
│ 1. Circle Gateway API access (apply early)                     │
│ 2. LI.FI API partnership/rate limits                           │
│ 3. Yellow Network SDK availability                             │
│ 4. Arc Blockchain documentation & testnet access               │
│ 5. Smart contract audit timeline (4-6 weeks typical)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      RISK MITIGATION                            │
├─────────────────────────────────────────────────────────────────┤
│ • Start external API integrations early (Sprint 1)             │
│ • Have fallback bridge providers if LI.FI unavailable          │
│ • Build MVP without Yellow (add later if SDK delayed)          │
│ • Engage auditors at Sprint 2 start                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Priority Order (Jika Resource Terbatas)

```
MUST HAVE (MVP)
├── 1. Wallet connection + balance display
├── 2. Circle Gateway integration
├── 3. Smart Sourcing Engine (basic)
├── 4. LI.FI bridge execution
└── 5. Transaction tracking

SHOULD HAVE (v1.0)
├── 6. Yellow Network instant UX
├── 7. ENS resolution
└── 8. Merchant dashboard

NICE TO HAVE (v2.0)
├── 9. Uniswap v4 auto-yield
├── 10. Recurring payments
└── 11. Mobile app
```

---

> **Estimasi Total Timeline:**
> - MVP (features 1-5): 8-10 minggu
> - v1.0 (features 6-8): +4-6 minggu
> - v2.0 (features 9-11): +8-12 minggu

