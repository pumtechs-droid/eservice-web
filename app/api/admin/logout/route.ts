import { NextResponse } from "next/server";

import {
  clearAdminSession,
  getAdminSession,
  type AdminSession,
} from "@/lib/auth";
import { notifySuperAdmin } from "@/lib/system-notifications";

export async function POST(request: Request) {
  let session: AdminSession | null = null;

  try {
    session = await getAdminSession();
  } catch (error) {
    console.error("ADMIN_LOGOUT_SESSION_LOOKUP_ERROR:", error);
  }

  await clearAdminSession();

  if (session) {
    await notifySuperAdmin({
      eventType: "ADMIN_LOGOUT",
      subject: "Administrator signed out",
      details: {
        Email: session.email,
        Role: session.role,
      },
    });
  }

  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
