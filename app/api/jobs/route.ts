import { after } from "next/server";
import { getAuthenticatedClient } from "@/lib/api/auth";
import { processJobContent } from "@/lib/ai/process-job";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { JOB_LIST_COLUMNS } from "@/lib/constants/queries";
import { logger } from "@/lib/logger";
import { createJobSchema } from "@/lib/validations/jobs";

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return jsonUnauthorized();

  const minimal = new URL(request.url).searchParams.get("minimal") === "true";
  const columns = minimal
    ? "id, title, status"
    : JOB_LIST_COLUMNS;

  const { data, error } = await supabase
    .from("jobs")
    .select(columns)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("jobs list failed", { route: "/api/jobs", userId: user.id });
    return jsonError("No se pudieron cargar las vacantes", 500);
  }

  return jsonOk(data);
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedClient({ strict: true });
  if (!user) return jsonUnauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido");
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...parsed.data, created_by: user.id })
    .select(JOB_LIST_COLUMNS)
    .single();

  if (error) {
    logger.error("job create failed", { route: "/api/jobs", userId: user.id });
    return jsonError("No se pudo crear la vacante", 500);
  }

  if (process.env.GEMINI_API_KEY) {
    after(async () => {
      await processJobContent({
        jobId: data.id,
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        userId: user.id,
      });
    });
  }

  return jsonOk(data, 201);
}
