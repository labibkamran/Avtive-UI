import crypto from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { dataRows } from "@/db/schema";
import { withDataRowsRls } from "@/lib/db";

export async function getVisibleRowsForOrganization(organizationId: string) {
  return withDataRowsRls([organizationId], (tx) =>
    tx
      .select()
      .from(dataRows)
      .where(and(eq(dataRows.organizationId, organizationId), isNull(dataRows.deletedAt)))
      .orderBy(dataRows.createdAt),
  );
}

export async function addUnlistedRow(organizationId: string) {
  const [row] = await withDataRowsRls([organizationId], (tx) =>
    tx
      .insert(dataRows)
      .values({
        organizationId,
        fieldOne: "unlisted",
        fieldTwo: "unlisted",
        fieldThree: "unlisted",
      })
      .returning(),
  );

  return row;
}

export async function softDeleteRow(rowId: string, organizationId: string) {
  const [row] = await withDataRowsRls([organizationId], (tx) =>
    tx
      .update(dataRows)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(dataRows.id, rowId),
          eq(dataRows.organizationId, organizationId),
          isNull(dataRows.deletedAt),
        ),
      )
      .returning(),
  );

  return row ?? null;
}

export async function copyVisibleRowsToOrganization(params: {
  fromOrganizationId: string;
  toOrganizationId: string;
  transferId: string;
}) {
  return withDataRowsRls(
    [params.fromOrganizationId, params.toOrganizationId],
    async (tx) => {
      const rows = await tx
        .select()
        .from(dataRows)
        .where(
          and(
            eq(dataRows.organizationId, params.fromOrganizationId),
            isNull(dataRows.deletedAt),
          ),
        )
        .orderBy(dataRows.createdAt);

      if (rows.length === 0) {
        return [];
      }

      return tx
        .insert(dataRows)
        .values(
          rows.map((row) => ({
            organizationId: params.toOrganizationId,
            fieldOne: row.fieldOne,
            fieldTwo: row.fieldTwo,
            fieldThree: row.fieldThree,
            sourceTransferId: params.transferId,
          })),
        )
        .returning();
    },
  );
}

export async function seedRandomRowsForOrganization(params: {
  count: number;
  organizationId: string;
}) {
  const values = Array.from({ length: params.count }, (_, index) => ({
    organizationId: params.organizationId,
    fieldOne: `record-${index + 1}-${crypto.randomUUID().slice(0, 8)}`,
    fieldTwo: `value-${Math.floor(Math.random() * 100000)}`,
    fieldThree: `status-${["active", "pending", "review"][index % 3]}`,
  }));

  return withDataRowsRls([params.organizationId], (tx) =>
    tx.insert(dataRows).values(values).returning(),
  );
}
