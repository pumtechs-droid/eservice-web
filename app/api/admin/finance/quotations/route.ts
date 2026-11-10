
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    // 1. Enforce same-origin requests.
    const origin = request.headers.get("origin");
    const requestUrl = new URL(request.url);

    if (origin !== requestUrl.origin) {
      return errorResponse("Invalid request origin.", 403);
    }

    // 2. Authenticate administrator.
    const session = await getAdminSession();

    if (!session) {
      return errorResponse("Authentication required.", 401);
    }

    // 3. Verify that the administrator is active.
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
      return errorResponse("Your administrator account is inactive.", 403);
    }

    // 4. Restrict financial quotation creation.
    if (
      currentAdmin.role !== "SUPER_ADMIN" &&
      currentAdmin.role !== "ADMIN"
    ) {
      return errorResponse(
        "You are not authorized to create quotations.",
        403
      );
    }

    // 5. Read submitted form data.
    const formData = await request.formData();

    const requestId = String(formData.get("requestId") ?? "").trim();
    const amountInput = String(formData.get("amount") ?? "").trim();
    const description = String(
      formData.get("description") ?? ""
    ).trim();
    const notesInput = String(formData.get("notes") ?? "").trim();
    const validUntilInput = String(
      formData.get("validUntil") ?? ""
    ).trim();

    // 6. Validate required fields.
    if (!requestId || !amountInput || !description) {
      return errorResponse(
        "Please provide the service request, amount and description.",
        400
      );
    }

    if (
      requestId.length > 128 ||
      !/^\d+(\.\d{1,2})?$/.test(amountInput)
    ) {
      return errorResponse("Invalid request ID or quotation amount.", 400);
    }

    const amount = Number(amountInput);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 9999999999.99
    ) {
      return errorResponse(
        "The quotation amount must be greater than zero and within the permitted limit.",
        400
      );
    }

    if (description.length > 5000) {
      return errorResponse(
        "The quotation description is too long.",
        400
      );
    }

    if (notesInput.length > 3000) {
      return errorResponse("Internal notes are too long.", 400);
    }

    // 7. Validate optional quotation expiry date.
    let validUntil: Date | null = null;

    if (validUntilInput) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(validUntilInput)) {
        return errorResponse("Invalid quotation validity date.", 400);
      }

      const parsedDate = new Date(
        `${validUntilInput}T23:59:59.999`
      );

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== validUntilInput
      ) {
        return errorResponse("Invalid quotation validity date.", 400);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (parsedDate < today) {
        return errorResponse(
          "The quotation validity date cannot be in the past.",
          400
        );
      }

      validUntil = parsedDate;
    }

    // 8. Confirm that the selected service request exists.
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
      },
    });

    if (!serviceRequest) {
      return errorResponse(
        "The selected customer service request could not be found.",
        404
      );
    }

    // 9. Generate a unique quotation number.
    const now = new Date();

    const datePart = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("");

    const quotationNumber = `ESH-Q-${datePart}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    // 10. Create the quotation as a draft.
    const quotation = await prisma.serviceQuotation.create({
      data: {
        quotationNumber,
        requestId: serviceRequest.id,
        amount: amount.toFixed(2),
        currency: "KES",
        description,
        notes: notesInput || null,
        validUntil,
        status: "DRAFT",
        createdById: currentAdmin.id,
      },
      select: {
        id: true,
        quotationNumber: true,
      },
    });

    // 11. Redirect to the quotations register.
    return NextResponse.redirect(
      new URL("/admin/finance/quotations?created=1", request.url),
      303
    );
  } catch (error) {
    console.error("QUOTATION CREATION ERROR:", error);

    return errorResponse(
      "Unable to create the quotation. Please try again.",
      500
    );
  }
}
