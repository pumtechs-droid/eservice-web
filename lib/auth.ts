
import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "esh_admin_session";
const SESSION_DURATION = 60 * 60 * 8;

const secret = process.env.ADMIN_SESSION_SECRET;

if (!secret || secret.length < 64) {
  throw new Error(
    "ADMIN_SESSION_SECRET must contain at least 64 characters."
  );
}

const secretKey = new TextEncoder().encode(secret);

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

export type AdminSession = {
  id: string;
  email: string;
  role: AdminRole;
};

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_DURATION,
    ...(process.env.AUTH_COOKIE_DOMAIN
      ? { domain: process.env.AUTH_COOKIE_DOMAIN }
      : {}),
  };
}

export async function createAdminSession(
  admin: AdminSession
): Promise<void> {
  const token = await new SignJWT({
    email: admin.email,
    role: admin.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, cookieOptions());
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    const validRoles: AdminRole[] = [
      "SUPER_ADMIN",
      "ADMIN",
      "STAFF",
    ];

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      !validRoles.includes(payload.role as AdminRole)
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
}
