import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, useVelocity, AnimatePresence } from 'framer-motion'
import { ChefHat, Clock, Dices, Flame, RotateCcw, ArrowRight } from 'lucide-react'
import { useDishes } from '@/hooks/useDishes'
import { useStoredState } from '@/hooks/useStoredState'
import { MEALS } from '@/lib/constants'
import type { KindFilter } from '@/lib/filters'
import { cn, formatMinutes, pick, shuffle } from '@/lib/utils'
import type { Dish, MealType } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { RandomTabs } from '@/components/RandomTabs'
import { DishCover } from '@/components/DishCover'
import { KindBadge } from '@/components/KindBadge'
import { Confetti } from '@/components/Confetti'
import { EmptyState } from '@/components/EmptyState'
import { Segmented } from '@/components/ui/segmented'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const ITEM_H = 280
const SPIN_ITEMS = 28

export default function RandomPage() {
  const dishes = useDishes()
  const navigate = useNavigate()
  const [opts, setOpts] = useStoredState<{ kind: KindFilter; meal: MealType | 'any' }>('random-opts', { kind: 'all', meal: 'any' })
  const [reel, setReel] = useState<Dish[]>([])
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Dish | null>(null)
  const [burst, setBurst] = useState(0)
  const lastTick = useRef(0)

  const y = useMotionValue(0)
  const velocity = useVelocity(y)
  const blur = useTransform(velocity, (v) => `blur(${Math.min(6, Math.abs(v) / 900)}px)`)

  useMotionValueEvent(y, 'change', (v) => {
    const idx = Math.floor(-v / ITEM_H + 0.5)
    if (idx !== lastTick.current) {
      lastTick.current = idx
    }
  })

  const pool = useMemo(
    () =>
      (dishes ?? []).filter((d) => (opts.kind === 'all' || d.kind === opts.kind) && (opts.meal === 'any' || d.meals.includes(opts.meal))),
    [dishes, opts],
  )

  const spin = async () => {
    if (spinning || !pool.length) return
    const candidates = winner && pool.length > 1 ? pool.filter((d) => d.id !== winner.id) : pool
    const chosen = pick(candidates)!
    const filler: Dish[] = []
    while (filler.length < SPIN_ITEMS) filler.push(...shuffle(pool))
    const start = winner ?? reel[reel.length - 1] ?? pick(pool)!
    const nextReel = [start, ...filler.slice(0, SPIN_ITEMS), chosen]
    setReel(nextReel)
    setWinner(null)
    setSpinning(true)
    y.set(0)
    lastTick.current = 0
    await animate(y, -(nextReel.length - 1) * ITEM_H, { duration: 3.4, ease: [0.12, 0.75, 0.15, 1] })
    setSpinning(false)
    setWinner(chosen)
    setBurst((b) => b + 1)
  }

  if (!dishes) return <Skeleton className="h-[480px] rounded-3xl" />

  return (
    <div className="mx-auto max-w-2xl">
      <RandomTabs />
      <PageHeader title="Страва дня" subtitle="Не знаєш, що приготувати? Довірся удачі ✨" />

      {dishes.length === 0 ? (
        <EmptyState
          emoji="🎰"
          title="Поки що нема з чого обирати"
          text="Додай кілька страв, і рандомайзер запрацює."
          action={
            <Button asChild>
              <Link to="/dish/new">Додати першу страву</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-5 space-y-3">
            <Segmented<KindFilter>
              id="random-kind"
              className="w-full"
              value={opts.kind}
              onChange={(kind) => setOpts({ ...opts, kind })}
              options={[
                { value: 'all', label: 'Будь-яка' },
                { value: 'pp', label: 'Тільки ПП', activeClass: 'bg-pp' },
                { value: 'regular', label: 'Звичайна', activeClass: 'bg-regular' },
              ]}
            />
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              <Chip active={opts.meal === 'any'} onClick={() => setOpts({ ...opts, meal: 'any' })}>
                🍽️ Будь-коли
              </Chip>
              {MEALS.map((m) => (
                <Chip key={m.value} active={opts.meal === m.value} onClick={() => setOpts({ ...opts, meal: m.value })}>
                  {m.emoji} {m.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Слот-машина */}
          <div className="relative">
            <div
              className="from-secondary to-card shadow-lift ring-border/70 relative overflow-hidden rounded-[32px] bg-gradient-to-b p-3 ring-1"
              style={{ height: ITEM_H + 24 }}
            >
              {reel.length === 0 ? (
                <MysteryCard />
              ) : (
                <motion.div style={{ y, filter: blur }} className="will-change-transform">
                  {reel.map((d, i) => (
                    <div key={i} style={{ height: ITEM_H }} className="py-1.5">
                      <ReelCard dish={d} highlight={!spinning && i === reel.length - 1} />
                    </div>
                  ))}
                </motion.div>
              )}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/10 to-transparent dark:from-black/40" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/10 to-transparent dark:from-black/40" />
            </div>
            <Confetti burstKey={burst} />
          </div>

          <div className="mt-6">
            <AnimatePresence mode="wait" initial={false}>
              {winner && !spinning ? (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <Button size="xl" variant="secondary" onClick={spin}>
                    <RotateCcw /> Ще раз
                  </Button>
                  <Button size="xl" variant={winner.kind} onClick={() => navigate(`/dish/${winner.id}/cook`)}>
                    <ChefHat /> Готую це
                  </Button>
                  <Button asChild variant="ghost" className="col-span-2">
                    <Link to={`/dish/${winner.id}`}>
                      Переглянути рецепт <ArrowRight />
                    </Link>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="spin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <motion.button
                    onClick={spin}
                    disabled={spinning || !pool.length}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.04 }}
                    className={cn(
                      'shadow-lift relative grid size-32 place-items-center rounded-full text-white transition disabled:opacity-60',
                      opts.kind === 'regular'
                        ? 'bg-gradient-to-br from-amber-400 to-orange-600'
                        : opts.kind === 'pp'
                          ? 'bg-gradient-to-br from-lime-400 to-emerald-600'
                          : 'bg-gradient-to-br from-emerald-400 via-teal-500 to-orange-500',
                    )}
                  >
                    {!spinning && pool.length > 0 && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-20 [animation-duration:2s]" />
                    )}
                    <span className="relative flex flex-col items-center gap-1">
                      <motion.span
                        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
                        transition={spinning ? { repeat: Infinity, duration: 0.6, ease: 'linear' } : {}}
                      >
                        <Dices className="size-10" />
                      </motion.span>
                      <span className="text-sm font-extrabold tracking-wide uppercase">{spinning ? 'Крутимо…' : 'Крутити'}</span>
                    </span>
                  </motion.button>
                  <p className="text-muted-foreground mt-4 text-sm font-medium">
                    {pool.length ? `Обираємо з ${pool.length} страв` : 'Немає страв під ці фільтри'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

function ReelCard({ dish, highlight }: { dish: Dish; highlight: boolean }) {
  return (
    <div
      className={cn(
        'bg-card shadow-soft ring-border/60 relative flex h-full flex-col overflow-hidden rounded-3xl ring-1 transition-shadow duration-500',
        highlight && (dish.kind === 'pp' ? 'ring-pp/70 ring-4' : 'ring-regular/70 ring-4'),
      )}
    >
      <div className="relative min-h-0 flex-1">
        <DishCover dish={dish} emojiClass="text-[88px]" />
        <div className="absolute top-3 left-3">
          <KindBadge kind={dish.kind} glass />
        </div>
      </div>
      <div className="p-4">
        <h3 className="truncate text-lg font-extrabold tracking-tight">{dish.name}</h3>
        <div className="text-muted-foreground mt-1 flex gap-4 text-sm font-semibold">
          <span className="inline-flex items-center gap-1">
            <Flame className="size-4" /> {dish.calories} ккал
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-4" /> {formatMinutes(dish.timeMin)}
          </span>
        </div>
      </div>
    </div>
  )
}

function MysteryCard() {
  return (
    <div className="relative grid h-full place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-300 via-teal-300 to-orange-300 dark:from-emerald-700 dark:via-teal-800 dark:to-orange-800">
      <motion.div
        className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.35),transparent_30%)]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
      />
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        className="relative text-center text-white drop-shadow-lg"
      >
        <div className="text-[96px] leading-none">🎰</div>
        <div className="mt-3 text-xl font-extrabold">Що ж сьогодні?</div>
      </motion.div>
    </div>
  )
}
