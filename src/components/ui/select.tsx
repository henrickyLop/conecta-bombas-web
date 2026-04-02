"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SelectContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: React.ReactNode }[];
};

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

export function Select({ value = "", onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) {
  const [items, setItems] = React.useState<{ value: string; label: React.ReactNode }[]>([]);
  return (
    <SelectContext.Provider value={{ value, onValueChange: onValueChange || (() => {}), items }}>
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, { items } as any);
        }
        return child;
      })}
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children, id }: { className?: string; children?: React.ReactNode; id?: string }) {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("SelectTrigger must be used within Select");

  // Extract SelectValue (placeholder option) and SelectContent (actual options) from children
  let placeholder = "Selecione...";
  let optionsContent: React.ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const c = child as React.ReactElement<any>;
    if (c.type === SelectValue) {
      placeholder = c.props?.placeholder || placeholder;
    } else if (c.type === SelectContent) {
      optionsContent = c.props?.children;
    }
  });

  return (
    <select
      id={id}
      value={ctx.value}
      onChange={(e) => ctx.onValueChange(e.target.value)}
      className={cn(
        "flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer",
        className
      )}
    >
      <option value="" className="text-gray-400">{placeholder}</option>
      {optionsContent}
    </select>
  );
}

export function SelectContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  // Options are rendered inside the select element, not separately
  return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(SelectContext);
  React.useEffect(() => {
    if (!ctx) return;
    // Items are collected from children at Select level, not here
  }, []);
  return <option value={value}>{children}</option>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <option value="">{placeholder || "Selecione..."}</option>;
}

export function SelectGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectLabel({ children }: { children: React.ReactNode }) {
  return <optgroup label={String(children)} />;
}

export function SelectSeparator() {
  return <option disabled>────────</option>;
}

export function SelectScrollUpButton() {
  return null;
}

export function SelectScrollDownButton() {
  return null;
}
