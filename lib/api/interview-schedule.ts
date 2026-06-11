import type { SupabaseClient } from "@supabase/supabase-js";

export async function upsertInterviewSchedule(
  admin: SupabaseClient,
  params: {
    candidateId: string;
    jobId: string;
    scheduledAt: string;
    scheduledBy?: string;
  }
) {
  const { data: existing } = await admin
    .from("interviews")
    .select("id")
    .eq("candidate_id", params.candidateId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    candidate_id: params.candidateId,
    job_id: params.jobId,
    scheduled_at: params.scheduledAt,
    evaluator_id: params.scheduledBy ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await admin
      .from("interviews")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await admin
    .from("interviews")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}
