import type { Dish, DishKind, MealType } from '@/types'

export type KindFilter = 'all' | DishKind
export type SortKey = 'new' | 'rating' | 'calories' | 'time' | 'name'

export interface DishFilters {
  kind: KindFilter
  query: string
  meals: MealType[]
  maxCalories: number | null
  maxTime: number | null
  tags: string[]
  favorites: boolean
  sort: SortKey
}

export const DEFAULT_FILTERS: DishFilters = {
  kind: 'all',
  query: '',
  meals: [],
  maxCalories: null,
  maxTime: null,
  tags: [],
  favorites: false,
  sort: 'new',
}

export const SORT_LABEL: Record<SortKey, string> = {
  new: 'Нові',
  rating: 'Оцінка',
  calories: 'Калорії',
  time: 'Час',
  name: 'Назва',
}

export function activeFilterCount(f: DishFilters) {
  return f.meals.length + f.tags.length + (f.maxCalories ? 1 : 0) + (f.maxTime ? 1 : 0) + (f.favorites ? 1 : 0)
}

export function filterDishes(dishes: Dish[], f: DishFilters): Dish[] {
  const q = f.query.trim().toLowerCase()
  const result = dishes.filter((d) => {
    if (f.kind !== 'all' && d.kind !== f.kind) return false
    if (f.favorites && !d.favorite) return false
    if (f.meals.length && !f.meals.some((m) => d.meals.includes(m))) return false
    if (f.maxCalories && d.calories > f.maxCalories) return false
    if (f.maxTime && d.timeMin > f.maxTime) return false
    if (f.tags.length && !f.tags.every((t) => d.tags.includes(t))) return false
    if (q) {
      const hay = [d.name, d.description, ...d.tags, ...d.ingredients.map((i) => i.name)].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
  const sorters: Record<SortKey, (a: Dish, b: Dish) => number> = {
    new: (a, b) => b.createdAt - a.createdAt,
    rating: (a, b) => b.rating - a.rating || Number(b.favorite) - Number(a.favorite),
    calories: (a, b) => a.calories - b.calories,
    time: (a, b) => a.timeMin - b.timeMin,
    name: (a, b) => a.name.localeCompare(b.name, 'uk'),
  }
  return result.sort(sorters[f.sort])
}

export function allTags(dishes: Dish[]) {
  const counts = new Map<string, number>()
  dishes.forEach((d) => d.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)
}
