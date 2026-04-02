"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | undefined>(undefined);

function DropdownMenu({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div {...props} className={cn("relative inline-block", props.className)}>{children}</div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) throw new Error("DropdownMenuTrigger must be inside DropdownMenu");
  return <button {...props} onClick={() => ctx.setOpen(!ctx.open)}>{children}</button>;
}

function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuContent({ children, className, align = "start" }: { children: React.ReactNode; className?: string; align?: "start" | "end" }) {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) throw new Error("DropdownMenuContent must be inside DropdownMenu");
  if (!ctx.open) return null;
  return (
    <div className={cn(
      "absolute z-50 mt-1 min-w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-lg",
      align === "end" && "right-0 left-auto",
      typeof className === "string" ? className : ""
    )} onClick={() => ctx.setOpen(false)}>
      {children}
    </div>
  );
}

type DropdownMenuItemProps = {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
  variant?: "default" | "destructive";
  onSelect?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function DropdownMenuItem({ children, className, inset, variant = "default", onSelect, ...props }: DropdownMenuItemProps) {
  const ctx = React.useContext(DropdownMenuContext);
  return (
    <button
      className={cn(
        "flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-100",
        variant === "destructive" && "text-red-600",
        inset && "pl-7",
        className
      )}
      onClick={() => { onSelect?.(); ctx?.setOpen(false); }}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-1 my-1 h-px bg-gray-200", className)} {...props} />;
}

function DropdownMenuGroup({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

function DropdownMenuLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-3 py-1.5 text-xs font-medium text-[#6B7280]", className)}>{children}</div>;
}

function DropdownMenuCheckboxItem({ children, checked, onCheckedChange, className, ...props }: { children: React.ReactNode; checked?: boolean; onCheckedChange?: (v: boolean) => void; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(DropdownMenuContext);
  return (
    <button
      className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100", className)}
      onClick={() => { onCheckedChange?.(!checked); ctx?.setOpen(false); }}
      {...props}
    >
      {checked ? "☑" : "☐"} {children}
    </button>
  );
}

function DropdownMenuRadioGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

type DropdownMenuRadioItemProps = {
  children: React.ReactNode;
  value?: string;
  checked?: boolean;
  className?: string;
  onSelect?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function DropdownMenuRadioItem({ children, className, onSelect, ...props }: DropdownMenuRadioItemProps) {
  const ctx = React.useContext(DropdownMenuContext);
  return (
    <button
      className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100", className)}
      onClick={() => { onSelect?.(); ctx?.setOpen(false); }}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuSubTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <button className={cn("flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100", className)}>{children}</button>;
}

function DropdownMenuSubContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("ml-4 rounded-lg border bg-white p-1", className)}>{children}</div>;
}

function DropdownMenuShortcut({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("ml-auto text-xs text-[#6B7280]", className)}>{children}</span>;
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
