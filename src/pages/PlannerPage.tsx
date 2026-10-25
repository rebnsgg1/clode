import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, GripVertical, Plus, Search, ShoppingBasket, X, Minus } from 'lucide-react'
import { db, addToPlan } from '@/lib/db'
import { useDishes } from '@/hooks/useDishes'
import { addDays, cn, formatDayMonth, startOfWeek, toDateKey, WEEKDAYS, WEEKDAYS_SHORT } from '@/lib/utils'
import type { Dish, PlanEntry } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { DishCover } from '@/components/DishCover'
import { DishPicker } from '@/components/DishPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

type DragData = { type: 'lib'; dish: Dish } | { type: 'entry'; entry: PlanEntry; dish: Dish }

export default function PlannerPage() {
  const dishes = useDishes()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const from = toDateKey(days[0])
  const to = toDateKey(days[6])
  const entries = useLiveQuery(() => db.plan.where('date').between(from, to, true, true).toArray(), [from, to])
  const byId = useMemo(() => new Map((dishes ?? []).map((d) => [d.id, d])), [dishes])
  const [active, setActive] = useState<DragData | null>(null)
  const [pickerDay, setPickerDay] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const todayKey = toDateKey(new Date())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const onDragStart = (e: DragStartEvent) => {
    setActive(e.active.data.current as DragData)
  }

  const onDragEnd = async (e: DragEndEvent) => {
    setActive(null)
    const data = e.active.data.current as DragData | undefined
    const overId = e.over?.id ? String(e.over.id) : null
    if (!data || !overId?.startsWith('day:')) return
    const date = overId.slice(4)
    if (data.type === 'lib') {
      await addToPlan(data.dish.id, date, data.dish.servings)
    } else if (data.entry.date !== date) {
      await db.plan.update(data.entry.id, { date })
    }
  }

  const library = useMemo(() => {
    const query = q.trim().toLowerCase()
    return (dishes ?? []).filter((d) => !query || d.name.toLowerCase().includes(query)).sort((a, b) => a.name.localeCompare(b.name, 'uk'))
  }, [dishes, q])

  const weekLabel = `${formatDayMonth(days[0])} — ${formatDayMonth(days[6])}`
  const weekTotal = (entries ?? []).reduce((s, e) => s + (byId.get(e.dishId)?.calories ?? 0) * e.servings, 0)
  const isCurrentWeek = toDateKey(startOfWeek(new Date())) === from

  return (
    <div>
      <PageHeader
        title="Планувальник"
        subtitle="Перетягуй страви на дні тижня"
        actions={
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link to={`/shopping?from=${from}&to=${to}`}>
              <ShoppingBasket /> Список покупок
            </Link>
          </Button>
        }
      />

      <div className="bg-card shadow-soft ring-border/60 mb-5 flex items-center justify-between gap-2 rounded-2xl p-1.5 ring-1">
        <Button variant="ghost" size="icon" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="Попередній тиждень">
          <ChevronLeft />
        </Button>
        <button className="min-w-0 text-center" onClick={() => setWeekStart(startOfWeek(new Date()))}>
          <div className="truncate text-[15px] font-bold">{weekLabel}</div>
          <div className="text-muted-foreground text-xs font-medium">
            {isCurrentWeek ? 'Цей тиждень' : 'Повернутися до поточного'} · {Math.round(weekTotal)} ккал
          </div>
        </button>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="Наступний тиждень">
          <ChevronRight />
        </Button>
      </div>

      {!dishes || !entries ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-3xl" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Бібліотека страв */}
            <aside className="lg:sticky lg:top-10 lg:self-start">
              <div className="bg-card shadow-soft ring-border/60 rounded-3xl p-3 ring-1">
                <div className="relative mb-3">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Знайти страву" className="h-10 pl-9" />
                </div>
                <p className="text-muted-foreground mb-2 px-1 text-xs font-semibold">
                  <span className="lg:hidden">Перетягни страву на потрібний день ↓</span>
                  <span className="hidden lg:inline">Перетягни страву на день →</span>
                </p>
                <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:mx-0 lg:max-h-[60vh] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:px-0">
                  {library.map((d) => (
                    <LibraryItem key={d.id} dish={d} />
                  ))}
                  {!library.length && <p className="text-muted-foreground p-3 text-sm">Нічого не знайдено</p>}
                </div>
              </div>
            </aside>

            {/* Дні тижня */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {days.map((d, i) => {
                const key = toDateKey(d)
                const dayEntries = entries.filter((e) => e.date === key).sort((a, b) => a.createdAt - b.createdAt)
                return (
                  <DayColumn
                    key={key}
                    dateKey={key}
                    title={WEEKDAYS[i]}
                    short={WEEKDAYS_SHORT[i]}
                    date={d}
                    isToday={key === todayKey}
                    entries={dayEntries}
                    byId={byId}
                    onAdd={() => setPickerDay(key)}
                  />
                )
              })}
            </div>
          </div>

          {createPortal(
            <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }} zIndex={60}>
              {active ? <DragChip dish={active.dish} /> : null}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      )}

      <Button asChild variant="outline" className="mt-5 w-full sm:hidden">
        <Link to={`/shopping?from=${from}&to=${to}`}>
          <ShoppingBasket /> Список покупок на тиждень
        </Link>
      </Button>

      <DishPicker
        open={!!pickerDay}
        onOpenChange={(o) => !o && setPickerDay(null)}
        title="Додати страву"
        onPick={async (dish) => {
          if (!pickerDay) return
          await addToPlan(dish.id, pickerDay, dish.servings)
          toast.success(`${dish.name} — у плані`)
        }}
      />
    </div>
  )
}

