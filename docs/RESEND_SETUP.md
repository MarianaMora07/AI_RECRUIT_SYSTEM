# Configurar Resend — dominio y correos del ATS

Guía para enviar correos automáticos con tu marca (gratis hasta 100 emails/día).

---

## Fase 1 — Prueba rápida (sin dominio)

1. Crea cuenta en [resend.com](https://resend.com).
2. Ve a **API Keys** → crea una key → cópiala en `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxx
TALENT_TEAM_EMAIL=tu-correo@gmail.com
EMAIL_REPLY_TO=tu-correo@gmail.com
```

3. **No configures dominio aún.** Resend permite enviar desde:

```env
EMAIL_FROM=AI Recruit <onboarding@resend.dev>
```

4. **Limitación:** solo puedes enviar al email con el que te registraste en Resend.
5. Prueba subiendo un CV o moviendo una etapa con `RESEND_API_KEY` activa.

---

## Fase 2 — Tu dominio (producción)

### Paso 1: Agregar dominio en Resend

1. Resend → **Domains** → **Add Domain**.
2. Ingresa tu dominio, por ejemplo: `tuempresa.com` (sin `www`).
3. Resend te mostrará registros DNS.

### Paso 2: Configurar DNS

En tu proveedor (GoDaddy, Cloudflare, Namecheap, etc.) agrega:

| Tipo | Nombre / Host | Valor |
|------|----------------|-------|
| **TXT** | `@` o raíz | Verificación SPF que indica Resend |
| **TXT** | `resend._domainkey` | DKIM (copia exacta de Resend) |
| **TXT** | `_dmarc` | `v=DMARC1; p=none;` (opcional al inicio) |

> Copia los valores **exactos** del panel de Resend; cambian por cuenta.

### Paso 3: Verificar

- En Resend, pulsa **Verify**.
- Puede tardar de 5 minutos a 48 h según el DNS.
- Estado **Verified** = listo.

### Paso 4: Variables en producción (Vercel)

```env
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=AI Recruit <noreply@tuempresa.com>
EMAIL_REPLY_TO=talento@tuempresa.com
TALENT_TEAM_EMAIL=talento@tuempresa.com
NEXT_PUBLIC_SITE_URL=https://tu-app.vercel.app
NEXT_PUBLIC_APP_NAME=AI Recruit
NEXT_PUBLIC_APP_LOGO=/logo.png
CRON_SECRET=genera-un-secreto-largo
```

**Recomendación de remitente:**
- `noreply@tuempresa.com` — candidatos
- `talento@tuempresa.com` — alertas internas (TALENT_TEAM_EMAIL)

El dominio del `EMAIL_FROM` debe estar verificado en Resend.

---

## Plantillas incluidas en el código

| Evento | Plantilla | Destinatario |
|--------|-----------|--------------|
| Nueva aplicación | `applicationReceivedTemplate` | Candidato |
| Cambio de etapa | `stageUpdateTemplate` | Candidato |
| Técnica aprobada | `technicalApprovedCandidateTemplate` | Candidato |
| Técnica aprobada | `technicalApprovedTalentTemplate` | Equipo de talento |
| Perfil crítico IA | `criticalProfileTemplate` | Equipo de talento |
| Entrevista | `interviewScheduledTemplate` | Candidato |
| Reporte diario | `dailyReportTemplate` | Equipo de talento |

Archivos: `lib/automation/templates/`

Usan los colores del ATS (navy `#131829`, acento `#ff6b4a`) y el logo si defines `NEXT_PUBLIC_APP_LOGO` con URL pública absoluta vía `NEXT_PUBLIC_SITE_URL`.

---

## Probar plantilla sin disparar el ATS

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" \
  https://tu-app.vercel.app/api/cron/daily-report
```

O en local (con el servidor corriendo):

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" http://localhost:3000/api/cron/daily-report
```

---

## Errores comunes

| Error | Solución |
|-------|----------|
| `validation_error` dominio | `EMAIL_FROM` debe usar dominio verificado en Resend |
| Solo llega a tu email | Modo prueba: quita dominio o verifica el tuyo |
| Logo no se ve | Sube `public/logo.png` y define `NEXT_PUBLIC_SITE_URL` con HTTPS |
| No se envía nada | Revisa `RESEND_API_KEY` y logs en terminal |

---

## Checklist producción

- [ ] Dominio verificado en Resend
- [ ] `EMAIL_FROM` con `@tudominio.com`
- [ ] `TALENT_TEAM_EMAIL` configurado
- [ ] `NEXT_PUBLIC_SITE_URL` con URL real
- [ ] Logo en `public/` y `NEXT_PUBLIC_APP_LOGO=/logo.png`
- [ ] `CRON_SECRET` en Vercel para reporte diario
- [ ] Prueba: subir CV → correo al candidato
- [ ] Prueba: HM aprueba técnica → 2 correos (equipo + candidato)
