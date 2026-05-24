import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { verifyOtpCode } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { assertRateLimit } from "@/lib/rateLimit";
import { buildRedirectUrl } from "@/lib/redirects";
import { getUserById } from "@/lib/users";

async function getRateLimitKey(email: string) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || headerStore.get("x-real-ip") || "unknown";

  return `${email}:${ip}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const emailValue = formData.get("email");
  const codeValue = formData.get("code");
  const email = typeof emailValue === "string" ? emailValue.toLowerCase() : "";
  const code = typeof codeValue === "string" ? codeValue : "";

  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/login", {
        error: "Enter the 6 digit code.",
        sent: "1",
      }),
      { status: 303 },
    );
  }

  try {
    await assertRateLimit({
      action: "verify-otp",
      key: await getRateLimitKey(email),
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
  } catch (error) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/login", {
        email,
        error: error instanceof Error ? error.message : "Try again later.",
        sent: "1",
      }),
      { status: 303 },
    );
  }

  const result = await verifyOtpCode({ code, email });

  if (!result.ok) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/login", {
        email,
        error: result.reason,
        sent: "1",
      }),
      { status: 303 },
    );
  }

  const user = await getUserById(result.userId);

  if (!user) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/login", {
        error: "Unable to create session.",
      }),
      { status: 303 },
    );
  }

  await createSession(user);

  return NextResponse.redirect(buildRedirectUrl(request.url, "/transfer"), {
    status: 303,
  });
}
