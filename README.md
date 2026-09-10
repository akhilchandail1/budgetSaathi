# BudgetSaathi

BudgetSaathi is a personal-finance companion for planning monthly budgets, recording income and expenses, and keeping the rest of your financial life—net worth, dues, goals, and offers—in one place. It is built for Indian currency (INR) and stores each account's data separately in PostgreSQL.

New to the project? Read the [Codebase Guide](CODEBASE_GUIDE.md) for a simple walkthrough of its architecture, components, data flow, and security model.

## Features

- **Monthly budgeting:** Set income and expense categories with monthly budgets, then compare planned and actual spending by month.
- **Fast transaction logging:** Record income or expenses with a category, date, note, and payment method (UPI, cards, cash, or bank transfer). The amount field supports quick inline arithmetic such as `45+120`.
- **Dashboard and reports:** View income, spending, balance, category-level budget progress, and transaction details. Export the selected month’s dashboard as a PDF.
- **Calendar and annual summary:** Browse transactions by day, examine spending trends and category breakdowns, and review an annual table and charts.
- **Bank-statement import:** Upload a CSV, map its columns and date format, preview reconciled rows, and import only transactions that are not already logged. Both single-amount and debit/credit CSV layouts are supported.
- **Data portability:** Import BudgetSaathi backup data and export records from the account menu.
- **Net-worth tracking:** Track assets, liabilities, investments, loans, borrowed money, EPF, SIPs, and credit-card dues. Save monthly snapshots to see net-worth trends over time.
- **Dues and subscriptions:** Keep upcoming subscriptions, insurance premiums, credit-card dues, and other recurring payments with monthly or yearly cycles.
- **Financial actions and goals:** Maintain a prioritized finance to-do list and track progress toward savings goals.
- **Coupon wallet:** Save coupons, offers, and gift cards with their value, code, and expiry date.
- **Authentication and privacy:** Use email/password accounts or optional Google sign-in. Data is scoped to the signed-in user.
- **Responsive UI:** A desktop navigation bar and mobile-first bottom navigation make core actions available across screen sizes.

## Architecture

```text
Browser (React client components)
        │
        ├── Dashboard, calendar, summaries, imports, trackers
        └── Server Actions for validated mutations
                    │
Next.js App Router ── Auth.js middleware ── Auth.js (credentials / Google)
                    │
           Drizzle ORM + postgres.js
                    │
              PostgreSQL database
```

- `src/app` contains App Router pages, route handlers, and server actions. Protected pages live in `src/app/(app)`.
- `src/components` contains feature components and reusable UI primitives.
- `src/lib` holds domain calculations, formatting, CSV/bank-import reconciliation, PDF generation, and helpers.
- `src/auth.ts` configures Auth.js; `src/proxy.ts` protects application routes.
- `src/db/schema.ts` defines the PostgreSQL schema and `src/db/migrations` contains generated Drizzle migrations.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| Styling and UI | Tailwind CSS 4, Radix UI, Lucide icons |
| Database | PostgreSQL 17, Drizzle ORM, postgres.js |
| Authentication | Auth.js / NextAuth v5, Drizzle adapter, bcryptjs, optional Google OAuth |
| Validation | Zod |
| Charts and documents | Recharts, jsPDF, jsPDF AutoTable |
| Tooling | ESLint, Drizzle Kit, Docker Compose |

## Run locally

### Prerequisites

- Node.js 20.9 or newer
- npm
- Docker and Docker Compose (recommended for local PostgreSQL), or an accessible PostgreSQL database

### 1. Clone and install dependencies

```bash
git clone https://github.com/akhilchandail1/budgetSaathi.git
cd budgetSaathi
npm install
```

### 2. Configure environment variables

Copy the example environment file and add an Auth.js secret:

```bash
cp .env.example .env
npx auth secret
```

Copy the generated secret into `AUTH_SECRET` in `.env`. With the supplied Docker configuration, the remaining local configuration is:

```env
DATABASE_URL=postgres://budget:budget@localhost:5432/budget_planner
AUTH_SECRET=replace-with-the-generated-secret

# Optional: enable Google sign-in
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

Google sign-in is optional. Leave its variables empty to use email/password sign-up only. If you enable it, create OAuth credentials in Google Cloud and add the local callback URL `http://localhost:3000/api/auth/callback/google`.

### 3. Start PostgreSQL and apply migrations

```bash
docker compose up -d
npm run db:migrate
```

If you use a non-Docker PostgreSQL instance, set `DATABASE_URL` to that instance before running the migration command.

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and begin tracking your finances.

## Useful commands

```bash
npm run dev          # Start the development server
npm run build        # Create a production build
npm run start        # Run the production server
npm run lint         # Lint the codebase
npm run db:generate  # Generate a Drizzle migration after schema changes
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio
```

## Contributing

Issues and pull requests are welcome. For a database schema change, update `src/db/schema.ts`, run `npm run db:generate`, and include the generated migration in the pull request. Never commit `.env` or real credentials.

## License

This project is licensed under the [MIT License](LICENSE).
