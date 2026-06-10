import { getServerAuth } from "@/lib/api/auth";
import { JOB_LIST_COLUMNS, JOB_MINIMAL_COLUMNS } from "@/lib/constants/queries";

export async function fetchJobs() {
  const { supabase, user } = await getServerAuth();
  if (!user) return [];

  const { data } = await supabase
    .from("jobs")
    .select(JOB_LIST_COLUMNS)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function fetchJobsMinimal() {
  const { supabase, user } = await getServerAuth();
  if (!user) return [];

  const { data } = await supabase
    .from("jobs")
    .select(JOB_MINIMAL_COLUMNS)
    .order("created_at", { ascending: false });

  return data ?? [];
}
