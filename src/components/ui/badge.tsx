import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        pp: 'bg-pp-soft text-pp-foreground',
        regular: 'bg-regular-soft text-regular-foreground',
        glass: 'bg-black/35 text-white backdrop-blur-md',
        outline: 'border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
