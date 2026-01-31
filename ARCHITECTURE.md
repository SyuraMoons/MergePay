# MergePay Technical Architecture

> **Chain-Abstracted Payment Solution** - Solving Liquidity Fragmentation in Web3

---

## The Problem vs Solution

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE: FRAGMENTED                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   [Base]          [Arbitrum]       [Optimism]       [Others...]              ║
║   $20 USDC        $30 USDC         $15 USDC         $? USDC                  ║
║      |                |                |                |                     ║
║      v                v                v                v                     ║
║   Manual           Manual           Manual           Manual                   ║
║   Bridge           Bridge           Bridge           Bridge                   ║
║      |                |                |                |                     ║
║      +-------+--------+-------+--------+                                      ║
║              |                                                                ║
║              v                                                                ║
║   [15-30 min wait] + [10-20% fees] + [Complex UX] = FRUSTRATION              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                                    |
                                    | MergePay
                                    v

╔═══════════════════════════════════════════════════════════════════════════════╗
║                              AFTER: UNIFIED                                   ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║                         ╔═══════════════════╗                                 ║
║                         ║  TOTAL BALANCE    ║                                 ║
║                         ║     $65 USDC      ║                                 ║
║                         ║                   ║                                 ║
║                         ║  [Pay $50] <----  ║  One Click!                     ║
║                         ╚═══════════════════╝                                 ║
║                                                                               ║
║   Result: Instant confirmation, optimized fees, zero complexity              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LAYER 1: USER INTERFACE                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                       │
│  │  Next.js    │   │  Unified    │   │  One-Click  │                       │
│  │  Web App    │   │  Dashboard  │   │  Pay Button │                       │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                       │
└─────────┼─────────────────┼─────────────────┼───────────────────────────────┘
          │                 │                 │
          v                 v                 v
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WALLET CONNECTIONS                                   │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                       │
│  │ WalletConnect│   │  MetaMask   │   │ Sui Wallet  │                       │
│  │    (EVM)    │   │   (EVM)     │   │   (Sui)     │                       │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                       │
└─────────┼─────────────────┼─────────────────┼───────────────────────────────┘
          │                 │                 │
          v                 v                 v
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SOURCE CHAINS (Fragmented)                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │  BASE   │  │ARBITRUM │  │OPTIMISM │  │ POLYGON │  │   SUI   │          │
│  │  $20    │  │  $30    │  │  $15    │  │  $...   │  │  $...   │          │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘          │
└───────┼────────────┼────────────┼────────────┼────────────┼─────────────────┘
        │            │            │            │            │
        └────────────┴─────┬──────┴────────────┴────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────────────────┐
│                   LAYER 2: BALANCE AGGREGATION                              │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐     │
│  │       CIRCLE GATEWAY          │   │      ENS INTEGRATION          │     │
│  │  • Query USDC across chains   │   │  • Resolve merchant.eth       │     │
│  │  • Real-time balance sync     │   │  • Cross-chain addressing     │     │
│  └───────────────┬───────────────┘   └───────────────┬───────────────┘     │
│                  │                                   │                      │
│                  └─────────────┬─────────────────────┘                      │
│                                v                                            │
│                  ╔═══════════════════════════╗                              │
│                  ║   TOTAL: $65 Available    ║                              │
│                  ╚═════════════╤═════════════╝                              │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                                 v
┌─────────────────────────────────────────────────────────────────────────────┐
│                LAYER 3: SMART SOURCING ENGINE (The Brain)                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AUTO-SOURCE AGENT                           │   │
│  │                                                                     │   │
│  │  INPUT:   Payment = $50 | Balances = Base:$20, Arb:$30, OP:$15    │   │
│  │                                                                     │   │
│  │  LOGIC:   IF single_chain >= amount THEN use_single_chain          │   │
│  │           ELSE calculate_optimal_split(gas, fees, speed)           │   │
│  │                                                                     │   │
│  │  OUTPUT:  Execution Plan: Base($20) + Arbitrum($30) = $50          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────-┘
                                 │
                                 v
