import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "esh_customer_session";
const PASSWORD_CHANGE_COOKIE_NAME = "esh_customer_password_change";
const SESSION_DURATION = 60 * 60 * 24 * 7;
const PASSWORD_CHANGE_DURATION = 60 * 15;

const secret = process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;

if (!secret || secret.length < 64) {
  throw new Error(
    "CUSTOMER_SESSION_SECRET or ADMIN_SESSION_SECRET must contain at least 64 characters."
  );
}

const secretKey = new TextEncoder().encode(secret);

export type CustomerSession = {
  id: string;
  email: string;
  fullName: string;
  accountUpdatedAt: number;
};

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

export async function createCustomerSession(customer: CustomerSession) {
  const token = await new SignJWT({
    email: customer.email,
    fullName: customer.fullName,
    accountUpdatedAt: customer.accountUpdatedAt,
    purpose: "session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customer.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);

  const cookieStore = await cookies();
  await clearCustomerPasswordChangeSession();
  cookieStore.set(COOKIE_NAME, token, cookieOptions(SESSION_DURATION));
}

export async function createCustomerPasswordChangeSession(
  customer: CustomerSession
) {
  const token = await new SignJWT({
    email: customer.email,
    fullName: customer.fullName,
    accountUpdatedAt: customer.accountUpdatedAt,
    purpose: "password-change",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customer.id)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretKey);

  const cookieStore = await cookies();
  await clearCustomerSession();
  cookieStore.set(
    PASSWORD_CHANGE_COOKIE_NAME,
    token,
    cookieOptions(PASSWORD_CHANGE_DURATION)
  );
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let payload;
  try {
    ({ payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    }));
  } catch {
    return null;
  }

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.fullName !== "string" ||
    typeof payload.accountUpdatedAt !== "number" ||
    !Number.isFinite(payload.accountUpdatedAt) ||
    payload.purpose !== "session"
  ) {
    return null;
  }

  const customer = await prisma.customer.findUnique({
    where: { id: payload.sub },
    select: {
      email: true,
      fullName: true,
      isActive: true,
      passwordChangeRequired: true,
      updatedAt: true,
    },
  });

  if (
    !customer ||
    !customer.isActive ||
    customer.passwordChangeRequired ||
    customer.email !== payload.email ||
    customer.fullName !== payload.fullName ||
    customer.updatedAt.getTime() !== payload.accountUpdatedAt
  ) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    fullName: payload.fullName,
    accountUpdatedAt: payload.accountUpdatedAt,
  };
}

export async function getCustomerPasswordChangeSession(): Promise<CustomerSession | null> {
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

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.fullName !== "string" ||
    typeof payload.accountUpdatedAt !== "number" ||
    !Number.isFinite(payload.accountUpdatedAt) ||
    payload.purpose !== "password-change"
  ) {
    return null;
  }

  const customer = await prisma.customer.findUnique({
    where: { id: payload.sub },
    select: {
      email: true,
      fullName: true,
      isActive: true,
      passwordChangeRequired: true,
      updatedAt: true,
    },
  });

  if (
    !customer ||
    !customer.isActive ||
    !customer.passwordChangeRequired ||
    customer.email !== payload.email ||
    customer.fullName !== payload.fullName ||
    customer.updatedAt.getTime() !== payload.accountUpdatedAt
  ) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    fullName: payload.fullName,
    accountUpdatedAt: payload.accountUpdatedAt,
  };
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", cookieOptions(0));
}

export async function clearCustomerPasswordChangeSession() {
  const cookieStore = await cookies();
  cookieStore.set(
    PASSWORD_CHANGE_COOKIE_NAME,
    "",
    cookieOptions(0)
  );
}
