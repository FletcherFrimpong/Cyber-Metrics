"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Centred modal with a fixed header and a scrolling body.
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  header,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** Rendered left of the title, e.g. a logo. */
  header?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg focus:outline-none",
            className
          )}
        >
          <div className="flex items-start gap-3 border-b border-neutral-200 px-4 py-3">
            {header}
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-[14px] font-semibold text-neutral-900">{title}</DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-0.5 text-[13px] text-neutral-500">{description}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="overflow-y-auto p-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
