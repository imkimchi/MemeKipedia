/**
 * Price Chart Component
 * TradingView-style candlestick chart for wiki token price
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getRecentCandles, type OHLCCandle } from '@/lib/memecore/event-indexer'
import type { Address } from 'viem'

// Import TradingView Lightweight Charts
// npm install lightweight-charts
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts'

interface PriceChartProps {
  poolAddress: Address
  tokenSymbol: string
}

type TimeInterval = '5m' | '15m' | '1h' | '4h' | '1d'

export function PriceChart({ poolAddress, tokenSymbol }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  const [interval, setInterval] = useState<TimeInterval>('1h')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    candleSeriesRef.current = candleSeries

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  // Load candle data
  useEffect(() => {
    if (!candleSeriesRef.current) return

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const candles = await getRecentCandles(poolAddress, interval, 100)

        if (candles.length === 0) {
          setError('No trading data available yet')
          return
        }

        // Convert to TradingView format
        const chartData = candles.map((candle) => ({
          time: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }))

        candleSeriesRef.current?.setData(chartData)

        // Fit content
        chartRef.current?.timeScale().fitContent()
      } catch (err) {
        console.error('Failed to load chart data:', err)
        setError('Failed to load chart data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Auto-refresh every 30 seconds
    const interval_id = setInterval(loadData, 30000)
    return () => clearInterval(interval_id)
  }, [poolAddress, interval])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{tokenSymbol} / M</CardTitle>
          <div className="flex gap-2">
            {(['5m', '15m', '1h', '4h', '1d'] as TimeInterval[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={interval === t ? 'default' : 'outline'}
                onClick={() => setInterval(t)}
              >
                {t.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="h-[400px] flex items-center justify-center text-slate-400">
            Loading chart...
          </div>
        )}
        {error && (
          <div className="h-[400px] flex items-center justify-center text-slate-400">
            {error}
          </div>
        )}
        <div
          ref={chartContainerRef}
          style={{ display: isLoading || error ? 'none' : 'block' }}
        />
      </CardContent>
    </Card>
  )
}
