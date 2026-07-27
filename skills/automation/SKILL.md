---
name: automation
description: >-
  Build business processes that span systems you do not own — reconciliation against a vendor's
  authoritative state, idempotency and compensation across an uncontrolled boundary, multi-vendor
  credentials, human approval as a process node, triggers, sync semantics, workflow observability,
  quota and rate limits, platform selection and testing. Use to wire Stripe/CRM/email/Slack
  together, fix a duplicate or a sync loop, catch an automation that silently stopped, design an
  approval gate, or choose between Zapier/n8n/Temporal. Defaults to a solo or small-team posture.
  Not for your own server's jobs and queues (→ backend), the model's cognition (→ ai), the
  analytical plane (→ data), deploy and monitoring (→ operate), or the ship gate (→ quality).
---

# Workflow Automation

## Mission and boundary

Build processes that span systems, schedules, events and human approvals — and make them survive the
fact that **you cannot deploy a fix into someone else's system, and you cannot un-send.**

The distinguishing property is the substrate. `backend` owns async work inside a system you control:
your queue, your workers, your database, deployable and testable end to end. `automation` owns the
case where most of the steps belong to vendors you cannot deploy to, cannot unit-test, and cannot
roll back — where the API changes with no deploy on your side, the quota belongs to someone else, and
a person clicking "approve" is a node in the graph.

**The default reader is one person, or a small team, with no second pair of eyes.** That matters more
here than it looks: nearly every control this domain teaches assumes a counterparty. Approval assumes
an approver who is not the requester. Reconciliation assumes a reconciler who is not the recorder.
The *functions* survive at n=1; the second *body* does not, and the substitute is an independent
source, a clock, or a rule committed to in advance (I6).

`automation` writes workflow definitions, integration code, connector configuration and functions. It
does **not** author the business rule — `product` and the commercial skills own that; when no upstream
rule exists, capture it explicitly ([process-capture](references/process-capture.md)) rather than
inventing one silently.

Operate independently when invoked alone. When compatible upstream artifacts are provided, use them
without silently overriding established decisions. Recommend adjacent skills when useful; do not
invoke them automatically unless the user explicitly requested a composition workflow.

## Route before acting

1. Identify the **one primary job** and the **one base surface**. Read one of each.
2. Add `surface-agentic.md` **on top of** a base surface only when a model is a step or the trigger.
   It is additive, never a replacement.
3. **Re-verify anything volatile before using it.** Vendor limits, retry schedules, retention
   windows, pricing and licences churn, and a dependency can change with no deploy on your side (I15).
4. Read every selected reference completely before producing the affected artifact.
5. Do not load unrelated references.

### Jobs

