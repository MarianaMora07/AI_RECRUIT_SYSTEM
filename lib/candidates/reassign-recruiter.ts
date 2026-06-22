import type { SupabaseClient } from "@supabase/supabase-js";
import {
  insertRecruiterAssignmentEvent,
  type RecruiterAssignmentReason,
} from "@/lib/candidates/create-from-cv";

export interface ReassignCandidateRecruiterParams {
  supabase: SupabaseClient;
  candidateId: string;
  fromRecruiterId: string;
  toRecruiterId: string;
  changedBy: string;
  reason: RecruiterAssignmentReason;
}

export async function reassignCandidateRecruiter(
  params: ReassignCandidateRecruiterParams
) {
  const { supabase, candidateId, fromRecruiterId, toRecruiterId, changedBy, reason } =
    params;

  await insertRecruiterAssignmentEvent(supabase, {
    candidateId,
    fromRecruiterId,
    toRecruiterId,
    changedBy,
    reason,
  });

  const { error } = await supabase
    .from("candidates")
    .update({ assigned_recruiter_id: toRecruiterId })
    .eq("id", candidateId);

  if (error) {
    throw new Error(error.message);
  }
}

export interface JobRecruitersPatchInput {
  jobId: string;
  recruiterIds: string[];
  reassignments?: Record<string, string>;
}

export async function validateAndApplyJobRecruitersPatch(
  supabase: SupabaseClient,
  changedBy: string,
  input: JobRecruitersPatchInput
): Promise<{ error?: string; status?: number }> {
  const { jobId, recruiterIds, reassignments = {} } = input;

  const uniqueIds = [...new Set(recruiterIds)];

  if (uniqueIds.length === 0) {
    const { count } = await supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId)
      .is("deleted_at", null)
      .not("pipeline_stage", "eq", "hired")
      .not("pipeline_stage", "eq", "rejected");

    if ((count ?? 0) > 0) {
      return {
        error:
          "No puedes quitar todos los reclutadores mientras haya candidatos activos. Reasigna candidatos o cierra la vacante.",
        status: 409,
      };
    }
  }

  const { data: currentRows } = await supabase
    .from("job_recruiters")
    .select("recruiter_id")
    .eq("job_id", jobId);

  const currentIds = (currentRows ?? []).map((r) => r.recruiter_id as string);
  const removedIds = currentIds.filter((id) => !uniqueIds.includes(id));

  for (const removedId of removedIds) {
    const { data: affected } = await supabase
      .from("candidates")
      .select("id, assigned_recruiter_id, pipeline_stage")
      .eq("job_id", jobId)
      .eq("assigned_recruiter_id", removedId)
      .is("deleted_at", null);

    const active = (affected ?? []).filter(
      (c) => c.pipeline_stage !== "hired" && c.pipeline_stage !== "rejected"
    );
    if (active.length === 0) continue;

    const replacementId = reassignments[removedId];
    if (!replacementId || !uniqueIds.includes(replacementId)) {
      return {
        error: `Debes indicar un reclutador de reemplazo para el reclutador removido (${removedId}).`,
        status: 409,
      };
    }

    for (const candidate of active) {
      await reassignCandidateRecruiter({
        supabase,
        candidateId: candidate.id,
        fromRecruiterId: removedId,
        toRecruiterId: replacementId,
        changedBy,
        reason: "job_recruiter_removed",
      });
    }
  }

  await supabase.from("job_recruiters").delete().eq("job_id", jobId);

  if (uniqueIds.length > 0) {
    const { error: insertError } = await supabase.from("job_recruiters").insert(
      uniqueIds.map((recruiterId) => ({
        job_id: jobId,
        recruiter_id: recruiterId,
      }))
    );

    if (insertError) {
      return { error: "No se pudieron actualizar los reclutadores de la vacante", status: 500 };
    }
  }

  return {};
}

export async function manualReassignCandidateRecruiter(
  supabase: SupabaseClient,
  params: {
    candidateId: string;
    jobId: string;
    newRecruiterId: string;
    changedBy: string;
  }
): Promise<{ error?: string; status?: number }> {
  const { candidateId, jobId, newRecruiterId, changedBy } = params;

  const { data: link } = await supabase
    .from("job_recruiters")
    .select("recruiter_id")
    .eq("job_id", jobId)
    .eq("recruiter_id", newRecruiterId)
    .maybeSingle();

  if (!link) {
    return {
      error: "El reclutador no está asignado a esta vacante",
      status: 400,
    };
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, assigned_recruiter_id")
    .eq("id", candidateId)
    .is("deleted_at", null)
    .single();

  if (!candidate) {
    return { error: "Candidato no encontrado", status: 404 };
  }

  if (candidate.assigned_recruiter_id === newRecruiterId) {
    return { error: "El candidato ya está asignado a ese reclutador", status: 400 };
  }

  await reassignCandidateRecruiter({
    supabase,
    candidateId,
    fromRecruiterId: candidate.assigned_recruiter_id,
    toRecruiterId: newRecruiterId,
    changedBy,
    reason: "manual_reassignment",
  });

  return {};
}
