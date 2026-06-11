import { getSiteUrl } from "@/lib/automation/config";

export function getCandidateTrackingUrl(token: string): string {
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}/track/${token}`;
}

export function buildCandidateTrackingWhatsAppMessage(params: {
  url: string;
  candidateName?: string;
  jobTitle?: string;
}): string {
  const { url, candidateName, jobTitle } = params;
  if (candidateName && jobTitle) {
    return `Hola ${candidateName}, aquí puedes consultar el estado de tu postulación a "${jobTitle}":\n\n${url}`;
  }
  if (candidateName) {
    return `Hola ${candidateName}, aquí puedes consultar el estado de tu postulación:\n\n${url}`;
  }
  return `Consulta el estado de tu postulación aquí:\n\n${url}`;
}

export function getCandidateTrackingWhatsAppUrl(params: {
  url: string;
  candidateName?: string;
  jobTitle?: string;
}): string {
  const text = buildCandidateTrackingWhatsAppMessage(params);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
