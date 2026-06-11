import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/automation/email";
import { getTalentTeamEmail } from "@/lib/automation/config";
import { dailyReportTemplate } from "@/lib/automation/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { PIPELINE_STAGE_LABELS, type PipelineStage } from "@/lib/constants/roles";

export const dynamic = "force-dynamic";

interface DashboardMetrics {
  totalJobs?: number;
  openJobs?: number;
  totalCandidates?: number;
  stageCounts?: Record<string, number>;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const talentEmail = getTalentTeamEmail();
  if (!talentEmail) {
    return NextResponse.json({
      skipped: true,
      reason: "TALENT_TEAM_EMAIL no configurado",
    });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Supabase admin no disponible" }, { status: 500 });
  }

  const { data: metricsRaw } = await admin.rpc("get_dashboard_metrics");
  const m = (metricsRaw ?? {}) as DashboardMetrics;
  const stageCounts = m.stageCounts ?? {};

  const stageLinesHtml = Object.entries(stageCounts)
    .map(([stage, value]) => {
      const label = PIPELINE_STAGE_LABELS[stage as PipelineStage] ?? stage;
      return `<li>${label}: ${value}</li>`;
    })
    .join("");

  const template = dailyReportTemplate({
    totalJobs: m.totalJobs ?? 0,
    openJobs: m.openJobs ?? 0,
    totalCandidates: m.totalCandidates ?? 0,
    interviewCount: stageCounts.interview ?? 0,
    approvedCount: stageCounts.interview_approved ?? 0,
    stageLinesHtml: stageLinesHtml || "<li>Sin datos</li>",
  });

  const result = await sendEmail({
    to: talentEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
