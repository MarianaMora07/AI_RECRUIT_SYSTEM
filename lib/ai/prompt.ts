import { sanitizePii } from "@/lib/ai/pii-sanitizer";

export interface JobContext {
  title: string;
  description?: string;
  requirements: string;
}

export function buildCandidateAnalysisPrompt(
  cvText: string,
  job: JobContext
): string {
  const sanitizedCv = sanitizePii(cvText);
  const title = sanitizePii(job.title);
  const description = sanitizePii(job.description ?? "");
  const requirements = sanitizePii(job.requirements);

  return `Eres un reclutador técnico senior. Evalúa el CV contra la vacante usando EXPERIENCIA LABORAL y CONOCIMIENTOS TÉCNICOS demostrados en el CV (proyectos, stack, certificaciones, educación en curso).

## Criterios de clasificación (seniority real del candidato, no el título de la vacante)
- "Junior": estudiante, trainee, prácticas, o 0-2 años profesionales; conocimientos básicos o en formación.
- "Mid": 2-5 años profesionales; ejecuta tareas de forma autónoma con supervisión ocasional.
- "Senior": 5+ años; dominio profundo, lidera decisiones técnicas, optimización y arquitectura.
- "Lead": 8+ años; diseña arquitectura, mentorea equipos, define estándares.

## Criterio de fitScore (0-100)
Calcula el PORCENTAJE REAL de encaje con los requisitos de la vacante:
- 90-100: cumple casi todos los requisitos con experiencia demostrada.
- 70-89: buen encaje; faltan 1-2 áreas menores.
- 50-69: encaje parcial; varias brechas pero perfil formable.
- 30-49: pocas coincidencias; principalmente estudiante o cambio de carrera.
- 0-29: sin experiencia relevante para el rol.

Considera por separado:
1) Años de experiencia profesional (no confundir semestres universitarios con años laborales).
2) Skills explícitas en el CV vs requisitos obligatorios de la vacante.
3) Proyectos reales, repos, certificaciones y responsabilidades concretas.

## Criterio de riskLevel (riesgo de contratación para ESTA vacante)
- "low": encaje sólido; riesgo bajo de bajo rendimiento en el rol.
- "medium": brechas entrenables en plazo razonable.
- "high": brechas significativas vs requisitos críticos de la vacante.

## Vacante
Título: ${title}
Descripción: ${description || "(sin descripción adicional)"}
Requisitos:
${requirements}

## CV (anonimizado)
${sanitizedCv}

Responde ÚNICAMENTE con JSON válido (sin markdown) con estas llaves en inglés:
- "summary": string — resumen en español citando experiencia estimada y hallazgos clave.
- "classification": "Junior" | "Mid" | "Senior" | "Lead"
- "suggestions": string — recomendación concreta en español.
- "riskLevel": "low" | "medium" | "high"
- "fitScore": number — 0 a 100, encaje real con la vacante.
- "experienceYears": number — años de experiencia profesional estimados (0 si solo estudiante).
- "matchedSkills": string[] — skills del CV que coinciden con la vacante (máx. 8).
- "missingSkills": string[] — requisitos críticos de la vacante no cubiertos (máx. 8).`;
}
