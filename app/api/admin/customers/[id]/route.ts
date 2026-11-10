
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function respond(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // Require a valid same-origin browser request.
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return respond(
        {
          success: false,
          message: "Invalid request origin.",
        },
        403
      );
    }

    // Verify the authenticated administrator.
    const session = await getAdminSession();

    if (!session) {
      return respond(
        {
          success: false,
          message: "Authentication required.",
        },
        401
      );
    }

    // Always verify the current database account and role.
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
      return respond(
        {
          success: false,
          message: "Your administrator account is inactive.",
        },
        403
      );
    }

    if (
      currentAdmin.role !== "SUPER_ADMIN" &&
      currentAdmin.role !== "ADMIN"
    ) {
      return respond(
        {
          success: false,
          message: "You are not authorised to edit customers.",
        },
        403
      );
    }

    const { id } = await params;

    if (!id || id.length > 100) {
      return respond(
        {
          success: false,
          message: "Invalid customer identifier.",
        },
        400
      );
    }

    // Confirm the customer exists.
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingCustomer) {
      return respond(
        {
          success: false,
          message: "Customer record not found.",
        },
        404
      );
    }

    // Validate the submitted data.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return respond(
        {
          success: false,
          message: "Invalid request data.",
        },
        400
      );
    }

    if (!isPlainObject(body)) {
      return respond(
        {
          success: false,
          message: "Invalid customer information.",
        },
        400
      );
    }

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (
      fullName.length < 2 ||
      fullName.length > 120
    ) {
      return respond(
        {
          success: false,
          message: "Full name must contain between 2 and 120 characters.",
        },
        400
      );
    }

    if (
      phone.length < 7 ||
      phone.length > 30 ||
      !/^[0-9+\-()\s]+$/.test(phone)
    ) {
      return respond(
        {
          success: false,
          message: "Enter a valid customer phone number.",
        },
        400
      );
    }

    if (
      email.length > 254 ||
      (email !== "" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      return respond(
        {
          success: false,
          message: "Enter a valid email address.",
        },
        400
      );
    }

    // Update only the customer's contact information.
    const updatedCustomer = await prisma.customer.update({
      where: {
        id,
      },
      data: {
        fullName,
        phone,
        email: email || null,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return respond({
      success: true,
      message: "Customer information updated successfully.",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("CUSTOMER UPDATE ERROR:", error);

    return respond(
      {
        success: false,
        message: "Unable to update customer information.",
      },
      500
    );
  }
}
