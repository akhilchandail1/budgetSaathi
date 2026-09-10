"use client";

import { useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileJson,
  FileUp,
  LogOut,
  PiggyBank,
  Settings as SettingsIcon,
  Table,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportStoreJSON, exportTransactionsCSVFile, csvToTransactionInputs } from "@/lib/csv";
import { importBudgetData } from "@/app/actions/importExport";
import { addTransactionsBulk } from "@/app/actions/transactions";
import { signOutAction } from "@/app/actions/auth";
import type { Category, Transaction } from "@/lib/types";

export function AccountMenu({
  userEmail,
  categories,
  transactions,
}: {
  userEmail?: string | null;
  categories: Category[];
  transactions: Transaction[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  async function handleImportJSON(file: File) {
    let payload: unknown;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      window.alert("Couldn't read that file — make sure it's a valid JSON export.");
      return;
    }
    startTransition(async () => {
      const result = await importBudgetData(payload);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      window.alert(`Imported ${result.imported} transaction(s).`);
      router.refresh();
    });
  }

  async function handleImportCSV(file: File) {
    const text = await file.text();
    const inputs = csvToTransactionInputs(text, categories);
    if (inputs.length === 0) {
      window.alert("No matching transactions found in that CSV — category names must match your existing categories.");
      return;
    }
    startTransition(async () => {
      const result = await addTransactionsBulk(inputs);
      window.alert(`Imported ${result.imported} transaction(s).`);
      router.refresh();
    });
  }

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
    });
  }

  if (!userEmail) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="outline" size="sm">
            Log in
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="sm">Sign up</Button>
        </Link>
      </div>
    );
  }

  const initial = userEmail.trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportJSON(file);
          e.target.value = "";
        }}
      />
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportCSV(file);
          e.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            title={userEmail}
            aria-label="Account menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {initial}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
          <div className="truncate px-2.5 pb-2 text-sm text-zinc-700">{userEmail}</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <SettingsIcon className="h-4 w-4 text-zinc-400" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/summary">
              <PiggyBank className="h-4 w-4 text-zinc-400" />
              <span>Reports</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/import">
              <UploadCloud className="h-4 w-4 text-zinc-400" />
              <span>Import</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Export</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => exportStoreJSON(categories, transactions)}>
            <FileJson className="h-4 w-4 text-zinc-400" />
            <span>Export all data (JSON)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => exportTransactionsCSVFile(transactions, categories)}>
            <Table className="h-4 w-4 text-zinc-400" />
            <span>Export transactions (CSV)</span>
          </DropdownMenuItem>
          <DropdownMenuLabel>Import backup</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => jsonInputRef.current?.click()}>
            <FileJson className="h-4 w-4 text-zinc-400" />
            <span>Import from JSON backup</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => csvInputRef.current?.click()}>
            <FileUp className="h-4 w-4 text-zinc-400" />
            <span>Import transactions (CSV)</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleSignOut} disabled={isPending} className="text-red-600">
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
