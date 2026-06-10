import { formatJobRequirementsWithAi } from "@/lib/ai/format-requirements";
import { generateEmbedding } from "@/lib/ai/gemini";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

export async function processJobContent(params: {
  jobId: string;
  title: string;
  description?: string;
  requirements: string;
  userId?: string;
}) {
  await Promise.all([
    processJobEmbedding(params),
    processJobRequirementsFormat(params),
  ]);
}

export async function processJobRequirementsFormat(params: {
  jobId: string;
  title: string;
  requirements: string;
  userId?: string;
}): Promise<boolean> {
  const { jobId, title, requirements, userId } = params;

  if (!requirements.trim()) return false;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    logger.error("admin client unavailable for requirements format", {
      route: "/api/jobs",
      userId,
      message: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }

  try {
    const formatted = await formatJobRequirementsWithAi(requirements, title);

    const { error } = await supabase
      .from("jobs")
      .update({ requirements_formatted: formatted })
      .eq("id", jobId);

    if (error) {
      logger.error("requirements_formatted update failed", {
        route: "/api/jobs",
        jobId,
        message: error.message,
      });
      return false;
    }

    logger.info("job requirements formatted", { route: "/api/jobs", jobId });
    return true;
  } catch (err) {
    logger.error("job requirements format failed", {
      route: "/api/jobs",
      jobId,
      message: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }
}

export async function processJobEmbedding(params: {
  jobId: string;
  title: string;
  description?: string;
  requirements: string;
  userId?: string;
}): Promise<boolean> {
  const { jobId, title, description, requirements, userId } = params;

  if (!process.env.GEMINI_API_KEY) return false;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    logger.error("admin client unavailable for job embedding", {
      route: "/api/jobs",
      userId,
      message: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }

  try {
    const text = `${title}\n${description ?? ""}\n${requirements}`.slice(
      0,
      8000
    );
    const embedding = await generateEmbedding(text);

    if (!embedding) {
      logger.warn("job embedding generation returned null", {
        route: "/api/jobs",
        jobId,
      });
      return false;
    }

    const { error } = await supabase
      .from("jobs")
      .update({ embedding })
      .eq("id", jobId);

    if (error) {
      logger.error("job embedding update failed", {
        route: "/api/jobs",
        jobId,
        message: error.message,
      });
      return false;
    }

    logger.info("job embedding saved", { route: "/api/jobs", jobId });
    return true;
  } catch (err) {
    logger.error("job embedding failed", {
      route: "/api/jobs",
      jobId,
      message: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }
}
