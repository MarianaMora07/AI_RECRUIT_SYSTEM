const RETRYABLE = /503|429|UNAVAILABLE|high demand|overloaded|temporarily/i;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getModelFallbacks(primary?: string): string[] {
  const candidates = [
    primary,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ].filter((m): m is string => Boolean(m && m.trim()));

  return [...new Set(candidates)];
}

export function getEmbeddingModelFallbacks(primary?: string): string[] {
  const candidates = [
    primary,
    "gemini-embedding-001",
    "embedding-001",
    "text-embedding-004",
  ].filter((m): m is string => Boolean(m && m.trim()));

  return [...new Set(candidates)];
}

export async function withGeminiRetry<T>(
  fn: (model: string) => Promise<T>,
  primaryModel?: string
): Promise<{ result: T; model: string }> {
  const models = getModelFallbacks(primaryModel);
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await fn(model);
        return { result, model };
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        const retryable = RETRYABLE.test(message);
        if (!retryable || attempt === 2) break;
        await sleep(800 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini request failed");
}

export async function withEmbeddingRetry<T>(
  fn: (model: string) => Promise<T>,
  primaryModel?: string
): Promise<{ result: T; model: string } | null> {
  const models = getEmbeddingModelFallbacks(primaryModel);
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await fn(model);
        return { result, model };
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        const retryable =
          RETRYABLE.test(message) || /404|not found|not supported/i.test(message);
        if (!retryable || attempt === 1) break;
        await sleep(600 * (attempt + 1));
      }
    }
  }

  return null;
}
