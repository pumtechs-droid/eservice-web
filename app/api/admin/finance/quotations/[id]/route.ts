
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    // 1. Validate request origin.
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

    // 3. Verify active administrator account.
    const admin = await prisma.adminUser.findUnique({
      where: {
        id: session.id,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      return errorResponse(
        "Your administrator account is inactive.",
        403
      );
    }

    // 4. Restrict quotation editing.
    if (
      admin.role !== "SUPER_ADMIN" &&
      admin.role !== "ADMIN"
    ) {
      return errorResponse(
        "You are not authorized to edit quotations.",
        403
      );
    }

    // 5. Confirm quotation exists and is still a draft.
    const existingQuotation =
      await prisma.serviceQuotation.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
        },
      });

    if (!existingQuotation) {
      return errorResponse("Quotation not found.", 404);
    }

    if (existingQuotation.status !== "DRAFT") {
      return errorResponse(
        "Only draft quotations can be edited.",
        409
      );
    }

    // 6. Read submitted form data.
    const formData = await request.formData();

    const amountInput = String(
      formData.get("amount") ?? ""
    ).trim();

    const description = String(
      formData.get("description") ?? ""
    ).trim();

    const notesInput = String(
      formData.get("notes") ?? ""
    ).trim();

    const validUntilInput = String(
      formData.get("validUntil") ?? ""
    ).trim();

    // 7. Validate required fields.
    if (
      !amountInput ||
      !description
    ) {
      return errorResponse(
        "Amount and description are required.",
        400
      );
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amountInput)) {
      return errorResponse(
        "Please enter a valid quotation amount.",
        400
      );
    }

    const amount = Number(amountInput);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 9999999999.99
    ) {
      return errorResponse(
        "The quotation amount is outside the permitted range.",
        400
      );
    }

    if (description.length > 5000) {
      return errorResponse(
        "The description is too long.",
        400
      );
    }

    if (notesInput.length > 3000) {
      return errorResponse(
        "Internal notes are too long.",
        400
      );
    }

    // 8. Validate optional validity date.
    let validUntil: Date | null = null;

    if (validUntilInput) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(validUntilInput)) {
        return errorResponse(
          "Invalid quotation validity date.",
          400
        );
      }

      const parsedDate = new Date(
        `${validUntilInput}T23:59:59.999`
      );

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== validUntilInput
      ) {
        return errorResponse(
          "Invalid quotation validity date.",
          400
        );
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (parsedDate < today) {
        return errorResponse(
          "The validity date cannot be in the past.",
          400
        );
      }

      validUntil = parsedDate;
    }

    // 9. Update only if the quotation remains a draft.
    const result = await prisma.serviceQuotation.updateMany({
      where: {
        id,
        status: "DRAFT",
      },
      data: {
        amount: amount.toFixed(2),
        description,
        notes: notesInput || null,
        validUntil,
      },
    });

    if (result.count !== 1) {
      return errorResponse(
        "The quotation could not be updated. It may no longer be a draft.",
        409
      );
    }

    // 10. Redirect to updated quotation.
    return NextResponse.redirect(
      new URL(
        `/admin/finance/quotations/${id}?updated=1`,
        request.url
      ),
      303
    );
  } catch (error) {
    console.error("QUOTATION UPDATE ERROR:", error);

    return errorResponse(
      "Unable to update the quotation. Please try again.",
      500
    );
  }
}
