import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

/** Нижня шторка на телефоні та діалог по центру на десктопі */
export function SheetContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { title: React.ReactNode; description?: React.ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          'sheet-content bg-popover text-popover-foreground shadow-lift fixed z-50 flex flex-col outline-none',
          'pb-safe inset-x-0 bottom-0 max-h-[90dvh] rounded-t-[28px]',
          'md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:pb-0',
          className,
        )}
        {...props}
      >
        <div className="bg-border mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full md:hidden" />
        <div className="flex items-start justify-between gap-4 px-6 pt-4 pb-2 md:pt-6">
          <div>
            <DialogPrimitive.Title className="text-xl font-bold tracking-tight">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-muted-foreground mt-1 text-sm">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{String(title)}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close className="bg-secondary text-muted-foreground hover:text-foreground -mr-2 grid size-9 place-items-center rounded-full transition active:scale-95">
            <X className="size-4" />
            <span className="sr-only">Закрити</span>
          </DialogPrimitive.Close>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
