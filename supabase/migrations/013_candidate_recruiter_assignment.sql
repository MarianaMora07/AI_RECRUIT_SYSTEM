-- Job recruiters (configured by admin / hiring_manager)

CREATE TABLE IF NOT EXISTS job_recruiters (

  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (job_id, recruiter_id)

);



CREATE INDEX IF NOT EXISTS idx_job_recruiters_recruiter ON job_recruiters(recruiter_id);



-- Backfill: job creator as initial recruiter for existing jobs

INSERT INTO job_recruiters (job_id, recruiter_id)

SELECT id, created_by FROM jobs

ON CONFLICT DO NOTHING;



-- Assigned recruiter on candidates

ALTER TABLE candidates

  ADD COLUMN IF NOT EXISTS assigned_recruiter_id UUID REFERENCES profiles(id) ON DELETE RESTRICT;



UPDATE candidates c

SET assigned_recruiter_id = j.created_by

FROM jobs j

WHERE c.job_id = j.id AND c.assigned_recruiter_id IS NULL;



ALTER TABLE candidates

  ALTER COLUMN assigned_recruiter_id SET NOT NULL;



CREATE INDEX IF NOT EXISTS idx_candidates_assigned_recruiter ON candidates(assigned_recruiter_id);



-- Recruiter assignment history (append-only)

CREATE TABLE IF NOT EXISTS candidate_recruiter_events (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  from_recruiter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  to_recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  reason TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);



CREATE INDEX IF NOT EXISTS idx_recruiter_events_candidate ON candidate_recruiter_events(candidate_id, created_at DESC);



-- Backfill initial assignment events for existing candidates (skip if already seeded)

INSERT INTO candidate_recruiter_events (candidate_id, from_recruiter_id, to_recruiter_id, changed_by, reason)

SELECT c.id, NULL, c.assigned_recruiter_id, c.assigned_recruiter_id, 'initial_assignment'

FROM candidates c

WHERE c.deleted_at IS NULL

  AND NOT EXISTS (

    SELECT 1 FROM candidate_recruiter_events e

    WHERE e.candidate_id = c.id AND e.reason = 'initial_assignment'

  );



-- RLS: job_recruiters

ALTER TABLE job_recruiters ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS job_recruiters_select ON job_recruiters;

CREATE POLICY job_recruiters_select ON job_recruiters FOR SELECT TO authenticated

  USING (get_user_role() IN ('admin', 'recruiter', 'hiring_manager'));



DROP POLICY IF EXISTS job_recruiters_insert ON job_recruiters;

CREATE POLICY job_recruiters_insert ON job_recruiters FOR INSERT TO authenticated

  WITH CHECK (get_user_role() IN ('admin', 'hiring_manager'));



DROP POLICY IF EXISTS job_recruiters_delete ON job_recruiters;

CREATE POLICY job_recruiters_delete ON job_recruiters FOR DELETE TO authenticated

  USING (get_user_role() IN ('admin', 'hiring_manager'));



-- RLS: candidate_recruiter_events

ALTER TABLE candidate_recruiter_events ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS recruiter_events_select ON candidate_recruiter_events;

CREATE POLICY recruiter_events_select ON candidate_recruiter_events FOR SELECT TO authenticated

  USING (

    get_user_role() IN ('admin', 'hiring_manager')

    OR EXISTS (

      SELECT 1 FROM candidates c

      WHERE c.id = candidate_recruiter_events.candidate_id

        AND c.assigned_recruiter_id = auth.uid()

        AND c.deleted_at IS NULL

    )

  );



-- Update candidates policies

DROP POLICY IF EXISTS candidates_select ON candidates;

DROP POLICY IF EXISTS candidates_update ON candidates;



CREATE POLICY candidates_select ON candidates FOR SELECT TO authenticated

  USING (

    deleted_at IS NULL

    AND (

      get_user_role() IN ('admin', 'hiring_manager')

      OR (get_user_role() = 'recruiter' AND assigned_recruiter_id = auth.uid())

    )

  );



CREATE POLICY candidates_update ON candidates FOR UPDATE TO authenticated

  USING (

    get_user_role() IN ('admin', 'recruiter', 'hiring_manager')

    AND (

      get_user_role() IN ('admin', 'hiring_manager')

      OR assigned_recruiter_id = auth.uid()

    )

  );



-- Update scores policies (recruiter sees only assigned candidates)

-- scores_insert unchanged from 001_initial_schema — not recreated here

DROP POLICY IF EXISTS scores_select ON scores;

DROP POLICY IF EXISTS scores_update ON scores;



CREATE POLICY scores_select ON scores FOR SELECT TO authenticated

  USING (

    get_user_role() IN ('admin', 'hiring_manager')

    OR (

      get_user_role() = 'recruiter'

      AND EXISTS (

        SELECT 1 FROM candidates c

        WHERE c.id = scores.candidate_id

          AND c.assigned_recruiter_id = auth.uid()

          AND c.deleted_at IS NULL

      )

    )

  );



