import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MOBILE_NAV } from './nav'
import { cn, haptic } from '@/lib/utils'

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),12px)] md:hidden">
      <div className="glass shadow-lift ring-border/70 mx-auto flex max-w-md items-stretch justify-around rounded-[26px] p-1.5 ring-1">
        {MOBILE_NAV.map((item) => {
          const active = item.match(pathname)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => haptic()}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] py-2 text-[11px] font-bold transition-colors active:scale-95',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-active"
                  className="bg-primary/10 absolute inset-0 rounded-[20px]"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <item.icon className="relative size-[22px]" strokeWidth={active ? 2.4 : 2} />
              <span className="relative">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
