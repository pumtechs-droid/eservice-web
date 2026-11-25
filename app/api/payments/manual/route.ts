import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";

export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const amount = Number(body.amount);
  const method = body.method === "MPESA" ? "MPESA" : body.method === "BANK_TRANSFER" ? "BANK_TRANSFER" : "OTHER";
  const transactionReference = typeof body.transactionReference === "string" ? body.transactionReference.trim() : "";

  if (!requestId || !Number.isFinite(amount) || amount < 1) {
    return NextResponse.json({ success: false, message: "Valid request and amount are required." }, { status: 400 });
  }
  if (method !== "BANK_TRANSFER" && method !== "MPESA" && !transactionReference) {
    return NextResponse.json({ success: false, message: "Provide a transaction reference." }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: { id: requestId, customerId: session.id },
  });
  if (!serviceRequest) {
    return NextResponse.json({ success: false, message: "Request not found." }, { status: 404 });
  }

  const recorder = await prisma.adminUser.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  if (!recorder) {
    return NextResponse.json({ success: false, message: "Payment intake is temporarily unavailable." }, { status: 503 });
  }

  const payment = await prisma.payment.create({
    data: {
      receiptNumber: `ESH-PAY-${randomUUID().slice(0, 8).toUpperCase()}`,
      requestId: serviceRequest.id,
      amount,
      currency: "KES",
      method,
      status: "PENDING",
      transactionReference: transactionReference || null,
      notes: "Submitted by customer for verification.",
      recordedById: recorder.id,
    },
  });

  return NextResponse.json(
    { success: true, payment: { receiptNumber: payment.receiptNumber, status: payment.status } },
    { status: 201 }
  );
}
