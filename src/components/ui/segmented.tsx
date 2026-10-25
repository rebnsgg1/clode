import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: React.ReactNode
  /** Клас кольору активного індикатора */
  activeClass?: string
}

/** Перемикач-таби з анімованим індикатором (як у iOS) */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  id,
  className,
  size = 'default',
}: {
  value: T
  onChange: (v: T) => void
  options: SegmentedOption<T>[]
  id: string
  className?: string
  size?: 'default' | 'sm'
}) {
  return (
    <div className={cn('bg-secondary relative inline-flex rounded-2xl p-1', className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => {
              onChange(o.value)
            }}
            className={cn(
              'relative z-0 flex flex-1 items-center justify-center gap-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors',
              size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm',
              active ? (o.activeClass ? 'text-white' : 'text-foreground') : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className={cn('bg-card shadow-soft absolute inset-0 -z-10 rounded-xl', o.activeClass)}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
