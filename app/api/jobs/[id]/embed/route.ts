import { getAuthenticatedClient } from "@/lib/api/auth";
import { processJobContent } from "@/lib/ai/process-job";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { JOB_LIST_COLUMNS } from "@/lib/constants/queries";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  if (!process.env.GEMINI_API_KEY) {
    return jsonError("Embeddings no configurados", 503);
  }

  const { id } = await params;

  const { data: job, error } = await supabase
    .from("jobs")
    .select(JOB_LIST_COLUMNS)
    .eq("id", id)
    .single();

  if (error || !job) return jsonError("Vacante no encontrada", 404);

  await processJobContent({
    jobId: job.id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    userId: user.id,
  });

  return jsonOk({ processed: true, jobId: id });
}
