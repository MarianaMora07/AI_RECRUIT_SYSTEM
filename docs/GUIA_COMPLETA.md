# Guía completa — AI Recruitment Platform

Manual operativo del sistema ATS con inteligencia artificial. Documenta cómo funciona la aplicación, las tecnologías utilizadas, cómo ponerla en marcha y cómo usarla correctamente en el día a día.

---

## 1. Introducción

### ¿Qué es esta plataforma?

Es un **Applicant Tracking System (ATS)** que automatiza el procesamiento de currículums, evalúa candidatos con IA y gestiona el pipeline de selección de principio a fin. Reduce la revisión manual de CVs y ofrece ranking semántico por afinidad con cada vacante.

### Público objetivo

| Rol | Descripción |
|-----|-------------|
| **Reclutador** (`recruiter`) | Rol por defecto al registrarse. Gestiona vacantes, carga CVs, mueve candidatos en el pipeline y consulta métricas. |
| **Hiring Manager** (`hiring_manager`) | Revisa candidatos y toma decisiones post-entrevista (aprobar técnica o descartar). |
| **Administrador** (`admin`) | Acceso completo; puede asignar roles manualmente en la base de datos. |

### Rutas principales

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Página principal (landing) |
| `/login` | Público | Inicio de sesión |
| `/register` | Público | Registro de nuevos usuarios |
| `/verify-email` | Público | Verificación de correo electrónico |
| `/dashboard` | Autenticado | Panel principal con métricas |
| `/jobs` | Autenticado (admin/recruiter) | Gestión de vacantes |
| `/upload` | Autenticado (admin/recruiter) | Carga de CVs |
| `/candidates` | Autenticado | Listado y detalle de candidatos |
| `/pipeline` | Autenticado | Pipeline visual tipo Kanban |
| `/settings` | Autenticado | Perfil y contraseña |
| `/track/[token]` | Público | Seguimiento de estado del candidato (sin login) |

---

## 2. Stack tecnológico

| Capa | Tecnología | Uso en el proyecto |
|------|------------|-------------------|
| Framework | **Next.js 15** (App Router) | Frontend, API Routes, middleware, SSR |
| UI | **React 19**, **Tailwind CSS 4**, **Framer Motion** | Componentes, estilos, animaciones |
| Lenguaje | **TypeScript 5** (strict) | Tipado en todo el código |
| Validación | **Zod** | Esquemas de formularios y API |
| Auth y BD | **Supabase** (`@supabase/ssr`) | Autenticación, PostgreSQL, Storage, RLS |
| Base de datos | **PostgreSQL + pgvector** | Datos y embeddings de 768 dimensiones |
| IA | **Google Gemini** (`@google/generative-ai`) | Análisis de CV, OCR de imágenes, embeddings |
| PDF/CV | **pdf-parse** + Gemini Vision | Extracción de texto de PDF e imágenes |
| Emails | **Resend** | Automatización de correos al candidato y al equipo |
| Alertas | **Slack** (opcional) | Webhook para errores y perfiles críticos |
| Deploy | **Vercel** | Hosting, preview, cron diario |
| Calidad | **ESLint**, **Husky**, **lint-staged** | Lint y hooks de pre-commit |

### Arquitectura simplificada

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Next.js 15  │────▶│  API Routes  │────▶│  Supabase   │
│  (Vercel)   │     │  (Node.js)   │     │ PostgreSQL  │
└─────────────┘     └──────┬───────┘     └──────┬──────┘
                           │                     │
                    ┌──────▼───────┐      ┌──────▼──────┐
                    │ Google Gemini │      │  pgvector   │
                    │ JSON+embed    │      │  (ranking)  │
                    └──────────────┘      └─────────────┘
                           │
                    ┌──────▼───────┐
                    │    Resend    │
                    │   (emails)   │
                    └──────────────┘
```

Para más detalle técnico, consulta [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 3. Requisitos previos

Antes de instalar la aplicación, necesitas:

- **Node.js 20+** y npm
- **Cuenta en Supabase** (proyecto con Auth, PostgreSQL y Storage)
- **API key de Google Gemini** ([Google AI Studio](https://aistudio.google.com/))
- **Cuenta en Resend** (opcional en desarrollo local; necesaria para emails automáticos)
- **Cuenta en Vercel** (solo para despliegue en producción)

---

## 4. Puesta en marcha (paso a paso)

### Paso 1 — Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd ai-recruiment-system
npm install --legacy-peer-deps
```

