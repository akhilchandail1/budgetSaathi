import { db } from "@/db";
import { categories, type CategoryType } from "@/db/schema";

export const DEFAULT_CATEGORY_SEED: {
  name: string;
  type: CategoryType;
  icon: string;
  monthlyBudget: string | null;
}[] = [
  { name: "Food & Drink", type: "expense", icon: "ShoppingCart", monthlyBudget: null },
  { name: "Eating Out", type: "expense", icon: "Utensils", monthlyBudget: null },
  { name: "Loan / Borrowed", type: "expense", icon: "HandCoins", monthlyBudget: null },
  { name: "Utilities", type: "expense", icon: "Zap", monthlyBudget: null },
  { name: "Fuel & Commute", type: "expense", icon: "Fuel", monthlyBudget: null },
  { name: "Medical & Health", type: "expense", icon: "HeartPulse", monthlyBudget: null },
  { name: "Shopping", type: "expense", icon: "ShoppingBag", monthlyBudget: null },
  { name: "Travel", type: "expense", icon: "Plane", monthlyBudget: null },
  { name: "Miscellaneous", type: "expense", icon: "Circle", monthlyBudget: null },
  { name: "Salary", type: "income", icon: "Banknote", monthlyBudget: null },
  { name: "Freelance", type: "income", icon: "Briefcase", monthlyBudget: null },
  { name: "Investment Return", type: "income", icon: "TrendingUp", monthlyBudget: null },
  { name: "Gift", type: "income", icon: "Gift", monthlyBudget: null },
  { name: "SIP", type: "investment", icon: "Repeat", monthlyBudget: null },
  { name: "Stocks", type: "investment", icon: "TrendingUp", monthlyBudget: null },
  { name: "Liquid Fund", type: "investment", icon: "PiggyBank", monthlyBudget: null },
];

export async function seedDefaultCategories(userId: string) {
  await db.insert(categories).values(
    DEFAULT_CATEGORY_SEED.map((c) => ({
      userId,
      name: c.name,
      type: c.type,
      icon: c.icon,
      monthlyBudget: c.monthlyBudget,
    }))
  );
}
