export function formatRequirementsHeuristic(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (trimmed.includes("\n- ") || trimmed.includes("\n* ")) {
    return trimmed;
  }

  const segments = trimmed
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ])/u)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    const colonParts = trimmed.split(/:\s+/);
    if (colonParts.length > 2) {
      return colonParts
        .reduce<string[]>((acc, part, i) => {
          if (i === 0) {
            const firstColon = part.indexOf(":");
            if (firstColon === -1) return [part];
            acc.push(`**${part.slice(0, firstColon).trim()}:** ${part.slice(firstColon + 1).trim()}`);
            return acc;
          }
          if (i === colonParts.length - 1) {
            acc[acc.length - 1] += `: ${part}`;
          } else {
            acc.push(`**${part.trim()}:**`);
          }
          return acc;
        }, [])
        .map((line) => (line.startsWith("**") ? line : `- ${line}`))
        .join("\n");
    }
    return trimmed;
  }

  return segments.map((s) => `- ${s}`).join("\n");
}
