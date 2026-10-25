import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { NAV_ITEMS } from './nav'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { pathname } = useLocation()
  return (
    <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r px-4 py-6 md:flex">
      <Link to="/" className="mb-8 flex items-center gap-3 px-2">
        <img src="/favicon.svg" alt="" className="shadow-soft size-10 rounded-xl" />
        <div>
          <div className="text-lg leading-tight font-extrabold tracking-tight">Моє меню</div>
          <div className="text-muted-foreground text-xs font-medium">книга рецептів</div>
        </div>
      </Link>

      <Button asChild className="mb-6">
        <Link to="/dish/new">
          <Plus /> Нова страва
        </Link>
      </Button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="bg-card shadow-soft ring-border/70 absolute inset-0 rounded-xl ring-1"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <item.icon className={cn('relative size-[19px]', active && 'text-primary')} />
              <span className="relative">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <ThemeSwitcher className="mt-4" />
    </aside>
  )
}
