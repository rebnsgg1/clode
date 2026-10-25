import Dexie, { type EntityTable } from 'dexie'
import type { Dish, HistoryEntry, MetaEntry, PlanEntry, ShoppingCheck, ShoppingExtra } from '@/types'
import { SEED_DISHES, type SeedDish } from '@/data/seed'
import { uid } from './utils'

class MenuDB extends Dexie {
  dishes!: EntityTable<Dish, 'id'>
  plan!: EntityTable<PlanEntry, 'id'>
  history!: EntityTable<HistoryEntry, 'id'>
  shoppingChecks!: EntityTable<ShoppingCheck, 'key'>
  shoppingExtras!: EntityTable<ShoppingExtra, 'id'>
  meta!: EntityTable<MetaEntry, 'key'>

  constructor() {
    super('moie-menu')
    this.version(1).stores({
      dishes: 'id, seedId, name, kind, favorite, updatedAt, *meals, *tags',
      plan: 'id, date, dishId',
      history: 'id, dishId, cookedAt',
      shoppingChecks: 'key',
      shoppingExtras: 'id, createdAt',
      meta: 'key',
    })
  }
}

export const db = new MenuDB()

export function seedToDish(s: SeedDish, now = Date.now()): Dish {
  return {
    id: uid(),
    seedId: s.seedId,
    name: s.name,
    description: s.description,
    cover: s.cover,
    kind: s.kind,
    meals: s.meals,
    calories: s.calories,
    protein: s.protein,
    fat: s.fat,
    carbs: s.carbs,
    servings: s.servings,
    timeMin: s.timeMin,
    difficulty: s.difficulty,
    ingredients: s.ingredients.map(([name, amount, unit]) => ({ id: uid(), name, amount, unit })),
    steps: s.steps.map(([text, timerMin]) => ({ id: uid(), text, timerMin })),
    tags: s.tags,
    favorite: s.favorite ?? false,
    rating: s.rating ?? 0,
    createdAt: now,
    updatedAt: now,
  }
}

const SEEDED_KEY = 'seededIds'

/** Додає стартові страви, яких ще не було в базі. Видалені користувачем не повертаються. */
export async function ensureSeed() {
  await db.transaction('rw', db.dishes, db.meta, async () => {
    const meta = await db.meta.get(SEEDED_KEY)
    const seeded = new Set((meta?.value as string[] | undefined) ?? [])
    const fresh = SEED_DISHES.filter((s) => !seeded.has(s.seedId))
    if (!fresh.length) return
    const now = Date.now()
    await db.dishes.bulkAdd(fresh.map((s, i) => seedToDish(s, now - i)))
    fresh.forEach((s) => seeded.add(s.seedId))
    await db.meta.put({ key: SEEDED_KEY, value: [...seeded] })
  })
}

/** Повертає всі видалені стартові страви. */
export async function restoreSeed() {
  const existing = new Set((await db.dishes.toArray()).map((d) => d.seedId).filter(Boolean))
  const missing = SEED_DISHES.filter((s) => !existing.has(s.seedId))
  const now = Date.now()
  await db.dishes.bulkAdd(missing.map((s, i) => seedToDish(s, now - i)))
  return missing.length
}

export async function markCooked(dish: Dish) {
  await db.history.add({
    id: uid(),
    dishId: dish.id,
    dishName: dish.name,
    calories: dish.calories,
    cookedAt: Date.now(),
  })
}

export async function deleteDish(id: string) {
  await db.transaction('rw', db.dishes, db.plan, async () => {
    await db.dishes.delete(id)
    await db.plan.where('dishId').equals(id).delete()
  })
}

export async function addToPlan(dishId: string, date: string, servings = 1) {
  await db.plan.add({ id: uid(), dishId, date, servings, createdAt: Date.now() })
}

/** Проміс готовності бази (стартові страви додано) */
export const dbReady: Promise<void> = ensureSeed().catch((e) => console.error('Помилка ініціалізації бази', e))
