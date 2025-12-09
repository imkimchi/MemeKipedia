/**
 * Trading Panel Component
 * Buy/Sell interface for wiki memecoins
 * Supports both Bonding Curves (like pump.fun) and AMM pools
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConfig, useBalance } from 'wagmi'
import { getBalance } from '@wagmi/core'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  executeSwap,
  getSwapQuote,
  getTokenBalance,
  checkAllowance,
  approveToken,
  getTokenBalance as getSwapTokenBalance,
} from '@/lib/memecore/swap-service'
import {
  buyFromCurve,
  sellToCurve,
  getBuyQuote,
  getSellQuote,
  getTokenBalance as getNativeTokenBalance,
  checkAllowance as checkNativeAllowance,
  approveToken as approveNativeToken,
} from '@/lib/memecore/native-bonding-curve-service'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import Image from 'next/image'

interface TradingPanelProps {
  tokenAddress: Address
  tokenSymbol: string
  poolAddress?: Address // Optional: for AMM pools
  bondingCurveAddress?: Address // Optional: for bonding curves
}

export function TradingPanel({ tokenAddress, tokenSymbol, poolAddress, bondingCurveAddress }: TradingPanelProps) {
  const { address, isConnected, chain } = useAccount()
  const wagmiConfig = useConfig()

  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [slippage, setSlippage] = useState(1)
  const [showSlippageSettings, setShowSlippageSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [balanceM, setBalanceM] = useState('0')
  const [balanceToken, setBalanceToken] = useState('0')
  const [error, setError] = useState<string | null>(null)

  const M_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_M_TOKEN_ADDRESS as Address
  const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_MEMESWAP_ROUTER_ADDRESS

  // Determine trading mode: bonding curve or AMM pool
  const useBondingCurve = !!bondingCurveAddress
  const useAMM = !!poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000' && !useBondingCurve

  // Check if trading is available
  // Bonding curve is always available (uses native M)
  const tradingAvailable = useBondingCurve || (useAMM && !!ROUTER_ADDRESS && !!M_TOKEN_ADDRESS)

  // CHECK BALANCES WITH WAGMI HOOKS
  // For bonding curve: use native M balance (no token address)
  // For AMM: use ERC20 M token balance
  const { data: mBalanceData, error: mBalanceError } = useBalance({
    address: address,
    token: useBondingCurve ? undefined : M_TOKEN_ADDRESS, // Native M for bonding curve
    chainId: 43522,
  })
  const { data: tokenBalanceData, error: tokenBalanceError } = useBalance({
    address: address,
    token: tokenAddress,
    chainId: 43522,
  })

  // Fallback balance loading if hooks don't work
  useEffect(() => {
    if (!address || !isConnected) {
      console.log('Skipping balance load:', { address, isConnected })
      return
    }

    const loadBalancesFallback = async () => {
      try {
        console.log('=== BALANCE FETCH DEBUG ===')
        console.log('Connected Chain:', chain)
        console.log('Expected Chain ID:', 43522)
        console.log('Trading Mode:', useBondingCurve ? 'Bonding Curve (Native M)' : 'AMM (ERC20 M)')
        console.log('User Address:', address)
        console.log('Wiki Token Address:', tokenAddress)

        if (useBondingCurve) {
          // For bonding curve: use native M balance from provider
          const nativeBalance = await getBalance(wagmiConfig, {
            address,
            chainId: 43522
          })
          const token = await getNativeTokenBalance(tokenAddress, address, wagmiConfig)

          console.log('Fallback balances loaded (native):', {
            m: nativeBalance.formatted,
            token
          })
          setBalanceM(parseFloat(nativeBalance.formatted).toFixed(4))
          setBalanceToken(parseFloat(token).toFixed(4))
        } else {
          // For AMM: use ERC20 M token balance
          if (!M_TOKEN_ADDRESS) {
            console.error('M_TOKEN_ADDRESS not set for AMM mode')
            return
          }
          const [m, token] = await Promise.all([
            getNativeTokenBalance(M_TOKEN_ADDRESS, address, wagmiConfig),
            getNativeTokenBalance(tokenAddress, address, wagmiConfig),
          ])
          console.log('Fallback balances loaded (ERC20):', { m, token })
          setBalanceM(parseFloat(m).toFixed(4))
          setBalanceToken(parseFloat(token).toFixed(4))
        }
      } catch (err) {
        console.error('Failed to load balances:', err)
      }
    }

    // Load immediately and set up interval
    loadBalancesFallback()
    const interval = setInterval(loadBalancesFallback, 10000)

    return () => clearInterval(interval)
  }, [address, isConnected, M_TOKEN_ADDRESS, tokenAddress, wagmiConfig, chain, useBondingCurve])

  useEffect(() => {
    console.log('--- useBalance Hook Data ---')
    console.log('M_TOKEN_ADDRESS:', M_TOKEN_ADDRESS)
    console.log('M Balance Hook:', {
      data: mBalanceData,
      formatted: mBalanceData?.formatted,
      value: mBalanceData?.value,
      error: mBalanceError
    })
    console.log('Token Balance Hook:', {
      data: tokenBalanceData,
      formatted: tokenBalanceData?.formatted,
      value: tokenBalanceData?.value,
      error: tokenBalanceError,
    })

    if (mBalanceData?.formatted) {
      console.log('Setting balanceM to:', mBalanceData.formatted)
      setBalanceM(mBalanceData.formatted)
    }
    if (tokenBalanceData?.formatted) {
      console.log('Setting balanceToken to:', tokenBalanceData.formatted)
      setBalanceToken(tokenBalanceData.formatted)
    }
  }, [mBalanceData, tokenBalanceData, mBalanceError, tokenBalanceError, M_TOKEN_ADDRESS])

  // Get quote when amount changes
  useEffect(() => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setAmountOut('')
      return
    }

    const getQuote = async () => {
      try {
        if (useBondingCurve && bondingCurveAddress) {
          // Use bonding curve quotes
          if (mode === 'buy') {
            // User inputs wiki tokens wanted, get M cost
            const quote = await getBuyQuote(bondingCurveAddress, amountIn, wagmiConfig)
            setAmountOut(parseFloat(quote.mCost).toFixed(6))
          } else {
            // User inputs wiki tokens to sell, get M tokens back
            const quote = await getSellQuote(bondingCurveAddress, amountIn, wagmiConfig)
            setAmountOut(parseFloat(quote.mReturn).toFixed(6))
          }
          setError(null)
        } else if (useAMM) {
          // Use AMM quotes
          const quote = await getSwapQuote(
            mode === 'buy' ? 'M' : 'TOKEN',
            tokenAddress,
            amountIn,
            wagmiConfig
          )
          setAmountOut(parseFloat(quote.amountOut).toFixed(6))
          setError(null)
        }
      } catch (err) {
        console.error('Failed to get quote:', err)
        setError(useBondingCurve ? 'Failed to get quote from bonding curve.' : 'Failed to get quote. Pool may not exist.')
        setAmountOut('')
      }
    }

    const debounce = setTimeout(getQuote, 500)
    return () => clearTimeout(debounce)
  }, [amountIn, mode, tokenAddress, wagmiConfig, useBondingCurve, bondingCurveAddress, useAMM])

  // Check if approval is needed
  useEffect(() => {
    if (!address || !amountIn || parseFloat(amountIn) <= 0) {
      setNeedsApproval(false)
      return
    }

    const checkApproval = async () => {
      if (useBondingCurve && bondingCurveAddress) {
        if (mode === 'buy') {
          // No approval needed for native M (buying with native M is payable)
          setNeedsApproval(false)
        } else {
          // Need to approve wiki tokens for selling
          const hasApproval = await checkNativeAllowance(tokenAddress, address, bondingCurveAddress, amountIn, wagmiConfig)
          setNeedsApproval(!hasApproval)
        }
      } else if (useAMM) {
        const tokenToCheck = mode === 'buy' ? M_TOKEN_ADDRESS : tokenAddress
        const hasApproval = await checkAllowance(tokenToCheck, address, amountIn, wagmiConfig)
        setNeedsApproval(!hasApproval)
      }
    }

    checkApproval()
  }, [amountIn, amountOut, mode, address, tokenAddress, wagmiConfig, M_TOKEN_ADDRESS, useBondingCurve, bondingCurveAddress, useAMM])

  const handleApprove = async () => {
    if (!address) return

    setIsLoading(true)
    setError(null)

    try {
      if (useBondingCurve && bondingCurveAddress) {
        // Only need approval for selling (wiki tokens)
        // Buying with native M doesn't need approval
        if (mode === 'sell') {
          await approveNativeToken(tokenAddress, bondingCurveAddress, amountIn, wagmiConfig)
        }
      } else {
        const tokenToApprove = mode === 'buy' ? M_TOKEN_ADDRESS : tokenAddress
        await approveToken(tokenToApprove, amountIn, wagmiConfig)
      }

      setNeedsApproval(false)
    } catch (err: any) {
      console.error('Approval failed:', err)
      setError(err.message || 'Approval failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwap = async () => {
    if (!address) return

    setIsLoading(true)
    setError(null)

    try {
      let result

      if (useBondingCurve && bondingCurveAddress) {
        // Use bonding curve
        if (mode === 'buy') {
          result = await buyFromCurve({
            bondingCurveAddress,
            amount: amountIn,
            mode: 'buy',
            slippageTolerance: slippage,
            userAddress: address,
            wagmiConfig,
          })
        } else {
          result = await sellToCurve({
            bondingCurveAddress,
            amount: amountIn,
            mode: 'sell',
            slippageTolerance: slippage,
            userAddress: address,
            wagmiConfig,
          })
        }
      } else if (useAMM) {
        // Use AMM
        result = await executeSwap({
          fromToken: mode === 'buy' ? 'M' : 'TOKEN',
          toToken: mode === 'buy' ? 'TOKEN' : 'M',
          tokenAddress,
          amountIn,
          slippageTolerance: slippage,
          userAddress: address,
          wagmiConfig,
        })
      }

      console.log('Trade successful:', result)

      // Reset form
      setAmountIn('')
      setAmountOut('')

      // Refresh balances
      if (useBondingCurve) {
        const nativeBalance = await getBalance(wagmiConfig, {
          address,
          chainId: 43522
        })
        const token = await getNativeTokenBalance(tokenAddress, address, wagmiConfig)
        setBalanceM(parseFloat(nativeBalance.formatted).toFixed(4))
        setBalanceToken(parseFloat(token).toFixed(4))
      } else {
        const [m, token] = await Promise.all([
          getTokenBalance(M_TOKEN_ADDRESS, address, wagmiConfig),
          getTokenBalance(tokenAddress, address, wagmiConfig),
        ])
        setBalanceM(parseFloat(m).toFixed(4))
        setBalanceToken(parseFloat(token).toFixed(4))
      }

    } catch (err: any) {
      console.error('Trade failed:', err)
      setError(err.message || 'Trade failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMaxClick = () => {
    if (useBondingCurve) {
      // For bonding curves, always use wiki token balance (user inputs wiki amount)
      setAmountIn(balanceToken)
    } else {
      // For AMM, use appropriate balance based on mode
      if (mode === 'buy') {
        setAmountIn(balanceM)
      } else {
        setAmountIn(balanceToken)
      }
    }
  }

  const insufficientBalance = () => {
    if (!amountIn || parseFloat(amountIn) <= 0) return false

    // For bonding curves: always check wiki token balance first (user inputs wiki amount)
    // Then check if they have enough M to pay for it
    if (useBondingCurve) {
      if (mode === 'buy') {
        // Check if user has enough M to pay for the wiki tokens they want
        // amountOut = M cost needed
        if (!amountOut || parseFloat(amountOut) <= 0) return false
        const insufficient = parseFloat(amountOut) > parseFloat(balanceM)
        console.log('Balance check (bonding buy):', {
          wikiTokensWanted: amountIn,
          mCostNeeded: amountOut,
          balanceM,
          insufficient
        })
        return insufficient
      } else {
        // Check if user has enough wiki tokens to sell
        const insufficient = parseFloat(amountIn) > parseFloat(balanceToken)
        console.log('Balance check (bonding sell):', {
          wikiTokensToSell: amountIn,
          balanceToken,
          insufficient
        })
        return insufficient
      }
    }

    // For AMM: user inputs the "from" token
    const balance = mode === 'buy' ? parseFloat(balanceM) : parseFloat(balanceToken)
    const insufficient = parseFloat(amountIn) > balance
    console.log('Balance check (AMM):', {
      mode,
      amountIn,
      balanceM,
      balanceToken,
      balance,
      insufficient
    })
    return insufficient
  }

  return (
    <div className="space-y-4">
      {/* Trading Info Badge */}
      {/* {useBondingCurve && (
        <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-sm font-semibold text-purple-300">Bonding Curve Active</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Instant trading • No liquidity needed • Fair launch pricing
            </p>
          </CardContent>
        </Card>
      )} */}

      {/* Trading Not Available Warning */}
      {!tradingAvailable && (
        <Card className="bg-surface border-yellow-800">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-yellow-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold">Trading Not Available</span>
              </div>
              <p className="text-sm text-slate-400">
                {useBondingCurve
                  ? 'Bonding curve is being set up. Please wait...'
                  : 'Trading pool needs to be created. Run the add-liquidity script or contact the wiki creator.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trading Card */}
      <Card className="bg-surface border-slate-800">
        <CardContent className="p-6 space-y-4">
          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('buy')}
              className={`py-3 rounded-lg font-semibold transition-all ${
                mode === 'buy'
                  ? 'bg-primary text-white hover:bg-purple-600'
                  : 'bg-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setMode('sell')}
              className={`py-3 rounded-lg font-semibold transition-all ${
                mode === 'sell'
                  ? 'bg-primary text-white hover:bg-purple-600'
                  : 'bg-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Switch to Hemmy / Set max slippage buttons */}
          {/* <div className="flex gap-2"> */}
            {/* <button className="px-4 py-2 rounded-full bg-slate-800 text-sm text-slate-300 hover:bg-slate-700">
              Switch to Hemmy
            </button> */}
            <button
              onClick={() => setShowSlippageSettings(!showSlippageSettings)}
              className="px-4 py-2 rounded-full bg-slate-800 text-sm text-slate-300 hover:bg-slate-700"
            >
              Set max slippage
            </button>
          {/* </div> */}

          {/* Slippage Settings */}
          {showSlippageSettings && (
            <div className="space-y-2">
              <div className="text-sm text-slate-400">Slippage Tolerance: {slippage}%</div>
              <div className="grid grid-cols-3 gap-2">
                {[0.5, 1, 2].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setSlippage(pct)}
                    className={`py-2 rounded-lg text-sm ${
                      slippage === pct
                        ? 'bg-primary text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-primary transition-colors">
            <div className="flex items-center justify-between">
              <Input
                type="number"
                placeholder="0.00"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="bg-transparent border-0 text-3xl text-slate-100 placeholder:text-slate-600 focus-visible:ring-0 p-0 h-auto"
              />
              <div className="flex items-center gap-2 ml-4">
                {useBondingCurve || mode === 'sell' ? (
                  <span className="text-xl text-primary font-semibold">{tokenSymbol}</span>
                ) : (
                  <>
                    <span className="text-xl text-primary font-semibold">$M</span>
                    <Image
                      src="/m-token-logo.png"
                      alt="$M Token"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quote/Output Display */}
          {amountOut && (
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {useBondingCurve && mode === 'buy' ? 'Cost' : useBondingCurve && mode === 'sell' ? "You'll receive" : 'You get'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold text-slate-100">{amountOut}</span>
                  <span className="text-xl text-primary font-semibold">$M</span>
                  <Image
                    src="/m-token-logo.png"
                    alt="$M Token"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => setAmountIn('')}
              className="py-2 rounded-lg bg-slate-800 text-sm text-slate-300 hover:bg-slate-700"
            >
              Reset
            </button>
            {useBondingCurve ? (
              <>
                <button
                  onClick={() => setAmountIn('100')}
                  className="py-2 rounded-lg bg-slate-800 text-sm text-slate-300 hover:bg-slate-700"
                >
                  100
                </button>
                <button
                  onClick={() => setAmountIn('500')}
                  className="py-2 rounded-lg bg-slate-800 text-sm text-slate-300 hover:bg-slate-700"
                >
                  500
                </button>
                <button
                  onClick={() => setAmountIn('1000')}
                  className="py-2 rounded-lg bg-slate-800 text-sm text-slate-300 hover:bg-slate-700"
                >
                  1000
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAmountIn('0.1')}
                  className="py-2 rounded-lg bg-slate-800 text-sm text-slate-300 hover:bg-slate-700"
                >
                  0.1 $M
                </button>
                <button
                  onClick={() => setAmountIn('0.5')}
                  className="py-2 rounded-lg bg-slate-800 text-sm text-slate-300 hover:bg-slate-700"
                >
                  0.5 $M
                </button>
                <button
                  onClick={() => setAmountIn('1')}
                  className="py-2 rounded-lg bg-slate-800 text-sm text-slate-300 hover:bg-slate-700"
                >
                  1 $M
                </button>
              </>
            )}
            <button
              onClick={handleMaxClick}
              className="py-2 rounded-lg bg-slate-800 text-sm text-slate-300 hover:bg-slate-700"
            >
              Max
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Action Button */}
          {!tradingAvailable ? (
            <Button className="w-full bg-slate-700 text-slate-400 cursor-not-allowed py-6 text-lg" disabled>
              Trading Not Available
            </Button>
          ) : !isConnected ? (
            <Button className="w-full bg-secondary hover:bg-cyan-400 text-slate-900 font-semibold py-6 text-lg">
              Log in to buy
            </Button>
          ) : insufficientBalance() ? (
            <Button className="w-full bg-slate-700 text-slate-400 cursor-not-allowed py-6 text-lg" disabled>
              Insufficient Balance
            </Button>
          ) : needsApproval ? (
            <Button
              className="w-full bg-secondary hover:bg-cyan-400 text-slate-900 font-semibold py-6 text-lg"
              onClick={handleApprove}
              disabled={isLoading}
            >
              {isLoading ? 'Approving...' : `Approve ${useBondingCurve && mode === 'buy' ? '$M' : useBondingCurve ? tokenSymbol : mode === 'buy' ? '$M' : tokenSymbol}`}
            </Button>
          ) : (
            <Button
              className="w-full bg-secondary hover:bg-cyan-400 text-slate-900 font-semibold py-6 text-lg"
              onClick={handleSwap}
              disabled={isLoading || !amountIn || parseFloat(amountIn) <= 0}
            >
              {isLoading ? (mode === 'buy' ? 'Buying...' : 'Selling...') : mode === 'buy' ? 'Buy' : 'Sell'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Position/Trades Card */}
      <Card className="bg-surface border-slate-800">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-100">
                ${parseFloat(balanceToken) > 0 ? (parseFloat(balanceToken) * 0.01).toFixed(2) : '0.00'}
              </span>
              <span className="text-slate-400">
                {parseFloat(balanceToken).toFixed(2)} {tokenSymbol}
              </span>
              <span className="ml-auto text-slate-400">-</span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <button className="flex items-center gap-2 text-slate-400 hover:text-slate-300">
                <span>Position</span>
              </button>
              <button className="flex items-center gap-2 text-slate-400 hover:text-slate-300">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="inline"
                >
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span>Trades</span>
              </button>
              <span className="ml-auto text-slate-400">Profit/Loss</span>
            </div>

            {/* Profit Indicator */}
            <div className="relative h-2 bg-gradient-to-r from-red-500 via-slate-500 to-secondary rounded-full overflow-hidden">
              <div
                className="absolute top-0 bottom-0 w-1 bg-white"
                style={{ left: '50%' }}
              />
            </div>
            <div className="text-xs text-slate-500">Profit indicator</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
