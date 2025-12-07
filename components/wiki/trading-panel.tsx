/**
 * Trading Panel Component
 * Buy/Sell interface for wiki memecoins
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { executeSwap, getSwapQuote, getTokenBalance, checkAllowance, approveToken } from '@/lib/memecore/swap-service'
import { useWagmiConfig } from '@/lib/wagmi'
import type { Address } from 'viem'

interface TradingPanelProps {
  tokenAddress: Address
  tokenSymbol: string
  poolAddress: Address
}

export function TradingPanel({ tokenAddress, tokenSymbol, poolAddress }: TradingPanelProps) {
  const { address, isConnected } = useAccount()
  const wagmiConfig = useWagmiConfig()

  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [slippage, setSlippage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [balanceM, setBalanceM] = useState('0')
  const [balanceToken, setBalanceToken] = useState('0')
  const [error, setError] = useState<string | null>(null)

  const M_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_M_TOKEN_ADDRESS as Address

  // Load balances
  useEffect(() => {
    if (!address || !isConnected) return

    const loadBalances = async () => {
      try {
        const [m, token] = await Promise.all([
          getTokenBalance(M_TOKEN_ADDRESS, address, wagmiConfig),
          getTokenBalance(tokenAddress, address, wagmiConfig),
        ])
        setBalanceM(parseFloat(m).toFixed(4))
        setBalanceToken(parseFloat(token).toFixed(4))
      } catch (err) {
        console.error('Failed to load balances:', err)
      }
    }

    loadBalances()
    const interval = setInterval(loadBalances, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [address, isConnected, tokenAddress, wagmiConfig, M_TOKEN_ADDRESS])

  // Get quote when amount changes
  useEffect(() => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setAmountOut('')
      return
    }

    const getQuote = async () => {
      try {
        const quote = await getSwapQuote(
          mode === 'buy' ? 'M' : 'TOKEN',
          tokenAddress,
          amountIn,
          wagmiConfig
        )
        setAmountOut(parseFloat(quote.amountOut).toFixed(6))
        setError(null)
      } catch (err) {
        console.error('Failed to get quote:', err)
        setError('Failed to get quote. Pool may not exist.')
        setAmountOut('')
      }
    }

    const debounce = setTimeout(getQuote, 500)
    return () => clearTimeout(debounce)
  }, [amountIn, mode, tokenAddress, wagmiConfig])

  // Check if approval is needed
  useEffect(() => {
    if (!address || !amountIn || parseFloat(amountIn) <= 0) {
      setNeedsApproval(false)
      return
    }

    const checkApproval = async () => {
      const tokenToCheck = mode === 'buy' ? M_TOKEN_ADDRESS : tokenAddress
      const hasApproval = await checkAllowance(tokenToCheck, address, amountIn, wagmiConfig)
      setNeedsApproval(!hasApproval)
    }

    checkApproval()
  }, [amountIn, mode, address, tokenAddress, wagmiConfig, M_TOKEN_ADDRESS])

  const handleApprove = async () => {
    if (!address) return

    setIsLoading(true)
    setError(null)

    try {
      const tokenToApprove = mode === 'buy' ? M_TOKEN_ADDRESS : tokenAddress
      await approveToken(tokenToApprove, amountIn, wagmiConfig)
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
      const result = await executeSwap({
        fromToken: mode === 'buy' ? 'M' : 'TOKEN',
        toToken: mode === 'buy' ? 'TOKEN' : 'M',
        tokenAddress,
        amountIn,
        slippageTolerance: slippage,
        userAddress: address,
        wagmiConfig,
      })

      console.log('Swap successful:', result)

      // Reset form
      setAmountIn('')
      setAmountOut('')

      // Refresh balances
      const [m, token] = await Promise.all([
        getTokenBalance(M_TOKEN_ADDRESS, address, wagmiConfig),
        getTokenBalance(tokenAddress, address, wagmiConfig),
      ])
      setBalanceM(parseFloat(m).toFixed(4))
      setBalanceToken(parseFloat(token).toFixed(4))

    } catch (err: any) {
      console.error('Swap failed:', err)
      setError(err.message || 'Swap failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMaxClick = () => {
    if (mode === 'buy') {
      setAmountIn(balanceM)
    } else {
      setAmountIn(balanceToken)
    }
  }

  const insufficientBalance = () => {
    if (!amountIn || parseFloat(amountIn) <= 0) return false
    const balance = mode === 'buy' ? parseFloat(balanceM) : parseFloat(balanceToken)
    return parseFloat(amountIn) > balance
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade {tokenSymbol}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buy/Sell Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'buy' ? 'default' : 'outline'}
            onClick={() => setMode('buy')}
            className="flex-1"
          >
            Buy
          </Button>
          <Button
            variant={mode === 'sell' ? 'default' : 'outline'}
            onClick={() => setMode('sell')}
            className="flex-1"
          >
            Sell
          </Button>
        </div>

        {/* Input Amount */}
        <div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-slate-400">You pay</span>
            <button
              onClick={handleMaxClick}
              className="text-[#a855f7] hover:underline text-xs"
            >
              Balance: {mode === 'buy' ? balanceM : balanceToken}{' '}
              {mode === 'buy' ? 'M' : tokenSymbol}
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="flex-1"
            />
            <Badge variant="secondary" className="px-4 flex items-center">
              {mode === 'buy' ? 'M' : tokenSymbol}
            </Badge>
          </div>
        </div>

        {/* Output Amount */}
        <div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-slate-400">You receive</span>
            <span className="text-slate-400 text-xs">
              Balance: {mode === 'buy' ? balanceToken : balanceM}{' '}
              {mode === 'buy' ? tokenSymbol : 'M'}
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amountOut}
              readOnly
              className="flex-1 bg-slate-800"
            />
            <Badge variant="secondary" className="px-4 flex items-center">
              {mode === 'buy' ? tokenSymbol : 'M'}
            </Badge>
          </div>
        </div>

        {/* Slippage */}
        <div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-slate-400">Slippage Tolerance</span>
            <span className="text-slate-100">{slippage}%</span>
          </div>
          <div className="flex gap-2">
            {[0.5, 1, 2].map((pct) => (
              <Button
                key={pct}
                size="sm"
                variant={slippage === pct ? 'default' : 'outline'}
                onClick={() => setSlippage(pct)}
                className="flex-1"
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded">
            {error}
          </div>
        )}

        {/* Action Button */}
        {!isConnected ? (
          <Button className="w-full" disabled>
            Connect Wallet
          </Button>
        ) : insufficientBalance() ? (
          <Button className="w-full" disabled>
            Insufficient Balance
          </Button>
        ) : needsApproval ? (
          <Button className="w-full" onClick={handleApprove} disabled={isLoading}>
            {isLoading ? 'Approving...' : `Approve ${mode === 'buy' ? 'M' : tokenSymbol}`}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={handleSwap}
            disabled={isLoading || !amountIn || parseFloat(amountIn) <= 0}
          >
            {isLoading ? 'Swapping...' : 'Swap'}
          </Button>
        )}

        {/* Price Info */}
        {amountOut && (
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Rate:</span>
              <span>
                1 {mode === 'buy' ? 'M' : tokenSymbol} ={' '}
                {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)}{' '}
                {mode === 'buy' ? tokenSymbol : 'M'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
