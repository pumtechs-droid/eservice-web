import { NextResponse } from "next/server";
import {
  clearCustomerSession,
  getCustomerSession,
} from "@/lib/customer-auth";
import { notifySuperAdmin } from "@/lib/system-notifications";

export async function POST(request: Request) {
  const session = await getCustomerSession();
  await clearCustomerSession();
  if (session) {
    await notifySuperAdmin({
      eventType: "CUSTOMER_LOGOUT",
      subject: "Customer signed out of the portal",
      details: { Customer: session.fullName, Email: session.email },
    });
  }
  return NextResponse.redirect(new URL("/customer/login", request.url), 303);
}
