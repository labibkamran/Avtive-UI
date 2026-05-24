import crypto from "node:crypto";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { createOtpCode, generateOtpCode, logOtpCode } from "@/lib/auth/otp";
import { seedRandomRowsForOrganization } from "@/lib/dataRows";
import { sendOtpEmail } from "@/lib/email";
import { createOrganization, getOrganizationBySlug } from "@/lib/organizations";
import { assertRateLimit } from "@/lib/rateLimit";
import { buildRedirectUrl } from "@/lib/redirects";
import { createSlug } from "@/lib/slug";
import { createUser, getUserByEmail } from "@/lib/users";

async function getRateLimitKey(email: string) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || headerStore.get("x-real-ip") || "unknown";

  return `${email}:${ip}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const emailValue = formData.get("email");
  const nameValue = formData.get("name");
  const organizationNameValue = formData.get("organizationName");
  const seedDataValue = formData.get("seedData");
  const email = typeof emailValue === "string" ? emailValue.toLowerCase() : "";
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const organizationName =
    typeof organizationNameValue === "string" ? organizationNameValue.trim() : "";
  const seedData = seedDataValue === "on";

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    name.length < 2 ||
    name.length > 80 ||
    organizationName.length < 2 ||
    organizationName.length > 100
  ) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/onboard", {
        error: "Enter valid onboarding details.",
      }),
      { status: 303 },
    );
  }

  try {
    await assertRateLimit({
      action: "onboard",
      key: await getRateLimitKey(email),
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
  } catch (error) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/onboard", {
        error: error instanceof Error ? error.message : "Try again later.",
      }),
      { status: 303 },
    );
  }

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/onboard", {
        error: "A user already exists for this email.",
      }),
      { status: 303 },
    );
  }

  const baseSlug = createSlug(organizationName);

  if (!baseSlug) {
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/onboard", {
        error: "Organization name must contain letters or numbers.",
      }),
      { status: 303 },
    );
  }

  let slug = baseSlug;
  const existingOrganization = await getOrganizationBySlug(slug);

  if (existingOrganization) {
    slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  }

  const organization = await createOrganization({
    name: organizationName,
    slug,
    notificationEmail: email,
  });

  const user = await createUser({
    email,
    name,
    organizationId: organization.id,
  });

  if (seedData) {
    await seedRandomRowsForOrganization({
      organizationId: organization.id,
      count: 500,
    });
  }

  const code = generateOtpCode();
  await createOtpCode({ code, email, userId: user.id });
  logOtpCode({ code, email });
  await sendOtpEmail({ code, to: email });

  return NextResponse.redirect(
    buildRedirectUrl(request.url, "/login", {
      email,
      sent: "1",
      success: "Organization onboarded. Enter the OTP sent to your email.",
    }),
    { status: 303 },
  );
}
