"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, UploadCloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { addTransactionsBulk } from "@/app/actions/transactions";
import { parseCsvTable } from "@/lib/csv";
import { formatDateLabel, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  buildParsedRows,
  DATE_FORMAT_OPTIONS,
  reconcileRows,
  type ColumnMapping,
  type DateFormat,
  type ReconciledRow,
} from "@/lib/bankImport";
import type { Category, Transaction } from "@/lib/types";

type Step = "upload" | "mapping" | "review";

function guessColumn(headers: string[], keywords: string[]): number {
  const idx = headers.findIndex((h) => keywords.some((k) => h.toLowerCase().includes(k)));
  return idx >= 0 ? idx : 0;
}

export function ImportClient({
  categories,
  transactions,
}: {
  categories: Category[];
  transactions: Transaction[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [table, setTable] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [dateFormat, setDateFormat] = useState<DateFormat>("DMY");
  const [splitMode, setSplitMode] = useState(false);
  const [dateCol, setDateCol] = useState(0);
  const [descCol, setDescCol] = useState(1);
  const [amountCol, setAmountCol] = useState(2);
  const [debitCol, setDebitCol] = useState(2);
  const [creditCol, setCreditCol] = useState(3);
  const [reconciled, setReconciled] = useState<ReconciledRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === "expense" && !c.archived);
  const incomeCategories = categories.filter((c) => c.type === "income" && !c.archived);
  const [defaultExpenseCategoryId, setDefaultExpenseCategoryId] = useState(expenseCategories[0]?.id ?? "");
  const [defaultIncomeCategoryId, setDefaultIncomeCategoryId] = useState(incomeCategories[0]?.id ?? "");

  async function handleFile(file: File) {
    const text = await file.text();
    const parsed = parseCsvTable(text);
    setTable(parsed);
    setDateCol(guessColumn(parsed.headers, ["date"]));
    setDescCol(guessColumn(parsed.headers, ["desc", "narration", "particular", "detail"]));
    setAmountCol(guessColumn(parsed.headers, ["amount"]));
    setDebitCol(guessColumn(parsed.headers, ["debit", "withdrawal"]));
    setCreditCol(guessColumn(parsed.headers, ["credit", "deposit"]));
    setSuccessMessage(null);
    setStep("mapping");
  }

  function handleReview() {
    const mapping: ColumnMapping = splitMode
      ? { mode: "split", dateCol, descCol, debitCol, creditCol }
      : { mode: "single", dateCol, descCol, amountCol };
    const parsed = buildParsedRows(table.rows, mapping, dateFormat);
    const result = reconcileRows(parsed, transactions, categories);
    setReconciled(result);
    setSelected(new Set(result.map((_, i) => i).filter((i) => result[i].status === "missing")));
    setStep("review");
  }

  function toggleRow(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleImport() {
    const rowsToImport = Array.from(selected)
      .map((i) => reconciled[i])
      .filter((r): r is ReconciledRow => Boolean(r));
    if (rowsToImport.length === 0) return;

    const inputs = rowsToImport.map((r) => ({
      date: r.date,
      categoryId: r.direction === "expense" ? defaultExpenseCategoryId : defaultIncomeCategoryId,
      amount: r.amount,
      paymentMode: "Bank Transfer" as const,
      note: r.description || undefined,
    }));

    startTransition(async () => {
      const result = await addTransactionsBulk(inputs);
      setSuccessMessage(`Imported ${result.imported} transaction(s).`);
      router.refresh();
      setStep("upload");
      setTable({ headers: [], rows: [] });
    });
  }

  const matchedCount = reconciled.filter((r) => r.status === "matched").length;
  const missingCount = reconciled.filter((r) => r.status === "missing").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Import Bank Statement</h1>
        <p className="text-sm text-zinc-500">
          Upload a bank CSV export, map its columns, and reconcile it against what you&apos;ve already logged.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {step === "upload" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <UploadCloud className="h-10 w-10 text-zinc-300" />
            <p className="text-sm text-zinc-500">Choose a CSV file exported from your bank or broker.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
            <Button onClick={() => fileInputRef.current?.click()}>Choose CSV File</Button>
          </CardContent>
        </Card>
      )}

      {step === "mapping" && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Date Column</label>
                <Select value={dateCol} onChange={(e) => setDateCol(Number(e.target.value))}>
                  {table.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Date Format</label>
                <Select value={dateFormat} onChange={(e) => setDateFormat(e.target.value as DateFormat)}>
                  {DATE_FORMAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Description Column</label>
                <Select value={descCol} onChange={(e) => setDescCol(Number(e.target.value))}>
                  {table.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSplitMode(false)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium",
                  !splitMode ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500"
                )}
              >
                Single Amount Column
              </button>
              <button
                type="button"
                onClick={() => setSplitMode(true)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium",
                  splitMode ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500"
                )}
              >
                Separate Debit / Credit Columns
              </button>
            </div>

            {!splitMode ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Amount Column (positive = income, negative = expense)
                </label>
                <Select value={amountCol} onChange={(e) => setAmountCol(Number(e.target.value))}>
                  {table.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Debit Column</label>
                  <Select value={debitCol} onChange={(e) => setDebitCol(Number(e.target.value))}>
                    {table.headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Credit Column</label>
                  <Select value={creditCol} onChange={(e) => setCreditCol(Number(e.target.value))}>
                    {table.headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            {table.rows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-zinc-200">
                <table className="w-full min-w-[480px] text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-zinc-400">
                      {table.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 font-medium">
                          {h || `Column ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-zinc-50 last:border-0">
                        {row.map((cell, j) => (
                          <td key={j} className="truncate px-3 py-2 text-zinc-600">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleReview}>Preview & Reconcile</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Already Logged</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 pt-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p className="text-xl font-semibold text-zinc-900">{matchedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Missing From Records</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 pt-0">
                <CircleAlert className="h-5 w-5 text-amber-500" />
                <p className="text-xl font-semibold text-zinc-900">{missingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Default Expense Category</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Select
                  value={defaultExpenseCategoryId}
                  onChange={(e) => setDefaultExpenseCategoryId(e.target.value)}
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Default Income Category</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Select
                  value={defaultIncomeCategoryId}
                  onChange={(e) => setDefaultIncomeCategoryId(e.target.value)}
                >
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-zinc-900">
                {selected.size} selected for import
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep("mapping")}>
                  Back
                </Button>
                <Button size="sm" onClick={handleImport} disabled={isPending || selected.size === 0}>
                  {isPending ? "Importing…" : `Import ${selected.size} Selected`}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-[28rem] overflow-auto rounded-lg border border-zinc-100">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase text-zinc-400">
                      <th className="w-8 px-3 py-2" />
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciled.map((row, i) => (
                      <tr
                        key={i}
                        className={cn(
                          "border-b border-zinc-50 last:border-0",
                          row.status === "matched" && "opacity-50"
                        )}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(i)}
                            disabled={row.status === "matched"}
                            onChange={() => toggleRow(i)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-zinc-700">{formatDateLabel(row.date)}</td>
                        <td className="max-w-xs truncate px-3 py-2 text-zinc-600">{row.description || "—"}</td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right tabular-nums font-medium",
                            row.direction === "income" ? "text-emerald-600" : "text-zinc-800"
                          )}
                        >
                          {row.direction === "income" ? "+" : "−"}
                          {formatINR(row.amount)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              row.status === "matched"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            )}
                          >
                            {row.status === "matched" ? "Already logged" : "Missing"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
