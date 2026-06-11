import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EmbedContentRequest } from "@google/generative-ai";
import type { AiResponse } from "@/lib/constants/ai-schema";
import { buildCandidateAnalysisPrompt, type JobContext } from "@/lib/ai/prompt";
import { parseAiResponse } from "@/lib/ai/parse-response";
import { containsUnsanitizedPii, sanitizePii } from "@/lib/ai/pii-sanitizer";
import { withEmbeddingRetry, withGeminiRetry } from "@/lib/ai/retry";
import { logger } from "@/lib/logger";

/** Must match `vector(768)` columns in Supabase migrations. */
const EMBEDDING_DIMENSIONS = 768;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  return new GoogleGenerativeAI(apiKey);
}

function l2Normalize(values: number[]): number[] {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return values;
  return values.map((value) => value / magnitude);
}

export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  const primary = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
  const client = getClient();
  const content = text.slice(0, 8000);

  const response = await withEmbeddingRetry(async (modelName) => {
    const model = client.getGenerativeModel({ model: modelName });
    const request = {
      content: { parts: [{ text: content }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    } as EmbedContentRequest & { outputDimensionality: number };
    const result = await model.embedContent(request);
    const values = result.embedding.values;

    if (values.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `expected ${EMBEDDING_DIMENSIONS} dimensions, not ${values.length}`
      );
    }

    return l2Normalize(values);
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
