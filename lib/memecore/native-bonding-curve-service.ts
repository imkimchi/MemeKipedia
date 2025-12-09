/**
 * Native Bonding Curve Service (Client-Side)
 * Handles buy/sell operations on bonding curves using NATIVE M token
 */

import { Address, parseUnits, formatUnits } from 'viem'
import { writeContract, readContract, waitForTransactionReceipt } from '@wagmi/core'

// Native Bonding Curve ABI
export const NATIVE_BONDING_CURVE_ABI = [
  // Read functions
  {
    inputs: [],
    name: 'getCurrentPrice',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokensOut', type: 'uint256' }],
    name: 'calculateBuyCost',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokensIn', type: 'uint256' }],
    name: 'calculateSellReturn',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurveInfo',
    outputs: [
      { name: 'currentPrice', type: 'uint256' },
      { name: 'sold', type: 'uint256' },
      { name: 'reserve', type: 'uint256' },
      { name: 'availableSupply', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'wikiToken',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mToken',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions (payable buy)
  {
    inputs: [
      { name: 'tokensOut', type: 'uint256' },
      { name: 'maxMIn', type: 'uint256' },
    ],
    name: 'buy',
    outputs: [{ name: 'mCost', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokensIn', type: 'uint256' },
      { name: 'minMOut', type: 'uint256' },
    ],
    name: 'sell',
    outputs: [{ name: 'mOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// ERC20 ABI (for wiki token approvals and balances)
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export interface BuySellParams {
  bondingCurveAddress: Address
  amount: string // Human-readable amount
  mode: 'buy' | 'sell'
  slippageTolerance?: number // Percentage (default: 1)
  userAddress: Address
  wagmiConfig: any
}

export interface BuySellResult {
  hash: Address
  amountIn: string
  amountOut: string
}

/**
 * Get bonding curve info
 */
export async function getCurveInfo(curveAddress: Address, wagmiConfig: any) {
  try {
    const info = await readContract(wagmiConfig, {
      address: curveAddress,
      abi: NATIVE_BONDING_CURVE_ABI,
      functionName: 'getCurveInfo',
      chainId: 43522,
    })

    return {
      currentPrice: info[0],
      tokensSold: info[1],
      mReserve: info[2],
      availableSupply: info[3],
    }
  } catch (error) {
    console.error('Failed to get curve info:', error)
    throw error
  }
}

/**
 * Calculate buy quote (how much M needed to buy X tokens)
 */
export async function getBuyQuote(
  curveAddress: Address,
  tokensOut: string,
  wagmiConfig: any
): Promise<{ mCost: string; pricePerToken: string }> {
  try {
    const tokensOutWei = parseUnits(tokensOut, 18)

    const mCost = await readContract(wagmiConfig, {
      address: curveAddress,
      abi: NATIVE_BONDING_CURVE_ABI,
      functionName: 'calculateBuyCost',
      args: [tokensOutWei],
      chainId: 43522,
    })

    const mCostFormatted = formatUnits(mCost, 18)
    const pricePerToken = (parseFloat(mCostFormatted) / parseFloat(tokensOut)).toFixed(9)

    return {
      mCost: mCostFormatted,
      pricePerToken,
    }
  } catch (error) {
    console.error('Failed to get buy quote:', error)
    throw new Error('Failed to calculate buy cost')
  }
}

/**
 * Calculate sell quote (how much M received for selling X tokens)
 */
export async function getSellQuote(
  curveAddress: Address,
  tokensIn: string,
  wagmiConfig: any
): Promise<{ mReturn: string; pricePerToken: string }> {
  try {
    const tokensInWei = parseUnits(tokensIn, 18)

    const mReturn = await readContract(wagmiConfig, {
      address: curveAddress,
      abi: NATIVE_BONDING_CURVE_ABI,
      functionName: 'calculateSellReturn',
      args: [tokensInWei],
      chainId: 43522,
    })

    const mReturnFormatted = formatUnits(mReturn, 18)
    const pricePerToken = (parseFloat(mReturnFormatted) / parseFloat(tokensIn)).toFixed(9)

    return {
      mReturn: mReturnFormatted,
      pricePerToken,
    }
  } catch (error) {
    console.error('Failed to get sell quote:', error)
    throw new Error('Failed to calculate sell return')
  }
}

/**
 * Buy tokens from bonding curve (using native M)
 */
export async function buyFromCurve(params: BuySellParams): Promise<BuySellResult> {
  const { bondingCurveAddress, amount, slippageTolerance = 1, userAddress, wagmiConfig } = params

  // Calculate cost
  const tokensOut = parseUnits(amount, 18)
  const quote = await getBuyQuote(bondingCurveAddress, amount, wagmiConfig)
  const mCost = parseUnits(quote.mCost, 18)

  // Add slippage tolerance
  const maxMIn = (mCost * BigInt(100 + slippageTolerance)) / 100n

  console.log(`Buying ${amount} tokens for ~${quote.mCost} M (max: ${formatUnits(maxMIn, 18)} M)`)

  // Execute buy with native M (payable)
  const hash = await writeContract(wagmiConfig, {
    address: bondingCurveAddress,
    abi: NATIVE_BONDING_CURVE_ABI,
    functionName: 'buy',
    args: [tokensOut, maxMIn],
    value: maxMIn, // Send native M
  })

  console.log(`Buy tx: ${hash}`)
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash })

  if (receipt.status !== 'success') {
    throw new Error('Buy transaction failed')
  }

  return {
    hash,
    amountIn: quote.mCost,
    amountOut: amount,
  }
}

/**
 * Sell tokens to bonding curve (receive native M)
 */
export async function sellToCurve(params: BuySellParams): Promise<BuySellResult> {
  const { bondingCurveAddress, amount, slippageTolerance = 1, userAddress, wagmiConfig } = params

  // Get wiki token address from curve
  const wikiTokenAddress = await readContract(wagmiConfig, {
    address: bondingCurveAddress,
    abi: NATIVE_BONDING_CURVE_ABI,
    functionName: 'wikiToken',
    chainId: 43522,
  })

  // Calculate return
  const tokensIn = parseUnits(amount, 18)
  const quote = await getSellQuote(bondingCurveAddress, amount, wagmiConfig)
  const mReturn = parseUnits(quote.mReturn, 18)

  // Add slippage tolerance
  const minMOut = (mReturn * BigInt(100 - slippageTolerance)) / 100n

  // Check and approve wiki tokens if needed
  const currentAllowance = await readContract(wagmiConfig, {
    address: wikiTokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, bondingCurveAddress],
    chainId: 43522,
  })

  if (currentAllowance < tokensIn) {
    console.log('Approving wiki tokens...')
    const approvalHash = await writeContract(wagmiConfig, {
      address: wikiTokenAddress as Address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [bondingCurveAddress, tokensIn],
    })

    await waitForTransactionReceipt(wagmiConfig, { hash: approvalHash })
    console.log('Wiki tokens approved')
  }

  // Execute sell
  console.log(`Selling ${amount} tokens for ~${quote.mReturn} M`)
  const hash = await writeContract(wagmiConfig, {
    address: bondingCurveAddress,
    abi: NATIVE_BONDING_CURVE_ABI,
    functionName: 'sell',
    args: [tokensIn, minMOut],
  })

  console.log(`Sell tx: ${hash}`)
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash })

  if (receipt.status !== 'success') {
    throw new Error('Sell transaction failed')
  }

  return {
    hash,
    amountIn: amount,
    amountOut: quote.mReturn,
  }
}

/**
 * Get token balance
 */
export async function getTokenBalance(
  tokenAddress: Address,
  userAddress: Address,
  wagmiConfig: any
): Promise<string> {
  try {
    console.log('getTokenBalance called:', { tokenAddress, userAddress })
    const balance = await readContract(wagmiConfig, {
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
      chainId: 43522,
    })
    console.log('Raw balance:', balance)
    const formatted = formatUnits(balance, 18)
    console.log('Formatted balance:', formatted)
    return formatted
  } catch (error) {
    console.error('Error fetching balance:', error)
    return '0'
  }
}

/**
 * Check if user has approved curve to spend tokens
 */
export async function checkAllowance(
  tokenAddress: Address,
  userAddress: Address,
  curveAddress: Address,
  amount: string,
  wagmiConfig: any
): Promise<boolean> {
  const amountWei = parseUnits(amount, 18)

  const allowance = await readContract(wagmiConfig, {
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, curveAddress],
    chainId: 43522,
  })

  return allowance >= amountWei
}

/**
 * Approve token spending
 */
export async function approveToken(
  tokenAddress: Address,
  curveAddress: Address,
  amount: string,
  wagmiConfig: any
): Promise<Address> {
  const amountWei = parseUnits(amount, 18)

  const hash = await writeContract(wagmiConfig, {
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [curveAddress, amountWei],
  })

  await waitForTransactionReceipt(wagmiConfig, { hash })

  return hash
}
