import { transfers } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function createTransfer(params: {
  createdByUserId: string;
  fromOrganizationId: string;
  message: string;
  rowCount: number;
  toOrganizationId: string;
}) {
  const [transfer] = await getDb()
    .insert(transfers)
    .values(params)
    .returning();

  return transfer;
}
