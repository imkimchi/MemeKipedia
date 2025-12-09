/**
 * Pool Service - Client-side utilities for liquidity pools
 * Fetches pool addresses and reserves from MemeSwap Factory
 */

import { Address } from 'viem'
import { readContract } from '@wagmi/core'

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_MEMESWAP_FACTORY_ADDRESS as Address
const M_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_M_TOKEN_ADDRESS as Address

// Factory ABI (minimal, just what we need)
const FACTORY_ABI = [
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
] as const

// Pair ABI (minimal)
const PAIR_ABI = [
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
] as const

/**
 * Get pool address for a wiki token
 */
export async function getPoolAddress(
  wikiTokenAddress: Address,
  wagmiConfig: any
): Promise<Address | null> {
  if (!FACTORY_ADDRESS || !M_TOKEN_ADDRESS) {
    console.warn('Factory or M token address not configured')
    return null
  }

  try {
    const pairAddress = await readContract(wagmiConfig, {
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'getPair',
      args: [M_TOKEN_ADDRESS, wikiTokenAddress],
    })

    // Check if pair exists (not zero address)
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      return null
    }

    return pairAddress as Address
  } catch (error) {
    console.error('Failed to get pool address:', error)
    return null
  }
}

export interface PoolReserves {
  reserveM: bigint
  reserveWiki: bigint
  priceM: number // Price of 1 M in WIKI tokens
  priceWiki: number // Price of 1 WIKI in M tokens
  poolExists: boolean
}

/**
 * Get pool reserves and pricing info
 */
export async function getPoolReserves(
  wikiTokenAddress: Address,
  wagmiConfig: any
): Promise<PoolReserves> {
  const defaultReserves: PoolReserves = {
    reserveM: 0n,
    reserveWiki: 0n,
    priceM: 0,
    priceWiki: 0,
    poolExists: false,
  }

  try {
    const pairAddress = await getPoolAddress(wikiTokenAddress, wagmiConfig)

    if (!pairAddress) {
      return defaultReserves
    }

    // Get reserves
    const [reserve0, reserve1] = await readContract(wagmiConfig, {
      address: pairAddress,
      abi: PAIR_ABI,
      functionName: 'getReserves',
    })

    // Get token order
    const token0 = await readContract(wagmiConfig, {
      address: pairAddress,
      abi: PAIR_ABI,
      functionName: 'token0',
    })

    // Determine which reserve is which
    const isToken0M = (token0 as string).toLowerCase() === M_TOKEN_ADDRESS.toLowerCase()
    const reserveM = isToken0M ? reserve0 : reserve1
    const reserveWiki = isToken0M ? reserve1 : reserve0

    // Calculate prices (avoid division by zero)
    const priceM = reserveM > 0n ? Number(reserveWiki) / Number(reserveM) : 0
    const priceWiki = reserveWiki > 0n ? Number(reserveM) / Number(reserveWiki) : 0

    return {
      reserveM,
      reserveWiki,
      priceM,
      priceWiki,
      poolExists: true,
    }
  } catch (error) {
    console.error('Failed to get pool reserves:', error)
    return defaultReserves
  }
}

/**
 * Check if a pool exists for a wiki token
 */
export async function poolExists(
  wikiTokenAddress: Address,
  wagmiConfig: any
): Promise<boolean> {
  const pairAddress = await getPoolAddress(wikiTokenAddress, wagmiConfig)
  return pairAddress !== null
}

/**
 * Get pool stats for display
 */
export interface PoolStats {
  poolAddress: Address | null
  totalLiquidityM: string // Human-readable M tokens in pool
  totalLiquidityWiki: string // Human-readable wiki tokens in pool
  priceM: string // Price of 1 M in WIKI
  priceWiki: string // Price of 1 WIKI in M
  exists: boolean
}

export async function getPoolStats(
  wikiTokenAddress: Address,
  wagmiConfig: any
): Promise<PoolStats> {
  const pairAddress = await getPoolAddress(wikiTokenAddress, wagmiConfig)
  const reserves = await getPoolReserves(wikiTokenAddress, wagmiConfig)

  return {
    poolAddress: pairAddress,
    totalLiquidityM: (Number(reserves.reserveM) / 1e18).toFixed(2),
    totalLiquidityWiki: (Number(reserves.reserveWiki) / 1e18).toFixed(2),
    priceM: reserves.priceM.toFixed(6),
    priceWiki: reserves.priceWiki.toFixed(6),
    exists: reserves.poolExists,
  }
}
