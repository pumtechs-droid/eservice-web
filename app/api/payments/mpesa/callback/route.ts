import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const callback = body?.Body?.stkCallback;
    if (!callback) {
      return NextResponse.json({ success: false });
    }

    const metadata = (callback.CallbackMetadata?.Item ?? []) as Array<{ Name: string; Value?: unknown }>;
    const getValue = (name: string) => metadata.find((item) => item.Name === name)?.Value;
    const receipt = getValue("MpesaReceiptNumber");
    const amount = Number(getValue("Amount") ?? 0);
    const phone = String(getValue("PhoneNumber") ?? "");

    if (callback.ResultCode === 0 && typeof receipt === "string") {
      const pendingPayment = await prisma.payment.findFirst({
        where: { providerReference: String(callback.CheckoutRequestID) },
        include: { request: true },
      });

      if (pendingPayment) {
        await prisma.payment.update({
          where: { id: pendingPayment.id },
          data: {
            amount: amount || 0,
            status: "CONFIRMED",
            transactionReference: receipt,
            providerPayload: body,
            paidAt: new Date(),
            notes: phone ? `M-Pesa phone: ${phone}` : null,
          },
        });
        await prisma.serviceRequest.update({
          where: { id: pendingPayment.requestId },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MPESA_CALLBACK_ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