┌─────────────────────────────────────────────────────────────────────────────┐
│                   LAYER 4: BRIDGE ORCHESTRATION                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         LI.FI COMPOSER                                │ │
│  │                                                                       │ │
│  │   Receives execution plan from Smart Sourcing Engine                 │ │
│  │   Orchestrates "N-to-1" transaction (multiple sources -> one dest)   │ │
│  │   Queries best bridge routes per chain                               │ │
│  │                                                                       │ │
│  │   ┌─────────────┐         ┌─────────────┐                            │ │
│  │   │ BRIDGE A    │         │ BRIDGE B    │    <-- Parallel            │ │
│  │   │ Base -> Arc │         │ Arb -> Arc  │        Execution           │ │
│  │   │ $20 USDC    │         │ $30 USDC    │                            │ │
│  │   └──────┬──────┘         └──────┬──────┘                            │ │
│  └──────────┼───────────────────────┼────────────────────────────────────┘ │
└─────────────┼───────────────────────┼───────────────────────────────────────┘
              │                       │
              └───────────┬───────────┘
                          │
                          v
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAYER 5: UX ACCELERATION                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        YELLOW NETWORK                                 │ │
│  │                                                                       │ │
│  │   [Session Keys]          [State Channels]         [Instant UX]      │ │
│  │   Sign once at start      Off-chain confirmation   No waiting for    │ │
│  │   No repeat signatures    Payment recorded         bridge finality   │ │
│  │                           instantly                                   │ │
│  │                                                                       │ │
│  │   User sees: "Payment Confirmed!" (while bridges settle in background)│ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                          │
                          v (Background Settlement)
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LAYER 6: SETTLEMENT                                    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        ARC BLOCKCHAIN                                 │ │
│  │                   (Single Settlement Destination)                     │ │
│  │                                                                       │ │
│  │                  $20 (from Base) + $30 (from Arb)                    │ │
│  │                              │                                        │ │
│  │                              v                                        │ │
│  │                  ╔═══════════════════════╗                            │ │
│  │                  ║  Merchant Wallet      ║                            │ │
│  │                  ║    +$50 USDC          ║                            │ │
│  │                  ║  (Circle Custody)     ║                            │ │
│  │                  ╚═══════════╤═══════════╝                            │ │
│  └──────────────────────────────┼────────────────────────────────────────┘ │
│                                 │                                           │
│                                 v (Optional: Auto-Yield)                    │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      UNISWAP V4 HOOK                                  │ │
│  │                                                                       │ │
│  │   Detects idle funds -> Auto-deposits to LP -> Earns passive yield   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Transaction Flow: Alice Pays $50

```
STEP 1: USER ACTION
    Alice clicks [Pay $50 for NFT]
           │
           v

STEP 2: BALANCE CHECK
    Circle Gateway queries all chains
    ┌──────────┬──────────┬──────────┐
    │  Base    │ Arbitrum │ Optimism │
    │   $20    │   $30    │   $15    │
    └──────────┴──────────┴──────────┘
    TOTAL: $65 available (need $50)
           │
           v

STEP 3: AGENT DECISION
    Smart Sourcing Engine calculates:
    "Optimal Plan: Base($20) + Arbitrum($30) = $50"
           │
           v

STEP 4: SESSION AUTH
    Yellow Network: Alice signs session key (one-time)
    Off-chain state channel: Payment recorded instantly
    User sees: "Processing..."
           │
           v

STEP 5: PARALLEL BRIDGING
    ┌─────────────────┐     ┌─────────────────┐
    │    BRIDGE A     │     │    BRIDGE B     │
    │   Base -> Arc   │     │   Arb -> Arc    │
    │    $20 USDC     │     │    $30 USDC     │
    └────────┬────────┘     └────────┬────────┘
             │  (simultaneous)       │
             └───────────┬───────────┘
                         v

STEP 6: SETTLEMENT
    Arc Blockchain receives:
    $20 (from Base) + $30 (from Arb) = $50 total
    Merchant wallet: +$50 USDC
           │
           v

STEP 7: CONFIRMATION
    User sees: "Payment Complete!"
    Merchant receives NFT ticket transfer
           │
           v

STEP 8: POST-SETTLEMENT (Background)
    Uniswap v4 hook detects $50 idle
    Auto-deposits to LP -> Merchant earns yield
```

---

## Protocol Integration Summary

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL PROTOCOLS                               │
├────────────────┬────────────────────────────────────────────────────────┤
│ CIRCLE         │ Balance aggregation + Merchant wallets                 │
│ LI.FI          │ Bridge routing + DEX aggregation                       │
│ YELLOW NETWORK │ Session keys + State channels + Instant UX             │
│ ARC BLOCKCHAIN │ Settlement destination                                 │
│ UNISWAP V4     │ Auto-yield hooks                                       │
│ ENS            │ Merchant identity resolution                           │
├────────────────┴────────────────────────────────────────────────────────┤
│                         SUPPORTED CHAINS                                │
├─────────────────────────────────────────────────────────────────────────┤
│ Base (L2) | Arbitrum (L2) | Optimism (L2) | Polygon | Sui | Arc         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Metrics Comparison

```
┌─────────────────────┬───────────────────┬───────────────────┐
│      METRIC         │  BEFORE MergePay  │  AFTER MergePay   │
├─────────────────────┼───────────────────┼───────────────────┤
│ User Actions        │   5-10 bridges    │     1 click       │
│ Wait Time           │   15-30 minutes   │    Instant UX     │
│ Fee Overhead        │     10-20%        │    Optimized      │
│ Technical Knowledge │     Required      │   None needed     │
│ Accessible Funds    │    Fragmented     │   100% unified    │
└─────────────────────┴───────────────────┴───────────────────┘
```

---

## TL;DR

```
    AGGREGATE              ROUTE                 SETTLE
        │                    │                      │
        v                    v                      v
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Circle Gateway│ -> │ Smart Engine  │ -> │ Arc Blockchain│
│ queries all   │    │ finds optimal │    │ receives      │
│ chain balances│    │ multi-chain   │    │ consolidated  │
│               │    │ route         │    │ payment       │
└───────────────┘    └───────────────┘    └───────────────┘

         User clicks ONCE, MergePay does the REST
```
