/**
 * Token Stats Component
 * Display key metrics for wiki token
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPoolInfo } from '@/lib/memecore/pool-creator'
import { getCurrentPrice } from '@/lib/memecore/event-indexer'
import type { Address } from 'viem'

interface TokenStatsProps {
  tokenAddress: Address
  tokenSymbol: string
  poolAddress: Address
  totalSupply: string
}

export function TokenStats({
  tokenAddress,
  tokenSymbol,
  poolAddress,
  totalSupply,
}: TokenStatsProps) {
  const [stats, setStats] = useState({
    price: 0,
    marketCap: 0,
    volume24h: 0,
    holders: 0,
    reserveM: '0',
    reserveToken: '0',
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [poolInfo, price] = await Promise.all([
          getPoolInfo(tokenAddress),
          getCurrentPrice(poolAddress),
        ])

        if (poolInfo) {
          const currentPrice = price || poolInfo.priceInM

          // Calculate market cap (price * total supply)
          const supply = parseFloat(totalSupply) / 1e18
          const marketCap = currentPrice * supply

          setStats({
            price: currentPrice,
            marketCap,
            volume24h: 0, // TODO: Calculate from last 24h of events
            holders: 0, // TODO: Query from blockchain
            reserveM: (parseFloat(poolInfo.reserveM) / 1e18).toFixed(2),
            reserveToken: (parseFloat(poolInfo.reserveToken) / 1e18).toFixed(0),
          })
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()

    // Refresh every 15 seconds
    const interval = setInterval(loadStats, 15000)
    return () => clearInterval(interval)
  }, [tokenAddress, poolAddress, totalSupply])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400 text-sm">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tokenSymbol} Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-slate-400 text-sm">Price</span>
          <span className="text-slate-100 font-medium">
            ${stats.price.toFixed(6)} M
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400 text-sm">Market Cap</span>
          <span className="text-slate-100 font-medium">
            ${stats.marketCap.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400 text-sm">24h Volume</span>
          <span className="text-slate-100 font-medium">
            ${stats.volume24h.toFixed(2)}
          </span>
        </div>

        <div className="border-t border-slate-700 pt-3">
          <div className="text-slate-400 text-xs mb-2">Liquidity Pool</div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">M:</span>
            <span className="text-slate-100">{stats.reserveM} M</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{tokenSymbol}:</span>
            <span className="text-slate-100">{stats.reserveToken}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