> El flag `--legacy-peer-deps` es necesario por compatibilidad de dependencias (también configurado en `vercel.json`).

### Paso 2 — Configurar variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto con las variables de la sección 5. Como mínimo para arrancar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
GEMINI_API_KEY=tu-gemini-api-key
```

### Paso 3 — Aplicar migraciones de base de datos

En el **SQL Editor** de Supabase, ejecuta los 12 archivos en orden:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_match_function.sql`
3. `supabase/migrations/003_storage.sql`
4. `supabase/migrations/004_profile_avatars_and_metrics.sql`
5. `supabase/migrations/005_job_requirements_formatted.sql`
6. `supabase/migrations/006_sla_stage_tracking.sql`
7. `supabase/migrations/007_match_function_lean.sql`
8. `supabase/migrations/008_storage_cv_images.sql`
9. `supabase/migrations/009_hiring_manager_interview_decisions.sql`
10. `supabase/migrations/010_remove_next_round_stage.sql`
11. `supabase/migrations/011_candidate_pre_offer.sql`
12. `supabase/migrations/012_candidate_tracking_token.sql`

Cada migración añade tablas, funciones, políticas RLS o buckets de Storage según corresponda.

### Paso 4 — Configurar emails (opcional en local)

Sigue la guía [RESEND_SETUP.md](./RESEND_SETUP.md) para configurar `RESEND_API_KEY` y el remitente.

### Paso 5 — Iniciar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La landing pública aparece en `/`; desde ahí puedes ir a **Registrarse** o **Iniciar sesión**.

### Paso 6 — Despliegue en producción (Vercel)

1. Conecta el repositorio a Vercel.
2. Configura **todas** las variables de entorno de la sección 5 en el panel de Vercel.
3. Añade `CRON_SECRET` para proteger el endpoint de reporte diario (`/api/cron/daily-report`, programado a las 12:00 UTC).
4. El build usa `npm install --legacy-peer-deps` y `npm run build` según `vercel.json`.

---

## 5. Variables de entorno

Plantilla completa para `.env.local`:

```env
# ── Supabase (obligatorio) ──
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ── Google Gemini (obligatorio para IA) ──
GEMINI_API_KEY=
AI_MODEL_VERSION=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

# ── Resend / emails (opcional en local) ──
RESEND_API_KEY=
EMAIL_FROM=AI Recruit <onboarding@resend.dev>
EMAIL_REPLY_TO=
TALENT_TEAM_EMAIL=
RESEND_ALLOWED_RECIPIENTS=

# ── Branding y sitio ──
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AI Recruit
NEXT_PUBLIC_APP_TAGLINE=Talent Acquisition Platform
NEXT_PUBLIC_APP_LOGO=/logo.svg
NEXT_PUBLIC_APP_LOGO_ALT=AI Recruit

# ── Producción / ops ──
CRON_SECRET=
SLACK_WEBHOOK_URL=
```

| Variable | Obligatoria | Descripción | Valor por defecto |
|----------|-------------|-------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave pública anon de Supabase | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí (servidor) | Clave service role para operaciones admin | — |
| `GEMINI_API_KEY` | Sí (IA) | API key de Google Gemini | — |
| `AI_MODEL_VERSION` | No | Modelo para análisis y OCR | `gemini-2.5-flash` |
| `GEMINI_EMBEDDING_MODEL` | No | Modelo de embeddings | `gemini-embedding-001` |
| `RESEND_API_KEY` | No* | Activa el motor de emails | Sin key → eventos `skipped` |
| `EMAIL_FROM` | No | Remitente de correos | `{APP_NAME} <onboarding@resend.dev>` |
| `EMAIL_REPLY_TO` | No | Reply-to de correos | `TALENT_TEAM_EMAIL` |
| `TALENT_TEAM_EMAIL` | No | Bandeja del equipo de talento | — |
| `RESEND_ALLOWED_RECIPIENTS` | No | Lista de destinatarios en sandbox Resend | Emails de reply/talent |
| `NEXT_PUBLIC_SITE_URL` | No | URL canónica del sitio | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | No | Nombre de la app | `AI Recruit` |
| `NEXT_PUBLIC_APP_TAGLINE` | No | Subtítulo | `Talent Acquisition Platform` |
| `CRON_SECRET` | Prod | Token Bearer para cron diario | — |
| `SLACK_WEBHOOK_URL` | No | Webhook Slack para alertas | — |

