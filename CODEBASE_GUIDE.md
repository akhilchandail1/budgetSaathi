# BudgetSaathi Codebase Guide

This guide is for anyone opening the repository for the first time. It explains what BudgetSaathi does, why it exists, how its parts fit together, and the safest order in which to read the code.

For installation and environment setup, start with the [README](README.md).

## Why this project exists

BudgetSaathi is a personal-finance web app for people who want one simple place to:

- plan a monthly budget;
- record income and expenses quickly;
- understand spending with reports and charts; and
- track financial information beyond transactions, such as net worth, dues, goals, and coupons.

It is designed around INR and gives each signed-in user their own data.

## How we built it

The app uses a conventional full-stack Next.js design:

```text
User interacts with a page or component
                ↓
Client component renders forms, charts, and dialogs
                ↓
Server Action validates the input and checks the signed-in user
                ↓
Drizzle ORM reads or writes PostgreSQL
                ↓
Next.js refreshes the affected page data
```

Pages load data on the server. Interactive UI components run in the browser. When a user saves something, the client calls a Next.js Server Action; that action authenticates the request, validates the data, writes it to PostgreSQL, and refreshes the relevant pages.

## Technology used

| Need | What we use |
| --- | --- |
| Full-stack framework | Next.js 16 with the App Router |
| UI | React 19, TypeScript, Tailwind CSS, Radix UI, Lucide icons |
| Database | PostgreSQL, Drizzle ORM, postgres.js |
| Authentication | Auth.js (NextAuth v5), credentials login, optional Google OAuth |
| Password storage | bcryptjs |
| Input validation | Zod |
| Charts and exports | Recharts and jsPDF |
| Local database | Docker Compose with PostgreSQL |
| Schema changes | Drizzle Kit migrations in `src/db/migrations` |

## Read the code in this order

### 1. Start with the routes

Open `src/app` first. It shows the screens a user can visit.

| Location | Purpose |
| --- | --- |
| `src/app/login` and `src/app/signup` | Authentication screens |
| `src/app/(app)/layout.tsx` | Checks for a session and wraps protected pages in the shared app shell |
| `src/app/(app)/page.tsx` | Dashboard route (`/`) |
| `src/app/(app)/calendar` | Calendar route |
| `src/app/(app)/summary` | Reports and yearly summary |
| `src/app/(app)/net-worth` | Net-worth tracker |
| `src/app/(app)/dues` | Dues and subscriptions |
| `src/app/(app)/actions` | Financial actions and goals |
| `src/app/(app)/coupons` | Coupons, offers, and gift cards |
| `src/app/(app)/import` | Bank-statement CSV import |
| `src/app/(app)/settings` | Category and monthly-budget management |

The `(app)` folder is a Next.js route group: it organizes protected pages but does not appear in the URL.

### 2. See the shared layout and components

`src/components/layout/AppShell.tsx` defines the desktop navigation, mobile navigation, quick transaction logger, and account menu. From there, follow the imported component for the feature you are interested in:

| Component folder | Main responsibility |
| --- | --- |
| `dashboard/` | Monthly budget, KPI cards, category tables, PDF report export |
| `logger/` | Quick income/expense entry and category picker |
| `calendar/` | Daily transaction calendar and transaction dialog |
| `summary/` | Annual table, trend chart, and category donut chart |
| `networth/` | Assets/liabilities, snapshots, and net-worth trend chart |
| `dues/` | Due and subscription forms and list |
| `actions/` | Finance to-do list and financial-goal tracker |
| `coupons/` | Coupon, offer, and gift-card management |
| `import/` | CSV mapping, reconciliation preview, and import flow |
| `settings/` | Category creation, editing, budgets, and archival |
| `auth/` | Login and sign-up forms |
| `ui/` | Small reusable building blocks such as buttons, dialogs, inputs, and tabs |

### 3. Understand the data model

Read `src/db/schema.ts`. It is the source of truth for the database tables:

- Auth tables: `users`, `accounts`, `sessions`, and `verificationTokens`.
- Finance tables: `categories`, `transactions`, `netWorthItems`, `netWorthSnapshots`, `dues`, `financeActions`, `financialGoals`, and `coupons`.

Every finance table belongs to a `userId` and has a foreign key to `users`. The migration files in `src/db/migrations` are the ordered SQL history that builds this schema in a database.

Next, read `src/db/queries.ts` to see how server-rendered pages fetch data. It maps database rows into the types used by the UI.

### 4. Follow a change from UI to database

For any feature, use this pattern:

1. Find its page in `src/app/(app)`.
2. Open the page’s client component in `src/components`.
3. Find the Server Action it imports from `src/app/actions`.
4. Read the Zod schema at the top of that action file.
5. Follow the Drizzle query into `src/db/schema.ts`.

For example, to understand a new transaction:

