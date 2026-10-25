import type { Dish, Ingredient } from '@/types'
import { formatNumber } from './utils'

export interface Macros {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export function sumMacros(dishes: { dish: Dish; servings?: number }[]): Macros {
  return dishes.reduce(
    (acc, { dish, servings = 1 }) => ({
      calories: acc.calories + dish.calories * servings,
      protein: acc.protein + dish.protein * servings,
      fat: acc.fat + dish.fat * servings,
      carbs: acc.carbs + dish.carbs * servings,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  )
}

/** Частка калорій з білків/жирів/вуглеводів (для кільцевої діаграми) */
export function macroShares({ protein, fat, carbs }: Pick<Macros, 'protein' | 'fat' | 'carbs'>) {
  const p = protein * 4
  const f = fat * 9
  const c = carbs * 4
  const total = p + f + c || 1
  return { protein: p / total, fat: f / total, carbs: c / total }
}

const NO_AMOUNT_UNITS = new Set(['за смаком', 'дрібка'])

export function hasAmount(ing: Pick<Ingredient, 'amount' | 'unit'>) {
  return ing.amount > 0 && !NO_AMOUNT_UNITS.has(ing.unit)
}

export function scaleAmount(amount: number, factor: number) {
  return amount * factor
}

/** Гарне відображення кількості: 0,5 → ½, великі значення округлюються */
export function formatAmount(amount: number, unit: string) {
  if (!amount || NO_AMOUNT_UNITS.has(unit)) return unit
  const fractions: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' }
  const whole = Math.floor(amount)
  const rest = Math.round((amount - whole) * 100) / 100
  let value: string
  if (['шт', 'зубчик', 'пучок', 'склянка', 'ст. л.', 'ч. л.'].includes(unit) && fractions[String(rest)]) {
    value = (whole ? String(whole) : '') + fractions[String(rest)]
  } else if (['г', 'мл'].includes(unit) && amount >= 20) {
    value = String(Math.round(amount / 5) * 5)
  } else {
    value = formatNumber(amount)
  }
  return `${value} ${unit}`
}
