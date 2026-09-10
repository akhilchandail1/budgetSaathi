import type { Category, PaymentMode, Transaction } from "./types";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/** Parses any CSV into a header row + data rows, for formats we don't control (bank/broker exports). */
export function parseCsvTable(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const [headerLine, ...dataLines] = lines;
  return {
    headers: parseCsvLine(headerLine),
    rows: dataLines.map(parseCsvLine),
  };
}

export function transactionsToCSV(transactions: Transaction[], categories: Category[]): string {
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const header = ["Date", "Category", "Amount", "Payment Mode", "Note"];
  const rows = transactions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [t.date, catName(t.categoryId), String(t.amount), t.paymentMode, t.note ?? ""]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export interface TransactionCsvInput {
  date: string;
  categoryId: string;
  amount: number;
  paymentMode: PaymentMode;
  note?: string;
}

/** Parses a transactions CSV, resolving category names against the user's existing categories. */
export function csvToTransactionInputs(csvText: string, categories: Category[]): TransactionCsvInput[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const [, ...dataLines] = lines;
  const nameToId = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  const result: TransactionCsvInput[] = [];
  for (const line of dataLines) {
    const [date, categoryName, amount, paymentMode, note] = parseCsvLine(line);
    const categoryId = nameToId.get((categoryName ?? "").toLowerCase());
    const parsedAmount = parseFloat(amount);
    if (!categoryId || !date || !Number.isFinite(parsedAmount) || parsedAmount <= 0) continue;
    result.push({
      date,
      categoryId,
      amount: parsedAmount,
      paymentMode: (paymentMode as PaymentMode) || "Cash",
      note: note || undefined,
    });
  }
  return result;
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportStoreJSON(categories: Category[], transactions: Transaction[]) {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const payload = {
    categories: categories.map((c) => ({
      name: c.name,
      type: c.type,
      icon: c.icon,
      monthlyBudget: c.monthlyBudget,
    })),
    transactions: transactions.map((t) => ({
      date: t.date,
      category: catById.get(t.categoryId)?.name ?? "Miscellaneous",
      amount: t.amount,
      paymentMode: t.paymentMode,
      note: t.note ?? undefined,
    })),
  };
  downloadTextFile(
    `budgetsaathi-export-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(payload, null, 2),
    "application/json"
  );
}

export function exportTransactionsCSVFile(transactions: Transaction[], categories: Category[]) {
  downloadTextFile(
    `budgetsaathi-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
    transactionsToCSV(transactions, categories),
    "text/csv"
  );
}
