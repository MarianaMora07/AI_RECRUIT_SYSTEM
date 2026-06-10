# Demo Script — AI Recruitment Platform (10–15 min)

## Roles en la demo
- **PO:** Mariana Mora — narración del problema y valor
- **Frontend Lead:** muestra UI y flujos
- **Backend Lead:** menciona RLS, API y seguridad
- **AI/Automation Lead:** explica Gemini + n8n

## Pre-requisitos
- [ ] App desplegada en Vercel con variables configuradas
- [ ] Migraciones SQL aplicadas en Supabase
- [ ] Workflow n8n importado y activo
- [ ] `GEMINI_API_KEY` configurada
- [ ] Usuario reclutador de prueba creado
- [ ] 1 vacante de ejemplo y 1–2 CVs PDF de prueba

---

## Acto 1 — Bienvenida (2 min)
1. Abrir `/` — pantalla de bienvenida animada
2. Narrar: *"Plataforma ATS que elimina la revisión manual de CVs con IA"*
3. Clic en **Iniciar sesión**

## Acto 2 — Dashboard y vacantes (3 min)
1. Mostrar dashboard con métricas (vacantes, candidatos, etapas)
2. Ir a **Vacantes** → **Nueva vacante**
3. Crear vacante: "Desarrollador Full Stack Senior"
4. Destacar requisitos técnicos (contexto para IA)

## Acto 3 — Carga de CV end-to-end (4 min)
1. Ir a **Cargar CV** → seleccionar vacante
2. Subir PDF + datos del candidato
3. Mostrar confirmación con seniority detectado por Gemini
4. Mencionar: email automático vía n8n (`candidate.created`)

## Acto 4 — Ranking y detalle IA (3 min)
1. Ir a **Candidatos** → activar **Ranking semántico**
2. Mostrar orden por % afinidad (pgvector, no keywords)
3. Abrir detalle: resumen, seniority, riesgo, sugerencia
4. Mencionar auditoría IA sin PII (AC 4.3)

## Acto 5 — Pipeline y human-in-the-loop (2 min)
1. Ir a **Pipeline** → mover candidato a Evaluación
2. Intentar **Descartar** → modal de confirmación obligatoria
3. Mencionar alerta Slack para perfiles críticos (n8n)

## Acto 6 — Cierre técnico (1 min)
- Repositorio GitHub con README y arquitectura
- Checklist Venesoft 5/5 completado
- Preguntas

---

## Fallback si n8n o Gemini fallan
- **n8n caído:** El upload sigue funcionando; eventos se loguean como `skipped`
- **Gemini caído:** CV se registra sin score; reclutador puede revisar manualmente
- **Supabase:** Verificar `.env.local` y que migraciones estén aplicadas
