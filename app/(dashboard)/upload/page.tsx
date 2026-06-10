import { Suspense } from "react";
import { fetchJobs } from "@/lib/data/jobs";
import { UploadClient } from "@/components/upload/UploadClient";
import { Spinner } from "@/components/ui/Spinner";

async function UploadContent({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const params = await searchParams;
  const jobs = await fetchJobs();
  const minimalJobs = jobs.map((j) => ({ id: j.id, title: j.title }));
  return (
    <UploadClient
      jobs={minimalJobs}
      preselectedJob={params.jobId ?? ""}
    />
  );
}

export default function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  return (
    <Suspense fallback={<Spinner className="mx-auto mt-20" size="lg" />}>
      <UploadContent searchParams={searchParams} />
    </Suspense>
  );
}
