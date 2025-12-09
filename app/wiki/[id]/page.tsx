'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount, useConfig } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Wiki, SnapshotData } from '@/lib/types'
import Link from 'next/link'
import { Copy, Share2, Star } from 'lucide-react'
import { TradingPanel } from '@/components/wiki/trading-panel'
import { ShareModal } from '@/components/share-modal'
import type { Address } from 'viem'
import { toast } from 'sonner'
import Image from 'next/image'
import { getPoolAddress } from '@/lib/memecore/pool-service'

export default function WikiDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { address } = useAccount()
  const wagmiConfig = useConfig()
  const [wiki, setWiki] = useState<Wiki | null>(null)
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [poolAddress, setPoolAddress] = useState<Address | null>(null)

  useEffect(() => {
    const fetchWiki = async () => {
      try {
        const response = await fetch(`/api/wiki/${params.id}`)
        const data = await response.json()

        if (data.wiki && data.snapshot) {
          setWiki(data.wiki)
          setSnapshot(data.snapshot)

          // Fetch pool address if token exists
          if (data.wiki.token_address) {
            const pool = await getPoolAddress(data.wiki.token_address as Address, wagmiConfig)
            setPoolAddress(pool)
          }
        } else {
          router.push('/wiki')
        }
      } catch (error) {
        console.error('Failed to fetch wiki:', error)
        router.push('/wiki')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchWiki()
    }
  }, [params.id, router, wagmiConfig])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="mt-8 h-96 w-full" />
      </div>
    )
  }

  if (!wiki || !snapshot) {
    return null
  }

  const isEditor = address && address.toLowerCase() === wiki.editor.toLowerCase()

  const logo = snapshot.media.find(m => m.type === 'image')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleFavorite = () => {
    setIsFavorited(!isFavorited)
    toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites')
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section - New Layout */}
      <div className="flex items-start justify-between gap-6 mb-8 bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-2xl p-6 border border-slate-800/50">
        <div className="flex items-start gap-6 flex-1">
          {/* Large Profile Image with Border */}
          {logo && (
            <div className="relative">
              <div className="h-32 w-32 rounded-2xl p-1">
                <img
                  src={`https://ipfs.io/ipfs/${logo.cid}`}
                  alt={wiki.title}
                  className="h-full w-full rounded-xl object-cover"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h1 className="text-4xl font-bold text-slate-100 mb-3">{wiki.title}</h1>

            {/* Token Name with Copy Button */}
            {wiki.token_symbol && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-semibold text-slate-200">{wiki.token_symbol}</span>
                {wiki.token_address && (
                  <button
                    onClick={() => copyToClipboard(wiki.token_address!)}
                    className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/80 transition-colors border border-slate-700/50"
                    title="Copy contract address"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="font-mono">
                      {wiki.token_address.slice(0, 4)}...{wiki.token_address.slice(-4)}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* User Info */}
            <div className="flex items-center gap-3 text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-semibold text-white">
                  {wiki.editor.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium">
                  {wiki.editor.slice(0, 6)}...{wiki.editor.slice(-4)}
                </span>
              </div>
              <span className="text-sm">•</span>
              <span className="text-sm">
                {(() => {
                  const now = new Date()
                  const created = new Date(wiki.created_at)
                  const diffTime = Math.abs(now.getTime() - created.getTime())
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
                  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))

                  if (diffDays > 0) return `${diffDays}d ago`
                  if (diffHours > 0) return `${diffHours}h ago`
                  return 'Just now'
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-start gap-3">
          <Button
            onClick={() => setShareModalOpen(true)}
            variant="ghost"
            className="text-white hover:bg-slate-800/50 font-semibold px-6"
            size="lg"
          >
            Share
          </Button>
          <Button
            onClick={handleFavorite}
            variant="outline"
            size="lg"
            className="border-slate-700 hover:bg-slate-800"
          >
            <Star className={`h-5 w-5 ${isFavorited ? 'fill-secondary text-secondary' : ''}`} />
          </Button>
          {isEditor && (
            <Link href={`/wiki/${wiki.id}/edit`}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
                Edit to earn $M
                <Image src="/m-token-logo.png" alt="M token" width={20} height={20} className="rounded-full" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        title={wiki.title}
        url={shareUrl}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-7 space-y-8">
          {/* Wiki Content */}
          <Card>
            <CardContent className="">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: snapshot.body_mdx }}
              />
            </CardContent>
          </Card>

          {/* Token Information (moved from right to bottom on mobile) */}
          {wiki.token_address && (
            <Card className="lg:hidden">
              <CardHeader>
                <CardTitle>Token Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Symbol:</span>
                  <span className="font-mono text-slate-100">{wiki.token_symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contract Address:</span>
                  <button
                    onClick={() => copyToClipboard(wiki.token_address!)}
                    className="flex items-center gap-2 font-mono text-primary hover:underline"
                  >
                    {wiki.token_address}
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                {wiki.token_supply && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Supply:</span>
                    <span className="font-mono text-slate-100">
                      {Number(wiki.token_supply).toLocaleString()}
                    </span>
                  </div>
                )}
                {wiki.token_network && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Network:</span>
                    <span className="text-slate-100">{wiki.token_network}</span>
                  </div>
                )}
                {wiki.deploy_tx_hash && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deploy Tx:</span>
                    <button
                      onClick={() => copyToClipboard(wiki.deploy_tx_hash!)}
                      className="flex items-center gap-2 font-mono text-primary hover:underline"
                    >
                      {wiki.deploy_tx_hash.slice(0, 12)}...{wiki.deploy_tx_hash.slice(-8)}
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Trading Panel & Token Info */}
        <div className="lg:col-span-3 space-y-6">
          {/* Trading Panel */}
          {wiki.token_address && (
            <TradingPanel
              tokenAddress={wiki.token_address as Address}
              tokenSymbol={wiki.token_symbol || 'TOKEN'}
              poolAddress={poolAddress}
              bondingCurveAddress={(wiki.bonding_curve_address || undefined) as Address | undefined}
            />
          )}

          {/* Token Information (desktop only) */}
          {wiki.token_address && (
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle>Token Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Symbol:</span>
                  <span className="font-mono text-slate-100">{wiki.token_symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contract Address:</span>
                  <button
                    onClick={() => copyToClipboard(wiki.token_address!)}
                    className="flex items-center gap-2 font-mono text-primary hover:underline text-xs"
                  >
                    {wiki.token_address.slice(0, 8)}...{wiki.token_address.slice(-6)}
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                {wiki.token_supply && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Supply:</span>
                    <span className="font-mono text-slate-100">
                      {Number(wiki.token_supply).toLocaleString()}
                    </span>
                  </div>
                )}
                {wiki.token_network && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Network:</span>
                    <span className="text-slate-100">{wiki.token_network}</span>
                  </div>
                )}
                {wiki.deploy_tx_hash && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deploy Tx:</span>
                    <button
                      onClick={() => copyToClipboard(wiki.deploy_tx_hash!)}
                      className="flex items-center gap-2 font-mono text-primary hover:underline text-xs"
                    >
                      {wiki.deploy_tx_hash.slice(0, 8)}...{wiki.deploy_tx_hash.slice(-6)}
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
