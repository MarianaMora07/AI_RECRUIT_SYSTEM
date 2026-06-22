import type { Metadata } from "next";
import { Suspense } from "react";
import { CandidateApplyClient } from "@/components/public/CandidateApplyClient";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Postular — AI Recruit",
  description: "Aplica a vacantes abiertas y carga tu CV",
  robots: { index: false, follow: false },
};

export default function CandidatosPage() {
  return (
    <Suspense fallback={<Spinner className="mx-auto mt-20" size="lg" />}>
      <CandidateApplyClient />
    </Suspense>
  );
}
