-- Hotfix: re-run if get_dashboard_analytics fails with
-- "function round(double precision, integer) does not exist"
-- (016 and 017 must already be applied)

-- Dashboard analytics RPC (runs after 016 sources + 017 costs)

DROP FUNCTION IF EXISTS get_dashboard_analytics(timestamptz, timestamptz, uuid, uuid);

CREATE OR REPLACE FUNCTION get_dashboard_analytics(
  p_from_date timestamptz DEFAULT NULL,
  p_to_date timestamptz DEFAULT NULL,
  p_job_id uuid DEFAULT NULL,
  p_recruiter_filter uuid DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  user_role_val user_role;
  scope_recruiter uuid;
  result JSON;
BEGIN
  user_role_val := get_user_role();

  IF user_role_val = 'recruiter' THEN
    scope_recruiter := auth.uid();
  ELSIF user_role_val IN ('admin', 'hiring_manager') AND p_recruiter_filter IS NOT NULL THEN
    scope_recruiter := p_recruiter_filter;
  ELSE
    scope_recruiter := NULL;
  END IF;

  SELECT json_build_object(
    'totalJobs', (
      SELECT COUNT(*)::int FROM jobs j
      WHERE (p_job_id IS NULL OR j.id = p_job_id)
        AND (
          scope_recruiter IS NULL
          OR EXISTS (
            SELECT 1 FROM job_recruiters jr
            WHERE jr.job_id = j.id AND jr.recruiter_id = scope_recruiter
          )
        )
    ),
    'openJobs', (
      SELECT COUNT(*)::int FROM jobs j
      WHERE j.status = 'open'
        AND (p_job_id IS NULL OR j.id = p_job_id)
        AND (
          scope_recruiter IS NULL
          OR EXISTS (
            SELECT 1 FROM job_recruiters jr
            WHERE jr.job_id = j.id AND jr.recruiter_id = scope_recruiter
          )
        )
    ),
    'closedJobs', (
      SELECT COUNT(*)::int FROM jobs j
      WHERE j.status = 'closed'
        AND (p_job_id IS NULL OR j.id = p_job_id)
        AND (
          scope_recruiter IS NULL
          OR EXISTS (
            SELECT 1 FROM job_recruiters jr
            WHERE jr.job_id = j.id AND jr.recruiter_id = scope_recruiter
          )
        )
    ),
    'draftJobs', (
      SELECT COUNT(*)::int FROM jobs j
      WHERE j.status = 'draft'
        AND (p_job_id IS NULL OR j.id = p_job_id)
        AND (
          scope_recruiter IS NULL
          OR EXISTS (
            SELECT 1 FROM job_recruiters jr
            WHERE jr.job_id = j.id AND jr.recruiter_id = scope_recruiter
          )
        )
    ),
    'totalCandidates', (
      SELECT COUNT(*)::int FROM candidates c
      WHERE c.deleted_at IS NULL
        AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
        AND (p_job_id IS NULL OR c.job_id = p_job_id)
        AND (p_from_date IS NULL OR c.created_at >= p_from_date)
        AND (p_to_date IS NULL OR c.created_at <= p_to_date)
    ),
    'newCandidates24h', (
      SELECT COUNT(*)::int FROM candidates c
      WHERE c.deleted_at IS NULL
        AND c.created_at >= NOW() - INTERVAL '24 hours'
        AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
        AND (p_job_id IS NULL OR c.job_id = p_job_id)
    ),
    'pendingInterview', (
      SELECT COUNT(*)::int FROM candidates c
      WHERE c.deleted_at IS NULL
        AND c.pipeline_stage = 'interview'
        AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
        AND (p_job_id IS NULL OR c.job_id = p_job_id)
    ),
    'interviewApproved', (
      SELECT COUNT(*)::int FROM candidates c
      WHERE c.deleted_at IS NULL
        AND c.pipeline_stage = 'interview_approved'
        AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
        AND (p_job_id IS NULL OR c.job_id = p_job_id)
    ),
    'hiredCount', (
      SELECT COUNT(*)::int FROM candidates c
      WHERE c.deleted_at IS NULL
        AND c.pipeline_stage = 'hired'
        AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
        AND (p_job_id IS NULL OR c.job_id = p_job_id)
        AND (p_from_date IS NULL OR c.stage_entered_at >= p_from_date)
        AND (p_to_date IS NULL OR c.stage_entered_at <= p_to_date)
    ),
    'stageCounts', COALESCE(
      (
        SELECT json_object_agg(pipeline_stage, cnt)
        FROM (
          SELECT c.pipeline_stage, COUNT(*)::int AS cnt
          FROM candidates c
          WHERE c.deleted_at IS NULL
            AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
            AND (p_job_id IS NULL OR c.job_id = p_job_id)
            AND (p_from_date IS NULL OR c.created_at >= p_from_date)
            AND (p_to_date IS NULL OR c.created_at <= p_to_date)
          GROUP BY c.pipeline_stage
        ) s
      ),
      '{}'::json
    ),
    'applicantsPerJob', COALESCE(
      (
        SELECT json_object_agg(job_id::text, cnt)
        FROM (
          SELECT c.job_id, COUNT(*)::int AS cnt
          FROM candidates c
          WHERE c.deleted_at IS NULL
            AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
            AND (p_job_id IS NULL OR c.job_id = p_job_id)
            AND (p_from_date IS NULL OR c.created_at >= p_from_date)
            AND (p_to_date IS NULL OR c.created_at <= p_to_date)
          GROUP BY c.job_id
        ) j
      ),
      '{}'::json
    ),
    'timeToHireDays', (
      SELECT ROUND((AVG(
        EXTRACT(EPOCH FROM (c.stage_entered_at - c.created_at)) / 86400
      ))::numeric, 1)
      FROM candidates c
      WHERE c.deleted_at IS NULL
        AND c.pipeline_stage = 'hired'
        AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
        AND (p_job_id IS NULL OR c.job_id = p_job_id)
        AND (p_from_date IS NULL OR c.stage_entered_at >= p_from_date)
        AND (p_to_date IS NULL OR c.stage_entered_at <= p_to_date)
    ),
    'timeToFillDays', (
      SELECT ROUND((AVG(days_val))::numeric, 1)
      FROM (
        SELECT EXTRACT(EPOCH FROM (
          COALESCE(
            (
              SELECT MIN(c2.stage_entered_at)
              FROM candidates c2
              WHERE c2.job_id = j.id
                AND c2.deleted_at IS NULL
                AND c2.pipeline_stage = 'hired'
            ),
            CASE WHEN j.status = 'closed' THEN j.updated_at ELSE NULL END
          ) - j.created_at
        )) / 86400 AS days_val
        FROM jobs j
        WHERE (p_job_id IS NULL OR j.id = p_job_id)
          AND (
            scope_recruiter IS NULL
            OR EXISTS (
              SELECT 1 FROM job_recruiters jr
              WHERE jr.job_id = j.id AND jr.recruiter_id = scope_recruiter
            )
          )
          AND (
            j.status = 'closed'
            OR EXISTS (
              SELECT 1 FROM candidates c3
              WHERE c3.job_id = j.id AND c3.deleted_at IS NULL AND c3.pipeline_stage = 'hired'
            )
          )
      ) fills
      WHERE days_val IS NOT NULL AND days_val >= 0
    ),
    'overallConversionRate', (
      SELECT CASE
        WHEN total_cnt = 0 THEN NULL
        ELSE ROUND((100.0 * hired_cnt / total_cnt)::numeric, 1)
      END
      FROM (
        SELECT
          COUNT(*) FILTER (WHERE c.pipeline_stage = 'hired')::int AS hired_cnt,
          COUNT(*)::int AS total_cnt
        FROM candidates c
        WHERE c.deleted_at IS NULL
          AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
          AND (p_job_id IS NULL OR c.job_id = p_job_id)
          AND (p_from_date IS NULL OR c.created_at >= p_from_date)
          AND (p_to_date IS NULL OR c.created_at <= p_to_date)
      ) conv
    ),
    'conversionRates', json_build_object(
      'appliedToEvaluation', (
        SELECT CASE WHEN a = 0 THEN NULL ELSE ROUND((100.0 * e / a)::numeric, 1) END
        FROM (
          SELECT
            COUNT(*) FILTER (WHERE pipeline_stage = 'applied')::float AS a,
            COUNT(*) FILTER (WHERE pipeline_stage IN ('evaluation','interview','interview_approved','hired'))::float AS e
          FROM candidates c
          WHERE c.deleted_at IS NULL
            AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
            AND (p_job_id IS NULL OR c.job_id = p_job_id)
        ) x
      ),
      'evaluationToInterview', (
        SELECT CASE WHEN e = 0 THEN NULL ELSE ROUND((100.0 * i / e)::numeric, 1) END
        FROM (
          SELECT
            COUNT(*) FILTER (WHERE pipeline_stage = 'evaluation')::float AS e,
            COUNT(*) FILTER (WHERE pipeline_stage IN ('interview','interview_approved','hired'))::float AS i
          FROM candidates c
          WHERE c.deleted_at IS NULL
            AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
            AND (p_job_id IS NULL OR c.job_id = p_job_id)
        ) x
      ),
      'interviewToApproved', (
        SELECT CASE WHEN i = 0 THEN NULL ELSE ROUND((100.0 * a / i)::numeric, 1) END
        FROM (
          SELECT
            COUNT(*) FILTER (WHERE pipeline_stage = 'interview')::float AS i,
            COUNT(*) FILTER (WHERE pipeline_stage IN ('interview_approved','hired'))::float AS a
          FROM candidates c
          WHERE c.deleted_at IS NULL
            AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
            AND (p_job_id IS NULL OR c.job_id = p_job_id)
        ) x
      )
    ),
    'slaWarningCount', (
      SELECT COUNT(*)::int FROM candidates c
      WHERE c.deleted_at IS NULL
        AND c.pipeline_stage IN ('applied','evaluation','interview','interview_approved')
        AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
        AND (p_job_id IS NULL OR c.job_id = p_job_id)
        AND (
          (c.pipeline_stage = 'applied' AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 >= 1.5 AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 <= 2)
          OR (c.pipeline_stage = 'evaluation' AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 >= 4 AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 <= 5)
          OR (c.pipeline_stage = 'interview' AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 >= 5.5 AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 <= 7)
          OR (c.pipeline_stage = 'interview_approved' AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 >= 2.5 AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 <= 3)
        )
    ),
    'slaBreachedCount', (
      SELECT COUNT(*)::int FROM candidates c
      WHERE c.deleted_at IS NULL
        AND c.pipeline_stage IN ('applied','evaluation','interview','interview_approved')
        AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
        AND (p_job_id IS NULL OR c.job_id = p_job_id)
        AND (
          (c.pipeline_stage = 'applied' AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 > 2)
          OR (c.pipeline_stage = 'evaluation' AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 > 5)
          OR (c.pipeline_stage = 'interview' AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 > 7)
          OR (c.pipeline_stage = 'interview_approved' AND EXTRACT(EPOCH FROM (NOW() - c.stage_entered_at))/86400 > 3)
        )
    ),
    'jobsWithoutRecruiters', (
      SELECT COUNT(*)::int FROM jobs j
      WHERE j.status = 'open'
        AND (p_job_id IS NULL OR j.id = p_job_id)
        AND NOT EXISTS (SELECT 1 FROM job_recruiters jr WHERE jr.job_id = j.id)
        AND scope_recruiter IS NULL
    ),
    'teamWorkload', COALESCE(
      (
        SELECT json_agg(row_to_json(t))
        FROM (
          SELECT
            p.id AS recruiter_id,
            p.full_name,
            p.avatar_url,
            (
              SELECT COUNT(*)::int FROM job_recruiters jr
              WHERE jr.recruiter_id = p.id
                AND (p_job_id IS NULL OR jr.job_id = p_job_id)
            ) AS job_count,
            (
              SELECT COUNT(*)::int FROM candidates c
              WHERE c.deleted_at IS NULL
                AND c.assigned_recruiter_id = p.id
                AND c.pipeline_stage NOT IN ('hired', 'rejected')
                AND (p_job_id IS NULL OR c.job_id = p_job_id)
            ) AS active_candidates,
            (
              SELECT COUNT(*)::int FROM interviews i
              JOIN candidates c ON c.id = i.candidate_id
              WHERE c.assigned_recruiter_id = p.id
                AND i.scheduled_at IS NOT NULL
                AND i.scheduled_at >= date_trunc('week', NOW())
                AND i.scheduled_at < date_trunc('week', NOW()) + INTERVAL '7 days'
            ) AS interviews_this_week
          FROM profiles p
          WHERE p.role = 'recruiter'
            AND (scope_recruiter IS NULL OR p.id = scope_recruiter)
          ORDER BY active_candidates DESC
        ) t
      ),
      '[]'::json
    ),
    'sourceCounts', COALESCE(
      (
        SELECT json_object_agg(src, cnt)
        FROM (
          SELECT c.application_source::text AS src, COUNT(*)::int AS cnt
          FROM candidates c
          WHERE c.deleted_at IS NULL
            AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
            AND (p_job_id IS NULL OR c.job_id = p_job_id)
            AND (p_from_date IS NULL OR c.created_at >= p_from_date)
            AND (p_to_date IS NULL OR c.created_at <= p_to_date)
          GROUP BY c.application_source
        ) sc
      ),
      '{}'::json
    ),
    'costPerHire', (
      SELECT CASE
        WHEN hired_cnt = 0 OR total_cost IS NULL OR total_cost = 0 THEN NULL
        ELSE ROUND((total_cost / hired_cnt)::numeric, 2)
      END
      FROM (
        SELECT
          (
            SELECT COUNT(*)::numeric FROM candidates c
            WHERE c.deleted_at IS NULL AND c.pipeline_stage = 'hired'
              AND (scope_recruiter IS NULL OR c.assigned_recruiter_id = scope_recruiter)
              AND (p_job_id IS NULL OR c.job_id = p_job_id)
          ) AS hired_cnt,
          (
            SELECT COALESCE(SUM(jrc.amount), 0) FROM job_recruitment_costs jrc
            WHERE (p_job_id IS NULL OR jrc.job_id = p_job_id)
              AND (
                scope_recruiter IS NULL
                OR EXISTS (
                  SELECT 1 FROM job_recruiters jr
                  WHERE jr.job_id = jrc.job_id AND jr.recruiter_id = scope_recruiter
                )
              )
          ) AS total_cost
      ) cost_calc
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON AS $$
  SELECT get_dashboard_analytics(NULL, NULL, NULL, NULL);
$$ LANGUAGE sql SECURITY DEFINER STABLE;
