import { BookOpen, Dices, CalendarDays, ShoppingBasket, BarChart3, Settings, UtensilsCrossed, LayoutGrid } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Рецепти', icon: BookOpen, match: (p: string) => p === '/' || p.startsWith('/dish') },
  { to: '/random', label: 'Страва дня', icon: Dices, match: (p: string) => p.startsWith('/random') },
  { to: '/day', label: 'Меню на день', icon: UtensilsCrossed, match: (p: string) => p.startsWith('/day') },
  { to: '/planner', label: 'Планувальник', icon: CalendarDays, match: (p: string) => p.startsWith('/planner') },
  { to: '/shopping', label: 'Покупки', icon: ShoppingBasket, match: (p: string) => p.startsWith('/shopping') },
  { to: '/stats', label: 'Статистика', icon: BarChart3, match: (p: string) => p.startsWith('/stats') },
  { to: '/settings', label: 'Налаштування', icon: Settings, match: (p: string) => p.startsWith('/settings') },
]

export const MOBILE_NAV = [
  { to: '/', label: 'Рецепти', icon: BookOpen, match: NAV_ITEMS[0].match },
  { to: '/random', label: 'Рандом', icon: Dices, match: (p: string) => p.startsWith('/random') || p.startsWith('/day') },
  { to: '/planner', label: 'План', icon: CalendarDays, match: NAV_ITEMS[3].match },
  { to: '/shopping', label: 'Покупки', icon: ShoppingBasket, match: NAV_ITEMS[4].match },
  {
    to: '/more',
    label: 'Ще',
    icon: LayoutGrid,
    match: (p: string) => p.startsWith('/more') || p.startsWith('/stats') || p.startsWith('/settings'),
  },
]
