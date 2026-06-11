-- Pre-oferta: recta final tras entrevista técnica aprobada (Equipo de Talento / RRHH)

CREATE TABLE IF NOT EXISTS candidate_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE UNIQUE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  base_salary NUMERIC(12, 2),
  bonus TEXT,
  proposed_start_date DATE,
  internal_approval_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_approval', 'approved')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_offers_candidate
  ON candidate_offers(candidate_id);

CREATE TRIGGER candidate_offers_updated_at
  BEFORE UPDATE ON candidate_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE candidate_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_offers_select ON candidate_offers
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'recruiter', 'hiring_manager'));

CREATE POLICY candidate_offers_write ON candidate_offers
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'recruiter'))
  WITH CHECK (get_user_role() IN ('admin', 'recruiter'));
