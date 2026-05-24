import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { addUnlistedRow } from "@/lib/dataRows";
import { buildRedirectUrl } from "@/lib/redirects";

export async function POST(request: Request) {
  const session = await getAuthenticatedUser();

  if (!session) {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/login"), {
      status: 303,
    });
  }

  await addUnlistedRow(session.organizationId);
  revalidatePath("/transfer");

  return NextResponse.redirect(buildRedirectUrl(request.url, "/transfer"), {
    status: 303,
  });
}
