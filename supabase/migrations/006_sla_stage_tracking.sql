-- SLA: tiempo en etapa del pipeline
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE candidates
SET stage_entered_at = COALESCE(updated_at, created_at)
WHERE stage_entered_at IS NULL;

CREATE TABLE IF NOT EXISTS candidate_stage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  from_stage pipeline_stage,
  to_stage pipeline_stage NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stage_events_candidate
  ON candidate_stage_events(candidate_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidates_stage_entered
  ON candidates(stage_entered_at)
  WHERE deleted_at IS NULL;

ALTER TABLE candidate_stage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY stage_events_select ON candidate_stage_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY stage_events_insert ON candidate_stage_events
  FOR INSERT TO authenticated WITH CHECK (true);
