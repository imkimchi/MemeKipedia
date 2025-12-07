'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [stats, setStats] = useState({
    totalWikis: 0,
    weeklyEditors: 0,
    treasuryAmount: '10,000',
    trendingSearches: ['DeFi', 'NFT', 'Gaming'],
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { count: wikiCount } = await supabase
        .from('wiki')
        .select('*', { count: 'exact', head: true })

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { data: recentEdits } = await supabase
        .from('wiki')
        .select('editor')
        .gte('updated_at', weekAgo.toISOString())

      const uniqueEditors = new Set(recentEdits?.map((w) => w.editor) || [])

      setStats({
        totalWikis: wikiCount || 0,
        weeklyEditors: uniqueEditors.size,
        treasuryAmount: '10,000',
        trendingSearches: ['DeFi', 'NFT', 'Gaming'],
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-100">
          Welcome to <span className="text-[#a855f7]">Memekipedia</span>
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-400">
          A decentralized wiki platform powered by Web3. Create, edit, and earn rewards for
          contributing knowledge to the community.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/wiki">
            <Button size="lg">Browse Wikis</Button>
          </Link>
          <Link href="/wiki/new">
            <Button size="lg" variant="outline">
              Create Wiki
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-400">Total Wikis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#a855f7]">{stats.totalWikis}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-400">Weekly Active Editors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#98fce5]">{stats.weeklyEditors}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-400">Treasury (M Tokens)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-100">{stats.treasuryAmount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-400">Trending Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.trendingSearches.map((search) => (
                <span key={search} className="rounded-md bg-slate-700 px-2 py-1 text-xs">
                  {search}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Decentralized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-slate-400">
              Content stored on IPFS with immutable snapshots. Every edit is preserved and
              verifiable on-chain.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Earn Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-slate-400">
              Contributors earn M tokens for creating and editing wikis. Stake tokens to boost
              your rewards.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Community-Driven</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-slate-400">
              Participate in bounties, vote on governance proposals, and help shape the future of
              the platform.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
