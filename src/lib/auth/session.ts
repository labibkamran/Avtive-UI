import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getEnv } from "@/lib/env";
import { getUserById } from "@/lib/users";

const SESSION_COOKIE_NAME = "secure-data-session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type SessionUser = {
  email: string;
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
};

function getSessionSecret() {
  return new TextEncoder().encode(getEnv().SESSION_SECRET);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecret());

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const user = payload.user as SessionUser | undefined;

    if (!user?.id) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await getUserById(session.id);

  return user ?? null;
}

export async function requireSession() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
