import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { notifySuperAdmin } from "@/lib/system-notifications";

const employmentTypes = [
  "FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY",
] as const;

const employmentStatuses = [
  "ACTIVE", "ON_LEAVE", "SUSPENDED", "INACTIVE",
] as const;

function reply(success: boolean, message: string, status: number, data?: object) {
  return NextResponse.json(
    { success, message, ...data },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return reply(false, "Invalid request origin.", 403);
    }

    const session = await getAdminSession();

    if (!session) {
      return reply(false, "Authentication required.", 401);
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
      select: { id: true, role: true, isActive: true },
    });

    if (!admin?.isActive) {
      return reply(false, "Administrator account unavailable.", 403);
    }

    if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") {
      return reply(false, "You are not authorised to register employees.", 403);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return reply(false, "Invalid JSON request.", 400);
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return reply(false, "Invalid employee information.", 400);
    }

    const data = body as Record<string, unknown>;

    const fullName = typeof data.fullName === "string"
      ? data.fullName.trim().replace(/\s+/g, " ") : "";

    const email = typeof data.email === "string"
      ? data.email.trim().toLowerCase() : "";

    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const alternatePhone = typeof data.alternatePhone === "string"
      ? data.alternatePhone.trim() : "";

    const jobTitle = typeof data.jobTitle === "string"
      ? data.jobTitle.trim() : "";

    const departmentId = typeof data.departmentId === "string"
      ? data.departmentId : "";

    const managerId = typeof data.managerId === "string"
      ? data.managerId : "";

    const notes = typeof data.notes === "string" ? data.notes.trim() : "";

    const employmentType = data.employmentType;
    const employmentStatus = data.employmentStatus;
    const joiningDateText = typeof data.joiningDate === "string"
      ? data.joiningDate : "";

    if (fullName.length < 2 || fullName.length > 100) {
      return reply(false, "Full name must contain 2–100 characters.", 400);
    }

    if (!phone || phone.length > 30) {
      return reply(false, "A valid phone number is required.", 400);
    }

    if (alternatePhone.length > 30) {
      return reply(false, "Alternative phone number is too long.", 400);
    }

    if (jobTitle.length < 2 || jobTitle.length > 100) {
      return reply(false, "Job title must contain 2–100 characters.", 400);
    }

    if (email.length > 254 ||
      (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return reply(false, "Enter a valid email address.", 400);
    }

    if (notes.length > 2000) {
      return reply(false, "Notes must not exceed 2,000 characters.", 400);
    }

    if (!departmentId) {
      return reply(false, "Select a department.", 400);
    }

    if (
      typeof employmentType !== "string" ||
      !employmentTypes.includes(employmentType as typeof employmentTypes[number])
    ) {
      return reply(false, "Invalid employment type.", 400);
    }

    if (
      typeof employmentStatus !== "string" ||
      !employmentStatuses.includes(employmentStatus as typeof employmentStatuses[number])
    ) {
      return reply(false, "Invalid employment status.", 400);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(joiningDateText)) {
      return reply(false, "Enter a valid joining date.", 400);
    }

    const joiningDate = new Date(`${joiningDateText}T00:00:00.000Z`);

    if (
      Number.isNaN(joiningDate.getTime()) ||
      joiningDate.toISOString().slice(0, 10) !== joiningDateText
    ) {
      return reply(false, "Enter a valid joining date.", 400);
    }

    const department = await prisma.department.findFirst({
      where: { id: departmentId, isActive: true },
      select: { id: true, name: true },
    });

    if (!department) {
      return reply(false, "Selected department is unavailable.", 400);
    }

    if (managerId) {
      const manager = await prisma.employee.findFirst({
        where: { id: managerId, employmentStatus: "ACTIVE" },
        select: { id: true },
      });

      if (!manager) {
        return reply(false, "Selected reporting manager is unavailable.", 400);
      }
    }

    const year = joiningDate.getUTCFullYear();
    const prefix = `ESH-${year}-`;

    // Retry if another registration claims the same sequence concurrently.
    for (let attempt = 0; attempt < 6; attempt++) {
      const latest = await prisma.employee.findFirst({
        where: { staffId: { startsWith: prefix } },
        orderBy: { staffId: "desc" },
        select: { staffId: true },
      });

      const latestNumber = latest
        ? Number(latest.staffId.slice(prefix.length))
        : 0;

      const nextNumber = Number.isFinite(latestNumber)
        ? latestNumber + 1 : 1;

      const staffId = `${prefix}${String(nextNumber).padStart(3, "0")}`;

      try {
        const employee = await prisma.$transaction(async (tx) => {
          const created = await tx.employee.create({
            data: {
              staffId,
              fullName,
              email: email || null,
              phone,
              alternatePhone: alternatePhone || null,
              jobTitle,
              employmentType: employmentType as typeof employmentTypes[number],
              employmentStatus: employmentStatus as typeof employmentStatuses[number],
              joiningDate,
              notes: notes || null,
              departmentId,
              managerId: managerId || null,
            },
            select: {
              id: true,
              staffId: true,
              fullName: true,
              email: true,
              phone: true,
              jobTitle: true,
              employmentStatus: true,
              joiningDate: true,
            },
          });

          await tx.employeeEmploymentHistory.create({
            data: {
              employeeId: created.id,
              changeType: "HIRED",
              effectiveAt: joiningDate,
              newValue: jobTitle,
              reason: "Initial employee registration",
              recordedById: admin.id,
            },
          });

          return created;
        });

        await notifySuperAdmin({
          eventType: "EMPLOYEE_REGISTERED",
          subject: `New employee registered: ${employee.fullName}`,
          details: {
            staffId: employee.staffId,
            employeeName: employee.fullName,
            jobTitle: employee.jobTitle,
            department: department.name,
            employmentStatus: employee.employmentStatus,
            employmentType,
            joiningDate: joiningDateText,
          },
        });

        return reply(
          true,
          "Employee registered successfully.",
          201,
          { employee }
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }

        throw error;
      }
    }

    return reply(
      false,
      "Unable to allocate a unique staff ID. Please try again.",
      409
    );
  } catch (error) {
    console.error("HR EMPLOYEE REGISTRATION ERROR:", error);

    return reply(
      false,
      "Unable to register employee. Please try again.",
      500
    );
  }
}

