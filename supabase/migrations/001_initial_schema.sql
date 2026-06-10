-- AI Recruitment Platform — initial schema
-- Run in Supabase SQL Editor or via CLI

CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'recruiter', 'hiring_manager');
CREATE TYPE job_status AS ENUM ('draft', 'open', 'closed');
CREATE TYPE pipeline_stage AS ENUM ('applied', 'evaluation', 'interview', 'hired', 'rejected');
CREATE TYPE seniority_level AS ENUM ('Junior', 'Mid', 'Senior', 'Lead');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'recruiter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '',
  status job_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  embedding vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cv_storage_path TEXT,
  cv_text TEXT,
  pipeline_stage pipeline_stage NOT NULL DEFAULT 'applied',
  embedding vector(768),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scores (AI evaluation)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE UNIQUE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  summary TEXT,
  classification seniority_level,
  suggestions TEXT,
  risk_level risk_level,
  fit_score NUMERIC(5,2),
  similarity_score NUMERIC(5,2),
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interviews
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ,
  evaluator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI audit logs (no PII in prompts)
CREATE TABLE ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  prompt_anonymized TEXT NOT NULL,
  model_version TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  response_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API error logs (observability, no PII)
CREATE TABLE api_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL,
  user_id UUID,
  error_code TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_candidates_job_id ON candidates(job_id);
CREATE INDEX idx_candidates_pipeline ON candidates(pipeline_stage);
CREATE INDEX idx_candidates_deleted ON candidates(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_scores_job_id ON scores(job_id);
CREATE INDEX idx_ai_audit_candidate ON ai_audit_logs(candidate_id);

CREATE INDEX idx_jobs_embedding ON jobs USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_candidates_embedding ON candidates USING hnsw (embedding vector_cosine_ops);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER candidates_updated_at BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER scores_updated_at BEFORE UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER interviews_updated_at BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'recruiter')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_error_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR get_user_role() = 'admin');
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR get_user_role() = 'admin');

-- Jobs policies
CREATE POLICY jobs_select ON jobs FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('admin', 'recruiter')
    OR (get_user_role() = 'hiring_manager')
  );
CREATE POLICY jobs_insert ON jobs FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'recruiter') AND created_by = auth.uid());
CREATE POLICY jobs_update ON jobs FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'recruiter'));
CREATE POLICY jobs_delete ON jobs FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- Candidates policies
CREATE POLICY candidates_select ON candidates FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND get_user_role() IN ('admin', 'recruiter', 'hiring_manager'));
CREATE POLICY candidates_insert ON candidates FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'recruiter'));
CREATE POLICY candidates_update ON candidates FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'recruiter'));
CREATE POLICY candidates_delete ON candidates FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- Scores policies
CREATE POLICY scores_select ON scores FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'recruiter', 'hiring_manager'));
CREATE POLICY scores_insert ON scores FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'recruiter'));
CREATE POLICY scores_update ON scores FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'recruiter'));

-- Interviews policies
CREATE POLICY interviews_select ON interviews FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'recruiter', 'hiring_manager'));
CREATE POLICY interviews_all ON interviews FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'recruiter'));

-- AI audit policies
CREATE POLICY ai_audit_select ON ai_audit_logs FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'recruiter'));
CREATE POLICY ai_audit_insert ON ai_audit_logs FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'recruiter'));

-- API error logs (admin only read, service inserts via service role)
CREATE POLICY api_errors_select ON api_error_logs FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

-- Storage bucket for CVs (run separately in Supabase dashboard or storage migration)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false);
