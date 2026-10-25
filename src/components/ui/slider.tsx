import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

export function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root className={cn('relative flex w-full touch-none items-center py-2 select-none', className)} {...props}>
      <SliderPrimitive.Track className="bg-secondary relative h-2 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="border-primary shadow-soft focus-visible:ring-ring/25 block size-6 rounded-full border-[3px] bg-white transition-transform outline-none hover:scale-110 focus-visible:ring-4 active:scale-110" />
    </SliderPrimitive.Root>
  )
}
