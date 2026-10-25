import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer focus-visible:ring-ring/25 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors outline-none focus-visible:ring-4',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-6 rounded-full bg-white shadow-md transition-transform duration-200 data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  )
}
