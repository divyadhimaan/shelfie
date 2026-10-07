import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgres://missing-database-url";
// Optional cap on pooled connections (1 suits serverless functions and single-connection test databases).
const max = Number(process.env.DATABASE_POOL_MAX) || undefined;

// Reuse one pool per connection setting across hot reloads in development.
const poolKey = `${connectionString}|${max ?? "default"}`;
const globalForDb = globalThis as unknown as {
  pgClients?: Map<string, ReturnType<typeof postgres>>;
};
globalForDb.pgClients ??= new Map();

const client =
  globalForDb.pgClients.get(poolKey) ??
  postgres(connectionString, {
    max,
    // Neon/Supabase poolers run in transaction mode, which doesn't support prepared statements.
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgClients.set(poolKey, client);

export const db = drizzle(client, { schema });
export { schema };
