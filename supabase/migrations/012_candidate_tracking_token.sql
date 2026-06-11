-- Enlace público de seguimiento para candidatos (sin login ni correo)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS public_tracking_token TEXT;

UPDATE candidates
SET public_tracking_token = encode(gen_random_bytes(24), 'hex')
WHERE public_tracking_token IS NULL;

ALTER TABLE candidates
  ALTER COLUMN public_tracking_token SET NOT NULL,
  ALTER COLUMN public_tracking_token SET DEFAULT encode(gen_random_bytes(24), 'hex');

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_public_tracking_token
  ON candidates(public_tracking_token);
