import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getServerAuth, getProfile } from "@/lib/api/auth";
import { isEmailVerified } from "@/lib/auth/email-verification";
import { fetchNotifications } from "@/lib/data/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect("/login");

  if (!isEmailVerified(user)) {
    const params = new URLSearchParams();
    if (user.email) params.set("email", user.email);
    redirect(`/verify-email?${params.toString()}`);
  }

  const [profile, notifications] = await Promise.all([
    getProfile(user.id, supabase),
    fetchNotifications(),
  ]);

  return (
    <DashboardShell profile={profile} notifications={notifications}>
      {children}
    </DashboardShell>
  );
}
