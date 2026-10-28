import Link from "next/link";
import { parseEscalationBody } from "@/lib/agent-questions";
import { LocalTime } from "@/components/local-time";
import {
  EscalationAnswerForm,
  EscalationTypeBadge,
  QuickResolveButtons,
} from "@/app/(app)/escalations/escalation-controls";

export type TicketEscalation = {
  id: string;
  body: string;
  answer?: string | null;
  answeredAt?: Date | null;
  createdAt: Date;
  agent: {
    id?: string;
    name: string;
  };
};

export function IssueEscalations({
  escalations,
}: {
  escalations: TicketEscalation[];
}) {
  if (escalations.length === 0) {
    return null;
  }

  const pending = escalations.filter((e) => !e.answeredAt);

  return (
    <section
      id="escalations"
      aria-label="Agent escalations"
      className="scroll-mt-24 rounded-xl border border-zk-border bg-zk-surface p-4 sm:p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zk-divider pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zk-muted">
            Escalations ({escalations.length})
          </h2>
          {pending.length > 0 ? (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-zk-warn-fg">
              {pending.length} unresolved
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              All resolved
            </span>
          )}
        </div>
        <Link
          href="/escalations"
          className="text-xs font-medium text-zk-accent hover:underline"
        >
          View all workspace escalations →
        </Link>
      </div>

      <ul className="space-y-3">
        {escalations.map((esc) => {
          const parsed = parseEscalationBody(esc.body);
          const type = parsed.type;
          const isPending = !esc.answeredAt;

          return (
            <li
              key={esc.id}
              className={`rounded-lg border p-4 space-y-3 transition-colors ${
                isPending
                  ? "border-zk-warn-bd bg-zk-warn-bg/20"
                  : "border-zk-border bg-zk-chip/40"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <EscalationTypeBadge type={type} />
                  <span className="text-sm font-semibold text-zk-text">
                    {esc.agent.name}
                  </span>
                  <span className="text-xs text-zk-muted">•</span>
                  <LocalTime date={esc.createdAt} className="text-xs text-zk-muted" />
                </div>
                {isPending ? (
                  <span className="text-xs font-medium text-amber-700">Awaiting guidance</span>
                ) : (
                  <span className="text-xs font-medium text-emerald-700">✓ Resolved</span>
                )}
              </div>

              <p className="whitespace-pre-wrap text-sm text-zk-text">{parsed.cleanBody}</p>

              {isPending ? (
                <div className="space-y-4 border-t border-amber-200/60 pt-3">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-zk-text2">Quick decision</p>
                    <QuickResolveButtons escalationId={esc.id} />
                  </div>
                  <div className="rounded-xl border border-zk-border bg-zk-surface p-3 sm:p-4">
                    <h3 id={`escalation-response-${esc.id}`} className="mb-2 text-sm font-semibold text-zk-text">
                      Reply in this issue
                    </h3>
                    <p className="mb-3 text-xs text-zk-muted">
                      Give {esc.agent.name} a decision or clarifying context. Your response is recorded with this issue and may resume a paused claim.
                    </p>
                    <EscalationAnswerForm escalationId={esc.id} labelledBy={`escalation-response-${esc.id}`} />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-zk-surface p-3 text-sm text-zk-text2 border border-zk-border space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-zk-text2">Your guidance</span>
                    {esc.answeredAt ? <LocalTime date={esc.answeredAt} className="text-xs text-zk-muted" /> : null}
                  </div>
                  <p className="whitespace-pre-wrap">{esc.answer}</p>
                  <Link href={`/escalations/${esc.id}`} className="inline-flex pt-1 text-xs font-semibold text-zk-accent hover:underline">
                    View escalation details →
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
