import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

export interface KitchenTimer {
  id: string
  label: string
  durationSec: number
  /** Час завершення (мс). null — на паузі */
  endsAt: number | null
  /** Залишок у секундах під час паузи */
  remainingSec: number
  done: boolean
}

interface TimersCtx {
  timers: KitchenTimer[]
  now: number
  start: (id: string, label: string, minutes: number) => void
  toggle: (id: string) => void
  remove: (id: string) => void
  get: (id: string) => KitchenTimer | undefined
  remaining: (t: KitchenTimer) => number
}

const Ctx = createContext<TimersCtx | null>(null)

function beep() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    ;[0, 0.35, 0.7].forEach((offset) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.25)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + 0.3)
    })
    setTimeout(() => ctx.close(), 1500)
  } catch {
    /* звук недоступний */
  }
}

export function TimersProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<KitchenTimer[]>([])
  const [now, setNow] = useState(() => Date.now())
  const timersRef = useRef(timers)
  timersRef.current = timers

  const running = timers.some((t) => t.endsAt && !t.done)

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      const t = Date.now()
      setNow(t)
      const finished = timersRef.current.filter((x) => x.endsAt && !x.done && x.endsAt <= t)
      if (finished.length) {
        setTimers((prev) => prev.map((x) => (finished.some((f) => f.id === x.id) ? { ...x, done: true, remainingSec: 0 } : x)))
        finished.forEach((f) => {
          beep()
          navigator.vibrate?.([200, 100, 200])
          toast.success(`Таймер завершено`, { description: f.label, duration: 8000 })
        })
      }
    }, 250)
    return () => clearInterval(iv)
  }, [running])

  const start = useCallback((id: string, label: string, minutes: number) => {
    const durationSec = Math.round(minutes * 60)
    const t: KitchenTimer = { id, label, durationSec, endsAt: Date.now() + durationSec * 1000, remainingSec: durationSec, done: false }
    setNow(Date.now())
    setTimers((prev) => [...prev.filter((x) => x.id !== id), t])
  }, [])

  const toggle = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((x) => {
        if (x.id !== id || x.done) return x
        if (x.endsAt) return { ...x, endsAt: null, remainingSec: Math.max(0, (x.endsAt - Date.now()) / 1000) }
        return { ...x, endsAt: Date.now() + x.remainingSec * 1000 }
      }),
    )
    setNow(Date.now())
  }, [])

  const remove = useCallback((id: string) => setTimers((prev) => prev.filter((x) => x.id !== id)), [])
  const get = useCallback((id: string) => timers.find((x) => x.id === id), [timers])
  const remaining = useCallback((t: KitchenTimer) => (t.done ? 0 : t.endsAt ? Math.max(0, (t.endsAt - now) / 1000) : t.remainingSec), [now])

  return <Ctx.Provider value={{ timers, now, start, toggle, remove, get, remaining }}>{children}</Ctx.Provider>
}

export function useTimers() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTimers поза TimersProvider')
  return ctx
}
