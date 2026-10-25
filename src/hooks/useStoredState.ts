import { useEffect, useState } from 'react'

/** useState, що зберігається в sessionStorage/localStorage між переходами. */
export function useStoredState<T>(key: string, initial: T, storage: 'session' | 'local' = 'session') {
  const [value, setValue] = useState<T>(() => {
    try {
      const store = storage === 'session' ? sessionStorage : localStorage
      const raw = store.getItem(key)
      if (!raw) return initial
      const parsed = JSON.parse(raw)
      return isPlainObject(initial) && isPlainObject(parsed) ? { ...initial, ...parsed } : parsed
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      const store = storage === 'session' ? sessionStorage : localStorage
      store.setItem(key, JSON.stringify(value))
    } catch {
      /* сховище недоступне */
    }
  }, [key, value, storage])

  return [value, setValue] as const
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
