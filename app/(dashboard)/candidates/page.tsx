import { Suspense } from "react";
import { CandidatesClient } from "@/components/candidates/CandidatesClient";
import { fetchCandidatesByJob } from "@/lib/data/candidates";
import { Spinner } from "@/components/ui/Spinner";

export const revalidate = 10;

async function CandidatesContent({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; semantic?: string }>;
}) {
  const params = await searchParams;
  const jobId = params.jobId ?? "";
  const semantic = params.semantic === "true";

  const candidates = jobId
    ? await fetchCandidatesByJob(jobId, semantic)
    : [];

  return (
    <CandidatesClient
      jobId={jobId}
      initialCandidates={candidates}
      initialSemantic={semantic}
    />
  );
}

export default function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; semantic?: string }>;
}) {
  return (
    <Suspense fallback={<Spinner className="mx-auto mt-20" size="lg" />}>
      <CandidatesContent searchParams={searchParams} />
    </Suspense>
  );
}
