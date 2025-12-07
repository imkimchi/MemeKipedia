'use client'

import { useAccount } from 'wagmi'
import { useUser } from '@/lib/store/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AccountPage() {
  const { address, isConnected } = useAccount()
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected && !isLoading) {
      router.push('/')
    }
  }, [isConnected, isLoading, router])

  if (!isConnected || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-100">Connect Wallet</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Please connect your wallet to view your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-100">Account</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300">Wallet Address</label>
              <Input value={address} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Nickname</label>
              <Input
                placeholder="Enter nickname"
                defaultValue={user.nickname || ''}
                className="mt-1"
              />
            </div>
            <Button>Update Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Early Adopter</Badge>
              <Badge variant="outline">Contributor</Badge>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Earn badges by contributing to wikis and participating in bounties.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-slate-400">
              Staking features will be available in Phase 7.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-slate-400">
              No edits yet. Start contributing to wikis to see your history here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total M Earned:</span>
              <span className="text-lg font-semibold text-[#a855f7]">0 M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Pending Rewards:</span>
              <span className="text-lg font-semibold text-[#98fce5]">0 M</span>
            </div>
            <Button variant="outline" className="w-full" disabled>
              Claim Rewards (Phase 7)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Wikis Created:</span>
              <span className="text-slate-100">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Wikis Edited:</span>
              <span className="text-slate-100">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Bounties Created:</span>
              <span className="text-slate-100">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Submissions:</span>
              <span className="text-slate-100">0</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