function LibraryItem({ dish }: { dish: Dish }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lib:${dish.id}`,
    data: { type: 'lib', dish } satisfies DragData,
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-secondary/60 hover:bg-secondary flex shrink-0 cursor-grab touch-manipulation items-center gap-2.5 rounded-2xl p-1.5 pr-3 transition select-none active:cursor-grabbing lg:shrink',
        isDragging && 'opacity-40',
      )}
    >
      <div className="size-10 shrink-0 overflow-hidden rounded-xl">
        <DishCover dish={dish} emojiClass="text-xl" />
      </div>
      <div className="max-w-40 min-w-0 lg:max-w-none">
        <div className="truncate text-[13px] font-bold">{dish.name}</div>
        <div className="text-muted-foreground text-[11px] font-semibold">{dish.calories} ккал</div>
      </div>
      <GripVertical className="text-muted-foreground/50 ml-auto hidden size-4 lg:block" />
    </div>
  )
}

function DragChip({ dish }: { dish: Dish }) {
  return (
    <div className="bg-card shadow-lift ring-primary flex w-56 rotate-2 items-center gap-2.5 rounded-2xl p-1.5 pr-3 ring-2">
      <div className="size-10 shrink-0 overflow-hidden rounded-xl">
        <DishCover dish={dish} emojiClass="text-xl" />
      </div>
      <div className="min-w-0 truncate text-[13px] font-bold">{dish.name}</div>
    </div>
  )
}

function DayColumn({
  dateKey,
  title,
  short,
  date,
  isToday,
  entries,
  byId,
  onAdd,
}: {
  dateKey: string
  title: string
  short: string
  date: Date
  isToday: boolean
  entries: PlanEntry[]
  byId: Map<string, Dish>
  onAdd: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${dateKey}` })
  const kcal = entries.reduce((s, e) => s + (byId.get(e.dishId)?.calories ?? 0) * e.servings, 0)
  return (
    <section
      ref={setNodeRef}
      className={cn(
        'bg-card shadow-soft ring-border/60 flex min-h-36 flex-col rounded-3xl p-3 ring-1 transition-all duration-200',
        isOver && 'bg-primary/5 ring-primary scale-[1.02] ring-2',
        isToday && !isOver && 'ring-primary/40 ring-2',
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'grid size-10 place-items-center rounded-xl text-center',
              isToday ? 'bg-primary text-primary-foreground' : 'bg-secondary',
            )}
          >
            <div>
              <div className="text-[10px] leading-none font-bold uppercase opacity-80">{short}</div>
              <div className="text-sm leading-tight font-extrabold">{date.getDate()}</div>
            </div>
          </div>
          <div>
            <div className="text-[15px] font-bold">{isToday ? 'Сьогодні' : title}</div>
            <div className="text-muted-foreground text-xs font-semibold">{kcal ? `${Math.round(kcal)} ккал` : formatDayMonth(date)}</div>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="bg-secondary text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-xl transition active:scale-90"
          aria-label="Додати страву"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {entries.map((e) => {
            const dish = byId.get(e.dishId)
            return dish ? <PlanItem key={e.id} entry={e} dish={dish} /> : null
          })}
        </AnimatePresence>
        {!entries.length && (
          <div
            className={cn(
              'text-muted-foreground/70 grid flex-1 place-items-center rounded-2xl border-2 border-dashed py-4 text-xs font-semibold transition',
              isOver && 'border-primary text-primary',
            )}
          >
            Перетягни сюди
          </div>
        )}
      </div>
    </section>
  )
}

function PlanItem({ entry, dish }: { entry: PlanEntry; dish: Dish }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `entry:${entry.id}`,
    data: { type: 'entry', entry, dish } satisfies DragData,
  })
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-secondary/60 flex items-center gap-2 rounded-2xl p-1.5"
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="flex min-w-0 flex-1 cursor-grab touch-manipulation items-center gap-2 select-none active:cursor-grabbing"
      >
        <div className="size-10 shrink-0 overflow-hidden rounded-xl">
          <DishCover dish={dish} emojiClass="text-xl" />
        </div>
        <div className="min-w-0">
          <Link to={`/dish/${dish.id}`} className="block truncate text-[13px] font-bold hover:underline">
            {dish.name}
          </Link>
          <div className="text-muted-foreground text-[11px] font-semibold">{Math.round(dish.calories * entry.servings)} ккал</div>
        </div>
      </div>
      <div className="bg-card flex items-center rounded-xl">
        <button
          onClick={() => (entry.servings > 1 ? db.plan.update(entry.id, { servings: entry.servings - 1 }) : db.plan.delete(entry.id))}
          className="text-muted-foreground hover:text-foreground grid size-7 place-items-center rounded-lg"
          aria-label="Менше порцій"
        >
          {entry.servings > 1 ? <Minus className="size-3.5" /> : <X className="size-3.5" />}
        </button>
        <span className="w-4 text-center text-xs font-extrabold tabular-nums">{entry.servings}</span>
        <button
          onClick={() => db.plan.update(entry.id, { servings: entry.servings + 1 })}
          className="text-muted-foreground hover:text-foreground grid size-7 place-items-center rounded-lg"
          aria-label="Більше порцій"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
