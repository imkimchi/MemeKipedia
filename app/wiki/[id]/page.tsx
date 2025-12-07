'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Wiki, SnapshotData } from '@/lib/types'
import Link from 'next/link'

export default function WikiDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { address } = useAccount()
  const [wiki, setWiki] = useState<Wiki | null>(null)
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWiki = async () => {
      try {
        const response = await fetch(`/api/wiki/${params.id}`)
        const data = await response.json()

        if (data.wiki && data.snapshot) {
          setWiki(data.wiki)
          setSnapshot(data.snapshot)
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
  }, [params.id, router])

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {logo && (
            <img
              src={`https://ipfs.io/ipfs/${logo.cid}`}
              alt={wiki.title}
              className="h-16 w-16 rounded-lg object-cover"
            />
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-slate-100">{wiki.title}</h1>
              <Badge variant="secondary">{wiki.category}</Badge>
            </div>
            <div className="mt-2 text-sm text-slate-400">
              Created by {wiki.editor.slice(0, 6)}...{wiki.editor.slice(-4)} on{' '}
              {new Date(wiki.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        {isEditor && (
          <Link href={`/wiki/${wiki.id}/edit`}>
            <Button>Edit</Button>
          </Link>
        )}
      </div>

      <Card className="mt-8">
        <CardContent className="pt-6">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: snapshot.body_mdx }}
          />
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">IPFS CID:</span>
            <a
              href={`https://ipfs.io/ipfs/${wiki.cid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#a855f7] hover:underline"
            >
              {wiki.cid.slice(0, 12)}...
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Last Updated:</span>
            <span className="text-slate-100">{new Date(wiki.updated_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Version:</span>
            <span className="text-slate-100">{snapshot.version}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
