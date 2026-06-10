import { Suspense } from "react";
import { CandidatesClient } from "@/components/candidates/CandidatesClient";
import {
  fetchCandidatesByJob,
  fetchCandidatesList,
} from "@/lib/data/candidates";
import { fetchJobsMinimal } from "@/lib/data/jobs";
import { Spinner } from "@/components/ui/Spinner";
import type { CandidateCardData } from "@/components/candidates/CandidateCard";

export const revalidate = 10;

function filterByQuery<T extends { full_name: string; email: string }>(
  items: T[],
  q?: string
): T[] {
  const term = q?.trim().toLowerCase();
  if (!term) return items;
  return items.filter(
    (c) =>
      c.full_name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
  );
}

async function CandidatesContent({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; q?: string; semantic?: string }>;
}) {
  const params = await searchParams;
  const jobId = params.jobId;
  const q = params.q;
  const semantic = params.semantic === "true";

  const jobs = await fetchJobsMinimal();

  let candidates: CandidateCardData[];

  if (semantic && jobId) {
    const ranked = await fetchCandidatesByJob(jobId, true);
    candidates = filterByQuery(ranked as CandidateCardData[], q);
  } else {
    candidates = (await fetchCandidatesList({ jobId, q })) as CandidateCardData[];
  }

  return (
    <CandidatesClient
      initialCandidates={candidates}
      jobs={jobs}
      initialJobId={jobId}
      initialQuery={q}
      initialSemantic={semantic}
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
