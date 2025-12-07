'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { MediaUploadArea } from '@/components/media-upload-area'

export default function NewWikiPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [title, setTitle] = useState('')
  const [ticker, setTicker] = useState('')
  const [content, setContent] = useState('')
  const [logoCid, setLogoCid] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push('/wiki')
    }
  }, [isConnected, router])

  const handleSave = async () => {
    if (!title || !ticker || !content || !address) {
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

      const response = await fetch('/api/wiki', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          ticker,
          body_mdx: content,
          media,
          editor: address,
          logo: logoCid ? `ipfs://${logoCid}` : undefined,
        }),
      })

      const result = await response.json()

      if (result.wiki) {
        router.push(`/wiki/${result.wiki.id}`)
      } else {
        alert('Failed to create wiki')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save wiki')
    } finally {
      setSaving(false)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-100">Create New Wiki</h1>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Wiki Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
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
              <label className="mb-2 block text-sm font-medium text-slate-300">Ticker</label>
              <Input
                type="text"
                placeholder="Add a coin ticker(e.g. DOGE)"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                maxLength={10}
              />
            </div>
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
              {saving ? 'Saving...' : 'Publish Wiki'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/wiki')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
