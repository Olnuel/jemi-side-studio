"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ProposalRevisionForm } from "@/components/demo/proposal-revision-form";
import { ProposalRevisionHistory } from "@/components/demo/proposal-revision-history";
import type { ProposalDraft, RevisionEvent, RevisionRequest } from "@/components/demo/proposal-revision-types";

type Dialog = "request" | "revise" | "guidance" | "evidence" | null;

const initialProposal: ProposalDraft = {
  approach: "Add an in-flight submission guard at the issue form level. Disable the submit action while the request is running, preserve the user's draft if it fails, then re-enable the action so they can retry.",
  estimateMinutes: 25,
  confidence: 87,
};

const initialEvents: RevisionEvent[] = [
  { id: 1, version: 1, action: "proposed", actor: "Patchwork · Contributor agent", note: "Plan prepared with root-cause notes, reproduction steps, and a test plan.", createdAt: "Today · 9:32 AM" },
  { id: 2, version: 1, action: "proposed", actor: "Patchwork · Contributor agent", note: "Root cause identified: the submit action stays enabled while the request is in flight.", createdAt: "Today · 9:36 AM" },
  { id: 3, version: 1, action: "proposed", actor: "Patchwork · Contributor agent", note: "Human review requested. Implementation stays locked until the plan is approved.", createdAt: "Today · 9:41 AM" },
];

const evidenceItems = [
  { title: "Root-cause notes", detail: "The submit handler has no in-flight guard; slow requests leave the button active." },
  { title: "Reproduction steps", detail: "Throttle the network, click Create issue twice, and observe duplicate tickets." },
  { title: "Test plan", detail: "Cover repeat clicks, successful submission, request failure, and draft recovery." },
  { title: "Related report", detail: "Three duplicate issue reports mention slow mobile connections." },
];

const workflowSteps = ["Understand issue", "Plan solution", "Human decision", "Implement & test"];
const demoStorageKey = "jemi-proposal-refinement-v1";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="workspace-modal-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zk-border bg-zk-surface p-5 shadow-2xl sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold tracking-[.15em] text-teal-700">JEMI WORKSPACE</p><h2 id="workspace-modal-title" className="mt-1 text-xl font-bold">{title}</h2></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full text-zk-muted hover:bg-zk-bg" aria-label="Close dialog">✕</button></div>{children}
    </section>
  </div>;
}

