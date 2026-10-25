import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { CalendarDays, Copy, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { useDishes } from '@/hooks/useDishes'
import { buildShoppingList } from '@/lib/shopping'
import { formatAmount } from '@/lib/nutrition'
import { addDays, cn, formatDayMonth, plural, startOfWeek, toDateKey, uid, fromDateKey } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Segmented } from '@/components/ui/segmented'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type Range = 'today' | 'week' | 'next'

function rangeDates(r: Range): [string, string] {
  const now = new Date()
  if (r === 'today') return [toDateKey(now), toDateKey(now)]
  const start = addDays(startOfWeek(now), r === 'next' ? 7 : 0)
  return [toDateKey(start), toDateKey(addDays(start, 6))]
}

interface Row {
  key: string
  name: string
  detail?: string
  amount?: string
  checked: boolean
  extra?: boolean
}

export default function ShoppingPage() {
  const [params, setParams] = useSearchParams()
  const initial = (() => {
    const f = params.get('from')
    if (!f) return 'week'
    if (f === rangeDates('next')[0]) return 'next'
    if (f === rangeDates('today')[0] && params.get('to') === f) return 'today'
    return 'week'
  })()
  const [range, setRange] = useState<Range>(initial as Range)
  const [from, to] =
    params.get('from') && params.get('to') && range === initial ? [params.get('from')!, params.get('to')!] : rangeDates(range)

  const dishes = useDishes()
  const entries = useLiveQuery(() => db.plan.where('date').between(from, to, true, true).toArray(), [from, to])
  const checks = useLiveQuery(() => db.shoppingChecks.toArray(), [])
  const extras = useLiveQuery(() => db.shoppingExtras.orderBy('createdAt').toArray(), [])
  const [newItem, setNewItem] = useState('')

  const items = useMemo(() => {
    if (!dishes || !entries) return []
    return buildShoppingList(entries, new Map(dishes.map((d) => [d.id, d])))
  }, [dishes, entries])

  const checkedSet = useMemo(() => new Set((checks ?? []).filter((c) => c.checked).map((c) => c.key)), [checks])

  const rows: Row[] = [
    ...items.map((i) => ({
      key: i.key,
      name: i.name,
      amount: i.amount ? formatAmount(i.amount, i.unit) : i.unit,
      detail: i.dishes.join(', '),
      checked: checkedSet.has(i.key),
    })),
    ...(extras ?? []).map((e) => ({ key: e.id, name: e.name, checked: e.checked, extra: true })),
  ]
  const todo = rows.filter((r) => !r.checked)
  const done = rows.filter((r) => r.checked)
  const progress = rows.length ? done.length / rows.length : 0

  const toggle = async (row: Row, value: boolean) => {
    if (row.extra) await db.shoppingExtras.update(row.key, { checked: value })
    else await db.shoppingChecks.put({ key: row.key, checked: value })
  }

  const addExtra = async () => {
    const name = newItem.trim()
    if (!name) return
    await db.shoppingExtras.add({ id: uid(), name, checked: false, createdAt: Date.now() })
    setNewItem('')
  }

  const copy = async () => {
    const text = todo.map((r) => `• ${r.name}${r.amount ? ` — ${r.amount}` : ''}`).join('\n')
    try {
      await navigator.clipboard.writeText(`Список покупок:\n${text}`)
      toast.success('Список скопійовано')
    } catch {
      toast.error('Не вдалося скопіювати')
    }
  }

  const resetChecks = async () => {
    await db.shoppingChecks.clear()
    await db.shoppingExtras.toCollection().modify({ checked: false })
  }

  const loading = !dishes || !entries || !checks || !extras
  const label =
    from === to ? formatDayMonth(fromDateKey(from)) : `${formatDayMonth(fromDateKey(from))} — ${formatDayMonth(fromDateKey(to))}`

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Покупки" subtitle={`Із запланованих страв · ${label}`} />

      <Segmented<Range>
        id="shop-range"
        className="mb-5 w-full"
        value={range}
        onChange={(r) => {
          setRange(r)
          setParams({}, { replace: true })
        }}
        options={[
          { value: 'today', label: 'Сьогодні' },
          { value: 'week', label: 'Цей тиждень' },
          { value: 'next', label: 'Наступний' },
        ]}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {rows.length > 0 && (
            <div className="bg-card shadow-soft ring-border/60 mb-5 rounded-3xl p-4 ring-1">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-bold">
                  Куплено {done.length} з {rows.length}
                </span>
                <span className="text-primary text-sm font-extrabold">{Math.round(progress * 100)}%</span>
              </div>
              <div className="bg-secondary h-2.5 overflow-hidden rounded-full">
                <motion.div
                  className="bg-primary h-full rounded-full"
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={copy} disabled={!todo.length}>
                  <Copy /> Копіювати
                </Button>
                <Button size="sm" variant="ghost" onClick={resetChecks} disabled={!done.length}>
                  <RotateCcw /> Скинути
                </Button>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              addExtra()
            }}
            className="mb-5 flex gap-2"
          >
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Додати свій пункт (напр., хліб)"
              className="rounded-2xl"
            />
            <Button type="submit" size="icon" aria-label="Додати" disabled={!newItem.trim()}>
              <Plus />
            </Button>
          </form>

          {rows.length === 0 ? (
            <EmptyState
              emoji="🛒"
              title="Список порожній"
              text={`Заплануй страви на ${range === 'today' ? 'сьогодні' : 'тиждень'} — і інгредієнти зберуться тут автоматично.`}
              action={
                <Button asChild>
                  <Link to="/planner">
                    <CalendarDays /> До планувальника
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              <ul className="bg-card shadow-soft ring-border/60 overflow-hidden rounded-3xl ring-1">
                <AnimatePresence initial={false}>
                  {todo.map((r) => (
                    <ShopRow key={r.key} row={r} onToggle={toggle} />
                  ))}
                </AnimatePresence>
                {!todo.length && <li className="text-primary p-6 text-center text-sm font-semibold">Усе куплено! 🎉</li>}
              </ul>
              {done.length > 0 && (
                <div>
                  <h3 className="text-muted-foreground mb-2 px-1 text-sm font-bold">
                    Куплено · {done.length} {plural(done.length, ['позиція', 'позиції', 'позицій'])}
                  </h3>
                  <ul className="bg-card/60 ring-border/60 overflow-hidden rounded-3xl ring-1">
                    <AnimatePresence initial={false}>
                      {done.map((r) => (
                        <ShopRow key={r.key} row={r} onToggle={toggle} />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ShopRow({ row, onToggle }: { row: Row; onToggle: (r: Row, v: boolean) => void }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="border-border/60 border-b last:border-0"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Checkbox checked={row.checked} onCheckedChange={(v) => onToggle(row, !!v)} aria-label={row.name} />
        <button className="min-w-0 flex-1 text-left" onClick={() => onToggle(row, !row.checked)}>
          <div className={cn('text-[15px] font-semibold transition', row.checked && 'text-muted-foreground line-through')}>{row.name}</div>
          {row.detail && <div className="text-muted-foreground truncate text-xs">{row.detail}</div>}
        </button>
        {row.amount && (
          <span className={cn('shrink-0 text-[15px] font-bold tabular-nums', row.checked && 'text-muted-foreground')}>{row.amount}</span>
        )}
        {row.extra && (
          <button
            onClick={() => db.shoppingExtras.delete(row.key)}
            className="text-muted-foreground hover:text-destructive grid size-8 place-items-center rounded-lg"
            aria-label="Видалити"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </motion.li>
  )
}
