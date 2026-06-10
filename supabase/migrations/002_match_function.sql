-- Semantic ranking function for candidates by job embedding
CREATE OR REPLACE FUNCTION match_candidates_by_job(
  job_embedding vector(768),
  target_job_id UUID
)
RETURNS TABLE (
  id UUID,
  job_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  cv_storage_path TEXT,
  cv_text TEXT,
  pipeline_stage pipeline_stage,
  embedding vector(768),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  scores JSONB,
  similarity_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.job_id,
    c.full_name,
    c.email,
    c.phone,
    c.cv_storage_path,
    c.cv_text,
    c.pipeline_stage,
    c.embedding,
    c.deleted_at,
    c.created_at,
    c.updated_at,
    COALESCE(
      (SELECT jsonb_agg(row_to_json(s.*))
       FROM scores s WHERE s.candidate_id = c.id),
      '[]'::jsonb
    ) AS scores,
    ROUND((1 - (c.embedding <=> job_embedding))::numeric * 100, 2) AS similarity_pct
  FROM candidates c
  WHERE c.job_id = target_job_id
    AND c.deleted_at IS NULL
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> job_embedding;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
