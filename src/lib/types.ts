export type CategoryType = "income" | "expense" | "investment";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  monthlyBudget: number | null;
  archived: boolean;
}

export type PaymentMode = "UPI" | "Credit Card" | "Debit Card" | "Cash" | "Bank Transfer";

export const PAYMENT_MODES: PaymentMode[] = [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Bank Transfer",
];

export interface Transaction {
  id: string;
  date: string; // ISO date, YYYY-MM-DD
  categoryId: string;
  amount: number;
  note?: string | null;
  paymentMode: PaymentMode;
  createdAt: string; // ISO datetime
}

/** month key format: "YYYY-MM" */
export type MonthKey = string;
