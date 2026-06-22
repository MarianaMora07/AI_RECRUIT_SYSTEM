import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { processCandidateAi } from "@/lib/ai/process-candidate";
import { extractCvText } from "@/lib/cv/extract-text";
import { logger } from "@/lib/logger";
import { dispatchN8nEvent } from "@/lib/n8n/dispatch";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeFilename } from "@/lib/utils/sanitize-filename";

export type RecruiterAssignmentReason =
  | "initial_assignment"
  | "job_recruiter_removed"
  | "manual_reassignment";

export type ApplicationSource =
  | "public_portal"
  | "manual_upload"
  | "linkedin"
  | "indeed"
  | "referral"
  | "agency"
  | "other";

export interface CreateCandidateFromCvParams {
  supabase: SupabaseClient;
  jobId: string;
  assignedRecruiterId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  file: File;
  buffer: Buffer;
  applicationSource?: ApplicationSource;
  changedByUserId?: string | null;
  assignmentReason?: RecruiterAssignmentReason;
  /** For logging */
  route: string;
  actorUserId?: string;
}

export interface CreateCandidateFromCvResult {
  candidate: {
    id: string;
    full_name: string;
    email: string;
    pipeline_stage: string;
    job_id: string;
    created_at: string;
    public_tracking_token?: string | null;
    assigned_recruiter_id: string;
  };
  job: {
    id: string;
    title: string;
    description: string;
    requirements: string;
  };
  cvText: string;
  storagePath: string;
}

export async function insertRecruiterAssignmentEvent(
  supabase: SupabaseClient,
  params: {
    candidateId: string;
    fromRecruiterId: string | null;
    toRecruiterId: string;
    changedBy: string | null;
    reason: RecruiterAssignmentReason;
  }
) {
  const { error } = await supabase.from("candidate_recruiter_events").insert({
    candidate_id: params.candidateId,
    from_recruiter_id: params.fromRecruiterId,
    to_recruiter_id: params.toRecruiterId,
    changed_by: params.changedBy,
    reason: params.reason,
  });

  if (error) {
    logger.warn("recruiter assignment event insert failed", {
      candidateId: params.candidateId,
      message: error.message,
    });
  }
}

export async function createCandidateFromCv(
  params: CreateCandidateFromCvParams
): Promise<CreateCandidateFromCvResult> {
  const {
    supabase,
    jobId,
    assignedRecruiterId,
    fullName,
    email,
    phone,
    file,
    buffer,
    changedByUserId,
    assignmentReason = "initial_assignment",
    applicationSource = "manual_upload",
    route,
    actorUserId,
  } = params;

  const cvText = await extractCvText(buffer, file.type);

  const { data: jobData, error: jobError } = await supabase
    .from("jobs")
    .select("id, title, description, requirements")
    .eq("id", jobId)
    .single();

  if (jobError || !jobData) {
    throw new Error("JOB_NOT_FOUND");
  }

  const storagePath = `${jobId}/${Date.now()}-${sanitizeFilename(file.name)}`;

  const { data: candidate, error: insertError } = await supabase
    .from("candidates")
    .insert({
      job_id: jobId,
      assigned_recruiter_id: assignedRecruiterId,
      full_name: fullName,
      email,
      phone: phone ?? null,
      cv_storage_path: null,
      cv_text: cvText,
      pipeline_stage: "applied",
      application_source: applicationSource,
    })
    .select(
      "id, full_name, email, pipeline_stage, job_id, created_at, public_tracking_token, assigned_recruiter_id"
    )
    .single();

  if (insertError || !candidate) {
    logger.error("candidate insert failed", {
      route,
      userId: actorUserId,
      message: insertError?.message,
      code: insertError?.code,
    });
    throw new Error("CANDIDATE_INSERT_FAILED");
  }

  await insertRecruiterAssignmentEvent(supabase, {
    candidateId: candidate.id,
    fromRecruiterId: null,
    toRecruiterId: assignedRecruiterId,
    changedBy:
      changedByUserId === undefined
        ? assignedRecruiterId
        : changedByUserId,
    reason: assignmentReason,
  });

  return {
    candidate,
    job: jobData,
    cvText,
    storagePath,
  };
}

export function scheduleCandidateBackgroundProcessing(params: {
  candidateId: string;
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  jobRequirements: string;
  cvText: string;
  userId: string;
  storagePath: string;
  buffer: Buffer;
  fileType: string;
  automationPayload: {
    candidateId: string;
    email: string;
    fullName: string;
    jobId: string;
    jobTitle: string;
    trackingToken?: string | null;
  };
  route: string;
  actorUserId?: string;
}) {
  const {
    candidateId,
    jobId,
    jobTitle,
    jobDescription,
    jobRequirements,
    cvText,
    userId,
    storagePath,
    buffer,
    fileType,
    automationPayload,
    route,
    actorUserId,
  } = params;

  after(async () => {
    logger.info("background processing started", {
      route,
      userId: actorUserId,
      candidateId,
    });

    let bgSupabase;
    try {
      bgSupabase = createAdminClient();
    } catch (err) {
      logger.error("background upload skipped, no admin client", {
        route,
        userId: actorUserId,
        message: err instanceof Error ? err.message : "unknown",
      });
      if (process.env.GEMINI_API_KEY) {
        await processCandidateAi({
          candidateId,
          jobId,
          jobTitle,
          jobDescription,
          jobRequirements,
          cvText,
          userId,
        });
      }
      return;
    }

    const { error: uploadError } = await bgSupabase.storage
      .from("cvs")
      .upload(storagePath, buffer, {
        contentType: fileType,
        upsert: false,
      });

    if (!uploadError) {
      await bgSupabase
        .from("candidates")
        .update({ cv_storage_path: storagePath })
        .eq("id", candidateId);
    } else {
      logger.warn("storage upload failed in background", {
        route,
        userId: actorUserId,
      });
    }

    void dispatchN8nEvent("candidate.created", automationPayload);

    if (process.env.GEMINI_API_KEY) {
      await processCandidateAi({
        candidateId,
        jobId,
        jobTitle,
        jobDescription,
        jobRequirements,
        cvText,
        userId,
      });
    }
  });
}
