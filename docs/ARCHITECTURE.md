# Arquitectura — AI Recruitment Platform

## Vista general

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Next.js 15  │────▶│  API Routes  │────▶│  Supabase   │
│  (Vercel)   │     │  (Node.js)   │     │  PostgreSQL │
└─────────────┘     └──────┬───────┘     └──────┬──────┘
                           │                     │
                    ┌──────▼───────┐      ┌──────▼──────┐
                    │ Google Gemini │      │   pgvector  │
                    │  (JSON+embed) │      │  (ranking)  │
                    └──────────────┘      └─────────────┘
                           │
                    ┌──────▼───────┐
                    │     n8n      │
                    │  (webhook)   │
                    └──────────────┘
```

## Capas

### Frontend (Next.js App Router)
- Pantalla de bienvenida animada (`/`)
- Auth: `/login`, `/register`
- Dashboard: métricas, vacantes, upload, candidatos, pipeline
- Design system navy/off-white en `app/globals.css`

### Backend (API Routes)
| Ruta | Función |
|------|---------|
| `/api/jobs` | CRUD vacantes |
| `/api/candidates` | Listado + ranking semántico |
| `/api/candidates/[id]/stage` | Cambio de etapa + n8n |
| `/api/upload` | PDF parse + Gemini + embeddings |
| `/api/dashboard/metrics` | Métricas agregadas |

### Base de datos (Supabase)
- Tablas: `profiles`, `jobs`, `candidates`, `scores`, `interviews`, `ai_audit_logs`
- Extensión `pgvector` para embeddings 768-dim (Gemini `text-embedding-004`)
- RLS por rol: `admin`, `recruiter`, `hiring_manager`
- Storage bucket `cvs` para PDFs

### IA (Google Gemini)
1. PDF → texto (`lib/pdf/parser.ts`)
2. Sanitización PII (`lib/ai/pii-sanitizer.ts`) — AC 4.2
3. `generateContent` con JSON forzado — AC corporativo
4. Embeddings para búsqueda semántica — AC 4.1
5. Auditoría en `ai_audit_logs` con UUID — AC 4.3

### Automatización (n8n)
Workflow unificado `ats-automation-master.json`:
- Webhook único con `event_type` en body
- Ramas: `candidate.created`, `candidate.scored`, `stage.changed`, `interview.approved`
- Cron diario para reporte a hiring managers
- Error handler global → Slack `#ats-errors`

## Seguridad
- RLS en todas las tablas sensibles
- PII nunca enviada a Gemini sin sanitizar
- CSP headers en `next.config.ts`
- Rate limiting en `/api/upload`
- Human-in-the-loop para etapas `hired` y `rejected`
- Credenciales solo en variables de entorno

## Despliegue
- **Frontend:** Vercel (preview + production)
- **DB/Auth:** Supabase Cloud
- **n8n:** Self-hosted o n8n Cloud
- **IA:** Google AI Studio API key
