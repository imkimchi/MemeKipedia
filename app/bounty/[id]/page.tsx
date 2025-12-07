'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Bounty, BountySubmission } from '@/lib/types'

export default function BountyDetailPage() {
  const params = useParams()
  const { address, isConnected } = useAccount()
  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [submissions, setSubmissions] = useState<BountySubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [submissionCid, setSubmissionCid] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBounty()
  }, [params.id])

  const fetchBounty = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/bounty/${params.id}`)
      const data = await response.json()

      if (data.bounty) {
        setBounty(data.bounty)
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Failed to fetch bounty:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!submissionCid || !address) {
      alert('Please enter a CID')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/bounty/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submitter: address,
          cid: submissionCid,
        }),
      })

      const result = await response.json()

      if (result.submission) {
        setSubmissionCid('')
        fetchBounty()
      } else {
        alert('Failed to submit')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to submit')
    } finally {
      setSubmitting(false)
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

  if (!bounty) {
    return null
  }

  const isExpired = new Date(bounty.deadline) < new Date()

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-slate-100">{bounty.title}</h1>
            <Badge variant={bounty.status === 'open' ? 'success' : 'outline'}>
              {bounty.status}
            </Badge>
          </div>
          <div className="mt-2 text-sm text-slate-400">
            Created by {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
          </div>
        </div>
        <Badge variant="secondary" className="text-lg">
          {bounty.reward_m} M
        </Badge>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed text-slate-300">{bounty.description}</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
            <div>
              Deadline: {new Date(bounty.deadline).toLocaleString()}
              {isExpired && <span className="ml-2 text-red-400">(Expired)</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {isConnected && bounty.status === 'open' && !isExpired && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Submit Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                IPFS CID of your submission
              </label>
              <Input
                placeholder="Qm..."
                value={submissionCid}
                onChange={(e) => setSubmissionCid(e.target.value)}
              />
            </div>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Entry'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Submissions ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-slate-400">No submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between rounded-md border border-slate-700 p-4"
                >
                  <div>
                    <div className="text-sm text-slate-300">
                      By {submission.submitter.slice(0, 6)}...{submission.submitter.slice(-4)}
                    </div>
                    <a
                      href={`https://ipfs.io/ipfs/${submission.cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-[#a855f7] hover:underline"
                    >
                      View Submission
                    </a>
                  </div>
                  <Badge variant="outline">{submission.upvotes} upvotes</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
