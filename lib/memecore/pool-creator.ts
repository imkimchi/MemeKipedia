/**
 * AMM Pool Creation & Liquidity Seeding Service
 * Creates Uniswap V2-style pools for wiki tokens paired with $M
 */

import { createWalletClient, createPublicClient, http, defineChain, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { getNetworkConfig, type MemecoreNetwork, DEFAULT_NETWORK } from './config'
import { MEMESWAP_FACTORY_ABI, MEMESWAP_ROUTER_ABI, ERC20_ABI } from './amm-abis'

// Configuration from environment
const FACTORY_ADDRESS = process.env.MEMESWAP_FACTORY_ADDRESS as `0x${string}`
const ROUTER_ADDRESS = process.env.MEMESWAP_ROUTER_ADDRESS as `0x${string}`
const M_TOKEN_ADDRESS = process.env.M_TOKEN_ADDRESS as `0x${string}`

// Default liquidity amounts
const DEFAULT_LIQUIDITY_M = process.env.INITIAL_LIQUIDITY_M || '100' // 100 $M
const DEFAULT_LIQUIDITY_TOKENS = process.env.INITIAL_LIQUIDITY_TOKENS || '500000' // 500k tokens

export interface PoolCreationParams {
  tokenAddress: string
  liquidityM?: string // Amount of $M to add (default: 100)
  liquidityTokens?: string // Amount of tokens to add (default: 500000)
  network?: MemecoreNetwork
}

export interface PoolCreationResult {
  poolAddress: string
  liquidityM: string
  liquidityTokens: string
  lpTokensReceived: string
  transactionHash: string
  network: MemecoreNetwork
  explorerUrl: string
}

/**
 * Create AMM pool and seed initial liquidity for a wiki token
 */
export async function createPoolAndAddLiquidity(
  params: PoolCreationParams
): Promise<PoolCreationResult> {
  const network = params.network || DEFAULT_NETWORK
  const networkConfig = getNetworkConfig(network)

  // Validate configuration
  if (!FACTORY_ADDRESS || !ROUTER_ADDRESS || !M_TOKEN_ADDRESS) {
    throw new Error(
      'AMM contracts not configured. Please set MEMESWAP_FACTORY_ADDRESS, MEMESWAP_ROUTER_ADDRESS, and M_TOKEN_ADDRESS in environment variables.'
    )
  }

  const privateKey = process.env.MEMECORE_PRIVATE_KEY
  if (!privateKey || !privateKey.startsWith('0x')) {
    throw new Error('MEMECORE_PRIVATE_KEY not configured')
  }

  // Prepare liquidity amounts (18 decimals for both $M and wiki tokens)
  const liquidityM = parseUnits(params.liquidityM || DEFAULT_LIQUIDITY_M, 18)
  const liquidityTokens = parseUnits(params.liquidityTokens || DEFAULT_LIQUIDITY_TOKENS, 18)

  // Create chain config
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
    blockExplorers: {
      default: {
        name: 'Explorer',
        url: networkConfig.explorerUrl,
      },
    },
  })

  // Setup clients
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const walletClient = createWalletClient({
    account,
    chain: memecoreChain,
    transport: http(),
  })

  const publicClient = createPublicClient({
    chain: memecoreChain,
    transport: http(),
  })

  try {
    console.log('Creating AMM pool and adding liquidity...')
    console.log(`Token: ${params.tokenAddress}`)
    console.log(`M Token: ${M_TOKEN_ADDRESS}`)
    console.log(`Liquidity M: ${params.liquidityM || DEFAULT_LIQUIDITY_M}`)
    console.log(`Liquidity Tokens: ${params.liquidityTokens || DEFAULT_LIQUIDITY_TOKENS}`)

    // Step 1: Check if pool already exists
    const existingPool = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: MEMESWAP_FACTORY_ABI,
      functionName: 'getPair',
      args: [params.tokenAddress as `0x${string}`, M_TOKEN_ADDRESS],
    })

    let poolAddress: `0x${string}`

    if (existingPool === '0x0000000000000000000000000000000000000000') {
      // Step 2: Create new pool
      console.log('Pool does not exist. Creating new pool...')

      const createPairHash = await walletClient.writeContract({
        address: FACTORY_ADDRESS,
        abi: MEMESWAP_FACTORY_ABI,
        functionName: 'createPair',
        args: [params.tokenAddress as `0x${string}`, M_TOKEN_ADDRESS],
      })

      console.log(`Create pair tx: ${createPairHash}`)
      const createPairReceipt = await publicClient.waitForTransactionReceipt({
        hash: createPairHash,
      })

      if (createPairReceipt.status !== 'success') {
        throw new Error('Pool creation failed')
      }

      // Get the created pool address
      poolAddress = (await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: MEMESWAP_FACTORY_ABI,
        functionName: 'getPair',
        args: [params.tokenAddress as `0x${string}`, M_TOKEN_ADDRESS],
      })) as `0x${string}`

      console.log(`Pool created at: ${poolAddress}`)
    } else {
      poolAddress = existingPool as `0x${string}`
      console.log(`Pool already exists at: ${poolAddress}`)
    }

    // Step 3: Approve tokens for router
    console.log('Approving tokens for router...')

    // Approve $M
    const approveMHash = await walletClient.writeContract({
      address: M_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ROUTER_ADDRESS, liquidityM],
    })
    await publicClient.waitForTransactionReceipt({ hash: approveMHash })
    console.log('$M approved')

    // Approve wiki token
    const approveTokenHash = await walletClient.writeContract({
      address: params.tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ROUTER_ADDRESS, liquidityTokens],
    })
    await publicClient.waitForTransactionReceipt({ hash: approveTokenHash })
    console.log('Wiki token approved')

    // Step 4: Add liquidity
    console.log('Adding liquidity...')

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20) // 20 minutes from now

    const addLiquidityHash = await walletClient.writeContract({
      address: ROUTER_ADDRESS,
      abi: MEMESWAP_ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [
        params.tokenAddress as `0x${string}`, // tokenA
        M_TOKEN_ADDRESS, // tokenB
        liquidityTokens, // amountADesired
        liquidityM, // amountBDesired
        liquidityTokens - liquidityTokens / 100n, // amountAMin (1% slippage)
        liquidityM - liquidityM / 100n, // amountBMin (1% slippage)
        account.address, // to (LP tokens go to deployer)
        deadline, // deadline
      ],
    })

    console.log(`Add liquidity tx: ${addLiquidityHash}`)

    const addLiquidityReceipt = await publicClient.waitForTransactionReceipt({
      hash: addLiquidityHash,
    })

    if (addLiquidityReceipt.status !== 'success') {
      throw new Error('Add liquidity failed')
    }

    // Decode logs to get actual amounts and LP tokens received
    // For simplicity, we'll use the input amounts (actual amounts may vary slightly)
    const lpTokensReceived = '0' // Would need to parse logs to get exact amount

    console.log('Liquidity added successfully!')
    console.log(`Pool: ${poolAddress}`)
    console.log(`Transaction: ${addLiquidityHash}`)

    return {
      poolAddress,
      liquidityM: (params.liquidityM || DEFAULT_LIQUIDITY_M).toString(),
      liquidityTokens: (params.liquidityTokens || DEFAULT_LIQUIDITY_TOKENS).toString(),
      lpTokensReceived,
      transactionHash: addLiquidityHash,
      network,
      explorerUrl: `${networkConfig.explorerUrl}address/${poolAddress}`,
    }
  } catch (error) {
    console.error('Pool creation and liquidity seeding failed:', error)
    throw error
  }
}

