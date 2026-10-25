import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { db } from '@/lib/db'
import { cn, haptic } from '@/lib/utils'
import type { Dish } from '@/types'

export function FavoriteButton({ dish, className }: { dish: Pick<Dish, 'id' | 'favorite'>; className?: string }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.8 }}
      aria-label={dish.favorite ? 'Прибрати з улюблених' : 'Додати в улюблені'}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        haptic(12)
        db.dishes.update(dish.id, { favorite: !dish.favorite })
      }}
      className={cn(
        'relative grid size-9 place-items-center rounded-full bg-black/25 text-white backdrop-blur-md transition hover:bg-black/35',
        className,
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={String(dish.favorite)}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 20 }}
        >
          <Heart className={cn('size-[18px]', dish.favorite && 'fill-rose-500 text-rose-500')} />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
