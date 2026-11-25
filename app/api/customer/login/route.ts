import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createCustomerSession } from "@/lib/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (
      !customer ||
      !customer.passwordHash ||
      !customer.isActive
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const matches = await bcrypt.compare(password, customer.passwordHash);
    if (!matches) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    await createCustomerSession({
      id: customer.id,
      email: customer.email!,
      fullName: customer.fullName,
    });

    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json(
      { success: true, message: "Signed in successfully." },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("CUSTOMER_LOGIN_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Unable to sign in." },
      { status: 500 }
    );
  }
}
