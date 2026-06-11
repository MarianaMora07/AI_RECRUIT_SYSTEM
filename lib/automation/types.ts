export type AutomationEventType =
  | "candidate.created"
  | "candidate.scored"
  | "stage.changed"
  | "interview.approved"
  | "interview.technical_approved";

export interface AutomationResult {
  skipped?: boolean;
  success?: boolean;
  errors?: string[];
}
