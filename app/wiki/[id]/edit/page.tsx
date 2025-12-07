'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { CategoryFilter } from '@/components/category-filter'
import { MediaUploadArea } from '@/components/media-upload-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Wiki, SnapshotData } from '@/lib/types'

export default function EditWikiPage() {
  const params = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [wiki, setWiki] = useState<Wiki | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('DeFi')
  const [content, setContent] = useState('')
  const [logoCid, setLogoCid] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchWiki = async () => {
      try {
        const response = await fetch(`/api/wiki/${params.id}`)
        const data = await response.json()

        if (data.wiki && data.snapshot) {
          const fetchedWiki: Wiki = data.wiki
          const snapshot: SnapshotData = data.snapshot

          if (
            !isConnected ||
            !address ||
            address.toLowerCase() !== fetchedWiki.editor.toLowerCase()
          ) {
            router.push(`/wiki/${params.id}`)
            return
          }

          setWiki(fetchedWiki)
          setTitle(snapshot.title)
          setCategory(snapshot.category)
          setContent(snapshot.body_mdx)

          // Load existing logo from media
          const existingLogo = snapshot.media.find(m => m.type === 'image')
          if (existingLogo) {
            setLogoCid(existingLogo.cid)
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

    if (params.id && isConnected && address) {
      fetchWiki()
    } else if (!isConnected) {
      router.push('/wiki')
    }
  }, [params.id, isConnected, address, router])

  const handleSave = async () => {
    if (!title || !category || !content || !address) {
      alert('Please fill in all fields')
      return
    }

    setSaving(true)
    try {
      const media = logoCid ? [{
        type: 'image' as const,
        cid: logoCid,
        filename: 'logo'
      }] : []

      const response = await fetch(`/api/wiki/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          category,
          body_mdx: content,
          media,
          editor: address,
        }),
      })

      const result = await response.json()

      if (result.wiki) {
        router.push(`/wiki/${params.id}`)
      } else {
        alert('Failed to update wiki')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save wiki')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="mt-8 h-96 w-full" />
      </div>
    )
  }

  if (!wiki || !isConnected) {
    return null
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-100">Edit Wiki</h1>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Wiki Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Title</label>
            <Input
              type="text"
              placeholder="Enter wiki title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Category</label>
            <CategoryFilter value={category} onChange={setCategory} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Content</label>
            <TiptapEditor content={content} onChange={setContent} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Media (Logo/Image)</label>
            <MediaUploadArea
              value={logoCid}
              onUpload={(cid, filename) => {
                setLogoCid(cid)
                console.log('Uploaded:', filename, 'CID:', cid)
              }}
            />
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Update Wiki'}
            </Button>
            <Button variant="outline" onClick={() => router.push(`/wiki/${params.id}`)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
