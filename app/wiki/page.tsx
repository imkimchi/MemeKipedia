'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/search-bar'
import { CategoryFilter } from '@/components/category-filter'
import { WikiCard } from '@/components/wiki-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Wiki } from '@/lib/types'
import Link from 'next/link'

export default function WikiPage() {
  const [wikis, setWikis] = useState<Wiki[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('updated_at')
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchWikis = useCallback(
    async (reset: boolean = false) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          category,
          sort,
          limit: '20',
        })

        if (!reset && cursor) {
          params.set('cursor', cursor)
        }

        const response = await fetch(`/api/wiki/search?${params}`)
        const result = await response.json()

        if (reset) {
          setWikis(result.data || [])
        } else {
          setWikis((prev) => [...prev, ...(result.data || [])])
        }

        setCursor(result.nextCursor)
        setHasMore(result.hasMore)
      } catch (error) {
        console.error('Failed to fetch wikis:', error)
      } finally {
        setLoading(false)
      }
    },
    [query, category, sort, cursor]
  )

  useEffect(() => {
    fetchWikis(true)
  }, [query, category, sort])

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    setCursor(null)
  }, [])

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat)
    setCursor(null)
  }, [])

  const handleSortChange = useCallback((s: string) => {
    setSort(s)
    setCursor(null)
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-slate-100">Wiki Library</h1>
        <Link href="/wiki/new">
          <Button>Create Wiki</Button>
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <SearchBar onSearch={handleSearch} />
        </div>
        <CategoryFilter value={category} onChange={handleCategoryChange} />
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="flex h-10 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#a855f7]"
        >
          <option value="updated_at">Recently Updated</option>
          <option value="created_at">Recently Created</option>
        </select>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading && wikis.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))
          : wikis.map((wiki) => <WikiCard key={wiki.id} wiki={wiki} />)}
      </div>

      {wikis.length === 0 && !loading && (
        <div className="mt-8 text-center text-slate-400">
          No wikis found. Be the first to create one!
        </div>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button onClick={() => fetchWikis(false)} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}
