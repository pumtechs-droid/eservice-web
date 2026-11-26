import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import {
  createCustomerSession,
  getCustomerPasswordChangeSession,
} from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { notifySuperAdmin } from "@/lib/system-notifications";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json(
      { success: false, message: "Invalid request origin." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid password change request." },
        { status: 400 }
      );
    }

    const password = (body as Record<string, unknown>).password;
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain between 8 and 128 characters.",
        },
        { status: 400 }
      );
    }

    const session = await getCustomerPasswordChangeSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Your sign-in has expired. Please sign in again.",
        },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const currentCustomer = await prisma.customer.findUnique({
      where: { id: session.id },
      select: { passwordHash: true },
    });

    if (!currentCustomer?.passwordHash) {
      return NextResponse.json(
        { success: false, message: "Customer account unavailable." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (await bcrypt.compare(password, currentCustomer.passwordHash)) {
      return NextResponse.json(
        {
          success: false,
          message: "Choose a password different from your temporary password.",
        },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await prisma.customer.updateMany({
      where: {
        id: session.id,
        isActive: true,
        passwordChangeRequired: true,
        updatedAt: new Date(session.accountUpdatedAt),
      },
      data: {
        passwordHash,
        passwordChangeRequired: false,
      },
    });

    if (updated.count !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: "This password change session is no longer valid. Sign in again.",
        },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        updatedAt: true,
      },
    });

    if (!customer || !customer.email) {
      return NextResponse.json(
        { success: false, message: "Customer account unavailable." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    await createCustomerSession({
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      accountUpdatedAt: customer.updatedAt.getTime(),
    });

    await notifySuperAdmin({
      eventType: "CUSTOMER_PASSWORD_CHANGED",
      subject: "Customer portal password changed",
      details: {
        Customer: customer.fullName,
        Email: customer.email,
        "Other sessions": "Invalidated",
      },
    });

    return NextResponse.json(
      { success: true, message: "Password updated successfully." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("CUSTOMER_PASSWORD_CHANGE_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Unable to update your password." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
