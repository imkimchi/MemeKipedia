import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bounty } from '@/lib/types'

interface BountyCardProps {
  bounty: Bounty
}

export function BountyCard({ bounty }: BountyCardProps) {
  const isExpired = new Date(bounty.deadline) < new Date()
  const daysLeft = Math.ceil(
    (new Date(bounty.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Link href={`/bounty/${bounty.id}`}>
      <Card className="transition-all hover:border-[#a855f7]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{bounty.title}</CardTitle>
            <Badge variant={bounty.status === 'open' ? 'success' : 'outline'}>
              {bounty.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="line-clamp-2 text-sm text-slate-400">{bounty.description}</p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{bounty.reward_m} M</Badge>
              {!isExpired && bounty.status === 'open' && (
                <span className="text-slate-400">
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Expires today'}
                </span>
              )}
              {isExpired && <span className="text-red-400">Expired</span>}
            </div>
          </div>
          <div className="text-xs text-slate-400">
            By {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