```text
QuickLogger or dashboard UI
        → addTransaction in src/app/actions/transactions.ts
        → transactionSchema validates the submitted values
        → Drizzle inserts a row in the transactions table
        → dashboard and summary paths are revalidated
```

### 5. Learn the cross-cutting helpers

`src/lib` contains logic that does not belong to one screen:

- `selectors.ts` calculates monthly budget summaries.
- `calc.ts` evaluates the quick-entry arithmetic expression.
- `bankImport.ts` and `csv.ts` parse, map, reconcile, import, and export CSV/JSON data.
- `netWorth.ts`, `dues.ts`, `goals.ts`, `financeActions.ts`, and `coupons.ts` define feature types and calculations.
- `pdf.ts` creates dashboard PDF reports.
- `format.ts` formats INR amounts and dates.
- `seedCategories.ts` creates default categories for a new account.

## Authentication and authorization flow

1. A user signs up with a name, email, and password, or optionally uses Google OAuth.
2. The server validates the submitted values with Zod.
3. Credential passwords are hashed with bcrypt before they are stored in the `users.password_hash` column.
4. Auth.js creates a signed JWT session using `AUTH_SECRET`.
5. `src/proxy.ts` redirects unauthenticated visitors away from app pages and redirects signed-in users away from login and signup pages.
6. The protected app layout checks the session again before rendering application data.
7. Server Actions obtain the user ID from the session rather than accepting it from the browser.

The configuration lives in `src/auth.ts`. Google login is enabled only when both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set.

## Security already implemented

### User data security

- Finance records are associated with the authenticated user through `userId` foreign keys.
- Data reads in `src/db/queries.ts` filter by the current user’s ID.
- Update and delete actions scope most database queries by both the record ID and the current user ID. This prevents a user from changing a record merely by knowing its ID.
- User IDs are obtained server-side from the Auth.js session; the browser does not choose which user owns a newly created record.
- Category deletion is handled carefully: a category with transactions is archived instead of removed, preserving transaction history.
- Database credentials live in environment variables and `.env*` files are ignored by Git.

### Login and sign-up security

- Passwords are hashed with bcrypt using 12 salt rounds; plaintext passwords are not stored.
- Login and sign-up inputs are validated on the server, including email format, required name, and an eight-character minimum password.
- Auth.js manages session creation and signing. `AUTH_SECRET` must be a strong, private value in every deployed environment.
- Login failures return a generic “Invalid email or password” message, which avoids confirming whether an account exists.
- Google OAuth secrets are optional and remain server-side environment variables.

### Database security

- Drizzle uses parameterized queries rather than string-building SQL from user input, reducing SQL-injection risk.
- The database schema uses UUID primary keys, foreign keys, a unique email address, and cascading deletes for dependent records.
- Schema changes are kept in reviewed, ordered migration files rather than made ad hoc in production.
- The application accesses PostgreSQL only from server-side code; no database connection string is sent to the browser.

## Production hardening still recommended

The items below are not currently implemented by this repository. They should be considered before handling real financial data in production:

- **Rate limiting:** Add rate limits to login, sign-up, and large import actions to reduce brute-force and abuse risk.
- **Email verification and password reset:** Add an email-verification flow and a secure password-reset flow.
- **Strong password policy:** Consider longer passwords and breached-password checks.
- **Database network security:** Use a Supabase SSL connection string, keep the database password only in Vercel environment variables, and rotate secrets when needed.
- **Row Level Security (RLS):** The current application enforces ownership in server code. If you ever expose these tables through Supabase’s client/Data API, enable and test RLS policies first. Do not expose a service-role key to the browser.
- **Authorization checks for relations:** Before creating or updating a transaction, verify that the selected `categoryId` belongs to the current user. The action currently validates the ID format but does not perform that ownership check.
- **Security monitoring:** Add error monitoring, dependency updates, audit logs for sensitive actions, and a backup/recovery plan.

## Where to make common changes

| Change | Start here |
| --- | --- |
| Add a page | `src/app/(app)` and `src/components` |
| Add a form field | Feature component, its Zod schema in `src/app/actions`, then `src/db/schema.ts` if persistence changes |
| Add a database table or column | `src/db/schema.ts`, then run `npm run db:generate` to create a new migration |
| Add a protected mutation | A new Server Action that calls `auth()`, validates with Zod, and scopes queries with `userId` |
| Change login providers | `src/auth.ts` and `.env.example` |
| Change default categories | `src/lib/seedCategories.ts` |
| Change report calculations | `src/lib/selectors.ts` or the relevant feature helper in `src/lib` |

## Before opening a pull request

1. Keep secrets out of Git; use `.env` locally and Vercel environment variables in deployment.
2. Run `npm run lint`.
3. If the schema changed, generate and include the migration.
4. Test the changed flow while signed in and while signed out.
5. For any action that reads, updates, or deletes a record, confirm it is scoped to the authenticated `userId`.
