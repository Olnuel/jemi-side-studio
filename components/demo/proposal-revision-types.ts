export type ProposalDraft = {
  approach: string;
  estimateMinutes: number;
  confidence: number;
};

export type RevisionRequest = {
  id: number;
  proposalVersion: number;
  category: "Approach" | "Estimate" | "Confidence" | "Clarification";
  reason: string;
  suggestedEstimateMinutes?: number;
  suggestedConfidence?: number;
  status: "open" | "resolved";
  askedBy: string;
  response?: string;
  resolvedInVersion?: number;
};

export type RevisionEvent = {
  id: number;
  version: number;
  action: "proposed" | "changes requested" | "revised" | "approved" | "rejected" | "guidance sent";
  actor: string;
  note: string;
  createdAt: string;
};
