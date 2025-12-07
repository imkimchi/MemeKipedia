import { SnapshotData } from './types'

const PINATA_JWT = process.env.PINATA_JWT!
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

export async function uploadText(text: string): Promise<string> {
  const response = await fetch(PINATA_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: text,
      pinataMetadata: {
        name: `text-${Date.now()}.txt`,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to upload text to IPFS: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data.IpfsHash
}

export async function uploadFile(file: File): Promise<string> {
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('pinataMetadata', JSON.stringify({
    name: file.name,
  }))

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to upload file to IPFS: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data.IpfsHash
}

export async function uploadSnapshot(snapshot: SnapshotData): Promise<string> {
  const snapshotJson = JSON.stringify(snapshot)
  const maxSize = 1024 * 1024 // 1MB

  if (new Blob([snapshotJson]).size > maxSize) {
    throw new Error('Snapshot size exceeds 1MB limit')
  }

  const response = await fetch(PINATA_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: snapshot,
      pinataMetadata: {
        name: `snapshot-${Date.now()}.json`,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to upload snapshot to IPFS: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data.IpfsHash
}

export function getIPFSUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`
}
