export const JOB_LIST_COLUMNS =
  "id, title, description, requirements, requirements_formatted, status, created_by, created_at, updated_at";

export const JOB_MINIMAL_COLUMNS = "id, title, status";

export const CANDIDATE_LIST_COLUMNS =
  "id, full_name, email, phone, pipeline_stage, job_id, stage_entered_at, created_at, scores(summary, classification, risk_level, fit_score, similarity_score), jobs(title)";

export const CANDIDATE_PIPELINE_COLUMNS =
  "id, full_name, pipeline_stage, job_id, stage_entered_at";

export const CANDIDATE_PIPELINE_EXTENDED_COLUMNS =
  "id, full_name, email, pipeline_stage, job_id, stage_entered_at, jobs(title), scores(fit_score, classification)";

export const CANDIDATE_DETAIL_COLUMNS =
  "id, full_name, email, phone, cv_storage_path, pipeline_stage, stage_entered_at, job_id, created_at, scores(*), jobs(title, requirements)";

export const PROFILE_COLUMNS =
  "id, email, full_name, role, avatar_url, created_at, updated_at";
