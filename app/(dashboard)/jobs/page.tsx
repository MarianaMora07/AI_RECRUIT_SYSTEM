import { Suspense } from "react";
import { fetchJobs } from "@/lib/data/jobs";
import { JobsClient } from "@/components/jobs/JobsClient";
import { Spinner } from "@/components/ui/Spinner";

export const revalidate = 15;

async function JobsContent({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const params = await searchParams;
  const jobs = await fetchJobs();

  return (
    <JobsClient initialJobs={jobs} highlightJobId={params.selected} />
  );
}

export default function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  return (
    <Suspense fallback={<Spinner className="mx-auto mt-20" size="lg" />}>
      <JobsContent searchParams={searchParams} />
    </Suspense>
  );
}
