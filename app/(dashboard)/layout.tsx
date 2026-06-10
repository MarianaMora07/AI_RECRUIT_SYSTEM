import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getServerAuth, getProfile } from "@/lib/api/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id, supabase);

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