CREATE POLICY scores_update ON scores FOR UPDATE TO authenticated

  USING (

    get_user_role() IN ('admin', 'hiring_manager')

    OR (

      get_user_role() = 'recruiter'

      AND EXISTS (

        SELECT 1 FROM candidates c

        WHERE c.id = scores.candidate_id

          AND c.assigned_recruiter_id = auth.uid()

          AND c.deleted_at IS NULL

      )

    )

  );



-- Update interviews select policy

DROP POLICY IF EXISTS interviews_select ON interviews;



CREATE POLICY interviews_select ON interviews FOR SELECT TO authenticated

  USING (

    get_user_role() IN ('admin', 'hiring_manager')

    OR (

      get_user_role() = 'recruiter'

      AND EXISTS (

        SELECT 1 FROM candidates c

        WHERE c.id = interviews.candidate_id

          AND c.assigned_recruiter_id = auth.uid()

          AND c.deleted_at IS NULL

      )

    )

  );



-- Scoped match_candidates_by_job for recruiters
-- Must drop first: OUT/return row type cannot change with CREATE OR REPLACE
DROP FUNCTION IF EXISTS match_candidates_by_job(vector, uuid);

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

  pipeline_stage pipeline_stage,

  stage_entered_at TIMESTAMPTZ,

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

    c.pipeline_stage,

    c.stage_entered_at,

    c.created_at,

    c.updated_at,

    COALESCE(

      (SELECT jsonb_build_object(

        'fit_score', s.fit_score,

        'classification', s.classification,

        'summary', left(s.summary, 200)

      )

      FROM scores s WHERE s.candidate_id = c.id LIMIT 1),

      '{}'::jsonb

    ) AS scores,

    ROUND((1 - (c.embedding <=> job_embedding))::numeric * 100, 2) AS similarity_pct

  FROM candidates c

  WHERE c.job_id = target_job_id

    AND c.deleted_at IS NULL

    AND c.embedding IS NOT NULL

    AND (

      get_user_role() IN ('admin', 'hiring_manager')

      OR (get_user_role() = 'recruiter' AND c.assigned_recruiter_id = auth.uid())

    )

  ORDER BY c.embedding <=> job_embedding;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;



-- Scoped dashboard metrics for recruiters

CREATE OR REPLACE FUNCTION get_dashboard_metrics()

RETURNS JSON AS $$

DECLARE

  user_role_val user_role;

BEGIN

  user_role_val := get_user_role();



  IF user_role_val = 'recruiter' THEN

    RETURN (

      SELECT json_build_object(

        'totalJobs', (SELECT COUNT(*)::int FROM jobs),

        'openJobs', (SELECT COUNT(*)::int FROM jobs WHERE status = 'open'),

        'totalCandidates', (

          SELECT COUNT(*)::int FROM candidates

          WHERE deleted_at IS NULL AND assigned_recruiter_id = auth.uid()

        ),

        'stageCounts', COALESCE(

          (SELECT json_object_agg(pipeline_stage, cnt)

           FROM (

             SELECT pipeline_stage, COUNT(*)::int AS cnt

             FROM candidates

             WHERE deleted_at IS NULL AND assigned_recruiter_id = auth.uid()

             GROUP BY pipeline_stage

           ) s),

          '{}'::json

        ),

        'applicantsPerJob', COALESCE(

          (SELECT json_object_agg(job_id::text, cnt)

           FROM (

             SELECT job_id, COUNT(*)::int AS cnt

             FROM candidates

             WHERE deleted_at IS NULL AND assigned_recruiter_id = auth.uid()

             GROUP BY job_id

           ) j),

          '{}'::json

        )

      )

    );

  END IF;



  RETURN (

    SELECT json_build_object(

      'totalJobs', (SELECT COUNT(*)::int FROM jobs),

      'openJobs', (SELECT COUNT(*)::int FROM jobs WHERE status = 'open'),

      'totalCandidates', (SELECT COUNT(*)::int FROM candidates WHERE deleted_at IS NULL),

      'stageCounts', COALESCE(

        (SELECT json_object_agg(pipeline_stage, cnt)

         FROM (

           SELECT pipeline_stage, COUNT(*)::int AS cnt

           FROM candidates

           WHERE deleted_at IS NULL

           GROUP BY pipeline_stage

         ) s),

        '{}'::json

      ),

      'applicantsPerJob', COALESCE(

        (SELECT json_object_agg(job_id::text, cnt)

         FROM (

           SELECT job_id, COUNT(*)::int AS cnt

           FROM candidates

           WHERE deleted_at IS NULL

           GROUP BY job_id

         ) j),

        '{}'::json

      )

    )

  );

END;

$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


