const PII_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  {
    pattern: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}\b/g,
    replacement: "[PHONE_REDACTED]",
  },
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: "[EMAIL_REDACTED]",
  },
  {
    pattern:
      /\b(?:cedula|cédula|cc|dni|passport|pasaporte|rut)[\s:.#-]*[\d.kK-]{6,14}\b/gi,
    replacement: "[ID_REDACTED]",
  },
  {
    pattern:
      /\b(?:dirección|direccion|address|calle|av\.|avenida)[\s:.]*[\w\s.,#-]{8,60}\b/gi,
    replacement: "[ADDRESS_REDACTED]",
  },
];

export function sanitizePii(text: string): string {
  let sanitized = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized.replace(/\s{2,}/g, " ").trim();
}

export function containsUnsanitizedPii(text: string): boolean {
  const testPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}\b/,
  ];
  return testPatterns.some((p) => p.test(text));
}
