export const JOB_LIST_COLUMNS =
  "id, title, description, requirements, requirements_formatted, status, created_by, created_at, updated_at";

export const JOB_MINIMAL_COLUMNS = "id, title, status";

export const CANDIDATE_LIST_COLUMNS =
  "id, full_name, email, phone, pipeline_stage, job_id, created_at, scores(summary, classification, risk_level, fit_score, similarity_score)";

export const CANDIDATE_PIPELINE_COLUMNS =
  "id, full_name, pipeline_stage, job_id";

export const CANDIDATE_PIPELINE_EXTENDED_COLUMNS =
  "id, full_name, pipeline_stage, job_id, jobs(title), scores(fit_score, classification)";

export const CANDIDATE_DETAIL_COLUMNS =
  "id, full_name, email, phone, cv_storage_path, pipeline_stage, job_id, created_at, scores(*), jobs(title, requirements)";

export const PROFILE_COLUMNS =
  "id, email, full_name, role, avatar_url, created_at, updated_at";
