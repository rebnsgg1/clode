import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { CalendarPlus, ChefHat, ChevronLeft, Clock, Gauge, Minus, Pencil, Plus, Trash2, Users, CheckCircle2 } from 'lucide-react'
import { useDish } from '@/hooks/useDishes'
import { useStoredState } from '@/hooks/useStoredState'
import { addToPlan, db, deleteDish, markCooked } from '@/lib/db'
import { DIFFICULTY_LABEL, MEAL_LABEL } from '@/lib/constants'
import { formatAmount } from '@/lib/nutrition'
import { stepTimerMinutes } from '@/lib/time'
import { addDays, cn, formatDayMonth, formatMinutes, haptic, plural, toDateKey, WEEKDAYS } from '@/lib/utils'
import { DishCover } from '@/components/DishCover'
import { FavoriteButton } from '@/components/FavoriteButton'
import { KindBadge } from '@/components/KindBadge'
import { StarRating } from '@/components/StarRating'
import { MacroRing } from '@/components/MacroRing'
import { StepTimerButton } from '@/components/StepTimer'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Segmented } from '@/components/ui/segmented'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import type { Dish } from '@/types'

export default function DishPage() {
  const { id } = useParams()
  const dish = useDish(id)

  if (dish === undefined) return <DishSkeleton />
  if (dish === null)
    return (
      <EmptyState
        emoji="🤷"
        title="Страву не знайдено"
        text="Можливо, її було видалено."
        action={
          <Button asChild>
            <Link to="/">До рецептів</Link>
          </Button>
        }
      />
    )
  return <DishView dish={dish} />
}

