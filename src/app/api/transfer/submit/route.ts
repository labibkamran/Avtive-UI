import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  copyVisibleRowsToOrganization,
  getVisibleRowsForOrganization,
} from "@/lib/dataRows";
import { sendTransferNotificationEmail } from "@/lib/email";
import { getTransferRecipientOrganizations } from "@/lib/organizations";
import { assertRateLimit } from "@/lib/rateLimit";
import { buildRedirectUrl } from "@/lib/redirects";
import { createTransfer } from "@/lib/transfers";

export async function POST(request: Request) {
  const session = await getAuthenticatedUser();

  if (!session) {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/login"), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const messageValue = formData.get("message");
  const recipientOrganizationIdValue = formData.get("recipientOrganizationId");
  const message = typeof messageValue === "string" ? messageValue.trim() : "";
  const recipientOrganizationId =
    typeof recipientOrganizationIdValue === "string" ? recipientOrganizationIdValue : "";

  if (!message || message.length > 500 || !recipientOrganizationId) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/transfer", {
        error: "Select a recipient and enter a transfer message.",
      }),
      { status: 303 },
    );
  }

  try {
    await assertRateLimit({
      action: "transfer",
      key: session.id,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
  } catch (error) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/transfer", {
        error: error instanceof Error ? error.message : "Try again later.",
      }),
      { status: 303 },
    );
  }

  const recipients = await getTransferRecipientOrganizations(session.organizationId);
  const recipient = recipients.find(
    (organization) => organization.id === recipientOrganizationId,
  );

  if (!recipient) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/transfer", {
        error: "Select a valid recipient organization.",
      }),
      { status: 303 },
    );
  }

  const rows = await getVisibleRowsForOrganization(session.organizationId);

  if (rows.length === 0) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/transfer", {
        error: "There are no rows to transfer.",
      }),
      { status: 303 },
    );
  }

  const transfer = await createTransfer({
    createdByUserId: session.id,
    fromOrganizationId: session.organizationId,
    toOrganizationId: recipient.id,
    message,
    rowCount: rows.length,
  });

  await copyVisibleRowsToOrganization({
    fromOrganizationId: session.organizationId,
    toOrganizationId: recipient.id,
    transferId: transfer.id,
  });

  await sendTransferNotificationEmail({
    to: recipient.notificationEmail,
    senderOrgName: session.organizationName,
    message,
  });

  revalidatePath("/transfer");

  return NextResponse.redirect(
    buildRedirectUrl(request.url, "/transfer", {
      success: "Data transferred successfully.",
    }),
    { status: 303 },
  );
}
