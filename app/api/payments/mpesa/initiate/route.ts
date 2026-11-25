import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";

export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  const amount = Number(body.amount);

  if (!requestId || !phone || !Number.isFinite(amount) || amount < 1) {
    return NextResponse.json({ success: false, message: "Provide a valid request, phone and amount." }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: { id: requestId, customerId: session.id },
  });
  if (!serviceRequest) {
    return NextResponse.json({ success: false, message: "Request not found." }, { status: 404 });
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  const environment = process.env.MPESA_ENVIRONMENT === "production" ? "api" : "sandbox";

  if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
    return NextResponse.json({
      success: false,
      message: "M-Pesa payments are not configured yet. Contact support or use the displayed payment instructions.",
    }, { status: 503 });
  }

  try {
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const tokenResponse = await fetch(`https://${environment}.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    });
    if (!tokenResponse.ok) throw new Error("Unable to authenticate with M-Pesa.");
    const token = await tokenResponse.json() as { access_token: string };

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const normalizedPhone = phone.startsWith("254") ? phone : `254${phone.replace(/^0/, "")}`;

    const stkResponse = await fetch(`https://${environment}.safaricom.co.ke/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: normalizedPhone,
        PartyB: shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: serviceRequest.reference,
        TransactionDesc: "E-SERVICE HUB payment",
      }),
      cache: "no-store",
    });

    const result = await stkResponse.json() as {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResponseCode?: string;
      ResponseDescription?: string;
    };
    if (!stkResponse.ok || result.ResponseCode !== "0" || !result.CheckoutRequestID) {
      throw new Error(result.ResponseDescription || "M-Pesa did not accept the payment request.");
    }

    const recorder = await prisma.adminUser.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (recorder) {
      await prisma.payment.create({
        data: {
          receiptNumber: `ESH-MPESA-${result.CheckoutRequestID.slice(-10).toUpperCase()}`,
          requestId: serviceRequest.id,
          amount: Math.round(amount),
          currency: "KES",
          method: "MPESA",
          status: "PENDING",
          providerReference: result.CheckoutRequestID,
          providerPayload: result,
          recordedById: recorder.id,
          notes: `M-Pesa phone: ${normalizedPhone}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      checkoutRequestId: result.CheckoutRequestID,
      message: "Check your phone and enter your M-Pesa PIN.",
    });
  } catch (error) {
    console.error("MPESA_INITIATE_ERROR:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to start M-Pesa payment.",
    }, { status: 502 });
  }
}
