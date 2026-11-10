
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

const allowedRoles = ["ADMIN", "STAFF"] as const;

type NewStaffRole = (typeof allowedRoles)[number];

function jsonResponse(
  success: boolean,
  message: string,
  status: number,
  data?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success,
      message,
      ...data,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request origin.
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return jsonResponse(
        false,
        "Invalid request origin.",
        403
      );
    }

    // 2. Authenticate the current administrator.
    const session = await getAdminSession();

    if (!session) {
      return jsonResponse(
        false,
        "Authentication required. Please sign in.",
        401
      );
    }

    // 3. Verify current account status and permissions.
    const currentAdmin = await prisma.adminUser.findUnique({
      where: {
        id: session.id,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!currentAdmin || !currentAdmin.isActive) {
      return jsonResponse(
        false,
        "Administrator account unavailable.",
        403
      );
    }

    if (
      currentAdmin.role !== "SUPER_ADMIN" &&
      currentAdmin.role !== "ADMIN"
    ) {
      return jsonResponse(
        false,
        "You are not authorised to create personnel accounts.",
        403
      );
    }

    // 4. Parse submitted information.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        false,
        "Invalid request data. Please submit valid JSON.",
        400
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return jsonResponse(
        false,
        "Invalid account information.",
        400
      );
    }

    const data = body as Record<string, unknown>;

    const fullName =
      typeof data.fullName === "string"
        ? data.fullName.trim().replace(/\s+/g, " ")
        : "";

    const email =
      typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";

    const password =
      typeof data.password === "string"
        ? data.password
        : "";

    const role = data.role;

    // 5. Validate full name.
    if (fullName.length < 2 || fullName.length > 100) {
      return jsonResponse(
        false,
        "Full name must contain between 2 and 100 characters.",
        400
      );
    }

    // 6. Validate email address.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      email.length > 254 ||
      !emailPattern.test(email)
    ) {
      return jsonResponse(
        false,
        "Enter a valid email address.",
        400
      );
    }

    // 7. Validate password.
    if (password.length < 12 || password.length > 128) {
      return jsonResponse(
        false,
        "Password must contain between 12 and 128 characters.",
        400
      );
    }

    // 8. Validate account role.
    if (
      typeof role !== "string" ||
      !allowedRoles.includes(role as NewStaffRole)
    ) {
      return jsonResponse(
        false,
        "Invalid account role selected.",
        400
      );
    }

    const selectedRole = role as NewStaffRole;

    // 9. Enforce role hierarchy.
    // ADMIN users may only create STAFF accounts.
    if (
      currentAdmin.role === "ADMIN" &&
      selectedRole !== "STAFF"
    ) {
      return jsonResponse(
        false,
        "Administrators may only create STAFF accounts.",
        403
      );
    }

    // SUPER_ADMIN may create ADMIN and STAFF accounts.
    // No account can be created with SUPER_ADMIN privileges here.

    // 10. Check for an existing email address.
    const existingAdmin = await prisma.adminUser.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingAdmin) {
      return jsonResponse(
        false,
        "An account with this email address already exists.",
        409
      );
    }

    // 11. Securely hash the password.
    const passwordHash = await bcrypt.hash(password, 12);

    // 12. Create the personnel account.
    const newAdmin = await prisma.adminUser.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: selectedRole,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // 13. Return successful creation response.
    return jsonResponse(
      true,
      "Personnel account created successfully.",
      201,
      {
        administrator: newAdmin,
      }
    );

  } catch (error) {
    // 14. Handle duplicate email race conditions.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonResponse(
        false,
        "An account with this email address already exists.",
        409
      );
    }

    // 15. Log unexpected server errors.
    console.error(
      "STAFF ACCOUNT CREATION ERROR:",
      error
    );

    return jsonResponse(
      false,
      "Unable to create the personnel account. Please try again.",
      500
    );
  }
}
