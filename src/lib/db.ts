import { Pool, neonConfig } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "@/db/schema";
import { getEnv } from "@/lib/env";

neonConfig.webSocketConstructor = ws;

let cachedDb: NeonDatabase<typeof schema> | null = null;
let cachedPool: Pool | null = null;

type AppDb = NeonDatabase<typeof schema>;
type AppTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export function getDb() {
  if (!cachedDb) {
    cachedPool = new Pool({
      connectionString: getEnv().DATABASE_URL,
      max: 1,
    });
    cachedDb = drizzle({
      client: cachedPool,
      schema,
    });
  }

  return cachedDb;
}

export async function withDataRowsRls<T>(
  organizationIds: string[],
  callback: (tx: AppTransaction) => Promise<T>,
) {
  if (organizationIds.length === 0) {
    throw new Error("At least one organization id is required for data row access.");
  }

  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.allowed_organization_ids', ${organizationIds.join(",")}, true)`,
    );

    return callback(tx);
  });
}
