'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger } from '@/components/ui/modal'
import { BountyCard } from '@/components/bounty-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Bounty } from '@/lib/types'

export default function BountyPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open')
  const [creating, setCreating] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rewardM, setRewardM] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    fetchBounties()
  }, [filter])

  const fetchBounties = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.set('status', filter)
      }

      const response = await fetch(`/api/bounty?${params}`)
      const result = await response.json()

      setBounties(result.data || [])
    } catch (error) {
      console.error('Failed to fetch bounties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!title || !description || !rewardM || !deadline || !address) {
      alert('Please fill in all fields')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/bounty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          reward_m: parseFloat(rewardM),
          deadline: new Date(deadline).toISOString(),
          creator: address,
        }),
      })

      const result = await response.json()

      if (result.bounty) {
        router.push(`/bounty/${result.bounty.id}`)
      } else {
        alert('Failed to create bounty')
      }
    } catch (error) {
      console.error('Create error:', error)
      alert('Failed to create bounty')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-slate-100">Bounty Hub</h1>
        {isConnected && (
          <Modal>
            <ModalTrigger asChild>
              <Button>Create Bounty</Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Create New Bounty</ModalTitle>
              </ModalHeader>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#a855f7]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Reward (M tokens)
                  </label>
                  <Input
                    type="number"
                    value={rewardM}
                    onChange={(e) => setRewardM(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Deadline</label>
                  <Input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? 'Creating...' : 'Create Bounty'}
                </Button>
              </div>
            </ModalContent>
          </Modal>
        )}
      </div>

      <div className="mt-8 flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'open' ? 'default' : 'outline'}
          onClick={() => setFilter('open')}
        >
          Open
        </Button>
        <Button
          variant={filter === 'closed' ? 'default' : 'outline'}
          onClick={() => setFilter('closed')}
        >
          Closed
        </Button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
          : bounties.map((bounty) => <BountyCard key={bounty.id} bounty={bounty} />)}
      </div>

      {bounties.length === 0 && !loading && (
        <div className="mt-8 text-center text-slate-400">No bounties found.</div>
      )}
    </div>
  )
}
