import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const sections = {
  issues: {
    eyebrow: "THE SHARED BACKLOG",
    title: "Small fixes, in plain sight.",
    copy: "People can browse reports, add context, and see what is waiting for help. Votes tell the team where the rough edges are.",
    items: ["Search forgets its filters after refresh", "Invite links expire before teammates arrive", "Keep the composer open while attaching files"],
    next: "An agent can suggest a plan, but a person chooses what happens next.",
  },
  agents: {
    eyebrow: "HELPFUL, WITH PERMISSION",
    title: "Meet the agents on the team.",
    copy: "Agents can look for issues and prepare a useful plan. They work on behalf of a person and wait for a clear go-ahead.",
    items: ["Scout found 3 reports that may be related", "Patch prepared a small fix proposal", "Verifier is ready to check the linked change"],
    next: "Every suggestion stays attached to its issue, so the team has the context.",
  },
  inbox: {
    eyebrow: "A HUMAN CHECKPOINT",
    title: "One clear question, one useful answer.",
    copy: "When an agent reaches a decision it should not make alone, the question arrives with the issue context and its proposed approach.",
    items: ["Question: update the shared search component, or only the issues page?", "Why it matters: other product areas use the same component", "Agent’s suggestion: keep the fix local until a broader change is requested"],
    next: "Approving a plan lets the agent continue. The team can still review the work before it ships.",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  const content = sections[section as keyof typeof sections];
  return { title: content ? `${content.title} · Jemi Side Studio` : "Jemi Side Studio" };
}

export default async function DemoSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const content = sections[section as keyof typeof sections];
  if (!content) notFound();

  return <main className="min-h-screen bg-zk-bg px-4 py-8 text-zk-text sm:px-8 sm:py-12">
    <div className="mx-auto max-w-3xl">
      <Link href="/demo" className="text-sm font-semibold text-teal-700 hover:underline">← Back to workspace overview</Link>
      <section className="mt-10 rounded-3xl border border-zk-border bg-zk-surface p-6 sm:mt-14 sm:p-10">
        <p className="text-xs font-semibold tracking-widest text-teal-700">{content.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{content.title}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-zk-muted">{content.copy}</p>
        <ul className="mt-8 space-y-3">{content.items.map((item, index) => <li key={item} className="flex gap-3 rounded-2xl border border-zk-border p-4"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-teal-50 text-sm font-semibold text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">{index + 1}</span><span className="pt-1 text-sm">{item}</span></li>)}</ul>
        <p className="mt-6 rounded-2xl bg-zk-bg p-4 text-sm leading-6 text-zk-muted">{content.next}</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link href="/demo/issues" className="rounded-full border border-zk-border px-4 py-2.5 text-sm font-semibold hover:border-teal-700">Issues</Link><Link href="/demo/agents" className="rounded-full border border-zk-border px-4 py-2.5 text-sm font-semibold hover:border-teal-700">Agents</Link><Link href="/demo/inbox" className="rounded-full border border-zk-border px-4 py-2.5 text-sm font-semibold hover:border-teal-700">Human review</Link><Link href="/login" className="rounded-full bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">Start your workspace</Link></div>
      </section>
      <p className="mt-5 text-center text-xs text-zk-muted">This is sample content. No sign-in is required to explore.</p>
    </div>
  </main>;
}
