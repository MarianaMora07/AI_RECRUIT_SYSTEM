-- Allow admin and hiring_manager to delete jobs only when unassigned.

DROP POLICY IF EXISTS jobs_delete ON jobs;

CREATE POLICY jobs_delete ON jobs FOR DELETE TO authenticated
  USING (
    get_user_role() IN ('admin', 'hiring_manager')
    AND NOT EXISTS (
      SELECT 1 FROM job_recruiters jr WHERE jr.job_id = jobs.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM candidates c
      WHERE c.job_id = jobs.id AND c.deleted_at IS NULL
    )
  );
