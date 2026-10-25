import { BookOpen, Dices, CalendarDays, ShoppingBasket, BarChart3, Settings, UtensilsCrossed } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Рецепти', icon: BookOpen, match: (p: string) => p === '/' || p.startsWith('/dish') },
  { to: '/random', label: 'Страва дня', icon: Dices, match: (p: string) => p.startsWith('/random') },
  { to: '/day', label: 'Меню на день', icon: UtensilsCrossed, match: (p: string) => p.startsWith('/day') },
  { to: '/planner', label: 'Планувальник', icon: CalendarDays, match: (p: string) => p.startsWith('/planner') },
  { to: '/shopping', label: 'Покупки', icon: ShoppingBasket, match: (p: string) => p.startsWith('/shopping') },
  { to: '/stats', label: 'Статистика', icon: BarChart3, match: (p: string) => p.startsWith('/stats') },
  { to: '/settings', label: 'Налаштування', icon: Settings, match: (p: string) => p.startsWith('/settings') },
]
