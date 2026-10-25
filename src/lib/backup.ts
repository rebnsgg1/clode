import { db } from './db'
import type { Dish, HistoryEntry, MetaEntry, PlanEntry, ShoppingCheck, ShoppingExtra } from '@/types'

interface Backup {
  app: 'moie-menu'
  version: 1
  exportedAt: string
  dishes: Dish[]
  plan: PlanEntry[]
  history: HistoryEntry[]
  shoppingChecks: ShoppingCheck[]
  shoppingExtras: ShoppingExtra[]
  meta: MetaEntry[]
}

export async function exportBackup() {
  const data: Backup = {
    app: 'moie-menu',
    version: 1,
    exportedAt: new Date().toISOString(),
    dishes: await db.dishes.toArray(),
    plan: await db.plan.toArray(),
    history: await db.history.toArray(),
    shoppingChecks: await db.shoppingChecks.toArray(),
    shoppingExtras: await db.shoppingExtras.toArray(),
    meta: await db.meta.toArray(),
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `moie-menu-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return data.dishes.length
}

export async function readBackup(file: File): Promise<Backup> {
  const text = await file.text()
  let data: Partial<Backup>
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Файл не є коректним JSON')
  }
  if (data.app !== 'moie-menu' || !Array.isArray(data.dishes)) {
    throw new Error('Це не резервна копія «Мого меню»')
  }
  return {
    app: 'moie-menu',
    version: 1,
    exportedAt: data.exportedAt ?? '',
    dishes: data.dishes,
    plan: data.plan ?? [],
    history: data.history ?? [],
    shoppingChecks: data.shoppingChecks ?? [],
    shoppingExtras: data.shoppingExtras ?? [],
    meta: data.meta ?? [],
  }
}

/** mode: 'merge' — додати/оновити за id, 'replace' — повністю замінити базу */
export async function importBackup(data: Backup, mode: 'merge' | 'replace') {
  const tables = [db.dishes, db.plan, db.history, db.shoppingChecks, db.shoppingExtras, db.meta]
  await db.transaction('rw', tables, async () => {
    if (mode === 'replace') await Promise.all(tables.map((t) => t.clear()))
    else {
      // Стартова страва з іншого пристрою має інший id — прив'язуємо до локальної, щоб не дублювати
      const localBySeed = new Map<string, string>()
      ;(await db.dishes.toArray()).forEach((d) => d.seedId && localBySeed.set(d.seedId, d.id))
      const remap = new Map<string, string>()
      data.dishes = data.dishes.map((d) => {
        const localId = d.seedId ? localBySeed.get(d.seedId) : undefined
        if (localId && localId !== d.id) {
          remap.set(d.id, localId)
          return { ...d, id: localId }
        }
        return d
      })
      data.plan = data.plan.map((p) => ({ ...p, dishId: remap.get(p.dishId) ?? p.dishId }))
      data.history = data.history.map((h) => ({ ...h, dishId: remap.get(h.dishId) ?? h.dishId }))
    }
    await db.dishes.bulkPut(data.dishes)
    await db.plan.bulkPut(data.plan)
    await db.history.bulkPut(data.history)
    await db.shoppingChecks.bulkPut(data.shoppingChecks)
    await db.shoppingExtras.bulkPut(data.shoppingExtras)
    if (mode === 'replace') {
      await db.meta.bulkPut(data.meta)
    } else {
      const seeded = new Set<string>()
      for (const m of [...(await db.meta.toArray()), ...data.meta]) {
        if (m.key === 'seededIds') (m.value as string[]).forEach((s) => seeded.add(s))
      }
      await db.meta.put({ key: 'seededIds', value: [...seeded] })
    }
  })
  return data.dishes.length
}
