import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifySuperAdmin } from "@/lib/system-notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const callback = body?.Body?.stkCallback;
    if (!callback) {
      return NextResponse.json({ success: false });
    }

    if (
      typeof callback.ResultCode !== "number" ||
      !Number.isInteger(callback.ResultCode)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid payment callback result." },
        { status: 400 }
      );
    }

    const metadata = (callback.CallbackMetadata?.Item ?? []) as Array<{ Name: string; Value?: unknown }>;
    const getValue = (name: string) => metadata.find((item) => item.Name === name)?.Value;
    const receipt = getValue("MpesaReceiptNumber");
    const amount = Number(getValue("Amount") ?? 0);
    const phone = String(getValue("PhoneNumber") ?? "");
    const checkoutRequestId =
      typeof callback.CheckoutRequestID === "string"
        ? callback.CheckoutRequestID
        : "";

    if (!checkoutRequestId || checkoutRequestId.length > 200) {
      return NextResponse.json(
        { success: false, message: "Invalid payment callback reference." },
        { status: 400 }
      );
    }

    if (
      callback.ResultCode === 0 &&
      (typeof receipt !== "string" ||
        !Number.isFinite(amount) ||
        amount < 1)
    ) {
      return NextResponse.json(
        { success: false, message: "Incomplete payment confirmation." },
        { status: 400 }
      );
    }

    if (callback.ResultCode === 0 && typeof receipt === "string") {
      const pendingPayment = await prisma.payment.findFirst({
        where: {
          providerReference: checkoutRequestId,
          status: "PENDING",
        },
        include: { request: true },
      });

      if (pendingPayment) {
        const updated = await prisma.$transaction(async (tx) => {
          const result = await tx.payment.updateMany({
            where: { id: pendingPayment.id, status: "PENDING" },
            data: {
              amount: amount || 0,
              status: "CONFIRMED",
              transactionReference: receipt,
              providerPayload: body,
              paidAt: new Date(),
              notes: phone ? `M-Pesa phone: ${phone}` : null,
            },
          });

          if (result.count !== 1) return false;

          await tx.serviceRequest.update({
            where: { id: pendingPayment.requestId },
            data: { status: "IN_PROGRESS" },
          });

          return true;
        });

        if (updated) {
          await notifySuperAdmin({
            eventType: "MPESA_PAYMENT_CONFIRMED",
            subject: "M-Pesa payment confirmed",
            details: {
              Receipt: pendingPayment.receiptNumber,
              "M-Pesa receipt": receipt,
              Request: pendingPayment.request.reference,
              Amount: `KES ${(amount || 0).toFixed(2)}`,
              Status: "CONFIRMED",
            },
          });
        }
      }
    } else {
      const failedPayment = await prisma.payment.findFirst({
        where: {
          providerReference: checkoutRequestId,
          status: "PENDING",
        },
        include: { request: true },
      });

      if (failedPayment) {
        const updated = await prisma.payment.updateMany({
          where: { id: failedPayment.id, status: "PENDING" },
          data: { status: "FAILED", providerPayload: body },
        });

        if (updated.count === 1) {
          await notifySuperAdmin({
            eventType: "MPESA_PAYMENT_FAILED",
            subject: "M-Pesa payment failed",
            details: {
              Receipt: failedPayment.receiptNumber,
              Request: failedPayment.request.reference,
              Amount: `KES ${Number(failedPayment.amount).toFixed(2)}`,
              Status: "FAILED",
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MPESA_CALLBACK_ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
