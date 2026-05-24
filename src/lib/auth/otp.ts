import crypto from "node:crypto";

import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { otpCodes } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function logOtpCode(params: { code: string; email: string }) {
  if (getEnv().NODE_ENV === "production") {
    return;
  }

  console.info(`[OTP] ${params.email}: ${params.code}`);
}

export function hashOtpCode(code: string) {
  return crypto
    .createHmac("sha256", getEnv().SESSION_SECRET)
    .update(code)
    .digest("hex");
}

export async function createOtpCode(params: {
  code: string;
  email: string;
  userId: string;
}) {
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await getDb().insert(otpCodes).values({
    userId: params.userId,
    email: params.email,
    codeHash: hashOtpCode(params.code),
    expiresAt,
  });
}

export async function verifyOtpCode(params: { code: string; email: string }) {
  const [otp] = await getDb()
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, params.email),
        isNull(otpCodes.usedAt),
        gt(otpCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!otp) {
    return { ok: false, reason: "Invalid or expired code." } as const;
  }

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    return { ok: false, reason: "Too many code attempts." } as const;
  }

  const isMatch = otp.codeHash === hashOtpCode(params.code);

  if (!isMatch) {
    await getDb()
      .update(otpCodes)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(otpCodes.id, otp.id));

    return { ok: false, reason: "Invalid or expired code." } as const;
  }

  await getDb()
    .update(otpCodes)
    .set({ usedAt: new Date() })
    .where(eq(otpCodes.id, otp.id));

  return { ok: true, userId: otp.userId } as const;
}
