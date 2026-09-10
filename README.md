# BudgetSaathi

A personal finance and monthly budget planner: plan budgets by category, log
expenses on the go (with inline math like `45+120`), and compare planned vs.
actual spending across months.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data

All data (categories, planned budgets, transactions) lives in the browser's
`localStorage` — nothing leaves your device. Use the header's export/import
icons to back up or restore data as JSON, or export/import transactions as
CSV.

## Structure

- `src/lib` — data types, default categories, the math evaluator, formatting,
  CSV helpers, and the localStorage-backed store (`externalStore.ts`).
- `src/context/BudgetDataContext.tsx` — React context exposing CRUD
  operations over the store.
- `src/components` — UI primitives (`ui/`), the quick expense logger
  (`logger/`), the dashboard (`dashboard/`), and charts/tables for the
  annual summary (`summary/`).
- `src/app` — the Dashboard (`/`) and Annual Summary (`/summary`) pages.
