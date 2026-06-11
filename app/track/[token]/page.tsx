import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CandidateStatusView } from "@/components/track/CandidateStatusView";
import { fetchCandidateStatusByToken } from "@/lib/data/candidate-tracking";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Estado de postulación — AI Recruit",
  description: "Consulta el avance de tu proceso de selección",
  robots: { index: false, follow: false },
};

export default async function CandidateTrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const status = await fetchCandidateStatusByToken(token);

  if (!status) notFound();

  return <CandidateStatusView status={status} />;
}
