import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString, {
  // Required for Supabase's transaction-mode pooler (port 6543), which
  // doesn't support prepared statements. Serverless functions should use
  // the transaction pooler, not the session pooler (5432), which has a
  // small connection cap and gets exhausted under concurrent invocations.
  prepare: false,
});
export const db = drizzle(client, { schema });
