import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, ListChecks, Sun, X } from 'lucide-react'
import { useDish } from '@/hooks/useDishes'
import { useWakeLock } from '@/hooks/useWakeLock'
import { db, markCooked } from '@/lib/db'
import { formatAmount } from '@/lib/nutrition'
import { stepTimerMinutes } from '@/lib/time'
import { cn, haptic } from '@/lib/utils'
import { StepTimerButton, TimerDock } from '@/components/StepTimer'
import { StarRating } from '@/components/StarRating'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { Dish } from '@/types'

export default function CookModePage() {
  const { id } = useParams()
  const dish = useDish(id)
  if (dish === undefined) return <div className="bg-background min-h-dvh" />
  if (dish === null)
    return (
      <EmptyState
        title="Страву не знайдено"
        action={
          <Button asChild>
            <Link to="/">До рецептів</Link>
          </Button>
        }
      />
    )
  return <CookMode dish={dish} />
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
}

function CookMode({ dish }: { dish: Dish }) {
  const navigate = useNavigate()
  const wake = useWakeLock(true)
  const [[index, dir], setPage] = useState<[number, number]>([0, 0])
  const [ingOpen, setIngOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const total = dish.steps.length
  const isFinal = index === total
  const accent = dish.kind === 'pp' ? 'bg-pp' : 'bg-regular'

  const go = useCallback(
    (delta: number) => {
      setPage(([i]) => {
        const next = Math.min(total, Math.max(0, i + delta))
        if (next !== i) haptic()
        return [next, delta]
      })
    },
    [total],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') go(1)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'Escape') navigate(`/dish/${dish.id}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, navigate, dish.id])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x + info.velocity.x * 0.2
    if (swipe < -80) go(1)
    else if (swipe > 80) go(-1)
  }

  const step = dish.steps[index]
  const minutes = step ? stepTimerMinutes(step) : undefined

  return (
    <div className="bg-background fixed inset-0 z-50 flex flex-col pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)]">
      {/* Верхня панель */}
      <div className="mx-auto w-full max-w-3xl px-5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(`/dish/${dish.id}`)}
            className="bg-secondary grid size-11 place-items-center rounded-full transition active:scale-90"
            aria-label="Вийти з режиму готування"
          >
            <X className="size-5" />
          </button>
          <div className="min-w-0 text-center">
            <div className="truncate text-sm font-bold">{dish.name}</div>
            <div className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
              {wake.active ? (
                <>
                  <Sun className="size-3 text-amber-500" /> Екран не згасне
                </>
              ) : (
                'Режим готування'
              )}
            </div>
          </div>
          <button
            onClick={() => setIngOpen(true)}
            className="bg-secondary grid size-11 place-items-center rounded-full transition active:scale-90"
            aria-label="Інгредієнти"
          >
            <ListChecks className="size-5" />
          </button>
        </div>
        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: total + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage([i, i > index ? 1 : -1])}
              className="bg-secondary h-1.5 flex-1 overflow-hidden rounded-full"
              aria-label={i === total ? 'Фініш' : `Крок ${i + 1}`}
            >
              <motion.div
                className={cn('h-full rounded-full', accent)}
                initial={false}
                animate={{ width: i <= index ? '100%' : '0%' }}
                transition={{ duration: 0.35 }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Слайди */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={index}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={onDragEnd}
            className="absolute inset-0 mx-auto flex max-w-3xl touch-pan-y flex-col justify-center px-6 select-none sm:px-10"
          >
            {!isFinal && step ? (
              <>
                <div className="text-muted-foreground mb-5 text-base font-bold">
                  Крок {index + 1} із {total}
                </div>
                <p className="text-[28px] leading-[1.3] font-bold tracking-tight sm:text-[40px]">{step.text}</p>
                {minutes && (
                  <div className="mt-8">
                    <StepTimerButton id={`${dish.id}-${step.id}`} label={`${dish.name}: крок ${index + 1}`} minutes={minutes} size="lg" />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.4, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                  className="text-[96px]"
                >
                  🎉
                </motion.div>
                <h2 className="mt-2 text-4xl font-extrabold tracking-tight">Смачного!</h2>
                <p className="text-muted-foreground mt-2">Як вийшло? Оціни страву</p>
                <div className="mt-5 flex justify-center">
                  <StarRating value={dish.rating} size="lg" onChange={(rating) => db.dishes.update(dish.id, { rating })} />
                </div>
                <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
                  <Button
                    size="lg"
                    variant={dish.kind}
                    disabled={saved}
                    onClick={async () => {
                      await markCooked(dish)
                      setSaved(true)
                      haptic(25)
                      toast.success('Записано в історію 🍽️')
                    }}
                  >
                    {saved ? 'Записано ✓' : 'Записати в історію'}
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => navigate(`/dish/${dish.id}`)}>
                    До рецепта
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Навігація */}
      <div className="mx-auto flex w-full max-w-3xl gap-3 px-5">
        <Button variant="secondary" size="xl" className="w-20" onClick={() => go(-1)} disabled={index === 0} aria-label="Попередній крок">
          <ChevronLeft className="size-6" />
        </Button>
        {!isFinal && (
          <Button size="xl" variant={dish.kind} className="flex-1" onClick={() => go(1)}>
            {index === total - 1 ? 'Завершити' : 'Далі'} <ChevronRight className="size-6" />
          </Button>
        )}
      </div>

      <TimerDock />

      <Sheet open={ingOpen} onOpenChange={setIngOpen}>
        <SheetContent title="Інгредієнти" description={`На ${dish.servings} порц.`}>
          <ul className="divide-border/70 divide-y">
            {dish.ingredients.map((ing) => (
              <li key={ing.id} className="flex justify-between gap-3 py-3 text-[17px]">
                <span className="font-medium">{ing.name}</span>
                <span className="font-bold tabular-nums">{formatAmount(ing.amount, ing.unit)}</span>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  )
}
