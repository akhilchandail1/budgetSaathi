import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

export const categoryTypeValues = ["income", "expense"] as const;
export type CategoryType = (typeof categoryTypeValues)[number];

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").$type<CategoryType>().notNull(),
  icon: text("icon").notNull().default("Circle"),
  monthlyBudget: numeric("monthly_budget", { precision: 12, scale: 2 }),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const paymentModeValues = [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Bank Transfer",
] as const;
export type PaymentModeValue = (typeof paymentModeValues)[number];

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // ISO date, YYYY-MM-DD
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  paymentMode: text("payment_mode").$type<PaymentModeValue>().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const netWorthItemTypeValues = [
  "asset",
  "liability",
  "loan_given",
  "borrowed",
  "mutual_fund",
  "stocks",
  "us_stocks",
  "epf",
  "credit_card_due",
  "sip",
] as const;
export type NetWorthItemType = (typeof netWorthItemTypeValues)[number];

export const netWorthItems = pgTable("net_worth_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<NetWorthItemType>().notNull(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const netWorthSnapshots = pgTable(
  "net_worth_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: text("month").notNull(), // YYYY-MM
    breakdown: jsonb("breakdown").$type<Record<string, number>>().notNull(),
    netWorth: numeric("net_worth", { precision: 14, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("net_worth_snapshots_user_month_idx").on(t.userId, t.month)]
);

export const duesCategoryValues = ["subscription", "insurance", "credit_card", "other"] as const;
export type DuesCategory = (typeof duesCategoryValues)[number];

export const billingCycleValues = ["monthly", "yearly"] as const;
export type BillingCycle = (typeof billingCycleValues)[number];

export const dues = pgTable("dues", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: text("category").$type<DuesCategory>().notNull(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  cycle: text("cycle").$type<BillingCycle>().notNull(),
  nextDueDate: text("next_due_date"), // ISO date, YYYY-MM-DD
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const actionPriorityValues = ["low", "medium", "high"] as const;
export type ActionPriority = (typeof actionPriorityValues)[number];

export const financeActions = pgTable("finance_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  notes: text("notes"),
  priority: text("priority").$type<ActionPriority>().notNull().default("medium"),
  dueDate: text("due_date"), // ISO date, YYYY-MM-DD
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const goalStatusValues = ["active", "completed"] as const;
export type GoalStatus = (typeof goalStatusValues)[number];

export const financialGoals = pgTable("financial_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 14, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  targetDate: text("target_date"), // ISO date, YYYY-MM-DD
  notes: text("notes"),
  status: text("status").$type<GoalStatus>().notNull().default("active"),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const couponTypeValues = ["coupon", "offer", "gift_card"] as const;
export type CouponType = (typeof couponTypeValues)[number];

export const couponValueTypeValues = ["flat", "percent"] as const;
export type CouponValueType = (typeof couponValueTypeValues)[number];

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<CouponType>().notNull(),
  merchant: text("merchant").notNull(),
  title: text("title").notNull(),
  code: text("code"),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  valueType: text("value_type").$type<CouponValueType>().notNull(),
  expiryDate: text("expiry_date"), // ISO date, YYYY-MM-DD
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
