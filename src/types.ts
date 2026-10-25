export type DishKind = 'pp' | 'regular'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Ingredient {
  id: string
  name: string
  /** 0 — «за смаком» / без кількості */
  amount: number
  unit: string
}

export interface Step {
  id: string
  text: string
  /** Таймер у хвилинах. Якщо не задано — визначається з тексту кроку. */
  timerMin?: number
}

export interface Cover {
  emoji: string
  /** Два кольори градієнта */
  from: string
  to: string
}

export interface Dish {
  id: string
  /** Ідентифікатор стартової страви з seed.ts */
  seedId?: string
  name: string
  description: string
  /** Стиснене фото як data URL */
  photo?: string
  cover: Cover
  kind: DishKind
  meals: MealType[]
  /** КБЖВ на одну порцію */
  calories: number
  protein: number
  fat: number
  carbs: number
  servings: number
  timeMin: number
  difficulty: Difficulty
  ingredients: Ingredient[]
  steps: Step[]
  tags: string[]
  favorite: boolean
  rating: number
  createdAt: number
  updatedAt: number
}

export interface PlanEntry {
  id: string
  /** YYYY-MM-DD */
  date: string
  dishId: string
  servings: number
  createdAt: number
}

export interface HistoryEntry {
  id: string
  dishId: string
  dishName: string
  calories: number
  cookedAt: number
}

export interface ShoppingCheck {
  key: string
  checked: boolean
}

export interface ShoppingExtra {
  id: string
  name: string
  checked: boolean
  createdAt: number
}

export interface MetaEntry {
  key: string
  value: unknown
}
