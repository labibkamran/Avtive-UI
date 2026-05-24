import { eq } from "drizzle-orm";

import { dataRows, organizations, users } from "@/db/schema";
import { getDb, withDataRowsRls } from "@/lib/db";

async function seed() {
  const db = getDb();

  const [orgA] = await db
    .insert(organizations)
    .values({
      name: "Organization A",
      slug: "organization-a",
      notificationEmail: "org-a@example.com",
    })
    .onConflictDoUpdate({
      target: organizations.slug,
      set: {
        name: "Organization A",
        notificationEmail: "org-a@example.com",
      },
    })
    .returning();

  const [orgB] = await db
    .insert(organizations)
    .values({
      name: "Organization B",
      slug: "organization-b",
      notificationEmail: "org-b@example.com",
    })
    .onConflictDoUpdate({
      target: organizations.slug,
      set: {
        name: "Organization B",
        notificationEmail: "org-b@example.com",
      },
    })
    .returning();

  await db
    .insert(users)
    .values([
      {
        organizationId: orgA.id,
        email: "org-a@example.com",
        name: "Org A Admin",
      },
      {
        organizationId: orgB.id,
        email: "org-b@example.com",
        name: "Org B Admin",
      },
    ])
    .onConflictDoNothing();

  const existingRows = await withDataRowsRls([orgA.id], (tx) =>
    tx
      .select({ id: dataRows.id })
      .from(dataRows)
      .where(eq(dataRows.organizationId, orgA.id))
      .limit(1),
  );

  if (existingRows.length === 0) {
    await withDataRowsRls([orgA.id], (tx) =>
      tx.insert(dataRows).values(
        Array.from({ length: 500 }, (_, index) => ({
          organizationId: orgA.id,
          fieldOne: `row-${index + 1}-field-1`,
          fieldTwo: `row-${index + 1}-field-2`,
          fieldThree: `row-${index + 1}-field-3`,
        })),
      ),
    );
  }

  console.log("Seed complete: Organization A, Organization B, users, and 500 rows.");
}

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
