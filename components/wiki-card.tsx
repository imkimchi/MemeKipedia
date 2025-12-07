import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wiki } from '@/lib/types'

interface WikiCardProps {
  wiki: Wiki
}

export function WikiCard({ wiki }: WikiCardProps) {
  return (
    <Link href={`/wiki/${wiki.id}`}>
      <Card className="transition-all hover:border-[#a855f7]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{wiki.title}</CardTitle>
            <Badge variant="secondary">{wiki.category}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-slate-400">
            <div>
              Editor: {wiki.editor.slice(0, 6)}...{wiki.editor.slice(-4)}
            </div>
            <div>Updated: {new Date(wiki.updated_at).toLocaleDateString()}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
