const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrFormatterPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatINR(amount: number, precise = false): string {
  return (precise ? inrFormatterPrecise : inrFormatter).format(amount || 0);
}

export function formatCompactINR(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(amount / 1_000).toFixed(1)}k`;
  return formatINR(amount);
}

export function getMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function formatMonthShort(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function formatDateLabel(iso: string): string {
  const date = new Date(iso + "T00:00:00");
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return getMonthKey(date);
}

export function monthKeyFromISO(iso: string): string {
  return iso.slice(0, 7);
}

export function listRecentMonths(count: number, endMonth: string = getMonthKey()): string[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    months.push(shiftMonth(endMonth, -i));
  }
  return months;
}

/** Monday of the week containing `date`, as an ISO date (YYYY-MM-DD) — used as the week key. */
export function getWeekStartISO(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function weekKeyFromISO(iso: string): string {
  return getWeekStartISO(new Date(iso + "T00:00:00"));
}

export function shiftWeek(weekStartISO: string, delta: number): string {
  const d = new Date(weekStartISO + "T00:00:00");
  d.setDate(d.getDate() + delta * 7);
  return getWeekStartISO(d);
}

export function formatWeekLabel(weekStartISO: string): string {
  const start = new Date(weekStartISO + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startLabel = start.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const endLabel = end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

export function formatWeekShort(weekStartISO: string): string {
  const start = new Date(weekStartISO + "T00:00:00");
  return start.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function listRecentWeeks(count: number, endWeekStart: string = getWeekStartISO()): string[] {
  const weeks: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    weeks.push(shiftWeek(endWeekStart, -i));
  }
  return weeks;
}

export function getYearKey(date: Date = new Date()): string {
  return String(date.getFullYear());
}

export function yearKeyFromISO(iso: string): string {
  return iso.slice(0, 4);
}

export function listRecentYears(count: number, endYear: string = getYearKey()): string[] {
  const end = Number(endYear);
  const years: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    years.push(String(end - i));
  }
  return years;
}

export function getDaysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** Weekday (0 = Sunday) of the 1st of the month — used to offset a calendar grid. */
export function getMonthStartWeekday(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).getDay();
}

export function dateFromDayOfMonth(monthKey: string, day: number): string {
  return `${monthKey}-${String(day).padStart(2, "0")}`;
}
