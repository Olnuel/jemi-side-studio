# Proposal: A clarification loop for human–agent work

## The gap

Ziki already lets an agent stop and ask its owner for help through an escalation. A human can approve, authorize, or write a response. That is a useful human-in-the-loop gate, but it is a one-shot exchange: the answer is final, and the agent has no way to ask a follow-up in the same context. Humans may then send a separate agent message, while the decision and its follow-up lose their shared thread.

This makes nuanced questions harder than they need to be. For example, an agent asking whether a change may update a shared API might need a quick scope clarification after the owner approves the direction.

## Prototype placement in Ziki

The local UI is integrated into the existing human–agent workflow rather than introduced as a separate destination:

- On an issue detail page, pending agent questions now have an inline reply and decision panel beside the issue's status and agent activity.
- The workspace Escalations queue and Activity & Approvals page expose the same inline response, so people can act without losing their place in triage.
- The existing authenticated escalation action records the human's answer, and the linked issue path is revalidated so its visible guidance stays current.

The current Ziki data model treats the owner's answer as a one-time resolution. The integrated UI intentionally uses that real behavior. A true multi-turn thread, including agent follow-ups and per-message read state, is a next implementation step that requires a persisted conversation model and agent API support.

## Proposed improvement: Clarification thread

Turn each escalation into a small, contextual conversation between the requesting agent and its owner. Keep the escalation as the durable decision record, and let the people and agent exchange follow-up messages underneath it until the human closes the loop.

### Human experience

- Show the escalation question, issue link, and agent identity together.
- Give the human a reply box with clear choices: **Reply**, **Approve direction**, or **Decline**. Approval and decline include an optional rationale.
- Keep the thread visible on the issue and on the workspace Escalations page.
- Show who is expected to act next and whether the agent has read the latest human reply.
- Preserve the full exchange after resolution so future contributors can understand why a decision was made.

### Agent experience

- Deliver each human reply into the agent's existing inbox, linked to the escalation ID.
- Allow the agent to acknowledge the guidance, ask one follow-up, or report that work has resumed.
- Keep consequential actions—claiming work, widening scope, or closing an issue—behind the existing explicit authorization and lifecycle rules. A message alone never grants permission.

## Example flow

1. Agent: “This fix requires changing the shared API response. Is that in scope?”
2. Human: “The direction is okay. Keep the old field available for existing clients.”
3. Agent: “Understood. I’ll add the field without removing the old one.”
4. Human closes the clarification as **Guidance confirmed**. The answer and rationale remain attached to the escalation.

## Why this fits Ziki

Ziki already has issue-linked escalations, human answers, agent-specific inbox messages, and read receipts for messages sent to agents. The proposal reuses those interaction concepts and adds a common thread identity and a visible “waiting on” state. It strengthens the existing human review gate without changing who can approve, claim, merge, or deploy work.

## Smallest useful implementation

1. Add a thread-message record linked to an escalation and author (agent or human), with timestamp and read state.
2. Keep the initial escalation body and the human's final resolution fields as the decision record; do not rewrite them into chat messages.
3. Add an authenticated human reply action and an agent API action for follow-up messages. Scope both to the escalation's tenant, agent, and owner/admin permissions.
4. Deliver new human replies through the agent inbox. Record agent replies in the same thread and notify the owner through the existing activity/notification path.
5. Render the chronological thread on the escalation detail page and issue page, with a clear unresolved/resolved state and keyboard-accessible reply form.
6. Preserve the current quick actions for straightforward approvals, but record their decision as a thread event so the conversation remains complete.

## Guardrails

- Only the owning human (or an authorized tenant admin where current policy permits) can reply or resolve.
- The agent can add context but cannot resolve its own human-approval or authorization request.
- Replies do not implicitly authorize work; explicit authorization remains a distinct action.
- Resolved threads are read-only unless a human reopens them.
- Keep private agent conversations private to the owner/admin and the relevant agent; do not put message bodies in tenant-wide feeds.

## How to evaluate it

Pilot on issue-linked questions, blockers, and human-approval requests. Track median time from escalation to resolution, the share of escalations resolved without a second out-of-band message, reopen/follow-up frequency, and human reports of unclear or accidental authorization. A successful pilot should reduce context switching while keeping explicit approval boundaries intact.

## Product decision requested

Should issue-linked escalations support a short, auditable follow-up thread while retaining the current one-click authorization gate?
