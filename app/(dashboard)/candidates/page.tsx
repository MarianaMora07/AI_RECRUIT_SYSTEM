import { Suspense } from "react";
import { CandidatesClient } from "@/components/candidates/CandidatesClient";
import {
  fetchCandidatesList,
} from "@/lib/data/candidates";
import { fetchJobsMinimal } from "@/lib/data/jobs";
import { Spinner } from "@/components/ui/Spinner";
import type { CandidateCardData } from "@/components/candidates/CandidateCard";

export const revalidate = 10;

async function CandidatesContent({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; q?: string; semantic?: string }>;
}) {
  const params = await searchParams;
  const jobId = params.jobId;
  const q = params.q;
  const rankByAffinity = jobId ? params.semantic !== "false" : true;

  const jobs = await fetchJobsMinimal();

  const candidates = (await fetchCandidatesList(
    { jobId, q },
    { rankByAffinity: Boolean(jobId) && rankByAffinity }
  )) as CandidateCardData[];

  return (
    <CandidatesClient
      initialCandidates={candidates}
      jobs={jobs}
      initialJobId={jobId}
      initialQuery={q}
      initialSemantic={Boolean(jobId) && rankByAffinity}
    />
  );
}

export default function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; q?: string; semantic?: string }>;
}) {
  return (
    <Suspense fallback={<Spinner className="mx-auto mt-20" size="lg" />}>
      <CandidatesContent searchParams={searchParams} />
    </Suspense>
  );
}
