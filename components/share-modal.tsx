'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check, Twitter, Send } from 'lucide-react'
import { toast } from 'sonner'

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  url: string
}

export function ShareModal({ open, onOpenChange, title, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Check out ${title}!`)
    const shareUrl = encodeURIComponent(url)
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      '_blank',
      'width=550,height=420'
    )
  }

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`Check out ${title}!`)
    const shareUrl = encodeURIComponent(url)
    window.open(
      `https://t.me/share/url?url=${shareUrl}&text=${text}`,
      '_blank'
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Share</DialogTitle>
          <DialogDescription className="text-slate-400">
            Share this wiki with others
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Link</label>
            <div className="flex gap-2">
              <Input
                value={url}
                readOnly
                className="bg-slate-800 border-slate-700 text-slate-100 font-mono text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="icon"
                className="shrink-0 border-slate-700 hover:bg-slate-800"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share to Social Media */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Share to</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleShareTwitter}
                variant="outline"
                className="w-full border-slate-700 hover:bg-slate-800 hover:border-blue-500 transition-colors"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={handleShareTelegram}
                variant="outline"
                className="w-full border-slate-700 hover:bg-slate-800 hover:border-blue-500 transition-colors"
              >
                <Send className="h-4 w-4 mr-2" />
                Telegram
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
