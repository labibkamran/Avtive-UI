import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { createOtpCode, generateOtpCode, logOtpCode } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email";
import { assertRateLimit } from "@/lib/rateLimit";
import { buildRedirectUrl } from "@/lib/redirects";
import { getUserByEmail } from "@/lib/users";

async function getRateLimitKey(email: string) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || headerStore.get("x-real-ip") || "unknown";

  return `${email}:${ip}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const emailValue = formData.get("email");
  const email = typeof emailValue === "string" ? emailValue.toLowerCase() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/login", {
        error: "Enter a valid email address.",
      }),
      { status: 303 },
    );
  }

  try {
    await assertRateLimit({
      action: "request-otp",
      key: await getRateLimitKey(email),
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
  } catch (error) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/login", {
        error: error instanceof Error ? error.message : "Try again later.",
      }),
      { status: 303 },
    );
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/login", {
        error: "No organization user exists for this email.",
      }),
      { status: 303 },
    );
  }

  const code = generateOtpCode();
  await createOtpCode({ code, email, userId: user.id });
  logOtpCode({ code, email: user.email });
  await sendOtpEmail({ code, to: user.email });

  return NextResponse.redirect(
    buildRedirectUrl(request.url, "/login", {
      email,
      sent: "1",
    }),
    { status: 303 },
  );
}