function DishView({ dish }: { dish: Dish }) {
  const navigate = useNavigate()
  const [servings, setServings] = useState(dish.servings)
  const [macroMode, setMacroMode] = useState<'one' | 'total'>('one')
  const [checked, setChecked] = useStoredState<Record<string, boolean>>(`checked-${dish.id}`, {})
  const [planOpen, setPlanOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const factor = servings / dish.servings
  const mult = macroMode === 'total' ? servings : 1
  const accent = dish.kind === 'pp' ? 'pp' : 'regular'
  const checkedCount = dish.ingredients.filter((i) => checked[i.id]).length

  const cooked = async () => {
    await markCooked(dish)
    haptic(20)
    toast.success('Записано в історію 🍽️', { description: dish.name })
  }

  return (
    <div className="-mt-[max(env(safe-area-inset-top),20px)] md:mt-0">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
        {/* Ліва колонка */}
        <div className="lg:sticky lg:top-10 lg:self-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="shadow-soft relative -mx-4 aspect-[4/3.4] overflow-hidden rounded-b-[32px] sm:-mx-6 md:mx-0 md:aspect-[16/11] md:rounded-[28px]"
          >
            <DishCover dish={dish} emojiClass="text-[110px] md:text-[140px]" />
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/30 to-transparent" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(env(safe-area-inset-top),16px)] md:pt-4">
              <button
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                className="grid size-10 place-items-center rounded-full bg-black/25 text-white backdrop-blur-md transition active:scale-90"
                aria-label="Назад"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex gap-2">
                <Link
                  to={`/dish/${dish.id}/edit`}
                  className="grid size-10 place-items-center rounded-full bg-black/25 text-white backdrop-blur-md transition active:scale-90"
                  aria-label="Редагувати"
                >
                  <Pencil className="size-[18px]" />
                </Link>
                <FavoriteButton dish={dish} className="size-10" />
              </div>
            </div>
          </motion.div>

          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <KindBadge kind={dish.kind} />
              {dish.meals.map((m) => (
                <Badge key={m}>{MEAL_LABEL[m]}</Badge>
              ))}
            </div>
            <h1 className="text-[28px] leading-tight font-extrabold tracking-tight sm:text-[34px]">{dish.name}</h1>
            {dish.description && <p className="text-muted-foreground text-[15px] leading-relaxed">{dish.description}</p>}

            <div className="grid grid-cols-3 gap-2">
              <Meta icon={<Clock />} label="Час" value={formatMinutes(dish.timeMin)} />
              <Meta icon={<Gauge />} label="Складність" value={DIFFICULTY_LABEL[dish.difficulty]} />
              <Meta icon={<Users />} label="Порцій" value={String(dish.servings)} />
            </div>

            <div className="bg-card ring-border/70 flex items-center justify-between rounded-2xl p-3 pl-4 ring-1">
              <span className="text-muted-foreground text-sm font-semibold">Моя оцінка</span>
              <StarRating value={dish.rating} onChange={(rating) => db.dishes.update(dish.id, { rating })} />
            </div>

            {dish.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dish.tags.map((t) => (
                  <span key={t} className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-[13px] font-semibold">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <Button asChild variant={accent} size="lg">
                <Link to={`/dish/${dish.id}/cook`}>
                  <ChefHat /> Готувати
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-4" onClick={() => setPlanOpen(true)} aria-label="Додати в план">
                <CalendarPlus />
                <span className="hidden sm:inline">У план</span>
              </Button>
              <Button variant="outline" size="lg" className="px-4" onClick={cooked} aria-label="Я це приготував(-ла)">
                <CheckCircle2 />
                <span className="hidden sm:inline">Приготовано</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Права колонка */}
        <div className="space-y-6">
          <section className="bg-card shadow-soft ring-border/60 rounded-3xl p-5 ring-1">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">КБЖВ</h2>
              <Segmented
                id="macro-mode"
                size="sm"
                value={macroMode}
                onChange={setMacroMode}
                options={[
                  { value: 'one', label: 'Порція' },
                  { value: 'total', label: `${servings} ${plural(servings, ['порція', 'порції', 'порцій'])}` },
                ]}
              />
            </div>
            <MacroRing
              key={macroMode}
              calories={dish.calories * mult}
              protein={dish.protein * mult}
              fat={dish.fat * mult}
              carbs={dish.carbs * mult}
              caption={macroMode === 'one' ? 'ккал / порція' : 'ккал усього'}
            />
          </section>

          <section className="bg-card shadow-soft ring-border/60 rounded-3xl p-5 ring-1">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Інгредієнти</h2>
                <p className="text-muted-foreground text-[13px] font-medium">
                  {checkedCount ? `Готово ${checkedCount} з ${dish.ingredients.length}` : `${dish.ingredients.length} позицій`}
                </p>
              </div>
              <div className="bg-secondary flex items-center gap-1 rounded-2xl p-1">
                <button
                  className="hover:bg-card grid size-9 place-items-center rounded-xl transition active:scale-90 disabled:opacity-40"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  disabled={servings <= 1}
                  aria-label="Менше порцій"
                >
                  <Minus className="size-4" />
                </button>
                <div className="min-w-14 text-center">
                  <motion.div
                    key={servings}
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-base leading-none font-extrabold tabular-nums"
                  >
                    {servings}
                  </motion.div>
                  <div className="text-muted-foreground text-[10px] font-bold uppercase">
                    {plural(servings, ['порція', 'порції', 'порцій'])}
                  </div>
                </div>
                <button
                  className="hover:bg-card grid size-9 place-items-center rounded-xl transition active:scale-90"
                  onClick={() => setServings((s) => Math.min(50, s + 1))}
                  aria-label="Більше порцій"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
            <ul className="divide-border/70 divide-y">
              {dish.ingredients.map((ing) => {
                const isChecked = !!checked[ing.id]
                return (
                  <li key={ing.id}>
                    <label className="flex cursor-pointer items-center gap-3 py-3">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(v) => {
                          haptic()
                          setChecked({ ...checked, [ing.id]: !!v })
                        }}
                      />
                      <span className={cn('flex-1 text-[15px] font-medium transition', isChecked && 'text-muted-foreground line-through')}>
                        {ing.name}
                      </span>
                      <span className={cn('text-[15px] font-bold tabular-nums transition', isChecked && 'text-muted-foreground')}>
                        {formatAmount(ing.amount * factor, ing.unit)}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
            {checkedCount > 0 && (
              <button onClick={() => setChecked({})} className="text-muted-foreground hover:text-foreground mt-2 text-[13px] font-semibold">
                Зняти всі позначки
              </button>
            )}
          </section>

          <section className="bg-card shadow-soft ring-border/60 rounded-3xl p-5 ring-1">
            <h2 className="mb-4 text-lg font-bold">Приготування</h2>
            <ol className="space-y-5">
              {dish.steps.map((step, i) => {
                const min = stepTimerMinutes(step)
                return (
                  <li key={step.id} className="flex gap-4">
                    <span
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold',
                        dish.kind === 'pp' ? 'bg-pp-soft text-pp-foreground' : 'bg-regular-soft text-regular-foreground',
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 space-y-2 pt-1">
                      <p className="text-[15px] leading-relaxed">{step.text}</p>
                      {min && <StepTimerButton id={`${dish.id}-${step.id}`} label={`${dish.name}: крок ${i + 1}`} minutes={min} />}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>

          <div className="flex justify-center pb-4">
            <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
              <Trash2 /> Видалити страву
            </Button>
          </div>
        </div>
      </div>

      <PlanSheet dish={dish} open={planOpen} onOpenChange={setPlanOpen} defaultServings={dish.servings} />

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent title="Видалити страву?" description={`«${dish.name}» буде видалено разом із записами в планувальнику.`}>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={async () => {
                await deleteDish(dish.id)
                toast('Страву видалено')
                navigate('/', { replace: true })
              }}
            >
              Видалити
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card ring-border/70 [&_svg]:text-muted-foreground rounded-2xl p-3 ring-1 [&_svg]:size-4">
      {icon}
      <div className="text-muted-foreground mt-1.5 text-[11px] font-bold tracking-wide uppercase">{label}</div>
      <div className="text-[15px] font-bold">{value}</div>
    </div>
  )
}

export function PlanSheet({
  dish,
  open,
  onOpenChange,
  defaultServings = 1,
}: {
  dish: Dish
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultServings?: number
}) {
  const [servings, setServings] = useState(defaultServings)
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Додати в план" description={dish.name}>
        <div className="bg-secondary/70 mb-5 flex items-center justify-between rounded-2xl p-3 pl-4">
          <span className="text-sm font-bold">Порцій</span>
          <div className="flex items-center gap-2">
            <Button size="icon-sm" variant="outline" onClick={() => setServings((s) => Math.max(1, s - 1))}>
              <Minus />
            </Button>
            <span className="w-6 text-center font-extrabold tabular-nums">{servings}</span>
            <Button size="icon-sm" variant="outline" onClick={() => setServings((s) => s + 1)}>
              <Plus />
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          {days.map((d, i) => (
            <button
              key={i}
              onClick={async () => {
                await addToPlan(dish.id, toDateKey(d), servings)
                haptic(15)
                toast.success('Додано в планувальник', { description: `${WEEKDAYS[(d.getDay() + 6) % 7]}, ${formatDayMonth(d)}` })
                onOpenChange(false)
              }}
              className="bg-card hover:border-primary/40 hover:bg-accent flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.99]"
            >
              <span className="font-bold">{i === 0 ? 'Сьогодні' : i === 1 ? 'Завтра' : WEEKDAYS[(d.getDay() + 6) % 7]}</span>
              <span className="text-muted-foreground text-sm">{formatDayMonth(d)}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DishSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
      <div className="space-y-4">
        <Skeleton className="-mx-4 aspect-[4/3.4] rounded-none rounded-b-[32px] sm:-mx-6 md:mx-0 md:aspect-[16/11] md:rounded-[28px]" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    </div>
  )
}
