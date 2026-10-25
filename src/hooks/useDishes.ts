import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, dbReady } from '@/lib/db'

export function useDbReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    dbReady.then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])
  return ready
}

/** Усі страви; undefined — ще завантажується */
export function useDishes() {
  const ready = useDbReady()
  const dishes = useLiveQuery(() => db.dishes.toArray(), [])
  return ready ? dishes : undefined
}

export function useDish(id: string | undefined) {
  return useLiveQuery(async () => (id ? ((await db.dishes.get(id)) ?? null) : null), [id])
}
