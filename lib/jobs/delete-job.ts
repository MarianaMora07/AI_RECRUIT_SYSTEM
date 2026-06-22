import type { SupabaseClient } from "@supabase/supabase-js";

export interface JobDeletionCheck {
  canDelete: boolean;
  recruiterCount: number;
  candidateCount: number;
  reason?: string;
}

export async function getJobDeletionCheck(
  supabase: SupabaseClient,
  jobId: string
): Promise<JobDeletionCheck> {
  const [recruitersRes, candidatesRes] = await Promise.all([
    supabase
      .from("job_recruiters")
      .select("job_id", { count: "exact", head: true })
      .eq("job_id", jobId),
    supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId)
      .is("deleted_at", null),
  ]);

  if (recruitersRes.error || candidatesRes.error) {
    return {
      canDelete: false,
      recruiterCount: 0,
      candidateCount: 0,
      reason: "No se pudo verificar si la vacante puede eliminarse.",
    };
  }

  const recruiters = recruitersRes.count ?? 0;
  const candidates = candidatesRes.count ?? 0;

  if (recruiters > 0 && candidates > 0) {
    return {
      canDelete: false,
      recruiterCount: recruiters,
      candidateCount: candidates,
      reason:
        "No se puede eliminar: hay reclutadores y candidatos asociados a esta vacante.",
    };
  }

  if (recruiters > 0) {
    return {
      canDelete: false,
      recruiterCount: recruiters,
      candidateCount: candidates,
      reason:
        "No se puede eliminar: hay reclutadores asignados. Abre «Asignar reclutadores», desmarca a todos y guarda antes de eliminar.",
    };
  }

  if (candidates > 0) {
    return {
      canDelete: false,
      recruiterCount: recruiters,
      candidateCount: candidates,
      reason:
        "No se puede eliminar: hay candidatos postulados a esta vacante.",
    };
  }

  return {
    canDelete: true,
    recruiterCount: 0,
    candidateCount: 0,
  };
}
