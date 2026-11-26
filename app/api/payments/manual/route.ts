import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";
import { notifySuperAdmin } from "@/lib/system-notifications";
import { MPESA_TILL_NUMBER } from "@/lib/payment-config";

export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const amount = Number(body.amount);
  const paymentChannel =
    body.method === "MPESA_TILL"
      ? "MPESA_TILL"
      : body.method === "MPESA"
        ? "MPESA"
        : body.method === "BANK_TRANSFER"
          ? "BANK_TRANSFER"
          : null;
  const transactionReference = typeof body.transactionReference === "string" ? body.transactionReference.trim() : "";

  if (!paymentChannel) {
    return NextResponse.json({ success: false, message: "Select a valid payment method." }, { status: 400 });
  }
  if (!requestId || !Number.isFinite(amount) || amount < 1) {
    return NextResponse.json({ success: false, message: "Valid request and amount are required." }, { status: 400 });
  }
  if (paymentChannel === "MPESA_TILL" && transactionReference.length > 32) {
    return NextResponse.json({ success: false, message: "M-Pesa confirmation code must be 32 characters or fewer." }, { status: 400 });
  }
  if (paymentChannel === "MPESA_TILL" && !transactionReference) {
    return NextResponse.json({ success: false, message: "Enter the M-Pesa confirmation code." }, { status: 400 });
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
    select: { id: true },
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
      method: paymentChannel === "BANK_TRANSFER" ? "BANK_TRANSFER" : "MPESA",
      status: "PENDING",
      transactionReference: transactionReference || null,
      notes:
        paymentChannel === "MPESA_TILL"
          ? `Lipa na M-Pesa Till ${MPESA_TILL_NUMBER}.`
          : "Submitted by customer for verification.",
      recordedById: recorder.id,
    },
  });

  await notifySuperAdmin({
    eventType: "MANUAL_PAYMENT_SUBMITTED",
    subject: "Customer submitted a payment for verification",
    details: {
      Receipt: payment.receiptNumber,
      Request: serviceRequest.reference,
      Amount: `${payment.currency} ${Number(payment.amount).toFixed(2)}`,
      Method:
        paymentChannel === "MPESA_TILL"
          ? `M-Pesa Till ${MPESA_TILL_NUMBER}`
          : payment.method,
      Reference: payment.transactionReference ?? "Not provided",
      Status: payment.status,
      Customer: session.fullName,
    },
  });

  return NextResponse.json(
    { success: true, payment: { receiptNumber: payment.receiptNumber, status: payment.status } },
    { status: 201 }
  );
}
