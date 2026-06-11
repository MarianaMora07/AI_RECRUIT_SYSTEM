import { notFound } from "next/navigation";
import { CandidateDetailClient } from "@/components/candidates/CandidateDetailClient";
import { getServerAuth, getProfile } from "@/lib/api/auth";
import { canManagePipeline } from "@/lib/constants/roles";
import { fetchCandidateById } from "@/lib/data/candidates";

export const revalidate = 0;

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ supabase, user }, candidate] = await Promise.all([
    getServerAuth(),
    fetchCandidateById(id),
  ]);

  if (!candidate) notFound();

  const profile = user ? await getProfile(user.id, supabase) : null;

  return (
    <CandidateDetailClient
      candidate={candidate}
      canManagePipeline={canManagePipeline(profile?.role)}
      userRole={profile?.role ?? null}
    />
  );
}
