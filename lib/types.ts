export interface User {
  id: string
  wallet: string
  nickname: string | null
  settings: Record<string, any>
  created_at: string
}

export interface Wiki {
  id: string
  title: string
  category: string
  cid: string
  editor: string
  created_at: string
  updated_at: string
  // Memecore token fields
  token_address?: string | null
  token_symbol?: string | null
  token_name?: string | null
  token_supply?: string | null
  deploy_tx_hash?: string | null
  token_network?: string | null
  bonding_curve_address?: string | null // Bonding curve for instant trading
}

export interface SnapshotData {
  version: number
  type: 'wiki'
  title: string
  category: string
  body_mdx: string
  media: MediaItem[]
  editor: string
  timestamp: number
}

export interface MediaItem {
  type: 'image' | 'video'
  cid: string
  filename: string
}

export interface Bounty {
  id: string
  title: string
  description: string
  reward_m: number
  deadline: string
  creator: string
  status: 'open' | 'closed'
  created_at: string
  updated_at: string
}

export interface BountySubmission {
  id: string
  bounty_id: string
  submitter: string
  cid: string
  upvotes: number
  created_at: string
}
