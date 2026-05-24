import { NextResponse } from "next/server";

import { clearSession } from "@/lib/auth/session";
import { buildRedirectUrl } from "@/lib/redirects";

export async function POST(request: Request) {
  await clearSession();

  return NextResponse.redirect(buildRedirectUrl(request.url, "/login"), {
    status: 303,
  });
}