\* Sin `RESEND_API_KEY`, la app funciona; los emails automáticos se omiten sin bloquear el flujo.

> **Importante:** nunca subas `.env.local` al repositorio. Está ignorado en `.gitignore`.

---

## 6. Roles y permisos

### Matriz de acceso por módulo

| Módulo | Admin | Reclutador | Hiring Manager |
|--------|:-----:|:----------:|:--------------:|
| Dashboard | ✓ | ✓ | ✓ |
| Vacantes | ✓ | ✓ | — |
| Cargar CV | ✓ | ✓ | — |
| Candidatos | ✓ | ✓ | ✓ |
| Pipeline | ✓ | ✓ | ✓ (decisiones limitadas) |
| Mi perfil | ✓ | ✓ | ✓ |

### Registro y roles

- El registro público en `/register` asigna automáticamente el rol **reclutador**.
- Los roles `admin` y `hiring_manager` se asignan manualmente en la tabla `profiles` de Supabase.

### Permisos en el pipeline

- **Admin y reclutador:** pueden mover candidatos entre todas las etapas.
- **Hiring Manager:** solo puede decidir cuando el candidato está en etapa **Entrevista** (`interview`), con destinos:
  - **Descartar** → `rejected`
  - **Aprobar entrevista técnica** → `interview_approved`
- Las etapas **Contratado** (`hired`) y **Descartado** (`rejected`) requieren **confirmación explícita** (human-in-the-loop) para todos los roles con permiso de gestión.

---

## 7. Flujo del sistema — uso correcto

### Diagrama del ciclo de vida

```
Registro → Verificación email → Login → Dashboard
    ↓
Crear vacante → Cargar CV → IA analiza y puntúa
    ↓
Lista de candidatos (ranking semántico) → Pipeline Kanban
    ↓
Etapas del proceso → Contratado / Descartado
    ↓
Emails automáticos (Resend) en cada hito relevante
```

### 7.1 Acceso y autenticación

1. **Página principal (`/`)**  
   Landing pública con información del producto y enlaces a registro/login.

2. **Registro (`/register`)**  
   - Completa nombre, email y contraseña.  
   - Se crea cuenta con rol `recruiter`.  
   - Recibirás un correo de verificación (Supabase Auth).

3. **Verificación (`/verify-email`)**  
   - Si no verificaste el email, el middleware redirige aquí al intentar entrar al dashboard.  
   - Puedes reenviar el enlace de verificación.

4. **Login (`/login`)**  
   - Tras verificar el email, inicia sesión.  
   - Redirección automática a `/dashboard`.

5. **Cerrar sesión**  
   - Botón **Cerrar sesión** en el sidebar del panel.  
   - Cierra la sesión en Supabase y te lleva de vuelta a la **página principal (`/`)**.

### 7.2 Dashboard (`/dashboard`)

- Métricas agregadas: vacantes activas, candidatos, distribución por etapa.
- Vista previa del pipeline y calendario de entrevistas programadas.
- Punto de entrada recomendado tras cada login.

### 7.3 Vacantes (`/jobs`)

**Solo admin y reclutador.**

1. Clic en **Nueva vacante**.
2. Completa título, descripción, requisitos técnicos y estado (`draft`, `open`, `closed`).
3. Los requisitos alimentan el contexto que Gemini usa para evaluar CVs.
4. Mantén al menos una vacante en estado **open** antes de cargar CVs.

### 7.4 Cargar CV (`/upload`)

**Solo admin y reclutador.**

1. Selecciona la vacante destino.
2. Completa datos del candidato (nombre, email, etc.).
3. Sube el archivo:
   - **PDF** (hasta 5 MB)
   - **Imagen** (JPEG, PNG, WebP) — se procesa con OCR vía Gemini
