import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

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
        { success: false, message: "Invalid password reset request." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;
    const token = typeof data.token === "string" ? data.token : "";
    const password =
      typeof data.password === "string" ? data.password : "";

    if (
      !/^[A-Za-z0-9_-]{43}$/.test(token) ||
      password.length < 12 ||
      password.length > 128
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The reset link is invalid or expired, or the password does not meet the requirements.",
        },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const admin = await prisma.adminUser.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: now },
        role: "SUPER_ADMIN",
        isActive: true,
      },
      select: { id: true, email: true, fullName: true },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "The reset link is invalid or expired." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await prisma.adminUser.updateMany({
      where: {
        id: admin.id,
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: now },
        role: "SUPER_ADMIN",
        isActive: true,
      },
      data: {
        passwordHash,
        passwordChangeRequired: false,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    if (updated.count !== 1) {
      return NextResponse.json(
        { success: false, message: "The reset link is invalid or expired." },
        { status: 400 }
      );
    }

    await notifySuperAdmin({
      eventType: "ADMIN_PASSWORD_RESET_COMPLETED",
      subject: "Super administrator password changed",
      details: {
        Administrator: admin.fullName,
        Email: admin.email,
        "Other sessions": "Invalidated",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password reset complete. Sign in with your new password.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("ADMIN_PASSWORD_RESET_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Unable to reset the password." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
