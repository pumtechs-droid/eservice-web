import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const requests = await prisma.serviceRequest.findMany({
      where: { customerId: session.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reference: true,
        service: true,
        status: true,
      },
    });

    return NextResponse.json(
      { success: true, requests },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("CUSTOMER_REQUESTS_ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Customer data is temporarily unavailable. Please try again shortly.",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
