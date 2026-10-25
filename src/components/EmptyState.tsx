import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function EmptyState({
  emoji = '🍽️',
  title,
  text,
  action,
  className,
}: {
  emoji?: string
  title: string
  text?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center px-6 py-14 text-center', className)}
    >
      <div className="relative mb-6 grid size-36 place-items-center">
        <div className="absolute inset-0 rounded-[40%] bg-gradient-to-br from-emerald-200 via-lime-100 to-orange-200 opacity-80 blur-sm dark:from-emerald-900/60 dark:via-lime-900/30 dark:to-orange-900/50" />
        <motion.div
          className="absolute inset-3 rounded-[38%] border-2 border-dashed border-white/80 dark:border-white/15"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          className="relative text-6xl drop-shadow-lg"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {emoji}
        </motion.span>
        <span className="absolute top-2 right-3 text-2xl">✨</span>
        <span className="absolute bottom-3 left-2 text-xl">🌿</span>
      </div>
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      {text && <p className="text-muted-foreground mt-2 max-w-xs text-[15px]">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}
