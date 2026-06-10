import { notFound } from "next/navigation";
import { CandidateDetailClient } from "@/components/candidates/CandidateDetailClient";
import { fetchCandidateById } from "@/lib/data/candidates";

export const revalidate = 0;

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await fetchCandidateById(id);

  if (!candidate) notFound();

  return <CandidateDetailClient candidate={candidate} />;
}
