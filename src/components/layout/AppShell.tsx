"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Plus,
  Tag,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_EMAIL } from "@/lib/demo.constants";
import { AccountMenu } from "./AccountMenu";
import { Logo } from "./Logo";
import { QuickLogger } from "@/components/logger/QuickLogger";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { leaveDemo } from "@/app/actions/auth";
import type { Category, Transaction } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/net-worth", label: "Net Worth", icon: Wallet },
  { href: "/actions", label: "Actions", icon: ListChecks },
  { href: "/dues", label: "Dues", icon: CalendarClock },
  { href: "/coupons", label: "Coupons", icon: Tag },
];

export function AppShell({
  children,
  categories,
  transactions,
  userEmail,
}: {
  children: React.ReactNode;
  categories: Category[];
  transactions: Transaction[];
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const isDemo = userEmail === DEMO_EMAIL;
  const [showDemoModal, setShowDemoModal] = useState(false);

  function isDemoEditControl(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    if (target.closest("a, [data-demo-allow]")) return false;
    return Boolean(target.closest("button, input, select, textarea, [role=button], [role=checkbox], [role=switch]"));
  }

  function blockDemoEdit(event: React.SyntheticEvent<HTMLElement>) {
    if (!isDemo || !isDemoEditControl(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    setShowDemoModal(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
              <Logo className="h-7 w-7 shrink-0" />
              BudgetSaathi
            </span>
            <nav className="hidden gap-1 sm:flex">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {!isDemo && (
              <div className="hidden sm:block">
                <QuickLogger categories={categories} />
              </div>
            )}
            <AccountMenu userEmail={userEmail} categories={categories} transactions={transactions} isDemo={isDemo} />
          </div>
        </div>
      </header>

      {isDemo && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
          You are exploring a read-only demo. Sign up to add and manage your own data.
        </div>
      )}

      <main
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:pb-6"
        onPointerDownCapture={blockDemoEdit}
        onFocusCapture={blockDemoEdit}
        onKeyDownCapture={(event) => {
          if (event.key === "Enter" || event.key === " ") blockDemoEdit(event);
        }}
      >
        {children}
      </main>

      <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
        <DialogContent title="This is a demo account">
          <p className="text-sm leading-6 text-zinc-600">
            Demo data is shared and read-only. Create an account or log in to add, edit, and manage your own
            finances.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowDemoModal(false)}>
              Keep exploring
            </Button>
            <form action={leaveDemo}>
              <input type="hidden" name="destination" value="login" />
              <Button type="submit" variant="outline" className="w-full sm:w-auto">
                Log in
              </Button>
            </form>
            <form action={leaveDemo}>
              <input type="hidden" name="destination" value="signup" />
              <Button type="submit" className="w-full sm:w-auto">
                Create an account
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-zinc-200 bg-white/95 px-1 py-2 backdrop-blur sm:hidden">
        {NAV_ITEMS.slice(0, Math.ceil(NAV_ITEMS.length / 2)).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "flex flex-1 items-center justify-center rounded-lg py-2.5",
                active ? "text-zinc-900" : "text-zinc-400"
              )}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}

        <div className="-mt-8 flex flex-1 justify-center">
          {!isDemo && (
            <QuickLogger
              categories={categories}
              trigger={
                <button className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg active:scale-95">
                  <Plus className="h-6 w-6" />
                </button>
              }
            />
          )}
        </div>

        {NAV_ITEMS.slice(Math.ceil(NAV_ITEMS.length / 2)).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "flex flex-1 items-center justify-center rounded-lg py-2.5",
                active ? "text-zinc-900" : "text-zinc-400"
              )}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
