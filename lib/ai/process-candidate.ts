import { analyzeCandidate, generateEmbedding } from "@/lib/ai/gemini";
import { logger } from "@/lib/logger";
import { dispatchN8nEvent } from "@/lib/n8n/dispatch";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProcessCandidateAiResult =
  | { ok: true; classification: string; fitScore: number }
  | { ok: false; reason: string };

export async function processCandidateAi(params: {
  candidateId: string;
  jobId: string;
  jobTitle: string;
  jobDescription?: string;
  jobRequirements: string;
  cvText: string;
  userId: string;
  replaceExisting?: boolean;
}): Promise<ProcessCandidateAiResult> {
  const {
    candidateId,
    jobId,
    jobTitle,
    jobDescription,
    jobRequirements,
    cvText,
    userId,
    replaceExisting = false,
  } = params;

  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, reason: "GEMINI_API_KEY no configurada" };
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    logger.error("admin client unavailable for AI processing", {
      route: "/api/upload",
      userId,
      message: err instanceof Error ? err.message : "unknown",
    });
    return { ok: false, reason: "Cliente admin de Supabase no disponible" };
  }

  try {
    if (replaceExisting) {
      await supabase.from("scores").delete().eq("candidate_id", candidateId);
    }

    const analysis = await analyzeCandidate(cvText, {
      title: jobTitle,
      description: jobDescription,
      requirements: jobRequirements,
    });

    const skillsPayload = {
      experienceYears: analysis.result.experienceYears ?? null,
      matched: analysis.result.matchedSkills ?? [],
      missing: analysis.result.missingSkills ?? [],
    };

    const { error: scoreError } = await supabase.from("scores").upsert(
      {
        candidate_id: candidateId,
        job_id: jobId,
        summary: analysis.result.summary,
        classification: analysis.result.classification,
        suggestions: analysis.result.suggestions,
        risk_level: analysis.result.riskLevel,
        fit_score: analysis.result.fitScore,
        skills: skillsPayload,
      },
      { onConflict: "candidate_id" }
    );

    if (scoreError) {
      logger.error("score upsert failed", {
        route: "/api/upload",
        userId,
        message: scoreError.message,
      });
      throw new Error(scoreError.message);
    }

    const { error: auditError } = await supabase.from("ai_audit_logs").insert({
      candidate_id: candidateId,
      job_id: jobId,
      prompt_anonymized: analysis.promptAnonymized,
      model_version: analysis.model,
      latency_ms: analysis.latencyMs,
      response_json: analysis.result,
    });

    if (auditError) {
      logger.warn("audit log insert failed", {
        route: "/api/upload",
        userId,
        message: auditError.message,
      });
    }

    try {
      const embedding = await generateEmbedding(
        `${jobTitle}\n${jobRequirements}\n${cvText}`.slice(0, 8000)
      );
      if (embedding) {
        await supabase
          .from("candidates")
          .update({ embedding })
          .eq("id", candidateId);
      }
    } catch (embedErr) {
      logger.warn("embedding skipped, analysis saved", {
        route: "/api/upload",
        userId,
        message: embedErr instanceof Error ? embedErr.message : "unknown",
      });
    }

    logger.info("AI analysis completed", {
      route: "/api/upload",
      userId,
      candidateId,
      classification: analysis.result.classification,
      fitScore: analysis.result.fitScore,
      experienceYears: analysis.result.experienceYears,
    });

    void dispatchN8nEvent("candidate.scored", {
      candidateId,
      classification: analysis.result.classification,
      riskLevel: analysis.result.riskLevel,
      fitScore: analysis.result.fitScore,
      jobTitle,
    });

    return {
      ok: true,
      classification: analysis.result.classification,
      fitScore: analysis.result.fitScore,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    logger.error("AI analysis failed", {
      route: "/api/upload",
      userId,
      message,
    });

    if (/429|quota|rate.?limit/i.test(message)) {
      return {
        ok: false,
        reason:
          "Cuota de Gemini agotada. Cambia AI_MODEL_VERSION a gemini-2.5-flash o espera unos minutos.",
      };
    }

    return { ok: false, reason: message };
  }
}
