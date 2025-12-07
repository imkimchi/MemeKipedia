/**
 * Swap Service for Front-end (Client-Side)
 * Executes token swaps using user's wallet via wagmi
 */

import { Address, parseUnits, formatUnits } from 'viem'
import { writeContract, readContract, waitForTransactionReceipt } from '@wagmi/core'
import { MEMESWAP_ROUTER_ABI, ERC20_ABI } from './amm-abis'

// Contract addresses (should match your deployment)
const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_MEMESWAP_ROUTER_ADDRESS as Address
const M_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_M_TOKEN_ADDRESS as Address

export interface SwapParams {
  fromToken: 'M' | 'TOKEN'
  toToken: 'M' | 'TOKEN'
  tokenAddress: Address // The wiki token address
  amountIn: string // Human-readable amount (e.g., "100")
  slippageTolerance?: number // Percentage (default: 1)
  userAddress: Address
  wagmiConfig: any // wagmi config object
}

export interface SwapResult {
  hash: Address
  amountIn: string
  amountOut: string
  fromToken: string
  toToken: string
}

/**
 * Execute a token swap (user-signed via wallet)
 */
export async function executeSwap(params: SwapParams): Promise<SwapResult> {
  const {
    fromToken,
    tokenAddress,
    amountIn,
    slippageTolerance = 1,
    userAddress,
    wagmiConfig,
  } = params

  if (!ROUTER_ADDRESS || !M_TOKEN_ADDRESS) {
    throw new Error('Swap contracts not configured')
  }

  // Convert amount to wei (18 decimals)
  const amountInWei = parseUnits(amountIn, 18)

  // Build swap path
  const path: Address[] =
    fromToken === 'M'
      ? [M_TOKEN_ADDRESS, tokenAddress]
      : [tokenAddress, M_TOKEN_ADDRESS]

  // Get expected output amount from router
  const amounts = await readContract(wagmiConfig, {
    address: ROUTER_ADDRESS,
    abi: MEMESWAP_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [amountInWei, path],
  })

  const amountOut = amounts[1]

  // Calculate minimum output with slippage tolerance
  const slippageMultiplier = BigInt(Math.floor((100 - slippageTolerance) * 100))
  const amountOutMin = (amountOut * slippageMultiplier) / 10000n

  // Deadline: 20 minutes from now
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20)

  // Step 1: Check and handle token approval
  const tokenToApprove = fromToken === 'M' ? M_TOKEN_ADDRESS : tokenAddress

  const currentAllowance = await readContract(wagmiConfig, {
    address: tokenToApprove,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, ROUTER_ADDRESS],
  })

  if (currentAllowance < amountInWei) {
    console.log('Approving token spend...')

    const approvalHash = await writeContract(wagmiConfig, {
      address: tokenToApprove,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ROUTER_ADDRESS, amountInWei],
    })

    // Wait for approval
    await waitForTransactionReceipt(wagmiConfig, { hash: approvalHash })
    console.log('Token approved')
  }

  // Step 2: Execute swap
  console.log('Executing swap...')
  console.log(`Swapping ${amountIn} ${fromToken} for ~${formatUnits(amountOut, 18)} ${fromToken === 'M' ? 'TOKEN' : 'M'}`)

  const swapHash = await writeContract(wagmiConfig, {
    address: ROUTER_ADDRESS,
    abi: MEMESWAP_ROUTER_ABI,
    functionName: 'swapExactTokensForTokens',
    args: [
      amountInWei,
      amountOutMin,
      path,
      userAddress,
      deadline,
    ],
  })

  console.log(`Swap tx: ${swapHash}`)

  // Wait for transaction
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: swapHash })

  if (receipt.status !== 'success') {
    throw new Error('Swap transaction failed')
  }

  return {
    hash: swapHash,
    amountIn: formatUnits(amountInWei, 18),
    amountOut: formatUnits(amountOut, 18),
    fromToken: fromToken === 'M' ? 'M' : 'TOKEN',
    toToken: fromToken === 'M' ? 'TOKEN' : 'M',
  }
}

/**
 * Get swap quote (how much you'll receive)
 */
export async function getSwapQuote(
  fromToken: 'M' | 'TOKEN',
  tokenAddress: Address,
  amountIn: string,
  wagmiConfig: any
): Promise<{ amountOut: string; priceImpact: number }> {
  if (!ROUTER_ADDRESS || !M_TOKEN_ADDRESS) {
    throw new Error('Swap contracts not configured')
  }

  const amountInWei = parseUnits(amountIn, 18)

  const path: Address[] =
    fromToken === 'M'
      ? [M_TOKEN_ADDRESS, tokenAddress]
      : [tokenAddress, M_TOKEN_ADDRESS]

  try {
    const amounts = await readContract(wagmiConfig, {
      address: ROUTER_ADDRESS,
      abi: MEMESWAP_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [amountInWei, path],
    })

    const amountOut = formatUnits(amounts[1], 18)

    // TODO: Calculate actual price impact
    const priceImpact = 0.1

    return {
      amountOut,
      priceImpact,
    }
  } catch (error) {
    console.error('Failed to get swap quote:', error)
    throw new Error('Failed to get swap quote. Pool may not exist.')
  }
}

/**
 * Get token balance for user
 */
export async function getTokenBalance(
  tokenAddress: Address,
  userAddress: Address,
  wagmiConfig: any
): Promise<string> {
  const balance = await readContract(wagmiConfig, {
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  })

  return formatUnits(balance, 18)
}

/**
 * Check if user has approved router to spend tokens
 */
export async function checkAllowance(
  tokenAddress: Address,
  userAddress: Address,
  amount: string,
  wagmiConfig: any
): Promise<boolean> {
  if (!ROUTER_ADDRESS) {
    throw new Error('Router address not configured')
  }

  const amountWei = parseUnits(amount, 18)

  const allowance = await readContract(wagmiConfig, {
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, ROUTER_ADDRESS],
  })

  return allowance >= amountWei
}

/**
 * Approve token spending
 */
export async function approveToken(
  tokenAddress: Address,
  amount: string,
  wagmiConfig: any
): Promise<Address> {
  if (!ROUTER_ADDRESS) {
    throw new Error('Router address not configured')
  }

  const amountWei = parseUnits(amount, 18)

  const hash = await writeContract(wagmiConfig, {
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [ROUTER_ADDRESS, amountWei],
  })

  await waitForTransactionReceipt(wagmiConfig, { hash })

  return hash
}
