import { Leaf, Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { DishKind } from '@/types'

export function KindBadge({ kind, glass, className }: { kind: DishKind; glass?: boolean; className?: string }) {
  if (glass) {
    return (
      <Badge variant="glass" className={className}>
        {kind === 'pp' ? <Leaf className="text-emerald-300" /> : <Flame className="text-orange-300" />}
        {kind === 'pp' ? 'ПП' : 'Звичайна'}
      </Badge>
    )
  }
  return (
    <Badge variant={kind} className={className}>
      {kind === 'pp' ? <Leaf /> : <Flame />}
      {kind === 'pp' ? 'ПП' : 'Звичайна'}
    </Badge>
  )
}
