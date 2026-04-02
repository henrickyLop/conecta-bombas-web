"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
};

function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange?.(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 data-[state=open]:animate-in" 
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      <div 
        className={cn(
          "relative z-50 grid max-h-[90vh] w-full max-w-lg",
          "border border-gray-200 bg-white p-6 rounded-2xl shadow-2xl",
          "overflow-y-auto",
          "data-[state=open]:animate-in data-[state=closed]:animate-out"
        )}
      >
        {children}
      </div>
    </div>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-2 mb-4", className)} {...props} />
  )
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:justify-end mt-4", className)} {...props} />
  )
}

function DialogContent({ className, children, showCloseButton = true }: { className?: string; children: React.ReactNode; showCloseButton?: boolean }) {
  return <>{children}</>
}

function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-lg font-semibold text-[#1A1A2E]", className)}>{children}</h2>
}

function DialogDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("text-sm text-[#6B7280]", className)}>{children}</p>
}

function DialogClose({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick}>{children}</button>
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
}
