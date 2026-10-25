import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input bg-card placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/15 flex h-11 w-full min-w-0 rounded-xl border px-3.5 text-[15px] transition-[border-color,box-shadow] outline-none file:border-0 file:bg-transparent focus-visible:ring-4 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
