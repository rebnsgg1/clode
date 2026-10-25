import type { Difficulty, DishKind, MealType } from '@/types'

export const MEALS: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Сніданок', emoji: '🌅' },
  { value: 'lunch', label: 'Обід', emoji: '🍲' },
  { value: 'dinner', label: 'Вечеря', emoji: '🌙' },
  { value: 'snack', label: 'Перекус', emoji: '🥨' },
  { value: 'dessert', label: 'Десерт', emoji: '🍰' },
]

export const MEAL_LABEL: Record<MealType, string> = Object.fromEntries(MEALS.map((m) => [m.value, m.label])) as Record<MealType, string>

export const KIND_LABEL: Record<DishKind, string> = { pp: 'ПП', regular: 'Звичайна' }

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Легко' },
  { value: 'medium', label: 'Середньо' },
  { value: 'hard', label: 'Складно' },
]

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'Легко', medium: 'Середньо', hard: 'Складно' }

export const UNITS = ['г', 'кг', 'мл', 'л', 'шт', 'ст. л.', 'ч. л.', 'склянка', 'зубчик', 'пучок', 'дрібка', 'за смаком']

export const COVER_PRESETS: { from: string; to: string }[] = [
  { from: '#d9f99d', to: '#34d399' },
  { from: '#a7f3d0', to: '#2dd4bf' },
  { from: '#fde68a', to: '#fb923c' },
  { from: '#fecaca', to: '#fb7185' },
  { from: '#fed7aa', to: '#f97316' },
  { from: '#bfdbfe', to: '#818cf8' },
  { from: '#e9d5ff', to: '#c084fc' },
  { from: '#fef3c7', to: '#f59e0b' },
]

export const COVER_EMOJIS = [
  '🥗',
  '🍲',
  '🍝',
  '🥘',
  '🍳',
  '🥞',
  '🍗',
  '🐟',
  '🥑',
  '🍜',
  '🍕',
  '🍰',
  '🥣',
  '🌯',
  '🍔',
  '🥟',
  '🍛',
  '🧁',
  '🍓',
  '🥦',
]
