import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { cn, haptic } from '@/lib/utils'

export function StarRating({
  value,
  onChange,
  size = 'md',
  className,
}: {
  value: number
  onChange?: (v: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const px = size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-7' : 'size-5'
  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role={onChange ? 'radiogroup' : undefined}
      aria-label={`Оцінка ${value} з 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        const star = <Star className={cn(px, filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
        if (!onChange) return <span key={n}>{star}</span>
        return (
          <motion.button
            key={n}
            type="button"
            whileTap={{ scale: 0.75 }}
            whileHover={{ scale: 1.15 }}
            onClick={() => {
              haptic()
              onChange(n === value ? 0 : n)
            }}
            className="p-0.5"
            aria-label={`${n} з 5`}
          >
            {star}
          </motion.button>
        )
      })}
    </div>
  )
}
