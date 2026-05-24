import { eq, ne } from "drizzle-orm";

import { organizations } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function getOrganizationBySlug(slug: string) {
  const [organization] = await getDb()
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  return organization ?? null;
}

export async function getRecipientOrganization(senderOrganizationId: string) {
  const [organization] = await getDb()
    .select()
    .from(organizations)
    .where(ne(organizations.id, senderOrganizationId))
    .limit(1);

  return organization ?? null;
}

export async function getTransferRecipientOrganizations(senderOrganizationId: string) {
  return getDb()
    .select({
      id: organizations.id,
      name: organizations.name,
      notificationEmail: organizations.notificationEmail,
    })
    .from(organizations)
    .where(ne(organizations.id, senderOrganizationId))
    .orderBy(organizations.name);
}

export async function createOrganization(params: {
  name: string;
  notificationEmail: string;
  slug: string;
}) {
  const [organization] = await getDb()
    .insert(organizations)
    .values(params)
    .returning();

  return organization;
}
