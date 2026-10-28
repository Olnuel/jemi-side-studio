"use client";

import { useState, type FormEvent } from "react";
import type { ProposalDraft, RevisionRequest } from "./proposal-revision-types";

type Props = {
  mode: "request" | "revise";
  proposal: ProposalDraft;
  request?: RevisionRequest;
  onCancel: () => void;
  onRequest?: (input: Pick<RevisionRequest, "category" | "reason" | "suggestedEstimateMinutes" | "suggestedConfidence">) => void;
  onRevise?: (input: ProposalDraft, response: string) => void;
};

export function ProposalRevisionForm({ mode, proposal, request, onCancel, onRequest, onRevise }: Props) {
  const [category, setCategory] = useState<RevisionRequest["category"]>("Approach");
  const [reason, setReason] = useState("");
  const [suggestedEstimate, setSuggestedEstimate] = useState("");
  const [suggestedConfidence, setSuggestedConfidence] = useState("");
  const [approach, setApproach] = useState(proposal.approach);
  const [estimate, setEstimate] = useState(String(proposal.estimateMinutes));
  const [confidence, setConfidence] = useState(String(proposal.confidence));
  const [response, setResponse] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "request") {
      if (!reason.trim()) return;
      onRequest?.({
        category,
        reason: reason.trim(),
        ...(suggestedEstimate ? { suggestedEstimateMinutes: Number(suggestedEstimate) } : {}),
        ...(suggestedConfidence ? { suggestedConfidence: Number(suggestedConfidence) } : {}),
      });
      return;
    }
    if (!response.trim() || !approach.trim()) return;
    onRevise?.({ approach: approach.trim(), estimateMinutes: Number(estimate), confidence: Number(confidence) }, response.trim());
  }

  const fieldClass = "mt-1 w-full rounded-xl border border-zk-border bg-zk-bg px-3 py-2.5 text-sm text-zk-text outline-none focus:border-teal-600";
  return <form onSubmit={submit} className="space-y-4">
    {mode === "request" ? <>
      <div><label htmlFor="revision-category" className="text-sm font-semibold">What needs another pass?</label><select id="revision-category" value={category} onChange={(event) => setCategory(event.target.value as RevisionRequest["category"])} className={fieldClass}><option>Approach</option><option>Estimate</option><option>Confidence</option><option>Clarification</option></select></div>
      <div><label htmlFor="revision-reason" className="text-sm font-semibold">Reason and requested change <span className="text-rose-600">*</span></label><textarea id="revision-reason" required rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tell the agent what to change and why…" className={fieldClass}/><p className="mt-1 text-xs text-zk-muted">Be specific so the agent can make a useful revision.</p></div>
      <div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="suggested-estimate" className="text-sm font-semibold">Suggested estimate <span className="font-normal text-zk-muted">(optional)</span></label><div className="relative"><input id="suggested-estimate" type="number" min={1} max={480} value={suggestedEstimate} onChange={(event) => setSuggestedEstimate(event.target.value)} placeholder={`${proposal.estimateMinutes} min`} className={fieldClass}/><span className="absolute right-3 top-3 text-xs text-zk-muted">min</span></div></div><div><label htmlFor="suggested-confidence" className="text-sm font-semibold">Suggested confidence <span className="font-normal text-zk-muted">(optional)</span></label><div className="relative"><input id="suggested-confidence" type="number" min={1} max={100} value={suggestedConfidence} onChange={(event) => setSuggestedConfidence(event.target.value)} placeholder={`${proposal.confidence}%`} className={fieldClass}/><span className="absolute right-3 top-3 text-xs text-zk-muted">%</span></div></div></div>
    </> : <>
      {request && <div className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><span className="font-semibold">Owner asked for: </span>{request.reason}</div>}
      <div><label htmlFor="revised-approach" className="text-sm font-semibold">Revised approach</label><textarea id="revised-approach" required rows={4} value={approach} onChange={(event) => setApproach(event.target.value)} className={fieldClass}/></div>
      <div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="revised-estimate" className="text-sm font-semibold">Estimate</label><input id="revised-estimate" type="number" min={1} max={480} required value={estimate} onChange={(event) => setEstimate(event.target.value)} className={fieldClass}/></div><div><label htmlFor="revised-confidence" className="text-sm font-semibold">Confidence</label><input id="revised-confidence" type="number" min={1} max={100} required value={confidence} onChange={(event) => setConfidence(event.target.value)} className={fieldClass}/></div></div>
      <div><label htmlFor="revision-response" className="text-sm font-semibold">Response to owner</label><textarea id="revision-response" required rows={3} value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Explain what changed in this version…" className={fieldClass}/></div>
    </>}
    <div className="flex flex-wrap justify-end gap-2 border-t border-zk-border pt-4"><button type="button" onClick={onCancel} className="rounded-full border border-zk-border px-4 py-2.5 text-sm font-semibold hover:bg-zk-bg">Cancel</button><button type="submit" className="rounded-full bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">{mode === "request" ? "Send change request" : "Submit revision"}</button></div>
  </form>;
}
