-- Profile avatars + optimized dashboard metrics RPC

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Aggregated metrics (single round-trip instead of full table scans)
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON AS $$
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
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Avatar storage bucket (public read for profile images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY avatars_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY avatars_update ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY avatars_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY avatars_public_read ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'avatars');
