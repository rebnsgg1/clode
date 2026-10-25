import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, ChevronRight, Settings, UtensilsCrossed, Plus, Dices } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

const LINKS = [
  {
    to: '/dish/new',
    label: 'Нова страва',
    text: 'Додати рецепт у книгу',
    icon: Plus,
    tint: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  },
  {
    to: '/random',
    label: 'Страва дня',
    text: 'Рандом зі слот-машиною',
    icon: Dices,
    tint: 'bg-pink-500/12 text-pink-600 dark:text-pink-400',
  },
  {
    to: '/day',
    label: 'Меню на день',
    text: 'Сніданок, обід, вечеря, перекус',
    icon: UtensilsCrossed,
    tint: 'bg-orange-500/12 text-orange-600 dark:text-orange-400',
  },
  {
    to: '/stats',
    label: 'Історія і статистика',
    text: 'Що і як часто готуєш',
    icon: BarChart3,
    tint: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  },
  {
    to: '/settings',
    label: 'Налаштування',
    text: 'Тема, резервна копія, встановлення',
    icon: Settings,
    tint: 'bg-zinc-500/12 text-zinc-600 dark:text-zinc-300',
  },
]

export default function MorePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Ще" actions={<ThemeSwitcher id="theme-more" />} />
      <div className="bg-card shadow-soft ring-border/60 overflow-hidden rounded-3xl ring-1">
        {LINKS.map((l, i) => (
          <motion.div key={l.to} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
            <Link
              to={l.to}
              className="border-border/60 hover:bg-accent active:bg-accent flex items-center gap-4 border-b p-4 transition last:border-0"
            >
              <div className={`grid size-11 place-items-center rounded-2xl ${l.tint}`}>
                <l.icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{l.label}</div>
                <div className="text-muted-foreground truncate text-[13px]">{l.text}</div>
              </div>
              <ChevronRight className="text-muted-foreground/60 size-5" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