| User intent | Read | Contribution |
|---|---|---|
| **Prove what actually happened — catch what the webhook missed, diff against the vendor, close the gap ⭐** | [reconciliation](references/reconciliation.md) | **Flagship.** Reconcile against the vendor's authoritative state, never your own record; cadence and window; ID-set diff before field diff; matched / within-tolerance / exception; alert-first at n=1 |
| Stop duplicates and missed work — delivery semantics, dedup, at-least-once | [integration-reliability](references/integration-reliability.md) | Quick Acknowledgment (ack fast, process async); dedup keyed on the business event; **the completion-check false positive**; per-vendor delivery guarantees |
| A step failed after an earlier one already sent, charged or wrote | [compensation-and-recovery](references/compensation-and-recovery.md) | Compensation is a forward action, not a rollback; hardest-to-revert last; compensation as a human act; resume-vs-restart before any irreversible step |
| Manage API keys and OAuth across many vendors; something silently stopped authenticating | [credentials-and-connections](references/credentials-and-connections.md) | The credential *fleet*; silent-expiry traps; **scheduled pre-expiry refresh**; credential health as its own monitored resource; the shared-account bus factor |
| Put a human in the loop — who approves, what happens on timeout | [approval-and-authority](references/approval-and-authority.md) | Translating meeting-paced GRC (maker-checker, delegation of authority) into **machine-timeout policy**; no engine ships a default; the n=1 compensating control |
| Decide what starts the workflow; a trigger fires too often, too broadly, or twice | [trigger-design](references/trigger-design.md) | Trigger taxonomy; over-broad conditions; the **cron/DST comparison**; trigger idempotency across two delivery paths |
| Keep two systems in step; records duplicated, deleted rows diverging, a loop | [sync-semantics](references/sync-semantics.md) | The A→B→A loop; **deletes are invisible to incremental sync**; `updated_at` is a lie; conflict policy as a decision; backfill-to-incremental cutover |
| Tell whether it is still running, and what "green" does not mean | [workflow-observability](references/workflow-observability.md) | **A workflow that stopped is not a workflow that failed**; no engine alerts by default; missing-heartbeat over failure notification; audit of what ran on whose authority |
| Cap what this costs; a loop or a retry is burning quota | [cost-and-quota](references/cost-and-quota.md) | Per-task billing; **the quota is the vendor's** and its blast radius is the whole account; retry × 429; the workflow circuit breaker |
| Choose or leave a platform — no-code, self-hosted, code-first | [platform-selection](references/platform-selection.md) | The four tiers; resume-capability as a selection criterion; licence **and liveness**; exit cost asked up front |
| Test a workflow that spans vendors you cannot control | [workflow-testing](references/workflow-testing.md) | What is genuinely untestable and what replaces it — dry run, narrow canary, first-then-bulk gate, fixture replay |
| Turn a business rule into a workflow — or decide not to automate at all | [process-capture](references/process-capture.md) | Capturing the rule at n=1; the control-flow vocabulary worth having; **when not to automate**; prefer the API, and what you buy when there isn't one |

### Surfaces

| Surface | Read | When |
|---|---|---|
| Hosted iPaaS — Zapier/Make-class, connectors and a visual builder | [surface-hosted-ipaas](references/surface-hosted-ipaas.md) | **Default** |
| Self-hosted engine — n8n/Windmill/Activepieces/Kestra | [surface-self-hosted-engine](references/surface-self-hosted-engine.md) | You run the engine |
| Code-first durable execution — Temporal/Inngest/Restate/Step Functions | [surface-code-first-durable](references/surface-code-first-durable.md) | The workflow is code, steps are durable |
| Platform-native — Actions, cron, cloud schedulers | [surface-platform-native](references/surface-platform-native.md) | No engine; the platform is the scheduler |
| **Agentic (additive overlay)** | [surface-agentic](references/surface-agentic.md) | **Stacks on a base surface.** A model is a step, or is the trigger |

Emitting for downstream work → [handoff](references/handoff.md).

## Not this skill

| Ask | Goes to |
|---|---|
| Jobs, queues, outbox, saga **inside your own system**; the idempotency-key primitive itself | `backend` |
| The model's cognition — prompts, agent loop, retrieval, evals, model-level guardrails | `ai` |
| The warehouse, ETL/ELT, analytical modelling, the governed dataset | `data` |
| Deploying the workflow, running the monitoring platform, incident response | `operate` |
| Independent verification and the ship/claim decision | `quality` |
| Authoring the business rule, or customer-facing comms | `product` · `marketing` · `sales` · `success` |
| System shape, contracts, NFR budgets, threat model | `architecture` |
| Coordinating **agents inside a development session** to produce artifacts | `orchestrate` (not a lifecycle skill) |

## Universal invariants

References cite these by number. The numbering is canonical here.

- **I1 — Reconcile against the vendor's authoritative state, never against your own record of what
  you told it.** An ack is not evidence. A webhook that never arrived leaves no trace in your logs.
- **I2 — Never let the system's own record of what it did be the only evidence that it did it.** Log
  the raw event and your interpretation of it as two separate facts, so a completion check can be
  *falsified* against the raw log rather than confirmed by your own prior write.
- **I3 — Compensation is a new forward action with its own side effects, not a rollback.** A refund is
  not an un-charge. Where no compensating action exists, **perform the hardest-to-revert action
  last**. Compensation may legitimately be a human act.
- **I4 — Derive the idempotency key from the business event's identity, not the trigger mechanism that
  delivered it.** The same event arriving by webhook and by reconciliation poll must collapse to one.
