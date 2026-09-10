import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  coupons,
  dues,
  financeActions,
  financialGoals,
  netWorthItems,
  netWorthSnapshots,
  transactions,
  users,
} from "@/db/schema";
import { DEMO_EMAIL } from "@/lib/demo.constants";

export { DEMO_EMAIL } from "@/lib/demo.constants";

function isoDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

function addDays(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function ensureDemoUser() {
  const [existing] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({ name: "BudgetSaathi Demo", email: DEMO_EMAIL })
    .onConflictDoNothing({ target: users.email })
    .returning();

  if (!created) {
    const [demoUser] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
    if (!demoUser) throw new Error("Could not create the demo account.");
    return demoUser;
  }

  const today = new Date();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const lastMonth = month === 0 ? 11 : month - 1;
  const lastMonthYear = month === 0 ? year - 1 : year;

  const seededCategories = await db
    .insert(categories)
    .values([
      { userId: created.id, name: "Salary", type: "income", icon: "Banknote", monthlyBudget: "85000" },
      { userId: created.id, name: "Freelance", type: "income", icon: "Briefcase", monthlyBudget: "15000" },
      { userId: created.id, name: "Food & Drink", type: "expense", icon: "ShoppingCart", monthlyBudget: "9000" },
      { userId: created.id, name: "Home & Utilities", type: "expense", icon: "Home", monthlyBudget: "18000" },
      { userId: created.id, name: "Fuel & Commute", type: "expense", icon: "Fuel", monthlyBudget: "5000" },
      { userId: created.id, name: "Shopping", type: "expense", icon: "ShoppingBag", monthlyBudget: "6000" },
      { userId: created.id, name: "Health", type: "expense", icon: "HeartPulse", monthlyBudget: "3000" },
      { userId: created.id, name: "Entertainment", type: "expense", icon: "Film", monthlyBudget: "2500" },
    ])
    .returning();
  const categoryId = Object.fromEntries(seededCategories.map((category) => [category.name, category.id]));

  await Promise.all([
    db.insert(transactions).values([
      { userId: created.id, categoryId: categoryId.Salary, date: isoDate(year, month, 1), amount: "85000", paymentMode: "Bank Transfer", note: "Monthly salary" },
      { userId: created.id, categoryId: categoryId.Freelance, date: isoDate(year, month, 8), amount: "12000", paymentMode: "UPI", note: "Design project" },
      { userId: created.id, categoryId: categoryId["Food & Drink"], date: isoDate(year, month, 3), amount: "1840", paymentMode: "UPI", note: "Groceries" },
      { userId: created.id, categoryId: categoryId["Home & Utilities"], date: isoDate(year, month, 5), amount: "14500", paymentMode: "Bank Transfer", note: "Rent" },
      { userId: created.id, categoryId: categoryId["Home & Utilities"], date: isoDate(year, month, 7), amount: "1650", paymentMode: "UPI", note: "Electricity bill" },
      { userId: created.id, categoryId: categoryId["Fuel & Commute"], date: isoDate(year, month, 10), amount: "2200", paymentMode: "Credit Card", note: "Metro and fuel" },
      { userId: created.id, categoryId: categoryId.Shopping, date: isoDate(year, month, 12), amount: "2799", paymentMode: "Credit Card", note: "Running shoes" },
      { userId: created.id, categoryId: categoryId.Entertainment, date: isoDate(year, month, 14), amount: "599", paymentMode: "UPI", note: "Streaming subscription" },
      { userId: created.id, categoryId: categoryId.Salary, date: isoDate(lastMonthYear, lastMonth, 1), amount: "85000", paymentMode: "Bank Transfer", note: "Monthly salary" },
      { userId: created.id, categoryId: categoryId["Food & Drink"], date: isoDate(lastMonthYear, lastMonth, 6), amount: "7620", paymentMode: "UPI", note: "Groceries and meals" },
      { userId: created.id, categoryId: categoryId["Home & Utilities"], date: isoDate(lastMonthYear, lastMonth, 5), amount: "16100", paymentMode: "Bank Transfer", note: "Rent and utilities" },
      { userId: created.id, categoryId: categoryId["Fuel & Commute"], date: isoDate(lastMonthYear, lastMonth, 15), amount: "3400", paymentMode: "Credit Card", note: "Commute" },
    ]),
    db.insert(netWorthItems).values([
      { userId: created.id, type: "asset", name: "Emergency fund", amount: "180000", notes: "Six months of essential expenses" },
      { userId: created.id, type: "mutual_fund", name: "Index fund portfolio", amount: "320000", notes: "Long-term investment" },
      { userId: created.id, type: "epf", name: "EPF balance", amount: "145000", notes: null },
      { userId: created.id, type: "credit_card_due", name: "Credit card statement", amount: "8200", notes: "Due this month" },
      { userId: created.id, type: "sip", name: "Monthly SIP", amount: "15000", notes: "Index fund contribution" },
    ]),
    db.insert(netWorthSnapshots).values([
      { userId: created.id, month: `${lastMonthYear}-${String(lastMonth + 1).padStart(2, "0")}`, breakdown: { asset: 170000, mutual_fund: 305000, epf: 140000, credit_card_due: 12000, sip: 15000 }, netWorth: "603000" },
      { userId: created.id, month: `${year}-${String(month + 1).padStart(2, "0")}`, breakdown: { asset: 180000, mutual_fund: 320000, epf: 145000, credit_card_due: 8200, sip: 15000 }, netWorth: "636800" },
    ]),
    db.insert(dues).values([
      { userId: created.id, category: "credit_card", name: "HDFC credit card", amount: "8200", cycle: "monthly", nextDueDate: addDays(6), notes: "Pay in full" },
      { userId: created.id, category: "subscription", name: "Spotify Premium", amount: "119", cycle: "monthly", nextDueDate: addDays(10), notes: null },
      { userId: created.id, category: "insurance", name: "Health insurance", amount: "18000", cycle: "yearly", nextDueDate: addDays(45), notes: "Annual premium" },
    ]),
    db.insert(financeActions).values([
      { userId: created.id, title: "Review credit-card statement", priority: "high", dueDate: addDays(4), notes: "Check for unknown charges" },
      { userId: created.id, title: "Rebalance mutual funds", priority: "medium", dueDate: addDays(18), notes: "Review allocation" },
      { userId: created.id, title: "Download tax documents", priority: "low", dueDate: addDays(30), notes: null },
    ]),
    db.insert(financialGoals).values([
      { userId: created.id, name: "Emergency fund", targetAmount: "300000", currentAmount: "180000", targetDate: isoDate(year + 1, 2, 31), notes: "Build a six-month cash buffer" },
      { userId: created.id, name: "Japan trip", targetAmount: "150000", currentAmount: "60000", targetDate: isoDate(year + 1, 10, 15), notes: "Flights and accommodation" },
    ]),
    db.insert(coupons).values([
      { userId: created.id, type: "coupon", merchant: "Amazon", title: "Electronics discount", code: "SAVE10", value: "10", valueType: "percent", expiryDate: addDays(20), notes: "Up to ₹1,000 off" },
      { userId: created.id, type: "offer", merchant: "Swiggy", title: "Weekend dining offer", code: null, value: "150", valueType: "flat", expiryDate: addDays(8), notes: "Minimum order ₹499" },
      { userId: created.id, type: "gift_card", merchant: "Myntra", title: "Gift card balance", code: "DEMO-GIFT-2026", value: "750", valueType: "flat", expiryDate: addDays(90), notes: null },
    ]),
  ]);

  return created;
}
