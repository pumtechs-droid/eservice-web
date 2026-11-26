import { NextRequest, NextResponse } from "next/server";

import { retryPendingAdminNotifications } from "@/lib/system-notifications";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { success: false, message: "Notification retry is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const processed = await retryPendingAdminNotifications();
    return NextResponse.json(
      { success: true, processed },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("SUPER_ADMIN_NOTIFICATION_RETRY_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Notification retry failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
