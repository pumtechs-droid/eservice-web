import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createCustomerSession } from "@/lib/customer-auth";
import { notifySuperAdmin } from "@/lib/system-notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (fullName.length < 2 || fullName.length > 120) {
      return NextResponse.json({ success: false, message: "Enter a valid full name." }, { status: 400 });
    }
    if (!/^[+0-9()\s-]+$/.test(phone) || phone.length > 20) {
      return NextResponse.json({ success: false, message: "Enter a valid phone number." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ success: false, message: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 10 || password.length > 128) {
      return NextResponse.json({ success: false, message: "Password must contain at least 10 characters." }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      if (existing.passwordHash) {
        return NextResponse.json({ success: false, message: "An account already exists for this email." }, { status: 409 });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const customer = await prisma.customer.update({
        where: { id: existing.id },
        data: { fullName, phone, passwordHash, isActive: true },
      });
      await createCustomerSession({ id: customer.id, email: customer.email!, fullName: customer.fullName });
      await notifySuperAdmin({
        eventType: "CUSTOMER_ACCOUNT_CREATED",
        subject: "Customer portal account created",
        details: { Customer: customer.fullName, Email: customer.email! },
      });
      return NextResponse.json({ success: true, message: "Account created." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const customer = await prisma.customer.create({
      data: { fullName, phone, email, passwordHash, isActive: true },
    });
    await createCustomerSession({ id: customer.id, email: customer.email!, fullName: customer.fullName });
    await notifySuperAdmin({
      eventType: "CUSTOMER_ACCOUNT_CREATED",
      subject: "Customer portal account created",
      details: { Customer: customer.fullName, Email: customer.email! },
    });
    return NextResponse.json({ success: true, message: "Account created." }, { status: 201 });
  } catch (error) {
    console.error("CUSTOMER_REGISTER_ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Customer registration is temporarily unavailable. Please try again shortly.",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
