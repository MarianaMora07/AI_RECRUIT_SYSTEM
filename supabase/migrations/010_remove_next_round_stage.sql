-- Migrar candidatos que quedaron en next_round (etapa eliminada)
UPDATE candidates
SET pipeline_stage = 'interview_approved'
WHERE pipeline_stage = 'next_round';
