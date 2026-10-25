import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, Timer, X, Check } from 'lucide-react'
import { useTimers } from '@/hooks/useTimers'
import { formatClock } from '@/lib/time'
import { cn } from '@/lib/utils'

/** Кнопка таймера для кроку рецепта */
export function StepTimerButton({ id, label, minutes, size = 'md' }: { id: string; label: string; minutes: number; size?: 'md' | 'lg' }) {
  const { get, start, toggle, remove, remaining } = useTimers()
  const t = get(id)
  const big = size === 'lg'

  if (!t) {
    return (
      <button
        type="button"
        onClick={() => {
          start(id, label, minutes)
        }}
        className={cn(
          'bg-primary/10 text-primary hover:bg-primary/15 inline-flex items-center gap-1.5 rounded-full font-bold transition active:scale-95',
          big ? 'h-14 px-6 text-lg' : 'h-8 px-3 text-[13px]',
        )}
      >
        <Timer className={big ? 'size-5' : 'size-3.5'} />
        {minutes} хв
      </button>
    )
  }

  const left = remaining(t)
  const progress = 1 - left / t.durationSec
  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-1 overflow-hidden rounded-full font-bold tabular-nums',
        t.done ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background',
        big ? 'h-14 pr-2 pl-6 text-xl' : 'h-8 pr-1 pl-3 text-[13px]',
      )}
    >
      {!t.done && <motion.span className="absolute inset-y-0 left-0 bg-white/15" style={{ width: `${progress * 100}%` }} />}
      <span className="relative">{t.done ? 'Готово!' : formatClock(left)}</span>
      {!t.done && (
        <button
          type="button"
          onClick={() => toggle(id)}
          className={cn('relative grid place-items-center rounded-full hover:bg-white/15', big ? 'size-10' : 'size-6')}
          aria-label="Пауза"
        >
          {t.endsAt ? <Pause className={big ? 'size-5' : 'size-3.5'} /> : <Play className={big ? 'size-5' : 'size-3.5'} />}
        </button>
      )}
      <button
        type="button"
        onClick={() => remove(id)}
        className={cn('relative grid place-items-center rounded-full hover:bg-white/15', big ? 'size-10' : 'size-6')}
        aria-label="Скинути таймер"
      >
        {t.done ? <Check className={big ? 'size-5' : 'size-3.5'} /> : <X className={big ? 'size-5' : 'size-3.5'} />}
      </button>
    </div>
  )
}

/** Плаваюча панель активних таймерів — видно з будь-якого екрана */
export function TimerDock() {
  const { timers, toggle, remove, remaining } = useTimers()
  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {timers.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
              'glass shadow-lift ring-border pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl py-2 pr-2 pl-4 ring-1',
              t.done && 'ring-primary ring-2',
            )}
          >
            <Timer className={cn('size-4 shrink-0', t.done ? 'text-primary animate-bounce' : 'text-muted-foreground')} />
            <div className="min-w-0">
              <div className="text-muted-foreground truncate text-xs font-medium">{t.label}</div>
              <div className="text-lg leading-tight font-extrabold tabular-nums">{t.done ? 'Готово! ⏰' : formatClock(remaining(t))}</div>
            </div>
            {!t.done && (
              <button
                onClick={() => toggle(t.id)}
                className="bg-secondary grid size-9 place-items-center rounded-xl"
                aria-label="Пауза/старт"
              >
                {t.endsAt ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>
            )}
            <button onClick={() => remove(t.id)} className="bg-secondary grid size-9 place-items-center rounded-xl" aria-label="Закрити">
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
