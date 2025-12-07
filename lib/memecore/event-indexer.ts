/**
 * Event Indexer - Query swap events from blockchain
 * Builds OHLC candle data from on-chain swap events
 */

import { createPublicClient, http, defineChain, Address, parseAbiItem } from 'viem'
import { getNetworkConfig, type MemecoreNetwork, DEFAULT_NETWORK } from './config'
import { MEMESWAP_PAIR_ABI } from './amm-abis'

export interface SwapEvent {
  blockNumber: bigint
  blockTimestamp: number
  transactionHash: string
  sender: string
  amount0In: bigint
  amount1In: bigint
  amount0Out: bigint
  amount1Out: bigint
  to: string
  // Derived fields
  priceInM: number
  volumeInM: number
}

export interface OHLCCandle {
  timestamp: number // Unix timestamp (start of period)
  open: number
  high: number
  low: number
  close: number
  volume: number
  trades: number
}

/**
 * Query swap events from a pool
 */
export async function querySwapEvents(
  poolAddress: Address,
  fromBlock: bigint,
  toBlock: bigint | 'latest' = 'latest',
  network: MemecoreNetwork = DEFAULT_NETWORK
): Promise<SwapEvent[]> {
  const networkConfig = getNetworkConfig(network)

  const memecoreChain = defineChain({
    id: networkConfig.chainId,
    name: networkConfig.name,
    nativeCurrency: {
      name: 'Memecore',
      symbol: networkConfig.symbol,
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [networkConfig.rpcUrl] },
      public: { http: [networkConfig.rpcUrl] },
    },
  })

  const publicClient = createPublicClient({
    chain: memecoreChain,
    transport: http(),
  })

  // Get pool token order to determine which is $M
  const [token0, token1] = await Promise.all([
    publicClient.readContract({
      address: poolAddress,
      abi: MEMESWAP_PAIR_ABI,
      functionName: 'token0',
    }),
    publicClient.readContract({
      address: poolAddress,
      abi: MEMESWAP_PAIR_ABI,
      functionName: 'token1',
    }),
  ])

  const M_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_M_TOKEN_ADDRESS?.toLowerCase()
  const isToken0M = (token0 as string).toLowerCase() === M_TOKEN_ADDRESS

  // Query Swap events
  const swapEventAbi = parseAbiItem(
    'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)'
  )

  const logs = await publicClient.getLogs({
    address: poolAddress,
    event: swapEventAbi,
    fromBlock,
    toBlock,
  })

  // Fetch block timestamps for each event
  const swapEvents: SwapEvent[] = []

  for (const log of logs) {
    const block = await publicClient.getBlock({ blockNumber: log.blockNumber })

    const {
      sender,
      amount0In,
      amount1In,
      amount0Out,
      amount1Out,
      to,
    } = log.args as {
      sender: Address
      amount0In: bigint
      amount1In: bigint
      amount0Out: bigint
      amount1Out: bigint
      to: Address
    }

    // Calculate price and volume
    let priceInM = 0
    let volumeInM = 0

    if (isToken0M) {
      // token0 is $M, token1 is wiki token
      if (amount0In > 0n) {
        // Buying wiki token with $M
        priceInM = Number(amount0In) / Number(amount1Out) / 1e18
        volumeInM = Number(amount0In) / 1e18
      } else {
        // Selling wiki token for $M
        priceInM = Number(amount0Out) / Number(amount1In) / 1e18
        volumeInM = Number(amount0Out) / 1e18
      }
    } else {
      // token1 is $M, token0 is wiki token
      if (amount1In > 0n) {
        // Buying wiki token with $M
        priceInM = Number(amount1In) / Number(amount0Out) / 1e18
        volumeInM = Number(amount1In) / 1e18
      } else {
        // Selling wiki token for $M
        priceInM = Number(amount1Out) / Number(amount0In) / 1e18
        volumeInM = Number(amount1Out) / 1e18
      }
    }

    swapEvents.push({
      blockNumber: log.blockNumber,
      blockTimestamp: Number(block.timestamp),
      transactionHash: log.transactionHash,
      sender,
      amount0In,
      amount1In,
      amount0Out,
      amount1Out,
      to,
      priceInM,
      volumeInM,
    })
  }

  return swapEvents.sort((a, b) => a.blockTimestamp - b.blockTimestamp)
}

/**
 * Build OHLC candles from swap events
 */
