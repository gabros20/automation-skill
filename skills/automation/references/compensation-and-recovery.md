# Compensation and Recovery

Purpose: Decide what happens after a step fails when an earlier step in the same run already sent,
charged, or wrote something outside your system — and state plainly that the fix is a new forward
action with its own side effects, never a rollback, because you cannot deploy a fix into a vendor's
system and you cannot un-send.

Read when:
- A workflow has more than one step with an external side effect, and any step after the first can
  fail.
- You are deciding what order to run a sequence of external actions in.
- A run failed partway through and some earlier steps already had real-world effect.
- You are about to wire an irreversible action (a charge, a send, a write to a system of record) and
  need to know what your engine does on retry before you wire it.

Skip when:
- The failing step and every step around it live entirely inside your own system, your own queue,
  your own database — that is saga and idempotency-key design for services you own, and `backend`'s
  `async-and-messaging.md` owns it; this file starts where the boundary crosses to a vendor you
  cannot deploy to.
- The question is delivery guarantees and duplicate suppression for a single inbound event — that is
  [integration-reliability](integration-reliability.md).
- The question is whether the run is still going at all, or how you learn it stopped — that is
  [workflow-observability](workflow-observability.md).
- The question is comparing your record against the vendor's to catch what silently drifted — that
  is [reconciliation](reconciliation.md).
- The question is which named engine (Temporal, n8n, Step Functions, …) offers which resume
  mechanism, in named detail — that belongs to the base surface reference for the engine you picked
  (`surface-self-hosted-engine.md`, `surface-code-first-durable.md`); this file only states the
  question you must ask before you trust any of them.

Inputs: the step sequence with each step's external side effect named; which steps, if any, already
ran before the failure; whether your engine resumes from the point of failure or restarts the run
from the trigger.

Produces: an ordered step sequence with the hardest-to-revert action last; a filled
[irreversibility inventory](../assets/irreversibility-inventory.md); a stated compensating action —
or an explicit "none exists, escalate to a person" — per irreversible step; a resume-vs-restart
determination for the engine in use, made before the workflow ships.

## Contents

- Compensation is a forward action, not a rollback
- Hohpe already named this, twenty years ago — use his vocabulary, credited
- The irreversibility taxonomy
- Perform the hardest-to-revert action last
- Compensation can legitimately be a human act
- Partial completion: step 3 of 7 failed, and 1 and 2 already happened
- Before any irreversible step, know whether your engine resumes or restarts (I9)
- Boundary: saga inside your own system stays with `backend`
- Failure modes and handoff

## Compensation is a forward action, not a rollback

`automation` spans systems you do not own. There is no transaction log to roll back, no shared
database to restore from a snapshot, and no deploy you can push to a vendor's servers to make the
last five minutes not have happened. Once a step has an external effect, the only lever left is a
**second, deliberate, forward action** aimed at neutralizing the first one's consequences — and that
second action has its own side effects, its own failure modes, and its own audit trail. A refund is
not an un-charge: the original charge, the statement line it produced, and any processing fee already
occurred and stay true forever; the refund is a distinct transaction that happens to offset it. A
"delete" issued against a partner CRM record does not un-notify whatever workflow the partner's own
system fired off the original write. Treat compensation as a new item on the plan, not a special
"undo" case that gets less design attention than the action it is correcting (I3).

## Hohpe already named this, twenty years ago — use his vocabulary, credited

Do not present this as an undertaught corner. It is not. Gregor Hohpe's **Compensating Action**
pattern (*Enterprise Integration Patterns — Conversation Patterns*,
enterpriseintegrationpatterns.com, `/patterns/conversation/CompensatingAction.html`, © 2003, 2023,
CC BY 4.0 on the pattern name and its bold problem/solution statements only — verified 2026-07-27,
re-verify before quoting again since the grant is per-page, not site-wide) states the problem for
exactly this case, verbatim:

> "A participant is interacting with multiple, independent services, which change their state based
> on the interaction."

That sentence has described the reader of this file since 2003. The reason it feels unowned is that
the collection is largely unread outside integration-architecture circles, not that the mechanism is
new. Use Hohpe's name — **Compensating Action** — as the canonical term rather than inventing a house
name for the same thing; it is both more precise and free to cite.

Two more things the same pattern already settles, credited rather than reinvented:

- **When no compensating action exists at all**, the pattern's own guidance is to reorder the plan so
  the least-recoverable step never has to be recovered from: *"apply PERFORM HARDEST TO REVERT ACTION
  LAST to minimize the chances that this action has to be reverted."* This is the ordering rule the
  [irreversibility inventory](../assets/irreversibility-inventory.md) exists to apply mechanically.
- **Compensation may legitimately be a human act, not a system call.** Hohpe's own example: *"A
  mailed letter to a customer can be compensated by a phone call asking the customer to ignore the
  letter."* If the failed step's effect left your system entirely and nothing automatable can reach
  it, a person picking up the phone is not a workaround — it is the pattern working as designed.

Everything past the problem/solution statements above — the pattern's worked examples, its
discussion, its related-pattern commentary — is © 2003, 2023, all rights reserved; paraphrase it,
don't lift it, and always cite the specific pattern page rather than the collection index (the index
carries no CC grant at all).

## The irreversibility taxonomy

Not every external effect is equally stuck. Before ordering a sequence or choosing a compensating
action, classify each step into one of three tiers — full worksheet in the
[irreversibility inventory](../assets/irreversibility-inventory.md):

