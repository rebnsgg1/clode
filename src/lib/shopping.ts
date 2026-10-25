import type { Dish, PlanEntry } from '@/types'
import { hasAmount } from './nutrition'

export interface ShoppingItem {
  key: string
  name: string
  amount: number
  unit: string
  /** Назви страв, для яких потрібен інгредієнт */
  dishes: string[]
}

/** Штучні товари купують цілими — округлюємо вгору */
const WHOLE_UNITS = new Set(['шт', 'зубчик', 'пучок'])

const CONVERT: Record<string, { unit: string; factor: number }> = {
  кг: { unit: 'г', factor: 1000 },
  л: { unit: 'мл', factor: 1000 },
}

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Збирає інгредієнти запланованих страв, сумуючи однакові (з урахуванням порцій). */
export function buildShoppingList(entries: PlanEntry[], dishes: Map<string, Dish>): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>()
  for (const entry of entries) {
    const dish = dishes.get(entry.dishId)
    if (!dish) continue
    const factor = entry.servings / (dish.servings || 1)
    for (const ing of dish.ingredients) {
      const conv = CONVERT[ing.unit]
      const unit = conv?.unit ?? ing.unit
      const counted = hasAmount(ing)
      const amount = counted ? ing.amount * factor * (conv?.factor ?? 1) : 0
      const key = `${normalizeName(ing.name)}|${counted ? unit : '—'}`
      const existing = map.get(key)
      if (existing) {
        existing.amount += amount
        if (!existing.dishes.includes(dish.name)) existing.dishes.push(dish.name)
      } else {
        map.set(key, { key, name: ing.name.trim(), amount, unit: counted ? unit : ing.unit, dishes: [dish.name] })
      }
    }
  }
  return [...map.values()]
    .map((item) => {
      if (WHOLE_UNITS.has(item.unit) && item.amount > 0) return { ...item, amount: Math.ceil(item.amount - 0.01) }
      if (item.unit === 'г' && item.amount >= 1000) return { ...item, amount: item.amount / 1000, unit: 'кг' }
      if (item.unit === 'мл' && item.amount >= 1000) return { ...item, amount: item.amount / 1000, unit: 'л' }
      return item
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
}
