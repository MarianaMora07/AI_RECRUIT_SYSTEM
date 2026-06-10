import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiResponse } from "@/lib/constants/ai-schema";
import { buildCandidateAnalysisPrompt, type JobContext } from "@/lib/ai/prompt";
import { parseAiResponse } from "@/lib/ai/parse-response";
import { containsUnsanitizedPii, sanitizePii } from "@/lib/ai/pii-sanitizer";
import { withEmbeddingRetry, withGeminiRetry } from "@/lib/ai/retry";
import { logger } from "@/lib/logger";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  return new GoogleGenerativeAI(apiKey);
}

export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  const primary = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
  const client = getClient();

  const response = await withEmbeddingRetry(async (modelName) => {
    const model = client.getGenerativeModel({ model: modelName });
    const result = await model.embedContent(text.slice(0, 8000));
    return result.embedding.values;
  }, primary);

  if (!response) {
    logger.warn("embedding generation failed for all models", {
      primary,
    });
    return null;
  }

  return response.result;
}

export async function analyzeCandidate(
  cvText: string,
  job: JobContext
): Promise<{
  result: AiResponse;
  promptAnonymized: string;
  latencyMs: number;
  model: string;
}> {
  const sanitized = sanitizePii(cvText);

  if (containsUnsanitizedPii(sanitized)) {
    throw new Error("PII_DETECTED_IN_PROMPT");
  }

  const promptAnonymized = buildCandidateAnalysisPrompt(cvText, job);

  const start = Date.now();
  const primary = process.env.AI_MODEL_VERSION || "gemini-2.5-flash";

  const { result: text, model } = await withGeminiRetry(async (modelName) => {
    const client = getClient();
    const generativeModel = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const response = await generativeModel.generateContent(promptAnonymized);
    return response.response.text();
  }, primary);

  const latencyMs = Date.now() - start;

  const result = parseAiResponse(text);

  return {
    result,
    promptAnonymized,
    latencyMs,
    model,
  };
}
