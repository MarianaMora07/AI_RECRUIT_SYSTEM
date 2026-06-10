import { GoogleGenerativeAI } from "@google/generative-ai";
import { withGeminiRetry } from "@/lib/ai/retry";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  return new GoogleGenerativeAI(apiKey);
}

export async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const primary = process.env.AI_MODEL_VERSION || "gemini-2.5-flash";
  const base64 = buffer.toString("base64");

  const { result: text } = await withGeminiRetry(async (modelName) => {
    const client = getClient();
    const model = client.getGenerativeModel({ model: modelName });
    const response = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
      `Extrae TODO el texto legible de este currículum (CV). 
Incluye nombre, contacto, educación, experiencia y habilidades.
Responde ÚNICAMENTE con el texto extraído en español o el idioma original del documento, sin comentarios ni markdown.`,
    ]);
    return response.response.text();
  }, primary);

  return text.trim();
}
