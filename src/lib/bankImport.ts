import type { Category, Transaction } from "./types";

export type DateFormat = "YMD" | "DMY" | "MDY";

export const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
  { value: "YMD", label: "YYYY-MM-DD" },
  { value: "DMY", label: "DD/MM/YYYY" },
  { value: "MDY", label: "MM/DD/YYYY" },
];

/** Parses a bank statement's raw date text (format varies by bank) into an ISO YYYY-MM-DD string. */
export function parseStatementDate(raw: string, format: DateFormat): string | null {
  const cleaned = raw.trim().replace(/[.]/g, "/").replace(/-/g, "/");
  const parts = cleaned.split("/").map((p) => p.trim());
  if (parts.length !== 3) return null;

  let year: number, month: number, day: number;
  if (format === "YMD") {
    [year, month, day] = parts.map(Number);
  } else if (format === "DMY") {
    [day, month, year] = parts.map(Number);
  } else {
    [month, day, year] = parts.map(Number);
  }
  if (year < 100) year += 2000;
  if (!year || !month || !day || month > 12 || day > 31) return null;

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

export type ColumnMapping =
  | { mode: "single"; dateCol: number; descCol: number; amountCol: number }
  | { mode: "split"; dateCol: number; descCol: number; debitCol: number; creditCol: number };

export interface ParsedBankRow {
  date: string; // ISO
  description: string;
  amount: number;
  direction: "income" | "expense";
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[,₹\s]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Builds normalized rows from raw CSV data using the user's column mapping. Skips unparseable rows. */
export function buildParsedRows(
  rows: string[][],
  mapping: ColumnMapping,
  dateFormat: DateFormat
): ParsedBankRow[] {
  const result: ParsedBankRow[] = [];

  for (const row of rows) {
    const dateRaw = row[mapping.dateCol];
    const description = row[mapping.descCol]?.trim() ?? "";
    if (!dateRaw) continue;
    const date = parseStatementDate(dateRaw, dateFormat);
    if (!date) continue;

    if (mapping.mode === "single") {
      const rawAmount = parseAmount(row[mapping.amountCol] ?? "");
      if (rawAmount === 0) continue;
      result.push({
        date,
        description,
        amount: Math.abs(rawAmount),
        direction: rawAmount > 0 ? "income" : "expense",
      });
    } else {
      const debit = parseAmount(row[mapping.debitCol] ?? "");
      const credit = parseAmount(row[mapping.creditCol] ?? "");
      if (debit > 0) {
        result.push({ date, description, amount: debit, direction: "expense" });
      } else if (credit > 0) {
        result.push({ date, description, amount: credit, direction: "income" });
      }
    }
  }

  return result;
}

export interface ReconciledRow extends ParsedBankRow {
  status: "matched" | "missing";
}

function daysBetween(a: string, b: string): number {
  const diff = new Date(a + "T00:00:00").getTime() - new Date(b + "T00:00:00").getTime();
  return Math.abs(Math.round(diff / 86_400_000));
}

/** Flags each bank row as already logged ("matched") or missing from the user's own records. */
export function reconcileRows(
  parsed: ParsedBankRow[],
  transactions: Transaction[],
  categories: Category[]
): ReconciledRow[] {
  const typeByCategory = new Map(categories.map((c) => [c.id, c.type]));

  return parsed.map((row) => {
    const isMatched = transactions.some((t) => {
      if (typeByCategory.get(t.categoryId) !== row.direction) return false;
      if (Math.abs(t.amount - row.amount) > 0.5) return false;
      return daysBetween(t.date, row.date) <= 1;
    });
    return { ...row, status: isMatched ? "matched" : "missing" };
  });
}
