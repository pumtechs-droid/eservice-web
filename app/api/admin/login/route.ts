
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/auth";
import { notifySuperAdmin } from "@/lib/system-notifications";
import { createHash } from "node:crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    if (email.length > 254 || password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid login details.",
        },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      await notifySuperAdmin({
        eventType: "ADMIN_LOGIN_FAILED",
        subject: "Unsuccessful administrator sign-in",
        details: { "Attempted email": email },
        dedupeKey: `admin-login-failed:${createHash("sha256")
          .update(email)
          .digest("hex")}:${Math.floor(Date.now() / 900_000)}`,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    if (!passwordMatches) {
      await notifySuperAdmin({
        eventType: "ADMIN_LOGIN_FAILED",
        subject: "Unsuccessful administrator sign-in",
        details: { "Attempted email": email },
        dedupeKey: `admin-login-failed:${createHash("sha256")
          .update(email)
          .digest("hex")}:${Math.floor(Date.now() / 900_000)}`,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const updatedAdmin = await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
      select: { updatedAt: true },
    });

    await createAdminSession({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      accountUpdatedAt: updatedAdmin.updatedAt.getTime(),
    });

    await notifySuperAdmin({
      eventType: "ADMIN_LOGIN_SUCCEEDED",
      subject: "Administrator signed in",
      details: {
        Administrator: admin.fullName,
        Email: admin.email,
        Role: admin.role,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        admin: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("ADMIN_LOGIN_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process login. Please try again.",
      },
      { status: 500 }
    );
  }
}
