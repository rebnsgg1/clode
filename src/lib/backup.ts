import { invoke } from '@tauri-apps/api/core'
import { db } from './db'
import { isTauri } from './tauri'
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

export type BackupData = Backup

async function collectBackup(): Promise<Backup> {
  return {
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
}

/**
 * Зберігає резервну копію через системне вікно «Зберегти як».
 * Повертає кількість страв і шлях до файлу або null, якщо користувач скасував.
 */
export async function exportBackup(): Promise<{ count: number; path: string } | null> {
  const data = await collectBackup()
  const contents = JSON.stringify(data, null, 2)
  const fileName = `moie-menu-${new Date().toISOString().slice(0, 10)}.json`
  if (isTauri()) {
    const path = await invoke<string | null>('export_backup', { contents, fileName })
    return path ? { count: data.dishes.length, path } : null
  }
  // Запасний варіант для розробки у звичайному браузері
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { count: data.dishes.length, path: fileName }
}

/** Показує системне вікно вибору файлу й читає резервну копію. null — користувач скасував. */
export async function pickBackup(): Promise<Backup | null> {
  const text = isTauri() ? await invoke<string | null>('import_backup') : await pickFileInBrowser()
  return text === null ? null : parseBackup(text)
}

function pickFileInBrowser(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) file.text().then(resolve)
      else resolve(null)
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

export function parseBackup(text: string): Backup {
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
