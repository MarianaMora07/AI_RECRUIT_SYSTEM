import { PIPELINE_STAGE_LABELS, type PipelineStage } from "@/lib/constants/roles";
import { sendEmail } from "@/lib/automation/email";
import { getTalentTeamEmail } from "@/lib/automation/config";
import { sendSlackMessage } from "@/lib/automation/slack";
import {
  applicationReceivedTemplate,
  criticalProfileTemplate,
  interviewScheduledTemplate,
  stageUpdateTemplate,
  technicalApprovedCandidateTemplate,
  technicalApprovedTalentTemplate,
} from "@/lib/automation/templates";
import type { AutomationEventType } from "@/lib/automation/types";
import { getCandidateTrackingUrl } from "@/lib/utils/candidate-tracking";

function trackingUrlFromPayload(payload: Record<string, unknown>): string | undefined {
  const token = payload.trackingToken ? String(payload.trackingToken) : "";
  return token ? getCandidateTrackingUrl(token) : undefined;
}

function stageLabel(stage: string) {
  return PIPELINE_STAGE_LABELS[stage as PipelineStage] ?? stage;
}

function isCriticalProfile(payload: Record<string, unknown>): boolean {
  const classification = String(payload.classification ?? "");
  const fitScore = Number(payload.fitScore ?? 0);
  const riskLevel = String(payload.riskLevel ?? "");

  return (
    classification === "Senior" ||
    classification === "Lead" ||
    fitScore >= 80 ||
    (riskLevel === "low" && fitScore >= 70)
  );
}

async function handleCandidateCreated(payload: Record<string, unknown>) {
  const email = String(payload.email ?? "");
  const fullName = String(payload.fullName ?? "Candidato");
  const jobTitle = String(payload.jobTitle ?? "la vacante");

  if (!email) return ["email candidato faltante"];

  const template = applicationReceivedTemplate({
    fullName,
    jobTitle,
    trackingUrl: trackingUrlFromPayload(payload),
  });
  const result = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return result.ok ? [] : [result.error ?? "email candidato falló"];
}

async function handleCandidateScored(payload: Record<string, unknown>) {
  if (!isCriticalProfile(payload)) return [];

  const fullName = String(payload.fullName ?? payload.candidateId ?? "Candidato");
  const classification = String(payload.classification ?? "N/A");
  const fitScore =
    typeof payload.fitScore === "number"
      ? payload.fitScore
      : payload.fitScore != null
        ? String(payload.fitScore)
        : "N/A";
  const jobTitle = String(payload.jobTitle ?? "vacante");
  const candidateId = payload.candidateId
    ? String(payload.candidateId)
    : undefined;

  const template = criticalProfileTemplate({
    fullName,
    classification,
    fitScore,
    jobTitle,
    candidateId,
  });

  const errors: string[] = [];
  const slack = await sendSlackMessage(template.text);
  if (!slack.ok && slack.error !== "SLACK_WEBHOOK_URL no configurada") {
    errors.push(slack.error ?? "slack falló");
  }

  const talentEmail = getTalentTeamEmail();
  if (talentEmail) {
    const mail = await sendEmail({
      to: talentEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    if (!mail.ok) errors.push(mail.error ?? "email talento falló");
  }

  return errors;
}

async function handleStageChanged(payload: Record<string, unknown>) {
  if (payload.stage === "interview_approved") return [];

  const email = String(payload.email ?? "");
  const fullName = String(payload.fullName ?? "Candidato");
  const jobTitle = String(payload.jobTitle ?? "tu vacante");
  const stage = stageLabel(String(payload.stage ?? ""));

  if (!email) return ["email candidato faltante"];

  const template = stageUpdateTemplate({
    fullName,
    jobTitle,
    stageLabel: stage,
    trackingUrl: trackingUrlFromPayload(payload),
  });
  const result = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return result.ok ? [] : [result.error ?? "email etapa falló"];
}

async function handleTechnicalApproved(payload: Record<string, unknown>) {
  const errors: string[] = [];
  const talentEmail = getTalentTeamEmail();
  const candidateEmail = String(payload.candidateEmail ?? payload.email ?? "");
  const fullName = String(payload.fullName ?? "Candidato");
  const jobTitle = String(payload.jobTitle ?? "N/A");
  const rating =
    typeof payload.rating === "number"
      ? payload.rating
      : payload.rating != null
        ? String(payload.rating)
        : "N/A";
  const candidateId = String(payload.candidateId ?? "");
  const notes = payload.notes ? String(payload.notes) : undefined;

  if (payload.notifyTalentTeam !== false && talentEmail) {
    const talentTemplate = technicalApprovedTalentTemplate({
      fullName,
      jobTitle,
      rating,
      notes,
      candidateId,
      talentMessage: payload.talentTeamMessage
        ? String(payload.talentTeamMessage)
        : undefined,
    });

    const mail = await sendEmail({
      to: talentEmail,
      subject: talentTemplate.subject,
      html: talentTemplate.html,
      text: talentTemplate.text,
    });
    if (!mail.ok) errors.push(mail.error ?? "email equipo talento falló");

    const slack = await sendSlackMessage(talentTemplate.text);
    if (!slack.ok && slack.error !== "SLACK_WEBHOOK_URL no configurada") {
      errors.push(slack.error ?? "slack falló");
    }
  }

  if (payload.notifyCandidate !== false && candidateEmail) {
    const candidateTemplate = technicalApprovedCandidateTemplate({
      fullName,
      body: payload.candidateEmailBody
        ? String(payload.candidateEmailBody)
        : undefined,
      trackingUrl: trackingUrlFromPayload(payload),
    });

    const mail = await sendEmail({
      to: candidateEmail,
      subject:
        String(payload.candidateEmailSubject ?? "") || candidateTemplate.subject,
      html: candidateTemplate.html,
      text: candidateTemplate.text,
    });
    if (!mail.ok) errors.push(mail.error ?? "email candidato falló");
  }

  return errors;
}

async function handleInterviewApproved(payload: Record<string, unknown>) {
  const email = String(payload.email ?? "");
  const fullName = String(payload.fullName ?? "Candidato");
  const jobTitle = String(payload.jobTitle ?? "la vacante");

  if (!email) return ["email candidato faltante"];

  const template = interviewScheduledTemplate({
    fullName,
    jobTitle,
    trackingUrl: trackingUrlFromPayload(payload),
  });
  const result = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return result.ok ? [] : [result.error ?? "email entrevista falló"];
}

export async function runAutomationHandler(
  eventType: AutomationEventType,
  payload: Record<string, unknown>
): Promise<string[]> {
  switch (eventType) {
    case "candidate.created":
      return handleCandidateCreated(payload);
    case "candidate.scored":
      return handleCandidateScored(payload);
    case "stage.changed":
      return handleStageChanged(payload);
    case "interview.technical_approved":
      return handleTechnicalApproved(payload);
    case "interview.approved":
      return handleInterviewApproved(payload);
    default:
      return [];
  }
}
