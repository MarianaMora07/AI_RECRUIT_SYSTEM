import { redirect } from "next/navigation";
import { getServerAuth, getProfile } from "@/lib/api/auth";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id, supabase);
  if (!profile) redirect("/login");

  return <SettingsClient profile={profile} />;
}
