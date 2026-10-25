import * as React from 'react'
import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-card placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/15 flex field-sizing-content min-h-20 w-full rounded-xl border px-3.5 py-2.5 text-[15px] transition-[border-color,box-shadow] outline-none focus-visible:ring-4 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
