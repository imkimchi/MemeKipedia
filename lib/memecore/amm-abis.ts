/**
 * AMM Contract ABIs for Memecore MemeSwap V2
 * Based on Uniswap V2 interface
 */

export const MEMESWAP_FACTORY_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'token0', type: 'address' },
      { indexed: true, name: 'token1', type: 'address' },
      { indexed: false, name: 'pair', type: 'address' },
      { indexed: false, name: '', type: 'uint256' },
    ],
    name: 'PairCreated',
    type: 'event',
  },
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    name: 'createPair',
    outputs: [{ name: 'pair', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    name: 'getPair',
    outputs: [{ name: 'pair', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'allPairs',
    outputs: [{ name: 'pair', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'allPairsLength',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const MEMESWAP_ROUTER_ABI = [
  {
    inputs: [
      { name: '_factory', type: 'address' },
      { name: '_WETH', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'amountADesired', type: 'uint256' },
      { name: 'amountBDesired', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'addLiquidity',
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'amountInMax', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'swapTokensForExactTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    name: 'getAmountsOut',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    name: 'getAmountsIn',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'factory',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const MEMESWAP_PAIR_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'sender', type: 'address' },
      { indexed: false, name: 'amount0', type: 'uint256' },
      { indexed: false, name: 'amount1', type: 'uint256' },
    ],
    name: 'Burn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'sender', type: 'address' },
      { indexed: false, name: 'amount0', type: 'uint256' },
      { indexed: false, name: 'amount1', type: 'uint256' },
    ],
    name: 'Mint',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'sender', type: 'address' },
      { indexed: false, name: 'amount0In', type: 'uint256' },
      { indexed: false, name: 'amount1In', type: 'uint256' },
      { indexed: false, name: 'amount0Out', type: 'uint256' },
      { indexed: false, name: 'amount1Out', type: 'uint256' },
      { indexed: true, name: 'to', type: 'address' },
    ],
    name: 'Swap',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'reserve0', type: 'uint112' },
      { indexed: false, name: 'reserve1', type: 'uint112' },
    ],
    name: 'Sync',
    type: 'event',
  },
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token0',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token1',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'price0CumulativeLast',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'price1CumulativeLast',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'kLast',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