- **I5 — Assume your incremental cursor cannot see deletes** unless the vendor names a mechanism —
  then check its retention window.
- **I6 — At n=1, independence comes from the source, the clock, or a pre-committed rule** — never from
  a second person who does not exist. The functions survive; the second body does not.
- **I7 — Credential health is its own monitored resource**, checked on its own schedule, independent
  of whether any workflow happened to run.
- **I8 — A workflow that stopped is not a workflow that failed.** No engine alerts by default; the
  missing-heartbeat signal is yours to build.
- **I9 — Before any irreversible early step, know whether your engine resumes or restarts.**
  Restart-only plus an irreversible early step is a duplicate generator on every retry.
- **I10 — The quota is the vendor's.** Exhausting it is an availability event you cannot fix by paying
  faster, and its blast radius is every flow on the account.
- **I11 — Retrying into a 429 converts a transient failure into a sustained ban.** Backoff with
  jitter, honour `Retry-After`, budget retries as a fraction of successes.
- **I12 — An agentic step fails by continuing.** It fails loudly only where someone bolted a
  deterministic ceiling onto it — the fix is to reintroduce the property that made deterministic
  automation fail loudly.
- **I13 — Timeout policy is a decision, not a config default.** No engine ships one. Name
  deny / allow / escalate before the gate goes live.
- **I14 — Prefer the API.** Where there is none you have bought a maintenance liability with no
  deprecation notice — a UI-scraping bot consumes no versioned contract, so it gets no version signal.
- **I15 — Date-stamp every volatile vendor fact, and name the interest** of anyone selling what they
  measure — including when it makes their claim stronger.

## Core workflow

1. Establish the primary job and base surface; add the agentic overlay only if it applies.
2. State the business rule you are implementing, and who owns it. If nobody upstream stated it, say so.
3. **Inventory the irreversible steps first** — what sends, charges, writes to a system of record, or
   contacts a person. Order the flow so the hardest to revert runs last (I3).
4. Choose the idempotency key from the business event (I4), and decide the dedup window.
5. Decide the reconciliation loop: what you compare, how often, over what window, and whether a
   discrepancy alerts or auto-heals (I1). At n=1, alert-first.
6. Name the failure path per step: retry with jitter, compensate, dead-letter, or halt (I11).
7. For any human gate, state the timeout decision and who may approve — before it ships (I13).
8. Establish how you will learn it stopped (I8), and what it costs per run (I10).
9. Emit a compact handoff when downstream work is expected.

## Artifact contract

An automation artifact is incomplete unless it carries: the business rule and its owner · the trigger
and what it will *also* fire on · **every irreversible step, named** · the idempotency key and its
window · the failure and compensation path per step · the reconciliation loop or an explicit
statement that there is none · how you learn it stopped · the credentials it uses and when they
expire · and its cost per run with a ceiling.

Everything volatile — vendor limits, retry schedules, retention windows, prices, licences — carries a
verification date and a re-verify pointer.

## Completion and handoff

Before completion:

- Confirm you can tell, from outside the system, whether it ran and whether it is still running.
- Confirm every irreversible step is either idempotent or gated.
- Confirm the reconciliation loop exists, or state plainly that drift will go undetected.
- Distinguish what was verified against the live vendor from what is assumed.
- When downstream work is expected, provide artifact paths, owners, residual risk with expiry, and a
  recommended next skill — typically `operate` to run and watch it, or `quality` to verify it.

## Resources

Jobs — **reconciliation ⭐** · integration-reliability · compensation-and-recovery ·
credentials-and-connections · approval-and-authority · trigger-design · sync-semantics ·
workflow-observability · cost-and-quota · platform-selection · workflow-testing · process-capture

Surfaces — surface-hosted-ipaas (default) · surface-self-hosted-engine · surface-code-first-durable ·
surface-platform-native · surface-agentic (additive) · handoff

Assets — `irreversibility-inventory.md` · `reconciliation-worksheet.md` · `credential-register.md` ·
`approval-policy-card.md` · `trigger-audit-sheet.md` · `run-cost-table.md` · `handoff.yaml`
