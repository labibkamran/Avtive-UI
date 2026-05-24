import { eq } from "drizzle-orm";

import { organizations, users } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function getUserByEmail(email: string) {
  const [user] = await getDb()
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      organizationId: users.organizationId,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
    })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return user ?? null;
}

export async function getUserById(userId: string) {
  const [user] = await getDb()
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      organizationId: users.organizationId,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
    })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export async function createUser(params: {
  email: string;
  name: string;
  organizationId: string;
}) {
  const [user] = await getDb()
    .insert(users)
    .values({
      ...params,
      email: params.email.toLowerCase(),
    })
    .returning();

  return user;
}