/**
 * Get pool information
 */
export async function getPoolInfo(
  tokenAddress: string,
  network: MemecoreNetwork = DEFAULT_NETWORK
) {
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

  if (!FACTORY_ADDRESS || !M_TOKEN_ADDRESS) {
    throw new Error('AMM contracts not configured')
  }

  const poolAddress = await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi: MEMESWAP_FACTORY_ABI,
    functionName: 'getPair',
    args: [tokenAddress as `0x${string}`, M_TOKEN_ADDRESS],
  })

  if (poolAddress === '0x0000000000000000000000000000000000000000') {
    return null
  }

  // Import PAIR ABI
  const { MEMESWAP_PAIR_ABI } = await import('./amm-abis')

  const [reserves, token0, token1] = await Promise.all([
    publicClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: MEMESWAP_PAIR_ABI,
      functionName: 'getReserves',
    }),
    publicClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: MEMESWAP_PAIR_ABI,
      functionName: 'token0',
    }),
    publicClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: MEMESWAP_PAIR_ABI,
      functionName: 'token1',
    }),
  ])

  // Determine which reserve is which token
  const token0Lower = (token0 as string).toLowerCase()
  const mTokenLower = M_TOKEN_ADDRESS.toLowerCase()
  const isToken0M = token0Lower === mTokenLower

  return {
    poolAddress,
    token0,
    token1,
    reserve0: reserves[0].toString(),
    reserve1: reserves[1].toString(),
    reserveM: (isToken0M ? reserves[0] : reserves[1]).toString(),
    reserveToken: (isToken0M ? reserves[1] : reserves[0]).toString(),
    blockTimestampLast: reserves[2],
    // Calculate price: 1 TOKEN = X $M
    priceInM:
      Number(isToken0M ? reserves[0] : reserves[1]) /
      Number(isToken0M ? reserves[1] : reserves[0]),
  }
}

/**
 * Calculate swap quote (how much output for given input)
 */
export async function getSwapQuote(
  amountIn: string,
  fromToken: 'M' | 'TOKEN',
  tokenAddress: string,
  network: MemecoreNetwork = DEFAULT_NETWORK
) {
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

  if (!ROUTER_ADDRESS || !M_TOKEN_ADDRESS) {
    throw new Error('AMM contracts not configured')
  }

  const amountInWei = parseUnits(amountIn, 18)

  // Build path: [fromToken, toToken]
  const path =
    fromToken === 'M'
      ? [M_TOKEN_ADDRESS, tokenAddress as `0x${string}`]
      : [tokenAddress as `0x${string}`, M_TOKEN_ADDRESS]

  const amounts = await publicClient.readContract({
    address: ROUTER_ADDRESS,
    abi: MEMESWAP_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [amountInWei, path],
  })

  // amounts[0] = input amount, amounts[1] = output amount
  return {
    amountIn: amounts[0].toString(),
    amountOut: amounts[1].toString(),
    path,
    priceImpact: 0, // TODO: Calculate price impact
  }
}
