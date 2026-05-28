import { sepolia } from "wagmi/chains"

// ============================================================
// 按网络区分合约地址
// ============================================================

const MAINNET_CONTRACTS = {
  ROUTER_ADDRESS: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' as `0x${string}`,
  FACTORY_ADDRESS: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f' as `0x${string}`,
}

const SEPOLIA_CONTRACTS = {
  ROUTER_ADDRESS: '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008' as `0x${string}`,
  FACTORY_ADDRESS: '0x7E0987E5b3a30e3f2828572Bb659A548460a3003' as `0x${string}`,
}

export function getContracts(chainId: number) {
  if (chainId === sepolia.id) return SEPOLIA_CONTRACTS
  return MAINNET_CONTRACTS // Anvil Local (31337) 和主网都用主网地址
}

// ============================================================
// 按网络区分代币列表
// ============================================================
export interface TokenInfo {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
}

const MAINNET_TOKENS: TokenInfo[] = [
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
]

const SEPOLIA_TOKENS: TokenInfo[] = [
  {
    address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0x5e2f3b76cD5df52BBf4bcB9f50003bf769742dc9',
    symbol: 'PEPE',
    name: 'Pepe Token',
    decimals: 18,
  },
  {
    address: '0xbe188467fD1B470e96a9e1e3D9a173F7086c555E',
    symbol: 'SMT',
    name: 'Starmoon',
    decimals: 18,
  },
  {
    address: '0xa6743A34bf7889fAF2564C29F3339F114Ee55a5F',
    symbol: 'DX',
    name: 'DeusEx',
    decimals: 18,
  },
]

export function getTokenList(chainId: number): TokenInfo[] {
  if (chainId === sepolia.id) return SEPOLIA_TOKENS
  return MAINNET_TOKENS
}

// ============================================================
// ABI（只保留用到的方法，不需要完整 ABI）
// ============================================================

// Router: getAmountsOut + swapExactTokensForTokens
export const ROUTER_ABI = [
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  // ETH → Token 场景（如果输入端是 ETH 而非 WETH）
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const

// Factory abi
export const FACTORY_ABI = [
  {
    name: 'getPair',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    outputs: [{ name: 'pair', type: 'address' }],
  }
] as const

// Pair abi
export const PAIR_ABI = [
  {
    name: 'getReserves',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' },
    ],
  },
  {
    name: 'token0',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'token1',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  }
] as const

// ERC-20: balanceOf + allowance + approve
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const