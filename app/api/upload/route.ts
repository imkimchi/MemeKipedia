import { NextRequest, NextResponse } from 'next/server'

const PINATA_JWT = process.env.PINATA_JWT!

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (30MB limit for videos, 15MB for images)
    const isVideo = file.type.startsWith('video/')
    const maxSize = isVideo ? 30 * 1024 * 1024 : 15 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${isVideo ? '30' : '15'}MB limit` },
        { status: 400 }
      )
    }

    // Upload to Pinata
    const pinataFormData = new FormData()
    pinataFormData.append('file', file)
    pinataFormData.append('pinataMetadata', JSON.stringify({
      name: file.name,
    }))

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: pinataFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata error:', errorText)
      return NextResponse.json(
        { error: `Failed to upload to IPFS: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ cid: data.IpfsHash })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