4. Al confirmar, el sistema:
   - Extrae texto del CV
   - Sanitiza datos personales sensibles antes de enviar a Gemini
   - Genera análisis: seniority, fit score, riesgo, resumen
   - Calcula embedding y lo guarda para ranking semántico
   - Registra al candidato en etapa **Postulado** (`applied`)
   - Dispara email **“Solicitud recibida”** al candidato (si Resend está configurado)
   - Genera token de seguimiento público (`/track/[token]`)

### 7.5 Candidatos (`/candidates`)

1. Lista todos los candidatos con búsqueda por nombre o email.
2. Activa **Ranking semántico** para ordenar por % de afinidad con una vacante (pgvector, no keywords).
3. Abre el detalle de un candidato (`/candidates/[id]`):
   - Resumen IA, seniority, nivel de riesgo, sugerencia
   - Historial de etapas y entrevistas
   - Sección de **pre-oferta** (datos salariales y condiciones)
   - Opción de **re-analizar** con IA
   - Enlace de seguimiento para compartir con el candidato

### 7.6 Pipeline (`/pipeline`)

Vista Kanban con columnas por etapa:

| Etapa (código) | Etiqueta en UI |
|----------------|----------------|
| `applied` | Postulado |
| `evaluation` | Evaluación |
| `interview` | Entrevista |
| `interview_approved` | Entrevista técnica aprobada |
| `hired` | Contratado |
| `rejected` | Descartado |

**Cómo mover candidatos:**

1. Arrastra la tarjeta entre columnas o usa las acciones de la tarjeta.
2. Para avanzar a **Entrevista**, puedes **agendar entrevista** (fecha, hora, modalidad).
3. Al pasar a **Contratado** o **Descartado**, aparece un modal de confirmación obligatorio.
4. Cada cambio de etapa puede enviar un email al candidato (`stage.changed`).

**Flujo lineal recomendado:**

```
Postulado → Evaluación → Entrevista → Entrevista técnica aprobada → Contratado
                                              ↓
                                         Descartado (en cualquier punto con confirmación)
```

### 7.7 Seguimiento público (`/track/[token]`)

- El candidato recibe un enlace único (por email o manualmente).
- Puede ver el estado de su postulación **sin necesidad de cuenta**.
- No expone datos internos del reclutador ni scores detallados sensibles.

### 7.8 Mi perfil (`/settings`)

- Actualizar nombre y datos de perfil.
- Subir avatar (Storage de Supabase).
- Cambiar contraseña.

---

## 8. Automatizaciones (emails y alertas)

El motor de automatización es **nativo** (Resend + Slack). No depende de n8n en tiempo de ejecución.

### Eventos disparados

| Evento | Cuándo se dispara | Acción |
|--------|-------------------|--------|
| `candidate.created` | Tras cargar un CV | Email al candidato: solicitud recibida + enlace de seguimiento |
| `candidate.scored` | Tras análisis IA | Alerta al equipo de talento si el perfil es crítico (Senior/Lead, fit ≥ 80, etc.) |
| `stage.changed` | Al cambiar etapa en pipeline | Email al candidato con nueva etapa |
| `interview.approved` | Al agendar entrevista | Email al candidato con fecha/hora |
| `interview.technical_approved` | Al aprobar entrevista técnica | Email al candidato y al equipo de talento |

### Comportamiento sin Resend

Si `RESEND_API_KEY` no está configurada:

- Los eventos se registran como `skipped`.
- El upload, el pipeline y el análisis IA **siguen funcionando**.
- No se envían correos hasta configurar Resend.

### Slack (opcional)

Con `SLACK_WEBHOOK_URL` válida, se envían alertas de errores y perfiles críticos al canal configurado.

---

## 9. Seguridad y buenas prácticas

