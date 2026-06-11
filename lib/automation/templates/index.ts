import { getSiteUrl } from "@/lib/automation/config";
import {
  emailHeading,
  emailHighlightBox,
  emailMetaRow,
  emailParagraph,
  renderEmailLayout,
} from "@/lib/automation/templates/layout";
import {
  emailTrackingBlock,
  emailTrackingText,
  escapeHtml,
} from "@/lib/automation/templates/utils";

export function applicationReceivedTemplate(params: {
  fullName: string;
  jobTitle: string;
  trackingUrl?: string;
}) {
  const name = escapeHtml(params.fullName);
  const job = escapeHtml(params.jobTitle);

  return {
    subject: `Confirmación de aplicación — ${params.jobTitle}`,
    html: renderEmailLayout({
      preheader: `Recibimos tu postulación para ${params.jobTitle}`,
      title: "Aplicación recibida",
      bodyHtml: `
        ${emailHeading("¡Gracias por postularte!")}
        ${emailParagraph(`Hola <strong>${name}</strong>,`)}
        ${emailParagraph(`Hemos recibido correctamente tu aplicación para la posición de <strong>${job}</strong>.`)}
        ${emailHighlightBox("Nuestro Equipo de Talento revisará tu perfil. Si avanzas en el proceso, te contactaremos por este mismo correo.")}
        ${emailTrackingBlock(params.trackingUrl)}
        ${emailParagraph("Te deseamos mucho éxito en esta etapa.")}
      `,
    }),
    text: `Hola ${params.fullName}, recibimos tu aplicación para ${params.jobTitle}. El equipo te contactará si avanzas.${emailTrackingText(params.trackingUrl)}`,
  };
}

export function stageUpdateTemplate(params: {
  fullName: string;
  jobTitle: string;
  stageLabel: string;
  trackingUrl?: string;
}) {
  const name = escapeHtml(params.fullName);
  const job = escapeHtml(params.jobTitle);
  const stage = escapeHtml(params.stageLabel);

  return {
    subject: `Actualización de tu proceso — ${params.jobTitle}`,
    html: renderEmailLayout({
      preheader: `Tu postulación avanzó a: ${params.stageLabel}`,
      title: "Actualización de etapa",
      bodyHtml: `
        ${emailHeading("Tu proceso avanzó")}
        ${emailParagraph(`Hola <strong>${name}</strong>,`)}
        ${emailParagraph(`Tu postulación para <strong>${job}</strong> se actualizó a la etapa:`)}
        ${emailHighlightBox(`<strong style="font-size:16px;">${stage}</strong>`)}
        ${emailTrackingBlock(params.trackingUrl)}
        ${emailParagraph("Seguiremos en contacto contigo sobre los próximos pasos.")}
      `,
    }),
    text: `Hola ${params.fullName}, tu postulación para ${params.jobTitle} avanzó a ${params.stageLabel}.${emailTrackingText(params.trackingUrl)}`,
  };
}

export function technicalApprovedCandidateTemplate(params: {
  fullName: string;
  body?: string;
  trackingUrl?: string;
}) {
  const name = escapeHtml(params.fullName);
  const message =
    params.body ??
    `¡Buenas noticias, ${params.fullName}! Has aprobado nuestra evaluación técnica. El Equipo de Talento se comunicará contigo en las próximas 48 horas para coordinar el paso final del proceso.`;

  return {
    subject: "¡Buenas noticias! Aprobaste nuestra evaluación técnica",
    html: renderEmailLayout({
      preheader: "Aprobaste la evaluación técnica",
      title: "Evaluación técnica aprobada",
      variant: "success",
      bodyHtml: `
        ${emailHeading("¡Felicitaciones!")}
        ${emailParagraph(`Hola <strong>${name}</strong>,`)}
        ${emailParagraph(escapeHtml(message))}
        ${emailHighlightBox("El Equipo de Talento coordinará contigo el fit cultural y los pasos finales.")}
        ${emailTrackingBlock(params.trackingUrl)}
      `,
    }),
    text: `${message}${emailTrackingText(params.trackingUrl)}`,
  };
}

