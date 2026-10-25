import { useEffect, useState } from 'react'

/** Не дає екрану згаснути, поки компонент змонтований (Screen Wake Lock API). */
export function useWakeLock(enabled = true) {
  const [active, setActive] = useState(false)
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator

  useEffect(() => {
    if (!enabled || !supported) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          sentinel.release()
          return
        }
        setActive(true)
        sentinel.addEventListener('release', () => setActive(false))
      } catch {
        setActive(false)
      }
    }

    // Після повернення на вкладку блокування треба запросити знову
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) request()
    }

    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      sentinel?.release().catch(() => {})
    }
  }, [enabled, supported])

  return { supported, active }
}
