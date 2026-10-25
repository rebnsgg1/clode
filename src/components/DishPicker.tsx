import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search } from 'lucide-react'
import { db } from '@/lib/db'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { DishCover } from './DishCover'
import type { Dish } from '@/types'
import type { KindFilter } from '@/lib/filters'

/** Шторка вибору страви (для планувальника) */
export function DishPicker({
  open,
  onOpenChange,
  title,
  onPick,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  onPick: (dish: Dish) => void
}) {
  const dishes = useLiveQuery(() => db.dishes.toArray(), [])
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<KindFilter>('all')
  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return (dishes ?? [])
      .filter((d) => (kind === 'all' || d.kind === kind) && (!query || d.name.toLowerCase().includes(query)))
      .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
  }, [dishes, q, kind])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={title}>
        <div className="bg-popover sticky top-0 z-10 -mx-6 space-y-3 px-6 pb-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук страви" className="pl-10" />
          </div>
          <Segmented
            id="picker-kind"
            size="sm"
            className="w-full"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'all', label: 'Усі' },
              { value: 'pp', label: 'ПП', activeClass: 'bg-pp' },
              { value: 'regular', label: 'Звичайні', activeClass: 'bg-regular' },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          {list.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                onPick(d)
                onOpenChange(false)
              }}
              className="hover:bg-accent flex w-full items-center gap-3 rounded-2xl p-2 text-left transition active:scale-[0.99]"
            >
              <div className="size-12 shrink-0 overflow-hidden rounded-xl">
                <DishCover dish={d} emojiClass="text-2xl" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold">{d.name}</div>
                <div className="text-muted-foreground text-[13px]">
                  {d.calories} ккал · {d.timeMin} хв
                </div>
              </div>
              <span className={d.kind === 'pp' ? 'bg-pp size-2.5 rounded-full' : 'bg-regular size-2.5 rounded-full'} />
            </button>
          ))}
          {dishes && !list.length && <p className="text-muted-foreground py-8 text-center text-sm">Нічого не знайдено</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}
