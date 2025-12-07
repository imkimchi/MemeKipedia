'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { uploadFile } from '@/lib/ipfs'

interface ImageUploadButtonProps {
  onUpload: (cid: string, filename: string) => void
}

export function ImageUploadButton({ onUpload }: ImageUploadButtonProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Only image and video files are allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const cid = await uploadFile(file)
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

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading...' : 'Upload Image'}
      </Button>
    </>
  )
}
