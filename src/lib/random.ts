import type { Dish, MealType } from '@/types'
import { pick, shuffle } from './utils'
import type { KindFilter } from './filters'

export type DaySlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export const DAY_SLOTS: { slot: DaySlot; label: string; emoji: string }[] = [
  { slot: 'breakfast', label: 'Сніданок', emoji: '🌅' },
  { slot: 'lunch', label: 'Обід', emoji: '🍲' },
  { slot: 'dinner', label: 'Вечеря', emoji: '🌙' },
  { slot: 'snack', label: 'Перекус', emoji: '🥨' },
]

/** Для перекусу підходять і десерти, якщо перекусів немає */
const SLOT_FALLBACK: Record<DaySlot, MealType[]> = {
  breakfast: ['breakfast'],
  lunch: ['lunch', 'dinner'],
  dinner: ['dinner', 'lunch'],
  snack: ['snack', 'dessert'],
}

export type DayMenu = Record<DaySlot, Dish | undefined>

export function slotPool(dishes: Dish[], slot: DaySlot, kind: KindFilter) {
  const byKind = kind === 'all' ? dishes : dishes.filter((d) => d.kind === kind)
  for (const meal of SLOT_FALLBACK[slot]) {
    const pool = byKind.filter((d) => d.meals.includes(meal))
    if (pool.length) return pool
  }
  return []
}

export function menuCalories(menu: Partial<DayMenu>) {
  return Object.values(menu).reduce((s, d) => s + (d?.calories ?? 0), 0)
}

/**
 * Генерує меню на день. Якщо заданий ліміт калорій — шукає комбінацію,
 * що вписується в ліміт і максимально наближена до нього (80–100% ліміту).
 */
export function generateDayMenu(
  dishes: Dish[],
  opts: { kind: KindFilter; limit: number | null; locked?: Partial<DayMenu> },
): { menu: DayMenu; fits: boolean } {
  const pools = Object.fromEntries(
    DAY_SLOTS.map(({ slot }) => [slot, opts.locked?.[slot] ? [opts.locked[slot]!] : slotPool(dishes, slot, opts.kind)]),
  ) as Record<DaySlot, Dish[]>

  const randomMenu = (): DayMenu => {
    const used = new Set<string>()
    const menu = {} as DayMenu
    for (const { slot } of DAY_SLOTS) {
      const pool = pools[slot]
      const fresh = pool.filter((d) => !used.has(d.id))
      const chosen = pick(fresh.length ? fresh : pool)
      if (chosen) used.add(chosen.id)
      menu[slot] = chosen
    }
    return menu
  }

  if (!opts.limit) return { menu: randomMenu(), fits: true }

  const limit = opts.limit
  const candidates = Array.from({ length: 600 }, randomMenu)
  const under = candidates.filter((m) => menuCalories(m) <= limit)
  const sweet = under.filter((m) => menuCalories(m) >= limit * 0.8)
  if (sweet.length) return { menu: pick(sweet)!, fits: true }
  if (under.length) {
    const best = shuffle(under).sort((a, b) => menuCalories(b) - menuCalories(a))[0]
    return { menu: best, fits: true }
  }
  const lightest = candidates.sort((a, b) => menuCalories(a) - menuCalories(b))[0]
  return { menu: lightest, fits: false }
}