export function technicalApprovedTalentTemplate(params: {
  fullName: string;
  jobTitle: string;
  rating: string | number;
  notes?: string;
  candidateId: string;
  talentMessage?: string;
}) {
  const message =
    params.talentMessage ??
    `El candidato ${params.fullName} aprobó la entrevista técnica para ${params.jobTitle} con calificación ${params.rating}/5.`;

  return {
    subject: `[Prioridad] Entrevista técnica aprobada — ${params.fullName}`,
    html: renderEmailLayout({
      preheader: `${params.fullName} aprobó la entrevista técnica`,
      title: "Acción requerida: pre-oferta",
      variant: "success",
      cta: {
        label: "Abrir candidato y pre-oferta",
        href: `${getSiteUrl()}/candidates/${params.candidateId}`,
      },
      bodyHtml: `
        ${emailHeading("Entrevista técnica aprobada")}
        ${emailParagraph(escapeHtml(message))}
        ${emailMetaRow("Candidato", params.fullName)}
        ${emailMetaRow("Vacante", params.jobTitle)}
        ${emailMetaRow("Calificación HM", `${params.rating}/5`)}
        ${params.notes ? emailMetaRow("Notas del Hiring Manager", params.notes) : ""}
        ${emailHighlightBox("Proceder con fit cultural, referencias y formulario de pre-oferta en el ATS.")}
      `,
    }),
    text: `${message} Ver: ${getSiteUrl()}/candidates/${params.candidateId}`,
  };
}

export function criticalProfileTemplate(params: {
  fullName: string;
  classification: string;
  fitScore: string | number;
  jobTitle: string;
  candidateId?: string;
}) {
  const href = params.candidateId
    ? `${getSiteUrl()}/candidates/${params.candidateId}`
    : `${getSiteUrl()}/candidates`;

  return {
    subject: `[Urgente] Perfil crítico — ${params.fullName}`,
    html: renderEmailLayout({
      preheader: `Perfil crítico detectado: ${params.fullName}`,
      title: "Alerta de talento",
      variant: "alert",
      cta: { label: "Ver candidato", href },
      bodyHtml: `
        ${emailHeading("Perfil crítico detectado")}
        ${emailParagraph("La IA identificó un candidato con alta prioridad para contacto rápido.")}
        ${emailMetaRow("Candidato", params.fullName)}
        ${emailMetaRow("Seniority", params.classification)}
        ${emailMetaRow("Encaje", `${params.fitScore}%`)}
        ${emailMetaRow("Vacante", params.jobTitle)}
      `,
    }),
    text: `Perfil crítico: ${params.fullName} — ${params.classification} (${params.fitScore}%) para ${params.jobTitle}`,
  };
}

export function interviewScheduledTemplate(params: {
  fullName: string;
  jobTitle: string;
  trackingUrl?: string;
}) {
  const name = escapeHtml(params.fullName);
  const job = escapeHtml(params.jobTitle);

  return {
    subject: `Entrevista — ${params.jobTitle}`,
    html: renderEmailLayout({
      preheader: "Tu proceso avanzó a entrevista",
      title: "Etapa de entrevista",
      bodyHtml: `
        ${emailHeading("Próxima etapa: entrevista")}
        ${emailParagraph(`Hola <strong>${name}</strong>,`)}
        ${emailParagraph(`Tu postulación para <strong>${job}</strong> avanzó a la etapa de entrevista.`)}
        ${emailHighlightBox("El Equipo de Talento te contactará pronto para coordinar fecha y modalidad.")}
        ${emailTrackingBlock(params.trackingUrl)}
      `,
    }),
    text: `Hola ${params.fullName}, tu proceso para ${params.jobTitle} avanzó a entrevista.${emailTrackingText(params.trackingUrl)}`,
  };
}

export function dailyReportTemplate(params: {
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  interviewCount: number;
  approvedCount: number;
  stageLinesHtml: string;
}) {
  return {
    subject: "Reporte diario ATS",
    html: renderEmailLayout({
      preheader: "Resumen diario del pipeline de selección",
      title: "Reporte diario",
      cta: { label: "Abrir dashboard", href: `${getSiteUrl()}/dashboard` },
      bodyHtml: `
        ${emailHeading("Resumen del día")}
        ${emailMetaRow("Vacantes totales", String(params.totalJobs))}
        ${emailMetaRow("Vacantes abiertas", String(params.openJobs))}
        ${emailMetaRow("Candidatos activos", String(params.totalCandidates))}
        ${emailMetaRow("En entrevista", String(params.interviewCount))}
        ${emailMetaRow("Técnica aprobada", String(params.approvedCount))}
        <div style="margin-top:18px;">
          <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#131829;">Distribución por etapa</p>
          <ul style="margin:0;padding-left:18px;color:#3d4558;font-size:14px;line-height:1.8;">
            ${params.stageLinesHtml}
          </ul>
        </div>
      `,
    }),
    text: `Reporte ATS: ${params.totalCandidates} candidatos, ${params.openJobs} vacantes abiertas.`,
  };
}
