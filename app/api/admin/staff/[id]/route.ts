
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

type StaffRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedRoles = ["ADMIN", "STAFF"] as const;

type EditableRole = (typeof allowedRoles)[number];

type UpdateData = {
  fullName?: string;
  email?: string;
  role?: EditableRole;
  isActive?: boolean;
};

function respond(
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

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: StaffRouteContext
) {
  try {
    // 1. Enforce same-origin requests.
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return respond(false, "Invalid request origin.", 403);
    }

    // 2. Authenticate the administrator.
    const session = await getAdminSession();

    if (!session) {
      return respond(false, "Authentication required.", 401);
    }

    // 3. Validate personnel identifier.
    const { id } = await params;

    if (!id || !isValidUuid(id)) {
      return respond(false, "Invalid personnel identifier.", 400);
    }

    // 4. Parse request body safely.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return respond(false, "Invalid request data.", 400);
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return respond(false, "Invalid personnel information.", 400);
    }

    const data = body as Record<string, unknown>;

    const allowedFields = [
      "fullName",
      "email",
      "role",
      "isActive",
    ];

    if (Object.keys(data).some((key) => !allowedFields.includes(key))) {
      return respond(
        false,
        "The request contains unsupported personnel fields.",
        400
      );
    }

    const hasFullName = Object.hasOwn(data, "fullName");
    const hasEmail = Object.hasOwn(data, "email");
    const hasRole = Object.hasOwn(data, "role");
    const hasIsActive = Object.hasOwn(data, "isActive");

    if (!hasFullName && !hasEmail && !hasRole && !hasIsActive) {
      return respond(
        false,
        "No personnel information was submitted for updating.",
        400
      );
    }

    // 5. Validate full name.
    const updateData: UpdateData = {};

    if (hasFullName) {
      if (typeof data.fullName !== "string") {
        return respond(false, "Invalid full name.", 400);
      }

      const fullName = data.fullName.trim().replace(/\s+/g, " ");

      if (fullName.length < 2 || fullName.length > 100) {
        return respond(
          false,
          "Full name must contain between 2 and 100 characters.",
          400
        );
      }

      updateData.fullName = fullName;
    }

    // 6. Validate email address.
    if (hasEmail) {
      if (typeof data.email !== "string") {
        return respond(false, "Invalid email address.", 400);
      }

      const email = data.email.trim().toLowerCase();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (email.length > 254 || !emailPattern.test(email)) {
        return respond(false, "Enter a valid email address.", 400);
      }

      updateData.email = email;
    }

    // 7. Validate role.
    if (hasRole) {
      if (
        typeof data.role !== "string" ||
        !allowedRoles.includes(data.role as EditableRole)
      ) {
        return respond(false, "Invalid personnel role.", 400);
      }

      updateData.role = data.role as EditableRole;
    }

    // 8. Validate account status.
    if (hasIsActive) {
      if (typeof data.isActive !== "boolean") {
        return respond(
          false,
          "Account status must be either active or inactive.",
          400
        );
      }

      updateData.isActive = data.isActive;
    }

    // 9. Perform permission checks and update in one
    // serializable transaction.
    const updatedPersonnel = await prisma.$transaction(
      async (transaction) => {
        // Always retrieve the administrator's current database role.
        const currentAdmin = await transaction.adminUser.findUnique({
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
          throw new Error("ADMIN_ACCOUNT_UNAVAILABLE");
        }

        if (
          currentAdmin.role !== "SUPER_ADMIN" &&
          currentAdmin.role !== "ADMIN"
        ) {
          throw new Error("PERSONNEL_PERMISSION_DENIED");
        }

        // Retrieve the target account inside the transaction.
        const existingPersonnel =
          await transaction.adminUser.findUnique({
            where: {
              id,
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              isActive: true,
            },
          });

        if (!existingPersonnel) {
          throw new Error("PERSONNEL_NOT_FOUND");
        }

        // ADMIN accounts may only manage STAFF accounts.
        if (
          currentAdmin.role === "ADMIN" &&
          existingPersonnel.role !== "STAFF"
        ) {
          throw new Error("HIGHER_LEVEL_ACCOUNT_RESTRICTED");
        }

        // ADMIN accounts may only update STAFF names and emails.
        if (
          currentAdmin.role === "ADMIN" &&
          (hasRole || hasIsActive)
        ) {
          throw new Error("ROLE_STATUS_PERMISSION_DENIED");
        }

        // Nobody can change their own role or activation status.
        if (
          currentAdmin.id === existingPersonnel.id &&
          (hasRole || hasIsActive)
        ) {
          throw new Error("SELF_ACCESS_CHANGE_DENIED");
        }

        // Protect the last active SUPER_ADMIN.
        // This covers demotion to either ADMIN or STAFF,
        // as well as deactivation.
       const isSuperAdminDemotion =
  existingPersonnel.role === "SUPER_ADMIN" &&
  existingPersonnel.isActive &&
  (
    updateData.role !== undefined ||
    updateData.isActive === false
  );

        if (isSuperAdminDemotion) {
          const activeSuperAdmins =
            await transaction.adminUser.count({
              where: {
                role: "SUPER_ADMIN",
                isActive: true,
              },
            });

          if (activeSuperAdmins <= 1) {
            throw new Error("LAST_ACTIVE_SUPER_ADMIN");
          }
        }

        // Update the account.
        return transaction.adminUser.update({
          where: {
            id: existingPersonnel.id,
          },
          data: updateData,
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return respond(
      true,
      "Personnel account updated successfully.",
      200,
      {
        administrator: updatedPersonnel,
      }
    );
  } catch (error) {
    // 10. Handle known permission and validation errors.
    if (error instanceof Error) {
      const errors: Record<
        string,
        { message: string; status: number }
      > = {
        ADMIN_ACCOUNT_UNAVAILABLE: {
          message: "Administrator account unavailable.",
          status: 403,
        },
        PERSONNEL_PERMISSION_DENIED: {
          message: "You are not authorised to manage personnel accounts.",
          status: 403,
        },
        PERSONNEL_NOT_FOUND: {
          message: "Personnel account not found.",
          status: 404,
        },
        HIGHER_LEVEL_ACCOUNT_RESTRICTED: {
          message: "Administrators may only manage STAFF accounts.",
          status: 403,
        },
        ROLE_STATUS_PERMISSION_DENIED: {
          message:
            "Only a SUPER ADMIN may change personnel roles or account status.",
          status: 403,
        },
        SELF_ACCESS_CHANGE_DENIED: {
          message: "You cannot change your own role or account status.",
          status: 403,
        },
        LAST_ACTIVE_SUPER_ADMIN: {
          message:
            "The last active SUPER ADMIN account cannot be deactivated or demoted.",
          status: 403,
        },
      };

      const knownError = errors[error.message];

      if (knownError) {
        return respond(
          false,
          knownError.message,
          knownError.status
        );
      }
    }

    // 11. Handle duplicate email.
    if (hasPrismaCode(error, "P2002")) {
      return respond(
        false,
        "This email address is already registered to another account.",
        409
      );
    }

    // 12. Handle concurrent transaction conflicts safely.
    if (hasPrismaCode(error, "P2034")) {
      return respond(
        false,
        "Another account update occurred simultaneously. Please refresh and try again.",
        409
      );
    }

    console.error("PERSONNEL ACCOUNT UPDATE ERROR:", error);

    return respond(
      false,
      "Unable to update the personnel account. Please try again.",
      500
    );
  }
}
