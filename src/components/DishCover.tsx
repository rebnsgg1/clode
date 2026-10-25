import type { Dish } from '@/types'
import { cn } from '@/lib/utils'

/** Фото страви або градієнтний плейсхолдер з емодзі */
export function DishCover({
  dish,
  className,
  emojiClass = 'text-6xl',
}: {
  dish: Pick<Dish, 'photo' | 'cover' | 'name'>
  className?: string
  emojiClass?: string
}) {
  if (dish.photo) {
    return <img src={dish.photo} alt={dish.name} className={cn('size-full object-cover', className)} draggable={false} />
  }
  return (
    <div
      className={cn('relative grid size-full place-items-center overflow-hidden', className)}
      style={{ background: `linear-gradient(135deg, ${dish.cover.from}, ${dish.cover.to})` }}
      aria-label={dish.name}
      role="img"
    >
      <div className="absolute -top-1/4 -left-1/4 size-3/4 rounded-full bg-white/30 blur-2xl" />
      <div className="absolute -right-1/4 -bottom-1/3 size-3/4 rounded-full bg-black/10 blur-2xl" />
      <span className={cn('relative drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)] select-none', emojiClass)}>{dish.cover.emoji}</span>
    </div>
  )
}
