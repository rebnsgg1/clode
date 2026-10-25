import { cn, haptic } from '@/lib/utils'

export function Chip({ active, className, onClick, ...props }: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        haptic()
        onClick?.(e)
      }}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-all active:scale-95',
        active ? 'bg-foreground text-background border-transparent' : 'border-border bg-card text-foreground/80 hover:border-foreground/20',
        className,
      )}
      {...props}
    />
  )
}
