"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;

export function TabsList({ className, ...props }: React.ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn("inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors",
        "data-[state=active]:bg-zinc-900 data-[state=active]:text-white",
        "data-[state=inactive]:hover:bg-zinc-100 data-[state=inactive]:hover:text-zinc-900",
        className
      )}
      {...props}
    />
  );
}