export function buildOHLCCandles(
  swapEvents: SwapEvent[],
  interval: '5m' | '15m' | '1h' | '4h' | '1d' = '1h'
): OHLCCandle[] {
  if (swapEvents.length === 0) return []

  // Convert interval to seconds
  const intervalSeconds: Record<string, number> = {
    '5m': 5 * 60,
    '15m': 15 * 60,
    '1h': 60 * 60,
    '4h': 4 * 60 * 60,
    '1d': 24 * 60 * 60,
  }

  const periodSeconds = intervalSeconds[interval]

  // Group events by period
  const candleMap = new Map<number, SwapEvent[]>()

  for (const event of swapEvents) {
    const periodStart = Math.floor(event.blockTimestamp / periodSeconds) * periodSeconds

    if (!candleMap.has(periodStart)) {
      candleMap.set(periodStart, [])
    }
    candleMap.get(periodStart)!.push(event)
  }

  // Build candles
  const candles: OHLCCandle[] = []

  for (const [timestamp, events] of candleMap.entries()) {
    const prices = events.map((e) => e.priceInM)
    const volume = events.reduce((sum, e) => sum + e.volumeInM, 0)

    candles.push({
      timestamp,
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      volume,
      trades: events.length,
    })
  }

  return candles.sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Get recent candles for a pool
 */
export async function getRecentCandles(
  poolAddress: Address,
  interval: '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
  limit: number = 100,
  network: MemecoreNetwork = DEFAULT_NETWORK
): Promise<OHLCCandle[]> {
  const networkConfig = getNetworkConfig(network)

  const memecoreChain = defineChain({
    id: networkConfig.chainId,
    name: networkConfig.name,
    nativeCurrency: {
      name: 'Memecore',
      symbol: networkConfig.symbol,
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [networkConfig.rpcUrl] },
      public: { http: [networkConfig.rpcUrl] },
    },
  })

  const publicClient = createPublicClient({
    chain: memecoreChain,
    transport: http(),
  })

  // Get current block
  const currentBlock = await publicClient.getBlockNumber()

  // Estimate blocks to query based on interval and limit
  // Assuming ~12 second block time on Memecore
  const intervalSeconds: Record<string, number> = {
    '5m': 5 * 60,
    '15m': 15 * 60,
    '1h': 60 * 60,
    '4h': 4 * 60 * 60,
    '1d': 24 * 60 * 60,
  }

  const secondsToQuery = intervalSeconds[interval] * limit
  const blocksToQuery = BigInt(Math.ceil(secondsToQuery / 12))

  const fromBlock = currentBlock - blocksToQuery > 0n ? currentBlock - blocksToQuery : 0n

  // Query events
  const swapEvents = await querySwapEvents(poolAddress, fromBlock, 'latest', network)

  // Build candles
  const candles = buildOHLCCandles(swapEvents, interval)

  // Return last N candles
  return candles.slice(-limit)
}

/**
 * Get current price from latest swap event
 */
export async function getCurrentPrice(
  poolAddress: Address,
  network: MemecoreNetwork = DEFAULT_NETWORK
): Promise<number | null> {
  const networkConfig = getNetworkConfig(network)

  const memecoreChain = defineChain({
    id: networkConfig.chainId,
    name: networkConfig.name,
    nativeCurrency: {
      name: 'Memecore',
      symbol: networkConfig.symbol,
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [networkConfig.rpcUrl] },
      public: { http: [networkConfig.rpcUrl] },
    },
  })

  const publicClient = createPublicClient({
    chain: memecoreChain,
    transport: http(),
  })

  const currentBlock = await publicClient.getBlockNumber()
  const fromBlock = currentBlock - 1000n > 0n ? currentBlock - 1000n : 0n

  const swapEvents = await querySwapEvents(poolAddress, fromBlock, 'latest', network)

  if (swapEvents.length === 0) {
    // Fallback to reserves-based price
    const reserves = await publicClient.readContract({
      address: poolAddress,
      abi: MEMESWAP_PAIR_ABI,
      functionName: 'getReserves',
    })

    const [token0] = await Promise.all([
      publicClient.readContract({
        address: poolAddress,
        abi: MEMESWAP_PAIR_ABI,
        functionName: 'token0',
      }),
    ])

    const M_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_M_TOKEN_ADDRESS?.toLowerCase()
    const isToken0M = (token0 as string).toLowerCase() === M_TOKEN_ADDRESS

    const reserveM = isToken0M ? reserves[0] : reserves[1]
    const reserveToken = isToken0M ? reserves[1] : reserves[0]

    return Number(reserveM) / Number(reserveToken) / 1e18
  }

  return swapEvents[swapEvents.length - 1].priceInM
}
