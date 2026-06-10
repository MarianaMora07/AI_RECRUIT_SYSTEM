# AI Recruitment Platform

Plataforma ATS con Inteligencia Artificial para parsear CVs, rankear candidatos y automatizar el proceso de reclutamiento.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 + Tailwind CSS 4 + Framer Motion |
| Backend | Supabase + API Routes |
| Base de datos | PostgreSQL (Supabase) + pgvector |
| IA | Google Gemini API |
| Automatización | n8n (workflow unificado) |
| Deploy | Vercel |

## Inicio rápido

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd ai-recruiment-system
npm install --legacy-peer-deps
```

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role (solo servidor) |
| `GEMINI_API_KEY` | API key de Google Gemini |
| `AI_MODEL_VERSION` | Modelo Gemini (default: `gemini-2.0-flash`) |
| `GEMINI_EMBEDDING_MODEL` | Modelo embeddings (default: `text-embedding-004`) |
| `N8N_WEBHOOK_URL` | URL del webhook n8n unificado |

### 3. Base de datos

Ejecuta las migraciones en el SQL Editor de Supabase (en orden):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_match_function.sql`
3. `supabase/migrations/003_storage.sql`

### 4. n8n

Importa `n8n/workflows/ats-automation-master.json` en tu instancia n8n y configura credenciales SMTP/Slack.

### 5. Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura del proyecto

```
app/
  (auth)/          # Login y registro
  (dashboard)/     # Panel: dashboard, jobs, upload, candidates, pipeline
  api/             # API Routes
components/
  ui/              # Design system
  layout/          # Sidebar, shell
lib/
  ai/              # Gemini, PII sanitizer
  pdf/             # Parser PDF
  supabase/        # Clientes Supabase
  validations/     # Esquemas Zod
supabase/migrations/
n8n/workflows/
docs/              # Tracking, arquitectura, demo script
```

## Funcionalidades

- Autenticación con roles (admin, recruiter, hiring_manager)
- CRUD de vacantes
- Carga de CVs en PDF con análisis Gemini
- Ranking semántico con pgvector
- Pipeline de selección con human-in-the-loop
- Automatizaciones n8n (email, Slack, reportes)
- Auditoría IA sin PII

## Seguridad

- Row Level Security (RLS) en Supabase
- Sanitización PII antes de llamadas a Gemini
- CSP headers, rate limiting, validación Zod
- Credenciales solo en variables de entorno

## Deploy (Vercel)

1. Conecta el repositorio en Vercel
2. Configura las variables de entorno de producción
3. Aplica migraciones en Supabase producción
4. Importa workflow n8n apuntando al entorno prod

## Documentación

- [Seguimiento de fases](docs/PHASE_TRACKING.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Script de demo](docs/DEMO_SCRIPT.md)

## Licencia

Proyecto académico — Venesoft © 2026
