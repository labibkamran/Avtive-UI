import { and, count, eq, gt, lt } from "drizzle-orm";

import { rateLimits } from "@/db/schema";
import { getDb } from "@/lib/db";

type RateLimitOptions = {
  action: string;
  key: string;
  limit: number;
  windowMs: number;
};

export async function assertRateLimit({
  action,
  key,
  limit,
  windowMs,
}: RateLimitOptions) {
  const db = getDb();
  const windowStart = new Date(Date.now() - windowMs);

  await db.delete(rateLimits).where(lt(rateLimits.createdAt, windowStart));

  const [result] = await db
    .select({ value: count() })
    .from(rateLimits)
    .where(
      and(
        eq(rateLimits.action, action),
        eq(rateLimits.key, key),
        gt(rateLimits.createdAt, windowStart),
      ),
    );

  if ((result?.value ?? 0) >= limit) {
    throw new Error("Too many attempts. Please wait and try again.");
  }

  await db.insert(rateLimits).values({ action, key });
}
