import { redirect } from "next/navigation";

import PasswordChangeForm from "@/app/components/password-change-form";
import { getAdminPasswordChangeSession } from "@/lib/auth";

export const instant = false;

export default async function AdminChangePasswordPage() {
  const session = await getAdminPasswordChangeSession();
  if (!session) redirect("/admin/login");

  return <PasswordChangeForm accountType="admin" />;
}
