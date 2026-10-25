import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Clock, Flame } from 'lucide-react'
import type { Dish } from '@/types'
import { DishCover } from './DishCover'
import { FavoriteButton } from './FavoriteButton'
import { KindBadge } from './KindBadge'
import { StarRating } from './StarRating'
import { formatMinutes } from '@/lib/utils'

export function DishCard({ dish, index = 0 }: { dish: Dish; index?: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index, 10) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Link
        to={`/dish/${dish.id}`}
        className="group bg-card shadow-soft ring-border/60 hover:shadow-lift block overflow-hidden rounded-3xl ring-1 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <div className="size-full transition-transform duration-500 group-hover:scale-105">
            <DishCover dish={dish} emojiClass="text-6xl sm:text-7xl" />
          </div>
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <KindBadge kind={dish.kind} glass />
            <FavoriteButton dish={dish} />
          </div>
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-[15px] leading-snug font-bold tracking-tight">{dish.name}</h3>
          <div className="text-muted-foreground flex items-center gap-3 text-[13px] font-medium">
            <span className="inline-flex items-center gap-1">
              <Flame className={dish.kind === 'pp' ? 'text-pp size-3.5' : 'text-regular size-3.5'} />
              {dish.calories} ккал
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {formatMinutes(dish.timeMin)}
            </span>
          </div>
          {dish.rating > 0 && <StarRating value={dish.rating} size="sm" />}
        </div>
      </Link>
    </motion.div>
  )
}

export function DishCardSkeleton() {
  return (
    <div className="bg-card shadow-soft ring-border/60 overflow-hidden rounded-3xl ring-1">
      <div className="bg-muted aspect-[4/3] animate-pulse" />
      <div className="space-y-2.5 p-4">
        <div className="bg-muted h-4 w-4/5 animate-pulse rounded-lg" />
        <div className="bg-muted h-3 w-1/2 animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
