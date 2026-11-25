import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "esh_customer_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

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
};

export async function createCustomerSession(customer: CustomerSession) {
  const token = await new SignJWT({
    email: customer.email,
    fullName: customer.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customer.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.fullName !== "string"
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
    };
  } catch {
    return null;
  }
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
