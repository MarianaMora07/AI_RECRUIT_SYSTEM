-- Hiring Manager: decisiones post-entrevista y feedback

DO $$ BEGIN
  ALTER TYPE pipeline_stage ADD VALUE 'interview_approved';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Hiring Manager puede registrar feedback de entrevista
DROP POLICY IF EXISTS interviews_hm_insert ON interviews;
CREATE POLICY interviews_hm_insert ON interviews
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'hiring_manager');

DROP POLICY IF EXISTS interviews_hm_update ON interviews;
CREATE POLICY interviews_hm_update ON interviews
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'hiring_manager');
