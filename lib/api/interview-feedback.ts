import type { SupabaseClient } from "@supabase/supabase-js";
import type { HiringManagerDecisionTarget } from "@/lib/constants/roles";
import type { InterviewFeedbackInput } from "@/lib/validations/candidates";

export async function upsertInterviewFeedback(
  admin: SupabaseClient,
  params: {
    candidateId: string;
    jobId: string;
    evaluatorId: string;
    targetStage: HiringManagerDecisionTarget;
    feedback: InterviewFeedbackInput;
  }
) {
  const approved = params.targetStage === "interview_approved";

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
    evaluator_id: params.evaluatorId,
    rating: params.feedback.rating,
    notes: params.feedback.notes,
    approved,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await admin
      .from("interviews")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await admin.from("interviews").insert(payload);
  if (error) throw error;
}