export default function DemoIssue() {
  const [proposal, setProposal] = useState<ProposalDraft>(initialProposal);
  const [requests, setRequests] = useState<RevisionRequest[]>([]);
  const [events, setEvents] = useState<RevisionEvent[]>(initialEvents);
  const [status, setStatus] = useState<"awaiting" | "changes" | "approved" | "rejected">("awaiting");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [guidance, setGuidance] = useState("");
  const [guidanceSent, setGuidanceSent] = useState(false);
  const [toast, setToast] = useState("");
  const [issueVotes, setIssueVotes] = useState(12);
  const [voted, setVoted] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(demoStorageKey);
      if (saved) {
        const snapshot = JSON.parse(saved);
        if (snapshot?.schema === 1) {
          if (snapshot.proposal) setProposal(snapshot.proposal);
          if (Array.isArray(snapshot.requests)) setRequests(snapshot.requests);
          if (Array.isArray(snapshot.events)) setEvents(snapshot.events);
          if (["awaiting", "changes", "approved", "rejected"].includes(snapshot.status)) setStatus(snapshot.status);
          if (typeof snapshot.issueVotes === "number") setIssueVotes(snapshot.issueVotes);
          if (typeof snapshot.voted === "boolean") setVoted(snapshot.voted);
          if (typeof snapshot.guidanceSent === "boolean") setGuidanceSent(snapshot.guidanceSent);
        }
      }
    } catch {
      // The workflow still works in memory if browser storage is unavailable.
    }
    setDemoLoaded(true);
  }, []);

  useEffect(() => {
    if (!demoLoaded) return;
    try {
      window.localStorage.setItem(demoStorageKey, JSON.stringify({ schema: 1, proposal, requests, events, status, issueVotes, voted, guidanceSent }));
    } catch {
      // Browser storage is optional; interaction remains available in memory.
    }
  }, [demoLoaded, proposal, requests, events, status, issueVotes, voted, guidanceSent]);

  const openRequest = requests.find((request) => request.status === "open");
  const attentionCount = status === "awaiting" || openRequest ? 1 : 0;
  const version = events.reduce((latest, event) => Math.max(latest, event.version), 1);
  const statusText = status === "approved" ? "Approved · ready to start" : status === "rejected" ? "Plan rejected" : status === "changes" ? "Agent revision requested" : "Awaiting approval · Human review required";
  const statusTone = status === "approved" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" : status === "rejected" ? "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200" : status === "changes" ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200";

  const visibleEvents = useMemo(() => [...events].reverse(), [events]);

  function addEvent(action: RevisionEvent["action"], actor: string, note: string, eventVersion = version) {
    setEvents((current) => [...current, { id: Date.now(), version: eventVersion, action, actor, note, createdAt: "Just now" }]);
  }

  function requestChanges(input: Pick<RevisionRequest, "category" | "reason" | "suggestedEstimateMinutes" | "suggestedConfidence">) {
    const revision: RevisionRequest = { ...input, id: Date.now(), proposalVersion: version, status: "open", askedBy: "Alex Stone" };
    setRequests((current) => [...current, revision]);
    setStatus("changes");
    addEvent("changes requested", "Alex Stone · Workspace owner", `${input.category}: ${input.reason}`);
    setDialog(null);
    setToast("Change request sent to Patchwork");
  }

  function reviseProposal(next: ProposalDraft, response: string) {
    const nextVersion = version + 1;
    setProposal(next);
    setRequests((current) => current.map((request) => request.status === "open" ? { ...request, status: "resolved", response, resolvedInVersion: nextVersion } : request));
    setStatus("awaiting");
    addEvent("revised", "Patchwork · Contributor agent", response, nextVersion);
    setDialog(null);
    setToast(`Proposal revised to v${nextVersion}; ready for your review`);
  }

  function approvePlan() {
    setStatus("approved");
    addEvent("approved", "Alex Stone · Workspace owner", `Approved proposal v${version}. Implementation is now unlocked.`);
    setToast("Plan approved · implementation unlocked");
  }

  function rejectPlan() {
    setStatus("rejected");
    addEvent("rejected", "Alex Stone · Workspace owner", `Rejected proposal v${version}.`);
    setToast("Plan rejected");
  }

  function sendGuidance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!guidance.trim()) return;
    addEvent("guidance sent", "Alex Stone · Workspace owner", `Guidance for Patchwork: ${guidance.trim()}`);
    setGuidanceSent(true);
    setGuidance("");
    setToast("Guidance added to the shared issue timeline");
  }

  function resetWorkspace() {
    setProposal(initialProposal);
    setRequests([]);
    setEvents(initialEvents);
    setStatus("awaiting");
    setIssueVotes(12);
    setVoted(false);
    setGuidanceSent(false);
    try { window.localStorage.removeItem(demoStorageKey); } catch { /* Storage may be unavailable. */ }
    setToast("Workspace restored to the starting proposal");
  }

  const buttonClass = "rounded-xl border border-zk-border px-3.5 py-2 text-sm font-semibold transition hover:border-teal-700 hover:text-teal-800";

  return <main className="min-h-screen bg-zk-bg text-zk-text">
    {toast && <div role="status" className="fixed right-4 top-4 z-[60] max-w-sm rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl">{toast}<button type="button" className="ml-3 text-white/70 hover:text-white" onClick={() => setToast("")}>×</button></div>}
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <aside className="hidden w-60 shrink-0 border-r border-zk-border bg-zk-surface px-4 py-6 lg:block">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2 text-lg font-extrabold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-teal-700 text-white">z</span>ziki</Link>
        <SidebarGroup title="Workspace">
          <SidebarLink href="/demo" label="Overview" icon="◫" />
          <SidebarLink href="/demo/issues" label="Issues" icon="◉" badge="12" active />
          <SidebarLink href="/demo/agents" label="Agent activity" icon="✳" badge="3" />
          <SidebarLink href="/demo/issues" label="Projects" icon="▦" />
          <SidebarLink href="/demo/issues" label="Mistake registry" icon="◇" />
        </SidebarGroup>
        <SidebarGroup title="Collaboration">
          <SidebarLink href="#approval-card" label="Human approvals" icon="✓" badge={String(attentionCount)} active={Boolean(attentionCount)} />
          <SidebarLink href="#interaction-timeline" label="Activity history" icon="↻" />
          <SidebarLink href="/demo/agents" label="Agent permissions" icon="⛨" />
        </SidebarGroup>
        <div className="mt-8 rounded-2xl bg-teal-50 p-3 dark:bg-teal-950/30"><p className="text-xs font-bold text-teal-800 dark:text-teal-200">JEMI WORKSPACE</p><p className="mt-1 text-xs leading-5 text-zk-muted">Explore without signing in. Your changes are saved only in this browser.</p></div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-zk-border bg-zk-surface/95 px-4 py-3 backdrop-blur sm:px-7">
          <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Jemi Side Studio</span><span className="text-zk-muted">/</span><span className="text-zk-muted">Web app</span></div>
          <div className="flex items-center gap-2"><span className="rounded-full border border-zk-border px-3 py-1.5 text-xs text-zk-muted">Open workspace · no sign-in</span><button type="button" className="grid size-9 place-items-center rounded-full border border-zk-border" aria-label="Notifications">♧</button><span className="grid size-9 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800">AS</span></div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-zk-border bg-zk-surface px-4 py-2 text-xs lg:hidden" aria-label="Workspace navigation"><Link className="rounded-full bg-teal-50 px-3 py-2 font-semibold text-teal-800 dark:bg-teal-950/40 dark:text-teal-200" href="/demo">Overview</Link><Link className="rounded-full px-3 py-2 text-zk-muted" href="/demo/issues">Issues</Link><Link className="rounded-full px-3 py-2 text-zk-muted" href="/demo/agents">Agent activity</Link><a className="rounded-full px-3 py-2 text-zk-muted" href="#approval-card">Approvals {attentionCount ? `· ${attentionCount}` : ""}</a><a className="rounded-full px-3 py-2 text-zk-muted" href="#interaction-timeline">History</a></nav>

        <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-7 sm:pt-8">
          <Link href="/demo/issues" className="text-sm font-medium text-teal-700 hover:underline">← Back to issues</Link>
          {attentionCount > 0 && <a href="#approval-card" className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><span><strong>Needs your attention:</strong> {attentionCount} proposal {attentionCount === 1 ? "decision" : "decisions"} is holding progress.</span><span className="font-semibold">Review now →</span></a>}

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zk-muted"><span className="font-mono">ZK-284</span><span>·</span><span>Frontend</span><span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">High severity</span></div><h1 className="mt-2 max-w-4xl text-2xl font-bold tracking-tight sm:text-3xl">Prevent duplicate issue submissions on slow networks</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-zk-muted">A slow connection can leave the Create issue button active long enough for someone to submit the same report twice.</p></div><button type="button" aria-pressed={voted} onClick={() => { setVoted((value) => !value); setIssueVotes((value) => value + (voted ? -1 : 1)); }} className={`${buttonClass} ${voted ? "border-teal-700 bg-teal-700 text-white hover:text-white" : "bg-zk-surface"}`}>{voted ? "✓ Following" : "♡ Follow"} · {issueVotes}</button></div>

          <section className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Workspace metrics"><Metric label="Active agents" value="03" detail="2 working · 1 waiting"/><Metric label="Needs your decision" value={String(attentionCount).padStart(2, "0")} detail={openRequest ? "Revision request open" : status === "approved" ? "All clear" : "One approval holding progress"} tone={attentionCount ? "amber" : "teal"}/><Metric label="Evidence collected" value="04" detail="Attached to this issue"/><Metric label="Autonomy boundary" value="Human-gated" detail="Merge & product changes need approval" compact/></section>

          <section className="mt-6 rounded-2xl border border-zk-border bg-zk-surface p-4 sm:p-5" aria-labelledby="workflow-heading"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[11px] font-bold tracking-[.14em] text-teal-700">ISSUE WORKFLOW</p><h2 id="workflow-heading" className="mt-1 font-bold">A clear path from report to fix</h2></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusTone}`}>{statusText}</span></div><ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{workflowSteps.map((step, index) => {const done = index < 2 || (index === 2 && (status === "approved" || status === "rejected")); const current = index === 2 && status !== "approved" && status !== "rejected"; const locked = index === 3 && status !== "approved"; return <li key={step} className={`rounded-xl border p-3 ${current ? "border-teal-300 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/20" : "border-zk-border"}`}><div className="flex items-center gap-2"><span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${done ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" : locked ? "bg-zk-bg text-zk-muted" : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-100"}`}>{done ? "✓" : locked ? "🔒" : "3"}</span><span className="text-sm font-semibold">{step}</span></div><p className="mt-2 pl-8 text-xs text-zk-muted">{index === 0 ? "Requirements mapped" : index === 1 ? `Plan ready · v${version}` : index === 2 ? status === "approved" ? "Approved by workspace owner" : status === "rejected" ? "Plan declined" : openRequest ? "Agent is preparing a revision" : "Review the plan" : status === "approved" ? "Unlocked · agent may begin" : "Locked until approval"}</p></li>;})}</ol></section>

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
            <div className="min-w-0 space-y-5">
              <section className="rounded-2xl border border-zk-border bg-zk-surface p-5 sm:p-6" aria-labelledby="proposal-heading"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-bold tracking-[.14em] text-teal-700">PROPOSAL · VERSION {version}</p><h2 id="proposal-heading" className="mt-1 text-lg font-bold">Agent plan</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{proposal.confidence}% confidence</span></div><p className="mt-4 text-sm leading-6 text-zk-muted">{proposal.approach}</p><ol className="mt-5 space-y-3">{["Inspect current form submission state and error handling", "Add an in-flight guard to prevent repeat clicks", "Preserve the user's draft and restore the button after a failure", "Test duplicate clicks, slow responses, and retry scenarios"].map((step, index) => <li key={step} className="flex gap-3 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">{index + 1}</span><span className="pt-0.5">{step}</span></li>)}</ol><div className="mt-5 flex flex-wrap gap-4 border-t border-zk-border pt-4 text-xs text-zk-muted"><span>⏱ Estimate: <strong className="text-zk-text">{proposal.estimateMinutes} min</strong></span><span>🧑‍💻 Agent: <strong className="text-zk-text">Patchwork</strong> · Contributor</span><span>🔐 Changes stay human-gated</span></div></section>

              <section id="approval-card" className="scroll-mt-24 rounded-2xl border border-teal-200 bg-zk-surface p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold tracking-[.14em] text-teal-700">YOUR DECISION</p><h2 className="mt-1 text-lg font-bold">Review Patchwork’s plan</h2></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>{status === "awaiting" ? "Waiting on you" : status === "changes" ? "Waiting on agent" : status === "approved" ? "Approved" : "Rejected"}</span></div>{openRequest && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><strong>Open request · {openRequest.category}:</strong> {openRequest.reason}</p>}<div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={status !== "awaiting"} onClick={approvePlan} className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45">✓ Approve plan</button><button type="button" disabled={status !== "awaiting"} onClick={() => setDialog("request")} className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-45`}>↗ Request changes</button><button type="button" disabled={status !== "awaiting"} onClick={rejectPlan} className="rounded-xl border border-zk-border px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45">× Reject plan</button></div>{status === "approved" && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">Implementation is unlocked. Patchwork can now begin the approved work.</div>}{status === "rejected" && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-950/30 dark:text-rose-100">The agent will not start this plan. You can revisit the issue workflow later.</div>}</section>

              <section className="rounded-2xl border border-zk-border bg-zk-surface p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold tracking-[.14em] text-teal-700">SHARED CONTEXT</p><h2 className="mt-1 font-bold">Proposal conversation</h2></div><button type="button" onClick={() => setDialog("guidance")} className={buttonClass}>✎ Send guidance to agent</button></div><div className="mt-4 space-y-3"><p className="max-w-2xl rounded-2xl rounded-tl-sm bg-zk-bg p-3 text-sm leading-6"><strong>Patchwork · v{version}</strong><br/>I propose a form-level in-flight guard. This prevents duplicate submissions without changing the API.</p>{requests.map((request) => <p key={request.id} className="ml-auto max-w-2xl rounded-2xl rounded-tr-sm bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><strong>Alex · requested changes on v{request.proposalVersion}</strong><br/>{request.reason}</p>)}{guidanceSent && <p className="ml-auto max-w-2xl rounded-2xl rounded-tr-sm bg-sky-50 p-3 text-sm text-sky-950 dark:bg-sky-950/30 dark:text-sky-100"><strong>Alex · guidance sent</strong><br/>Added to the shared issue timeline.</p>}</div></section>

              <ProposalRevisionHistory requests={requests} events={visibleEvents}/>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-zk-border bg-zk-surface p-5"><div className="flex items-center justify-between gap-2"><div><p className="text-[11px] font-bold tracking-[.14em] text-teal-700">SUPPORTING CONTEXT</p><h2 className="mt-1 font-bold">Evidence attached</h2></div><span className="rounded-full bg-zk-bg px-2.5 py-1 text-xs font-semibold">04</span></div><ul className="mt-4 space-y-3">{evidenceItems.slice(0, 3).map((item) => <li key={item.title} className="flex gap-2 text-sm"><span className="text-emerald-700">✓</span><span>{item.title}</span></li>)}</ul><button type="button" onClick={() => setDialog("evidence")} className="mt-4 text-sm font-semibold text-teal-700 hover:underline">Inspect all evidence →</button></section>

              <section id="interaction-timeline" className="scroll-mt-24 rounded-2xl border border-zk-border bg-zk-surface p-5"><p className="text-[11px] font-bold tracking-[.14em] text-teal-700">AUDIT TRAIL</p><h2 className="mt-1 font-bold">Interaction timeline</h2><ol className="mt-4 space-y-4">{visibleEvents.slice(0, 5).map((event) => <li key={event.id} className="flex gap-3"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-teal-600"/><div><p className="text-sm font-semibold">{event.actor.split(" · ")[0]} {event.action}</p><p className="mt-0.5 text-xs leading-5 text-zk-muted">{event.note}</p><p className="mt-1 text-[11px] text-zk-muted">{event.createdAt}</p></div></li>)}</ol></section>

              {openRequest && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/25"><p className="text-xs font-bold tracking-widest text-amber-900 dark:text-amber-200">AGENT WORKSPACE</p><h2 className="mt-2 font-bold">Patchwork has your feedback</h2><p className="mt-2 text-sm leading-6 text-zk-muted">Revise the proposal to answer the open request. Your changes will create a new version and resolve the request.</p><button type="button" onClick={() => setDialog("revise")} className="mt-4 w-full rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">↻ Revise proposal</button></section>}
            </aside>
          </div>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-zk-border py-5 text-xs text-zk-muted"><span>Jemi Side Studio · no sign-in required · changes are saved only in this browser</span><button type="button" onClick={resetWorkspace} className="rounded-full border border-zk-border px-3 py-1.5 font-semibold hover:border-teal-700 hover:text-teal-800">Reset to starting state</button></footer>
        </div>
      </div>
    </div>

      {dialog === "request" && <Modal title="Request changes to the plan" onClose={() => setDialog(null)}><p className="mb-5 text-sm leading-6 text-zk-muted">Your request will be attached to proposal v{version}. Patchwork can revise the proposal before you approve it.</p><ProposalRevisionForm mode="request" proposal={proposal} onCancel={() => setDialog(null)} onRequest={requestChanges}/></Modal>}
      {dialog === "revise" && <Modal title={`Revise proposal · v${version} → v${version + 1}`} onClose={() => setDialog(null)}><p className="mb-5 text-sm leading-6 text-zk-muted">Patchwork responds to the owner's open request, updates the plan, and submits a new version for review.</p><ProposalRevisionForm mode="revise" proposal={proposal} request={openRequest} onCancel={() => setDialog(null)} onRevise={reviseProposal}/></Modal>}
      {dialog === "guidance" && <Modal title="Send guidance to Patchwork" onClose={() => setDialog(null)}><p className="mb-4 text-sm leading-6 text-zk-muted">Add context or a constraint. Guidance stays visible in this issue’s interaction timeline.</p><form onSubmit={sendGuidance}><label htmlFor="guidance-note" className="text-sm font-semibold">Your note</label><textarea id="guidance-note" autoFocus rows={4} required value={guidance} onChange={(event) => setGuidance(event.target.value)} placeholder="For example: preserve the current form state if the request times out…" className="mt-1 w-full rounded-xl border border-zk-border bg-zk-bg px-3 py-2.5 text-sm outline-none focus:border-teal-600"/><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className={buttonClass}>Cancel</button><button type="submit" className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">Send guidance</button></div></form></Modal>}
      {dialog === "evidence" && <Modal title="Evidence collected for ZK-284" onClose={() => setDialog(null)}><ul className="space-y-3">{evidenceItems.map((item, index) => <li key={item.title} className="flex gap-3 rounded-xl border border-zk-border p-4"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">0{index + 1}</span><div><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-1 text-sm leading-5 text-zk-muted">{item.detail}</p></div></li>)}</ul><div className="mt-5 flex justify-end"><button type="button" onClick={() => setDialog(null)} className={buttonClass}>Done</button></div></Modal>}
    </main>;
}

function SidebarGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mb-7"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-zk-muted">{title}</p><nav className="space-y-1" aria-label={title}>{children}</nav></div>;
}

function SidebarLink({ href, label, icon, badge, active = false }: { href: string; label: string; icon: string; badge?: string; active?: boolean }) {
  return <Link href={href} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-teal-50 font-semibold text-teal-900 dark:bg-teal-950/40 dark:text-teal-100" : "text-zk-muted hover:bg-zk-bg hover:text-zk-text"}`}><span className="flex items-center gap-2.5"><span aria-hidden="true" className="w-4 text-center">{icon}</span>{label}</span>{badge !== undefined && <span className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${active && badge !== "0" ? "bg-teal-100 text-teal-900 dark:bg-teal-900/60 dark:text-teal-100" : "bg-zk-bg text-zk-muted"}`}>{badge}</span>}</Link>;
}

function Metric({ label, value, detail, tone = "slate", compact = false }: { label: string; value: string; detail: string; tone?: "slate" | "amber" | "teal"; compact?: boolean }) {
  const valueTone = tone === "amber" ? "text-amber-700 dark:text-amber-200" : tone === "teal" ? "text-teal-700 dark:text-teal-200" : "text-zk-text";
  return <article className="rounded-2xl border border-zk-border bg-zk-surface p-4"><p className="text-xs font-medium text-zk-muted">{label}</p><p className={`mt-2 font-bold tabular-nums ${compact ? "text-base" : "text-2xl"} ${valueTone}`}>{value}</p><p className="mt-1 text-[11px] leading-4 text-zk-muted">{detail}</p></article>;
}
