import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  back?: boolean
  className?: string
}) {
  const navigate = useNavigate()
  return (
    <header className={cn('mb-6 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {back && (
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="text-muted-foreground hover:text-foreground mb-2 -ml-1.5 inline-flex items-center gap-0.5 text-sm font-semibold transition"
          >
            <ChevronLeft className="size-4" /> Назад
          </button>
        )}
        <h1 className="text-[28px] leading-tight font-extrabold tracking-tight sm:text-[34px]">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1 text-[15px]">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
