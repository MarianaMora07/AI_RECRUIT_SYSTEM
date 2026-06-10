import { withGeminiRetry } from "@/lib/ai/retry";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { formatRequirementsHeuristic } from "@/lib/utils/format-requirements-heuristic";
import { logger } from "@/lib/logger";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  return new GoogleGenerativeAI(apiKey);
}

export async function formatJobRequirementsWithAi(
  requirements: string,
  jobTitle?: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return formatRequirementsHeuristic(requirements);
  }

  const prompt = `Organiza los siguientes requisitos técnicos de una vacante${jobTitle ? ` ("${jobTitle}")` : ""} en markdown legible en español.

Reglas:
- Usa secciones con ## solo si hay más de un grupo temático (ej: Frontend, Backend).
- Cada requisito en una línea con guión (- ).
- Resalta tecnologías clave con **negrita** al inicio del ítem cuando aplique (ej: - **React:** experiencia avanzada...).
- No inventes requisitos; solo reorganiza el texto dado.
- Responde ÚNICAMENTE con markdown, sin explicaciones.

REQUISITOS ORIGINALES:
${requirements.slice(0, 4000)}`;

  try {
    const primary = process.env.AI_MODEL_VERSION || "gemini-2.5-flash";
    const { result: text } = await withGeminiRetry(async (modelName) => {
      const client = getClient();
      const model = client.getGenerativeModel({ model: modelName });
      const response = await model.generateContent(prompt);
      return response.response.text().trim();
    }, primary);

    return text.replace(/^```(?:markdown)?\s*/i, "").replace(/\s*```$/i, "").trim()
      || formatRequirementsHeuristic(requirements);
  } catch (err) {
    logger.warn("requirements formatting failed, using heuristic", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return formatRequirementsHeuristic(requirements);
  }
}