1. **Reverses cleanly** — nothing outside your system changed yet (a hold, a draft, an authorized-
   but-not-captured payment).
2. **Compensable only** — the external state changed permanently, but a new forward action can
   neutralize the effect (a captured payment refunded, a partner-CRM record deleted or corrected).
3. **Cannot be taken back, by any mechanism** — the effect left your system and something on the
   other side already consumed it (a sent email once opened, a message posted to a shared channel
   once seen, a webhook payload a partner's own automation already acted on).

The tier is a property of where the step actually stands in your workflow, not a fixed label per
action type — the same "send an email" step is tier 3 the instant it is delivered, regardless of how
trivial the content was.

## Perform the hardest-to-revert action last

Once every step is tiered, the ordering decision is mechanical: put every tier-3 step last, tier-2
steps before that, tier-1 steps first. This does not remove risk — a tier-3 step still cannot be
undone if something after it fails — but it bounds the damage to the steps you could still cleanly
abort or compensate. Skipping this ordering exercise is how a workflow ends up sending the customer
confirmation email *before* confirming the charge captured, so a declined payment is followed by a
cheerful "you're all set."

## Compensation can legitimately be a human act

Where the irreversibility inventory shows tier 3 with no automatable compensating action, do not
force a fragile automated "fix" (a second automated email retracting the first, a bot-posted
correction in the same channel). Route it to a person and say so explicitly in the workflow's
artifact contract: who gets notified, what they are expected to do, and by when. At n=1, this person
is you — but "escalate to a human" is still the correct node in the graph, not an admission that the
workflow is incomplete (I6).

## Partial completion: step 3 of 7 failed, and 1 and 2 already happened

A run that dies at step 3 of 7 is not "30% failed" — it is "steps 1 and 2 are permanently true, and
steps 3 through 7 did not happen." Before deciding whether to retry, restart, or halt:

- Look up steps 1 and 2 in the irreversibility inventory. If either is tier 2 or 3, retrying the
  *whole run* from the top risks re-doing them.
- Decide, per step, whether the correct response to the partial state is: skip (already done, do not
  repeat), retry (idempotent, safe to repeat), compensate (undo what step 3's dependency implied), or
  halt and escalate (nothing automatable is safe).
- Record which of the four applied and why — this is the evidence a later reconciliation pass or a
  person picking up the incident needs, and it is exactly what I2 asks for: the system's own belief
  that it "handled" the failure is not itself proof it was handled correctly.

## Before any irreversible step, know whether your engine resumes or restarts (I9)

This is the single most consequential thing to check before wiring a tier-2 or tier-3 step anywhere
but last, and it is a property of the **engine**, not the workflow logic:

- **Resume-capable** engines skip steps that already completed and only re-execute what failed or
  never ran.
- **Restart-only** engines re-run the entire flow from the trigger on retry — including every step
  that already had its external effect.

Confirmed, dated evidence for the restart-only failure mode, from the vendor's own docs: Azure
Durable Functions, verbatim, on an orchestrator that throws unhandled — *"you can't retry an
orchestration instance after it fails"* (learn.microsoft.com, Durable Orchestrations Overview,
verified 2026-07-27, re-verify before relying on this past a few months). And from a self-hosted
engine's own explanation of *why* it built durable, resumable execution in the first place —
Activepieces, verbatim: *"a worker that dies mid-flow would restart the whole run from the trigger and
re-send emails, re-charge cards, and re-call APIs"* (activepieces/activepieces, `durable-execution.mdx`,
verified 2026-07-27). That sentence is a vendor describing, in its own documentation, what happens to
every tier-2 and tier-3 step in your inventory if you build on a restart-only engine and skip this
check.

The practical rule: **restart-only plus an irreversible early step is a duplicate-side-effect
generator on every retry.** If your engine restarts, give every tier-2 and tier-3 step its own
idempotency key derived from the business event (I4), independent of whatever the engine's own retry
mechanism does — the engine's resume model is not something you can change, but you can make the step
itself safe to repeat.

Which named engines fall into which camp, and the detail of their resume mechanisms, is the base
surface reference's job, not this file's — read the surface reference for the engine you picked
before you finalize the order.

## Boundary: saga inside your own system stays with `backend`

If every step in the failing sequence is inside your own services — your database, your queue, your
workers — this is saga and compensating-transaction design for a system you can deploy to, and it is
`backend`'s `async-and-messaging.md` to own, not this file's. This reference
owns the case where at least one step belongs to a vendor: you cannot deploy a fix to their side, you
cannot inspect their internal state beyond what their API tells you, and the only recovery mechanism
available to you is a new forward action they will accept through their public interface.

## Failure modes and handoff

Stop and escalate to a person, rather than automating around it, when: the irreversibility inventory
shows a tier-3 step with no compensating action and something already failed downstream of it; the
engine's resume behavior is unconfirmed and the sequence includes a tier-2 or tier-3 step anywhere but
last; or a partial-completion state does not map cleanly to skip/retry/compensate/halt because the
business rule for that case was never stated upstream (route to
[process-capture](process-capture.md) to get it stated, rather than inventing one silently).

When downstream work is expected: hand off the filled irreversibility inventory, the resume-vs-restart
determination for the chosen engine, and the per-step failure path (retry / compensate / dead-letter /
halt) to `operate` if the workflow is going into production, or to `quality` if independent
verification of the failure paths is needed before it ships.
