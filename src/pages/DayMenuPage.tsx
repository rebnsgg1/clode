import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { AlertTriangle, CalendarPlus, Lock, LockOpen, RefreshCw, Sparkles } from 'lucide-react'
import { useDishes } from '@/hooks/useDishes'
import { useStoredState } from '@/hooks/useStoredState'
import { addToPlan } from '@/lib/db'
import { DAY_SLOTS, generateDayMenu, menuCalories, type DaySlot, type DayMenu } from '@/lib/random'
import type { KindFilter } from '@/lib/filters'
import { sumMacros } from '@/lib/nutrition'
import { cn, toDateKey } from '@/lib/utils'
import type { Dish } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { RandomTabs } from '@/components/RandomTabs'
import { DishCover } from '@/components/DishCover'
import { MacroRing } from '@/components/MacroRing'
import { EmptyState } from '@/components/EmptyState'
import { Segmented } from '@/components/ui/segmented'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface Saved {
  kind: KindFilter
  limitOn: boolean
  limit: number
  ids: Partial<Record<DaySlot, string>>
  locked: DaySlot[]
}

export default function DayMenuPage() {
  const dishes = useDishes()
  const navigate = useNavigate()
  const [state, setState] = useStoredState<Saved>('day-menu', { kind: 'all', limitOn: false, limit: 1800, ids: {}, locked: [] })
  const [fits, setFits] = useState(true)
  const [rollKey, setRollKey] = useState(0)

  const byId = useMemo(() => new Map((dishes ?? []).map((d) => [d.id, d])), [dishes])
  const menu = useMemo(
    () => Object.fromEntries(DAY_SLOTS.map(({ slot }) => [slot, state.ids[slot] ? byId.get(state.ids[slot]!) : undefined])) as DayMenu,
    [state.ids, byId],
  )
  const hasMenu = Object.values(menu).some(Boolean)
  const chosen = Object.values(menu).filter(Boolean) as Dish[]
  const totals = sumMacros(chosen.map((dish) => ({ dish })))
  const limit = state.limitOn ? state.limit : null

  const generate = (onlySlot?: DaySlot) => {
    if (!dishes) return
    const locked: Partial<DayMenu> = {}
    for (const { slot } of DAY_SLOTS) {
      const keep = onlySlot ? slot !== onlySlot : state.locked.includes(slot)
      if (keep && menu[slot]) locked[slot] = menu[slot]
    }
    const res = generateDayMenu(dishes, { kind: state.kind, limit, locked })
    setFits(res.fits)
    setState({ ...state, ids: Object.fromEntries(DAY_SLOTS.map(({ slot }) => [slot, res.menu[slot]?.id])) })
    setRollKey((k) => k + 1)
  }

  const toggleLock = (slot: DaySlot) =>
    setState({ ...state, locked: state.locked.includes(slot) ? state.locked.filter((s) => s !== slot) : [...state.locked, slot] })

  const saveToPlan = async () => {
    const date = toDateKey(new Date())
    for (const d of chosen) await addToPlan(d.id, date, 1)
    toast.success('Меню додано в план на сьогодні', { action: { label: 'Відкрити', onClick: () => navigate('/planner') } })
  }

  if (!dishes) return <Skeleton className="h-[480px] rounded-3xl" />

  return (
    <div className="mx-auto max-w-4xl">
      <RandomTabs />
      <PageHeader title="Меню на день" subtitle="Сніданок, обід, вечеря та перекус — одним натиском" />

      {dishes.length === 0 ? (
        <EmptyState
          emoji="📅"
          title="Спочатку додай страви"
          action={
            <Button asChild>
              <Link to="/dish/new">Додати першу страву</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-5">
            <section className="bg-card shadow-soft ring-border/60 space-y-4 rounded-3xl p-4 ring-1 sm:p-5">
              <Segmented<KindFilter>
                id="day-kind"
                className="w-full"
                value={state.kind}
                onChange={(kind) => setState({ ...state, kind })}
                options={[
                  { value: 'all', label: 'Мікс' },
                  { value: 'pp', label: 'Тільки ПП', activeClass: 'bg-pp' },
                  { value: 'regular', label: 'Звичайні', activeClass: 'bg-regular' },
                ]}
              />
              <div className="bg-secondary/60 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="limit" className="text-sm font-bold">
                    Ліміт калорій
                  </label>
                  <Switch id="limit" checked={state.limitOn} onCheckedChange={(limitOn) => setState({ ...state, limitOn })} />
                </div>
                <AnimatePresence initial={false}>
                  {state.limitOn && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <div className="mb-2 text-2xl font-extrabold tabular-nums">
                          {state.limit} <span className="text-muted-foreground text-base font-semibold">ккал</span>
                        </div>
                        <Slider
                          min={800}
                          max={3500}
                          step={50}
                          value={[state.limit]}
                          onValueChange={([limit]) => setState({ ...state, limit })}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button size="xl" className="w-full" onClick={() => generate()}>
                <Sparkles /> {hasMenu ? 'Згенерувати заново' : 'Згенерувати меню'}
              </Button>
            </section>

            {!fits && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 rounded-2xl bg-amber-500/10 p-4 text-sm font-medium text-amber-700 dark:text-amber-300"
              >
                <AlertTriangle className="size-5 shrink-0" />
                Не вдалося вкластися в ліміт — показано найлегше меню. Додай більше легких страв або збільш ліміт.
              </motion.div>
            )}

            {hasMenu && (
              <div className="space-y-3">
                {DAY_SLOTS.map(({ slot, label, emoji }, i) => (
                  <SlotCard
                    key={slot}
                    rollKey={rollKey}
                    index={i}
                    label={label}
                    emoji={emoji}
                    dish={menu[slot]}
                    locked={state.locked.includes(slot)}
                    onLock={() => toggleLock(slot)}
                    onReroll={() => generate(slot)}
                  />
                ))}
              </div>
            )}
          </div>

          {hasMenu && (
            <aside className="space-y-4 lg:sticky lg:top-10">
              <section className="bg-card shadow-soft ring-border/60 rounded-3xl p-5 ring-1">
                <h2 className="mb-4 text-lg font-bold">Підсумок дня</h2>
                <MacroRing
                  key={rollKey}
                  calories={totals.calories}
                  protein={totals.protein}
                  fat={totals.fat}
                  carbs={totals.carbs}
                  caption="ккал за день"
                />
                {limit && (
                  <div className="mt-5">
                    <div className="mb-1.5 flex justify-between text-[13px] font-semibold">
                      <span className="text-muted-foreground">Ліміт</span>
                      <span className={menuCalories(menu) > limit ? 'text-destructive' : 'text-primary'}>
                        {Math.round(menuCalories(menu))} / {limit}
                      </span>
                    </div>
                    <div className="bg-secondary h-2.5 overflow-hidden rounded-full">
                      <motion.div
                        className={cn('h-full rounded-full', menuCalories(menu) > limit ? 'bg-destructive' : 'bg-primary')}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (menuCalories(menu) / limit) * 100)}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                )}
              </section>
              <Button variant="outline" size="lg" className="w-full" onClick={saveToPlan}>
                <CalendarPlus /> Додати в план на сьогодні
              </Button>
            </aside>
          )}
        </div>
      )}
    </div>
  )
}

