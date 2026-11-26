import { redirect } from "next/navigation";

import PasswordChangeForm from "@/app/components/password-change-form";
import { getCustomerPasswordChangeSession } from "@/lib/customer-auth";

export const instant = false;

export default async function CustomerChangePasswordPage() {
  const session = await getCustomerPasswordChangeSession();
  if (!session) redirect("/customer/login");

  return <PasswordChangeForm accountType="customer" />;
}
