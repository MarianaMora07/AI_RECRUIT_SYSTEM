import { Suspense } from "react";
import { fetchPipelineCandidates } from "@/lib/data/candidates";
import { fetchJobsMinimal } from "@/lib/data/jobs";
import { getServerAuth, getProfile } from "@/lib/api/auth";
import { canManagePipeline, isHiringManager } from "@/lib/constants/roles";
import { PipelineClient } from "@/components/pipeline/PipelineClient";
import { Spinner } from "@/components/ui/Spinner";
import {
  PIPELINE_STAGES,
  type PipelineStage,
} from "@/lib/constants/roles";

export const revalidate = 10;

function parseStage(value?: string): PipelineStage | undefined {
  if (!value) return undefined;
  return PIPELINE_STAGES.includes(value as PipelineStage)
    ? (value as PipelineStage)
    : undefined;
}

async function PipelineContent({
  searchParams,
}: {
  searchParams: Promise<{
    jobId?: string;
    stage?: string;
    semantic?: string;
  }>;
}) {
  const params = await searchParams;
  const jobId = params.jobId;
  const stage = parseStage(params.stage);
  const semantic = jobId ? params.semantic !== "false" : false;

  const [candidates, jobs, auth] = await Promise.all([
    fetchPipelineCandidates({ jobId, stage, semantic: jobId ? semantic : false }),
    fetchJobsMinimal(),
    getServerAuth(),
  ]);

  const profile = auth.user ? await getProfile(auth.user.id, auth.supabase) : null;

  return (
    <PipelineClient
      initialCandidates={candidates}
      initialJobs={jobs}
      initialJobId={jobId}
      initialStage={stage}
      initialSemantic={semantic}
      canManagePipeline={canManagePipeline(profile?.role)}
      isHiringManager={isHiringManager(profile?.role)}
    />
  );
}

export default function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{
    jobId?: string;
    stage?: string;
    semantic?: string;
  }>;
}) {
  return (
    <Suspense fallback={<Spinner className="mx-auto mt-20" size="lg" />}>
      <PipelineContent searchParams={searchParams} />
    </Suspense>
  );
}
