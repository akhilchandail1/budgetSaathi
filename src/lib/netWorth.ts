export type NetWorthItemType =
  | "asset"
  | "liability"
  | "loan_given"
  | "borrowed"
  | "mutual_fund"
  | "stocks"
  | "us_stocks"
  | "epf"
  | "credit_card_due"
  | "sip";

export interface NetWorthItem {
  id: string;
  type: NetWorthItemType;
  name: string;
  amount: number;
  notes: string | null;
  updatedAt: string;
}

export interface NetWorthSnapshot {
  month: string; // YYYY-MM
  netWorth: number;
  breakdown: Record<string, number>;
}

/** sign: how this type contributes to net worth — +1 adds, -1 subtracts, 0 informational only (not counted) */
export interface NetWorthTypeMeta {
  type: NetWorthItemType;
  label: string;
  icon: string;
  sign: 1 | -1 | 0;
}

export const NET_WORTH_TYPES: NetWorthTypeMeta[] = [
  { type: "asset", label: "Assets", icon: "Home", sign: 1 },
  { type: "mutual_fund", label: "Mutual Fund Portfolio", icon: "PieChart", sign: 1 },
  { type: "stocks", label: "Stock Portfolio", icon: "TrendingUp", sign: 1 },
  { type: "us_stocks", label: "US / Foreign Stocks", icon: "Globe", sign: 1 },
  { type: "epf", label: "EPF", icon: "Landmark", sign: 1 },
  { type: "loan_given", label: "Loans Given (owed to you)", icon: "HandCoins", sign: 1 },
  { type: "liability", label: "Liabilities", icon: "AlertTriangle", sign: -1 },
  { type: "borrowed", label: "Borrowed (you owe)", icon: "Handshake", sign: -1 },
  { type: "credit_card_due", label: "Credit Card Dues", icon: "CreditCard", sign: -1 },
  { type: "sip", label: "Monthly SIPs", icon: "Repeat", sign: 0 },
];

export function getNetWorthTypeMeta(type: NetWorthItemType): NetWorthTypeMeta {
  return NET_WORTH_TYPES.find((t) => t.type === type) ?? NET_WORTH_TYPES[0];
}

export interface NetWorthTotals {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlySip: number;
  byType: Record<NetWorthItemType, number>;
}

export function computeNetWorthTotals(items: NetWorthItem[]): NetWorthTotals {
  const byType = Object.fromEntries(NET_WORTH_TYPES.map((t) => [t.type, 0])) as Record<
    NetWorthItemType,
    number
  >;
  for (const item of items) {
    byType[item.type] = (byType[item.type] ?? 0) + item.amount;
  }

  let totalAssets = 0;
  let totalLiabilities = 0;
  for (const meta of NET_WORTH_TYPES) {
    const value = byType[meta.type] ?? 0;
    if (meta.sign === 1) totalAssets += value;
    if (meta.sign === -1) totalLiabilities += value;
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    monthlySip: byType.sip ?? 0,
    byType,
  };
}