function SlotCard({
  label,
  emoji,
  dish,
  locked,
  onLock,
  onReroll,
  rollKey,
  index,
}: {
  label: string
  emoji: string
  dish?: Dish
  locked: boolean
  onLock: () => void
  onReroll: () => void
  rollKey: number
  index: number
}) {
  return (
    <motion.div
      key={`${rollKey}-${dish?.id}`}
      initial={{ opacity: 0, y: 14, rotateX: -25 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'bg-card shadow-soft ring-border/60 flex items-center gap-3 rounded-3xl p-3 ring-1',
        locked && 'ring-primary/60 ring-2',
      )}
    >
      {dish ? (
        <Link to={`/dish/${dish.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="size-[72px] shrink-0 overflow-hidden rounded-2xl">
            <DishCover dish={dish} emojiClass="text-4xl" />
          </div>
          <div className="min-w-0">
            <div className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
              {emoji} {label}
            </div>
            <div className="truncate text-[15px] font-bold">{dish.name}</div>
            <div className="text-muted-foreground text-[13px] font-medium">
              <span className={dish.kind === 'pp' ? 'text-pp-foreground' : 'text-regular-foreground'}>{dish.calories} ккал</span> · Б{' '}
              {dish.protein} · Ж {dish.fat} · В {dish.carbs}
            </div>
          </div>
        </Link>
      ) : (
        <div className="text-muted-foreground flex flex-1 items-center gap-3 py-3 pl-2 text-sm">
          <span className="text-2xl">{emoji}</span> Немає страв для «{label.toLowerCase()}»
        </div>
      )}
      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          onClick={onLock}
          className={cn(
            'grid size-9 place-items-center rounded-xl transition active:scale-90',
            locked ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
          )}
          aria-label={locked ? 'Розблокувати' : 'Зафіксувати'}
        >
          {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
        </button>
        <button
          onClick={onReroll}
          disabled={locked}
          className="bg-secondary text-muted-foreground grid size-9 place-items-center rounded-xl transition active:scale-90 disabled:opacity-40"
          aria-label="Замінити"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>
    </motion.div>
  )
}
