-- Phase 2: application source + job segmentation fields

DO $$ BEGIN
  CREATE TYPE application_source AS ENUM (
    'public_portal',
    'manual_upload',
    'linkedin',
    'indeed',
    'referral',
    'agency',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE job_priority AS ENUM ('urgent', 'standard');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE work_mode AS ENUM ('remote', 'hybrid', 'onsite');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS application_source application_source NOT NULL DEFAULT 'manual_upload';

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS work_mode work_mode,
  ADD COLUMN IF NOT EXISTS priority job_priority NOT NULL DEFAULT 'standard';

CREATE INDEX IF NOT EXISTS idx_candidates_application_source ON candidates(application_source);
CREATE INDEX IF NOT EXISTS idx_jobs_department ON jobs(department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON jobs(priority);
