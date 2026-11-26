import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  isTransactionalEmailConfigured,
  sendAdminPasswordResetEmail,
  SUPER_ADMIN_EMAIL,
} from "@/lib/email";

const RESET_TOKEN_LIFETIME_MS = 20 * 60 * 1000;
const REQUEST_COOLDOWN_MS = 5 * 60 * 1000;

function response(
  success: boolean,
  message: string,
  status = 200
) {
  return NextResponse.json(
    { success, message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return response(false, "Invalid request origin.", 403);
  }

  if (!isTransactionalEmailConfigured()) {
    return response(
      false,
      "Password recovery email is not configured. Please contact the site administrator.",
      503
    );
  }

  try {
    const appUrl = new URL(
      process.env.APP_URL || "https://eservice-web.vercel.app"
    );
    if (
      process.env.NODE_ENV === "production" &&
      appUrl.protocol !== "https:"
    ) {
      throw new Error("APP_URL must use HTTPS in production.");
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        passwordResetRequestedAt: true,
      },
    });

    if (
      !admin ||
      admin.role !== "SUPER_ADMIN" ||
      !admin.isActive
    ) {
      return response(
        true,
        "If the super administrator account is available, a reset link will be sent shortly.",
        202
      );
    }

    const now = new Date();
    if (
      admin.passwordResetRequestedAt &&
      now.getTime() - admin.passwordResetRequestedAt.getTime() <
        REQUEST_COOLDOWN_MS
    ) {
      return response(
        true,
        "If the super administrator account is available, a reset link will be sent shortly.",
        202
      );
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const resetRequested = await prisma.adminUser.updateMany({
      where: {
        id: admin.id,
        OR: [
          { passwordResetRequestedAt: null },
          {
            passwordResetRequestedAt: {
              lt: new Date(now.getTime() - REQUEST_COOLDOWN_MS),
            },
          },
        ],
      },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: new Date(
          now.getTime() + RESET_TOKEN_LIFETIME_MS
        ),
        passwordResetRequestedAt: now,
      },
    });

    if (resetRequested.count !== 1) {
      return response(
        true,
        "If the super administrator account is available, a reset link will be sent shortly.",
        202
      );
    }

    const resetUrl = new URL("/admin/reset-password", appUrl);
    resetUrl.hash = token;

    try {
      await sendAdminPasswordResetEmail(resetUrl.toString());
    } catch (error) {
      await prisma.adminUser.updateMany({
        where: {
          id: admin.id,
          passwordResetTokenHash: tokenHash,
        },
        data: {
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      });
      console.error("ADMIN_PASSWORD_RESET_EMAIL_ERROR:", error);
      return response(
        false,
        "The reset email could not be sent. Please try again later.",
        503
      );
    }

    return response(
      true,
      "If the super administrator account is available, a reset link will be sent shortly.",
      202
    );
  } catch (error) {
    console.error("ADMIN_PASSWORD_RESET_REQUEST_ERROR:", error);
    return response(
      false,
      "Unable to process the password reset request. Please try again later.",
      503
    );
  }
}
