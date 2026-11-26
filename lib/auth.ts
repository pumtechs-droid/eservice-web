
import "server-only";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "esh_admin_session";
const PASSWORD_CHANGE_COOKIE_NAME = "esh_admin_password_change";
const SESSION_DURATION = 60 * 60 * 8;
const PASSWORD_CHANGE_DURATION = 60 * 15;

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
  accountUpdatedAt: number;
};

export function matchesInitialAdminPassword(
  candidate: string,
  email: string,
  role: AdminRole
): boolean {
  const configuredPassword = process.env.INITIAL_ADMIN_PASSWORD;
  const configuredEmail =
    process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase() ||
    "aylatechs.hub@gmail.com";

  if (
    role !== "SUPER_ADMIN" ||
    email !== configuredEmail ||
    !configuredPassword ||
    configuredPassword.length < 12 ||
    configuredPassword.length > 128
  ) {
    return false;
  }

  const candidateBytes = Buffer.from(candidate, "utf8");
  const configuredPasswordBytes = Buffer.from(configuredPassword, "utf8");

  return (
    candidateBytes.length === configuredPasswordBytes.length &&
    timingSafeEqual(candidateBytes, configuredPasswordBytes)
  );
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
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
    accountUpdatedAt: admin.accountUpdatedAt,
    purpose: "session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);

  const cookieStore = await cookies();

  await clearAdminPasswordChangeSession();
  cookieStore.set(COOKIE_NAME, token, cookieOptions(SESSION_DURATION));
}

export async function createAdminPasswordChangeSession(
  admin: AdminSession
): Promise<void> {
  const token = await new SignJWT({
    email: admin.email,
    role: admin.role,
    accountUpdatedAt: admin.accountUpdatedAt,
    purpose: "password-change",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretKey);

  const cookieStore = await cookies();
  await clearAdminSession();
  cookieStore.set(
    PASSWORD_CHANGE_COOKIE_NAME,
    token,
    cookieOptions(PASSWORD_CHANGE_DURATION)
  );
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    }));
  } catch {
    return null;
  }

  const validRoles: AdminRole[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "STAFF",
  ];

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string" ||
    !validRoles.includes(payload.role as AdminRole) ||
    typeof payload.accountUpdatedAt !== "number" ||
    !Number.isFinite(payload.accountUpdatedAt) ||
    payload.purpose !== "session"
  ) {
    return null;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: {
      email: true,
      role: true,
      isActive: true,
      passwordChangeRequired: true,
      updatedAt: true,
    },
  });

  if (
    !admin ||
    !admin.isActive ||
    admin.passwordChangeRequired ||
    admin.email !== payload.email ||
    admin.role !== payload.role ||
    admin.updatedAt.getTime() !== payload.accountUpdatedAt
  ) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role as AdminRole,
    accountUpdatedAt: payload.accountUpdatedAt,
  };
}

export async function getAdminPasswordChangeSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PASSWORD_CHANGE_COOKIE_NAME)?.value;
  if (!token) return null;

  let payload;
  try {
    ({ payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    }));
  } catch {
    return null;
  }

  const validRoles: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "STAFF"];
  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string" ||
    !validRoles.includes(payload.role as AdminRole) ||
    typeof payload.accountUpdatedAt !== "number" ||
    !Number.isFinite(payload.accountUpdatedAt) ||
    payload.purpose !== "password-change"
  ) {
    return null;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: {
      email: true,
      role: true,
      isActive: true,
      passwordChangeRequired: true,
      updatedAt: true,
    },
  });

  if (
    !admin ||
    !admin.isActive ||
    !admin.passwordChangeRequired ||
    admin.email !== payload.email ||
    admin.role !== payload.role ||
    admin.updatedAt.getTime() !== payload.accountUpdatedAt
  ) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role as AdminRole,
    accountUpdatedAt: payload.accountUpdatedAt,
  };
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    ...cookieOptions(0),
    maxAge: 0,
  });
}

export async function clearAdminPasswordChangeSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PASSWORD_CHANGE_COOKIE_NAME, "", {
    ...cookieOptions(0),
    maxAge: 0,
  });
}
