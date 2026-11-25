import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }
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
  return NextResponse.json({ success: true, requests });
}
