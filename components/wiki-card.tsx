import Link from 'next/link'
import { Wiki } from '@/lib/types'
import { useEffect, useState } from 'react'

interface WikiCardProps {
  wiki: Wiki
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)

  const intervals = {
    y: 31536000,
    mo: 2592000,
    d: 86400,
    h: 3600,
    m: 60
  }

  for (const [name, secondsInInterval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInInterval)
    if (interval >= 1) {
      return `${interval}${name} ago`
    }
  }

  return 'just now'
}

export function WikiCard({ wiki }: WikiCardProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [description, setDescription] = useState<string>('')

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const response = await fetch(`/api/wiki/${wiki.id}`)
        const data = await response.json()

        if (data.snapshot) {
          const logo = data.snapshot.media.find((m: any) => m.type === 'image')
          if (logo) {
            setLogoUrl(`https://ipfs.io/ipfs/${logo.cid}`)
          }

          // Extract text from body_mdx (simple approach)
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = data.snapshot.body_mdx
          const text = tempDiv.textContent || tempDiv.innerText || ''
          setDescription(text.slice(0, 100))
        }
      } catch (error) {
        console.error('Failed to fetch snapshot:', error)
      }
    }

    fetchSnapshot()
  }, [wiki.id])

  return (
    <Link href={`/wiki/${wiki.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm transition-all hover:bg-slate-800/70 hover:shadow-lg hover:shadow-purple-500/10">
        {/* Image */}
        <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={wiki.token_name || wiki.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-slate-600">
              {(wiki.token_symbol || wiki.title || '?')[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and Ticker */}
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-slate-100">
              {wiki.token_name || wiki.title}
            </h3>
            <p className="text-sm text-slate-400">
              {wiki.token_symbol || 'N/A'}
            </p>
          </div>

          {/* Creator and Time */}
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <span>{wiki.editor.slice(0, 6)}</span>
            <span>{formatTimeAgo(wiki.created_at)}</span>
          </div>

          {/* Description */}
          {description && (
            <p className="mb-3 line-clamp-2 text-xs text-slate-400">
              {description}
            </p>
          )}

          {/* Stats Section - Placeholder for now */}
          <div className="flex items-center justify-between border-t border-slate-700 pt-3">
            <div className="text-xs">
              <span className="text-slate-500">MC</span>{' '}
              <span className="font-semibold text-slate-200">--</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-700">
                <div className="h-full w-1/2 bg-gradient-to-r from-yellow-500 to-green-500" />
              </div>
              <span className="text-xs font-medium text-green-400">--</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
