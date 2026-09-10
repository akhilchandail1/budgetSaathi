"use client";

import { createElement, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import type { Category } from "@/lib/types";
import { getCategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const TYPE_GROUPS = [
  { id: "expense" as const, label: "Expense" },
  { id: "income" as const, label: "Income" },
  { id: "investment" as const, label: "Investment" },
];

export function CategoryCombobox({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = categories.find((c) => c.id === value);
  const selectedIcon = selected
    ? createElement(getCategoryIcon(selected.icon), { className: "h-4 w-4 text-zinc-500" })
    : null;

  const groups = useMemo(() => {
    const filtered = categories.filter(
      (c) => !c.archived && c.name.toLowerCase().includes(query.toLowerCase())
    );
    return TYPE_GROUPS.map((g) => ({
      group: g,
      items: filtered.filter((c) => c.type === g.id),
    })).filter((g) => g.items.length > 0);
  }, [categories, query]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
      >
        <span className={cn("flex items-center gap-2", !selected && "text-zinc-400")}>
          {selectedIcon}
          {selected ? selected.name : "Select category…"}
        </span>
        <ChevronDown className="h-4 w-4 text-zinc-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 max-h-72 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search category…"
                className="w-full text-sm outline-none placeholder:text-zinc-400"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {groups.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-zinc-400">No matches</p>
              )}
              {groups.map(({ group, items }) => (
                <div key={group.id}>
                  <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                    {group.label}
                  </p>
                  {items.map((cat) => {
                    const itemIcon = createElement(getCategoryIcon(cat.icon), {
                      className: "h-4 w-4 text-zinc-500",
                    });
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onChange(cat.id);
                          setOpen(false);
                          setQuery("");
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-50"
                      >
                        <span className="flex items-center gap-2">
                          {itemIcon}
                          {cat.name}
                        </span>
                        {cat.id === value && <Check className="h-4 w-4 text-zinc-900" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