- **RLS (Row Level Security):** todas las tablas sensibles tienen políticas por rol en Supabase.
- **PII:** los datos personales se sanitizan antes de enviarse a Gemini (`lib/ai/pii-sanitizer.ts`).
- **Auditoría IA:** cada análisis queda registrado en `ai_audit_logs` sin PII.
- **CSP:** cabeceras de seguridad configuradas en `next.config.ts`.
- **Rate limiting:** aplicado en `/api/upload` para evitar abuso.
- **Human-in-the-loop:** contratación y descarte requieren confirmación explícita.
- **Credenciales:** solo en variables de entorno; nunca en el código ni en commits.
- **Service role key:** solo en servidor; no expongas `SUPABASE_SERVICE_ROLE_KEY` al cliente.

---

## 10. Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run dev:webpack` | Desarrollo con Webpack (alternativa) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación de tipos TypeScript |

---

## 11. Solución de problemas

### No puedo entrar al dashboard

- Verifica que el email esté confirmado (revisa bandeja y carpeta spam).
- Comprueba `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`.
- Reinicia el servidor de desarrollo tras cambiar variables.

### Error al cargar CV o sin puntuación IA

- Confirma que `GEMINI_API_KEY` es válida y tiene cuota disponible.
- Si aparece error de cuota, prueba `AI_MODEL_VERSION=gemini-2.5-flash`.
- Sin Gemini, el CV se guarda pero sin score automático.

### Ranking semántico vacío o incorrecto

- Asegúrate de haber ejecutado todas las migraciones (especialmente `002` y `007` para la función de match).
- La vacante debe tener requisitos y el candidato debe tener embedding generado (subida exitosa con IA).

### Los emails no se envían

- Verifica `RESEND_API_KEY` en `.env.local`.
- En modo sandbox (`onboarding@resend.dev`), solo se envían a emails verificados en Resend.
- Configura `RESEND_ALLOWED_RECIPIENTS` o `TALENT_TEAM_EMAIL` según [RESEND_SETUP.md](./RESEND_SETUP.md).

### Error de base de datos o permisos

- Revisa que las 12 migraciones estén aplicadas en orden.
- Comprueba que el usuario tenga un registro en `profiles` con el rol correcto.

### Tras cerrar sesión no veo la landing

- El cierre de sesión redirige a `/`. Si ves `/login`, limpia caché o verifica que estés en la versión actual del código.

---

## 12. Estructura del proyecto (referencia)

```
app/
  (auth)/           # login, register, verify-email
  (dashboard)/      # dashboard, jobs, upload, candidates, pipeline, settings
  api/              # REST API
  auth/callback/    # callback de verificación Supabase
  track/[token]/    # seguimiento público
components/         # UI, layout, módulos por feature
lib/
  ai/               # Gemini, prompts, PII, procesamiento
  automation/       # Resend, Slack, handlers, plantillas
  data/             # fetchers server-side
  supabase/         # clientes y middleware
  validations/      # esquemas Zod
supabase/migrations/  # 12 archivos SQL
docs/               # documentación (esta guía, arquitectura, demo, Resend)
```

---

## 13. Documentación relacionada

| Documento | Contenido |
|-----------|-----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Diagrama y capas técnicas |
| [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) | Guión de demostración (10–15 min) |
| [RESEND_SETUP.md](./RESEND_SETUP.md) | Configuración de dominio y correos |
| [PHASE_TRACKING.md](./PHASE_TRACKING.md) | Checklist de fases del proyecto |
| [README.md](../README.md) | Inicio rápido en la raíz del repo |

---

## 14. Resumen del flujo recomendado para empezar a usar

1. Configura `.env.local` y aplica las 12 migraciones en Supabase.
2. Ejecuta `npm run dev` y abre `http://localhost:3000`.
3. Regístrate en `/register` y verifica tu email.
4. Inicia sesión → llegarás a `/dashboard`.
5. Crea una vacante en **Vacantes** (estado `open`).
6. Sube un CV en **Cargar CV** vinculado a esa vacante.
7. Revisa el candidato en **Candidatos** (prueba el ranking semántico).
8. Gestiona el proceso en **Pipeline** (mueve etapas, agenda entrevista).
9. Comparte el enlace `/track/[token]` con el candidato si aplica.
10. Al terminar, **Cerrar sesión** te devuelve a la página principal.

Con estos pasos tienes el ciclo completo operativo: desde la configuración inicial hasta la gestión diaria del reclutamiento asistido por IA.
