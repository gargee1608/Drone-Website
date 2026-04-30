import path from "node:path";

import { config } from "dotenv";
import { Pool } from "pg";

/** Next does not load `backend/.env`; merge it so blogs API matches Express DB settings. */
config({ path: path.join(process.cwd(), "backend", ".env") });

const globalForPool = globalThis as unknown as { __blogPgPool?: Pool };

function createPool(): Pool {
  return new Pool({
    user: process.env.PGUSER || process.env.DB_USER || "postgres",
    host: process.env.PGHOST || process.env.DB_HOST || "localhost",
    database: process.env.PGDATABASE || process.env.DB_NAME || "drone_hire",
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || "admin",
    port:
      Number.parseInt(
        String(process.env.PGPORT || process.env.DB_PORT || "5432"),
        10
      ) || 5432,
  });
}

/** Shared pool for Next.js Route Handlers (blogs API). Matches `backend/db.js` env vars. */
export function getPgPool(): Pool {
  if (!globalForPool.__blogPgPool) {
    globalForPool.__blogPgPool = createPool();
  }
  return globalForPool.__blogPgPool;
}
