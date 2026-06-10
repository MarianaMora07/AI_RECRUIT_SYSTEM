import { extractTextFromImage } from "@/lib/cv/image-ocr";
import { extractTextFromPdf, normalizeCvText } from "@/lib/pdf/parser";
import { isAllowedCvMime, isImageCvMime } from "@/lib/constants/roles";

export async function extractCvText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!isAllowedCvMime(mimeType)) {
    throw new Error("UNSUPPORTED_CV_FORMAT");
  }

  let raw: string;

  if (mimeType === "application/pdf") {
    raw = await extractTextFromPdf(buffer);
  } else if (isImageCvMime(mimeType)) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_REQUIRED_FOR_IMAGE_CV");
    }
    raw = await extractTextFromImage(buffer, mimeType);
  } else {
    throw new Error("UNSUPPORTED_CV_FORMAT");
  }

  const normalized = normalizeCvText(raw);
  if (!normalized.trim()) {
    throw new Error("EMPTY_CV_TEXT");
  }

  return normalized;
}
