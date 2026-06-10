import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SlaBadge } from "@/components/ui/SlaBadge";
import { PIPELINE_STAGE_LABELS, type PipelineStage } from "@/lib/constants/roles";

interface Score {
  summary?: string;
  classification?: string;
  fit_score?: number;
}

export interface CandidateCardData {
  id: string;
  full_name: string;
  email: string;
  pipeline_stage: PipelineStage;
  job_id: string;
  stage_entered_at?: string | null;
  similarity_pct?: number;
  scores?: Score[] | Score | null;
  jobs?: { title: string } | { title: string }[] | null;
}

function getScore(scores?: CandidateCardData["scores"]) {
  if (!scores) return undefined;
  return Array.isArray(scores) ? scores[0] : scores;
}

function getJobTitle(jobs?: CandidateCardData["jobs"]) {
  if (!jobs) return undefined;
  return Array.isArray(jobs) ? jobs[0]?.title : jobs.title;
}

export function CandidateCard({
  candidate,
  rank,
  showJob = false,
}: {
  candidate: CandidateCardData;
  rank?: number;
  showJob?: boolean;
}) {
  const score = getScore(candidate.scores);
  const jobTitle = getJobTitle(candidate.jobs);
  const affinity = candidate.similarity_pct ?? score?.fit_score;

  return (
    <Card className="card-elevated !p-4 md:!p-5 h-full">
      <div className="flex items-start gap-3 md:gap-4">
        <Avatar name={candidate.full_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {rank != null && (
              <span className="text-sm font-extrabold gradient-text">#{rank}</span>
            )}
            <Link
              href={`/candidates/${candidate.id}`}
              className="font-bold text-base hover:text-[var(--accent)] truncate"
            >
              {candidate.full_name}
            </Link>
          </div>
          <p className="text-sm text-[var(--foreground-muted)] truncate">
            {candidate.email}
          </p>
          {showJob && jobTitle && (
            <p className="text-xs text-[var(--foreground-muted)] mt-1 truncate">
              Vacante: {jobTitle}
            </p>
          )}
          {score?.summary && (
            <p className="text-sm mt-2 line-clamp-2 text-[var(--foreground-muted)]">
              {score.summary}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge>
            {PIPELINE_STAGE_LABELS[candidate.pipeline_stage]}
          </Badge>
          <SlaBadge
            stage={candidate.pipeline_stage}
            stageEnteredAt={candidate.stage_entered_at}
          />
          {score?.classification && (
            <Badge variant="info">{score.classification}</Badge>
          )}
          {affinity != null && (
            <span className="text-sm font-bold text-[var(--accent)]">
              {affinity}% afinidad
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
