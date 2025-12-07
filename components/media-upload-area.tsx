'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ImageIcon } from 'lucide-react'

interface MediaUploadAreaProps {
  onUpload: (cid: string, filename: string) => void
  value?: string // Current CID if already uploaded
  maxSizeImage?: number // in MB
  maxSizeVideo?: number // in MB
}

export function MediaUploadArea({
  onUpload,
  value,
  maxSizeImage = 15,
  maxSizeVideo = 30
}: MediaUploadAreaProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File) => {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      alert('Only image and video files are allowed')
      return false
    }

    const maxSize = isImage ? maxSizeImage : maxSizeVideo
    const fileSizeMB = file.size / (1024 * 1024)

    if (fileSizeMB > maxSize) {
      alert(`${isImage ? 'Image' : 'Video'} size must be less than ${maxSize}MB`)
      return false
    }

    return true
  }

  const handleFile = async (file: File) => {
    if (!validateFile(file)) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { cid } = await response.json()
      onUpload(cid, file.name)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await handleFile(file)
  }

  return (
    <div className="space-y-4">
      {value ? (
        // Show uploaded image
        <div className="relative rounded-lg border-2 border-slate-700 bg-slate-900/50 p-4">
          <div className="flex items-center gap-4">
            <img
              src={`https://ipfs.io/ipfs/${value}`}
              alt="Uploaded media"
              className="h-24 w-24 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-100">Image uploaded successfully</p>
              <p className="text-xs text-slate-400 break-all">CID: {value}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Change'}
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpg,image/jpeg,image/gif,image/png,video/mp4"
            onChange={handleFileChange}
            className="hidden"
            id="media-upload-input"
          />
        </div>
      ) : (
        // Show upload area
        <div
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-slate-700 bg-slate-900/50'
          } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpg,image/jpeg,image/gif,image/png,video/mp4"
            onChange={handleFileChange}
            className="hidden"
            id="media-upload-input"
          />

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-lg border-2 border-slate-700 p-4">
              <ImageIcon className="h-8 w-8 text-slate-400" />
            </div>

            <h3 className="mb-2 text-lg font-semibold text-slate-100">
              Select video or image to upload
            </h3>
            <p className="mb-4 text-sm text-slate-400">
              or drag and drop it here
            </p>

            <Button
              type="button"
              size="lg"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="bg-[#8cf1c8] text-slate-900 hover:bg-[#7ce0b7]"
            >
              {uploading ? 'Uploading...' : 'Log in'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded border border-slate-700 p-1.5">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-slate-100">File size and type</h4>
          </div>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>• Image - max {maxSizeImage}mb. '.jpg', '.gif' or '.png' recommended</li>
            <li>• Video - max {maxSizeVideo}mb. '.mp4' recommended</li>
          </ul>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded border border-slate-700 p-1.5">
              <ImageIcon className="h-4 w-4 text-slate-400" />
            </div>
            <h4 className="font-semibold text-slate-100">Resolution and aspect ratio</h4>
          </div>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>• Image - min. 1000×1000px, 1:1 square recommended</li>
            <li>• Video - 16:9 or 9:16, 1080p+ recommended</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
