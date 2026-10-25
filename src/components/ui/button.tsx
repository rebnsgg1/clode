import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-4 focus-visible:ring-ring/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-[18px]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-soft hover:brightness-105 hover:shadow-lift',
        pp: 'bg-pp text-white shadow-soft hover:brightness-105 hover:shadow-lift',
        regular: 'bg-regular text-white shadow-soft hover:brightness-105 hover:shadow-lift',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        outline: 'border bg-card hover:bg-accent shadow-[0_1px_2px_oklch(0_0_0/0.04)]',
        ghost: 'hover:bg-accent',
        destructive: 'bg-destructive text-white hover:brightness-105',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 rounded-xl px-3.5 text-[13px]',
        lg: 'h-13 px-7 text-base',
        xl: 'h-15 px-8 text-lg rounded-3xl',
        icon: 'size-11',
        'icon-sm': 'size-9 rounded-xl',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { buttonVariants }
