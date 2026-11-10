
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function redirectToQuotation(
  request: NextRequest,
  id: string,
  result: string
) {
  return NextResponse.redirect(
    new URL(
      `/admin/finance/quotations/${id}?${result}=1`,
      request.url
    ),
    303
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    // SECURITY: Verify the request origin.
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    // SECURITY: Authenticate the administrator.
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.redirect(
        new URL("/admin/login", request.url),
        303
      );
    }

    // SECURITY: Verify administrator account and permissions.
    const admin = await prisma.adminUser.findUnique({
      where: {
        id: session.id,
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      return NextResponse.redirect(
        new URL("/admin/login", request.url),
        303
      );
    }

    if (
      admin.role !== "SUPER_ADMIN" &&
      admin.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error: "You are not authorized to send quotations.",
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // SECURITY: Only existing draft quotations can be sent.
    const quotation = await prisma.serviceQuotation.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        validUntil: true,
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found." },
        { status: 404 }
      );
    }

    if (quotation.status !== "DRAFT") {
      return redirectToQuotation(
        request,
        id,
        "sendError"
      );
    }

    // Do not send expired quotations.
    if (
      quotation.validUntil &&
      quotation.validUntil.getTime() < Date.now()
    ) {
      return redirectToQuotation(
        request,
        id,
        "sendError"
      );
    }

    // Atomically update the quotation.
    const result = await prisma.serviceQuotation.updateMany({
      where: {
        id,
        status: "DRAFT",
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentById: admin.id,
        sentByName: admin.fullName,
      },
    });

    if (result.count !== 1) {
      return redirectToQuotation(
        request,
        id,
        "sendError"
      );
    }

    return redirectToQuotation(
      request,
      id,
      "sent"
    );
  } catch (error) {
    console.error("SEND_QUOTATION_ERROR:", error);

    const debugError =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : String(error);

    return NextResponse.json(
      {
        error: "Quotation sending failed.",
        debug: debugError,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
