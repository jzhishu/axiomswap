# AxiomSwap

A minimal decentralized exchange (DEX) swap interface built on the Sepolia testnet, using Uniswap V2-style smart contracts.

## Features

- **Wallet Connection** — Connect via injected wallets (MetaMask, etc.) with automatic network detection
- **Token Swap** — Swap between WETH and PEPE tokens on Sepolia testnet
- **Real-time Quote** — On-chain price quotes via `getAmountsOut`, updated as you type
- **Token Approval** — ERC-20 approve flow before first swap for each token
- **Slippage Control** — Configurable slippage tolerance (0.1% / 0.5% / 1.0%)
- **Transaction Tracking** — Wallet confirmation, on-chain pending, and receipt status with Etherscan links
- **Error Handling** — User-readable Chinese error messages for common failure scenarios
- **SSR Wallet State** — Cookie-based wagmi state hydration for seamless page loads

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript (strict mode) |
| Blockchain | viem v2, wagmi v3 |
| Design | Geist fonts, Vercel-inspired design system |

## Getting Started

### Prerequisites

- Node.js 18+
- A wallet with Sepolia ETH and test tokens

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Contract Addresses (Sepolia)

| Contract | Address |
|---|---|
| Router | `0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008` |
| Factory | `0x7E0987E5b3a30e3f2828572Bb659A548460a3003` |
| WETH | `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` |
| PEPE | `0x5e2f3b76cD5df52BBf4bcB9f50003bf769742dc9` |

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind v4 + design tokens
│   ├── layout.tsx           # Root layout (fonts, providers, SSR hydration)
│   └── page.tsx             # Home page (header + swap card)
├── components/
│   ├── ConnectButton.tsx    # Wallet connect / switch network / disconnect
│   ├── Providers.tsx        # WagmiProvider + QueryClientProvider
│   ├── SwapCard.tsx         # Main swap UI (inputs, quote, approve, swap)
│   └── SwapStatusBanner.tsx # Error / warning / success banners
├── config/
│   └── wagmi.ts             # wagmi config (Sepolia, cookie storage)
├── contracts/
│   └── contracts.ts         # Contract addresses, ABIs, token definitions
├── hooks/
│   ├── useApprove.ts        # ERC-20 approve logic
│   ├── useQuote.ts          # On-chain price quote via getAmountsOut
│   └── useSwap.ts           # Swap execution (swapExactTokensForTokens)
└── utils/
    └── parseSwapError.ts    # Raw error → Chinese user message
```

## Swap Flow

1. **Connect** wallet (injected provider)
2. **Select** input token and enter amount
3. **Quote** is fetched automatically from the Router contract
4. If needed, **approve** the Router to spend the input token
5. **Swap** — tokens are exchanged with the configured slippage tolerance and a 2-minute deadline
6. Status is shown throughout: pending approval → waiting for wallet → on-chain confirmation → success / failure

## Design

The UI follows a Vercel-inspired design language defined in [DESIGN.md](./DESIGN.md), featuring:

- Ink-black primary (`#171717`) on near-white canvas (`#fafafa`)
- Geist / Geist Mono typefaces with negative letter-spacing at display sizes
- Hairline borders (`#ebebeb`) and stacked shadows for card elevation
- 100px pill-shaped CTA buttons
