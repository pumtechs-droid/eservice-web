
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

const allowedStatuses = [
  "NEW",
  "UNDER_REVIEW",
  "QUOTED",
  "AWAITING_PAYMENT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

type AllowedStatus = (typeof allowedStatuses)[number];

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getAuthorizedAdmin() {
  const session = await getAdminSession();

  if (!session) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive) return null;

  return admin;
}

// GET: Retrieve the activity history for a request.
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const admin = await getAuthorizedAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Administrator access required." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const requestExists = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!requestExists) {
      return NextResponse.json(
        { success: false, message: "Service request not found." },
        { status: 404 }
      );
    }

    const activities = await prisma.requestActivity.findMany({
      where: { requestId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        fromStatus: true,
        toStatus: true,
        note: true,
        createdAt: true,
        admin: {
          select: {
            fullName: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, activities },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to retrieve request activity." },
      { status: 500 }
    );
  }
}

// POST: Change request status or add an internal note.
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // Protect the endpoint against cross-origin requests.
    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const admin = await getAuthorizedAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Administrator access required." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

    // STATUS CHANGE
    if (body.action === "STATUS_CHANGE") {
      const newStatus = body.status as AllowedStatus;

      if (
        typeof body.status !== "string" ||
        !allowedStatuses.includes(newStatus)
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid request status." },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.serviceRequest.findUnique({
          where: { id },
          select: { id: true, status: true },
        });

        if (!existing) return { notFound: true as const };

        if (existing.status === newStatus) {
          return {
            unchanged: true as const,
            status: existing.status,
          };
        }

        const updated = await tx.serviceRequest.update({
          where: { id },
          data: { status: newStatus },
          select: { status: true },
        });

        await tx.requestActivity.create({
          data: {
            requestId: id,
            adminId: admin.id,
            type: "STATUS_CHANGE",
            fromStatus: existing.status,
            toStatus: newStatus,
          },
        });

        return {
          updated: true as const,
          status: updated.status,
        };
      });

      if ("notFound" in result) {
        return NextResponse.json(
          { success: false, message: "Service request not found." },
          { status: 404 }
        );
      }

      if ("unchanged" in result) {
        return NextResponse.json({
          success: true,
          message: "The request already has this status.",
          status: result.status,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Request status updated successfully.",
        status: result.status,
      });
    }

    // INTERNAL NOTE
    if (body.action === "INTERNAL_NOTE") {
      const note =
        typeof body.note === "string" ? body.note.trim() : "";

      if (!note || note.length > 2000) {
        return NextResponse.json(
          {
            success: false,
            message: "Internal notes must contain 1–2000 characters.",
          },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.serviceRequest.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!existing) return false;

        await tx.requestActivity.create({
          data: {
            requestId: id,
            adminId: admin.id,
            type: "INTERNAL_NOTE",
            note,
          },
        });

        return true;
      });

      if (!result) {
        return NextResponse.json(
          { success: false, message: "Service request not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Internal note saved successfully.",
      });
    }

    return NextResponse.json(
      { success: false, message: "Unsupported activity action." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to process request activity." },
      { status: 500 }
    );
  }
}
