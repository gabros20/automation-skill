# Usage reference

## Activation

`automation` should trigger on requests to **build or fix a business process that spans systems you do
not own** — wiring Stripe/a CRM/email/Slack/a partner API together, catching a duplicate charge or send,
finding a webhook that never arrived, designing a human approval gate, deciding what should start a
workflow, keeping two systems in sync, learning that an automation silently stopped, capping runaway
cost or quota, choosing or leaving a platform (Zapier/n8n/Temporal/…), testing a workflow you cannot
fully control, or capturing a business rule before automating it. Realistic triggers: "my automation
fired twice and charged someone," "the sync has been quietly dead for a week," "a webhook never arrived
and the order is missing," "should this step wait for me to approve it," "we're about to move off
Zapier — what breaks," "design a Stripe-to-CRM sync that survives a missed webhook," "put a human
approval gate on this refund flow," "our automation's OAuth token died and nothing told us."

It should **not** trigger on: "write the jobs/queues/outbox/saga inside our own service" (`backend` —
`automation` starts where the boundary crosses to a vendor you cannot deploy to), "the model's prompt,
agent loop, retrieval, or evals" (`ai`), "the warehouse, ETL/ELT, or analytical modelling" (`data`),
"deploy this, run the monitoring platform, or run the incident" (`operate`), "decide may we ship, or
write/grade tests" (`quality`), "author the business rule, or customer-facing comms" (`product` /
`marketing` / `sales` / `success`), "the system shape, NFR budgets, or threat model" (`architecture`), or
"coordinate agents inside a development session" (`orchestrate` — not a lifecycle skill) — unless the
request also requires the workflow, the integration code, or the automation-specific failure semantics
themselves.

Use `/automation` as documentation shorthand only. Codex explicit invocation is `$automation`; other
clients use an `@` mention, a skill tool, or natural-language activation.

## Mission and boundary

`automation` builds processes that span systems, schedules, events and human approvals — and makes them
survive the fact that **you cannot deploy a fix into someone else's system, and you cannot un-send.** The
distinguishing property is the substrate: `backend` owns async work inside a system you control — your
queue, your workers, your database, deployable and testable end to end; `automation` owns the case where
most of the steps belong to vendors you cannot deploy to, cannot unit-test, and cannot roll back — where
the API changes with no deploy on your side, the quota belongs to someone else, and a person clicking
"approve" is a node in the graph. **The default reader is one person, or a small team, with no second
pair of eyes** — nearly every control this domain teaches assumes a counterparty (an approver who is not
the requester, a reconciler who is not the recorder); the *functions* survive at n=1, the second *body*
does not, and the substitute is an independent source, a clock, or a rule committed to in advance (I6).
`automation` writes workflow definitions, integration code, connector configuration and functions. It
does **not** author the business rule — `product` and the commercial skills own that; when no upstream
rule exists, capture it explicitly ([process-capture](../skills/automation/references/process-capture.md))
rather than inventing one silently. It works standalone when invoked alone, uses supplied upstream
artifacts without silently overriding them, recommends adjacent skills for work it doesn't own, and never
silently invokes them.

## Workflow

1. Establish the primary job and base surface; add the agentic overlay only if a model is a step or the
   trigger.
2. State the business rule you are implementing, and who owns it. If nobody upstream stated it, say so.
3. Inventory the irreversible steps first — what sends, charges, writes to a system of record, or
   contacts a person. Order the flow so the hardest to revert runs last (I3).
4. Choose the idempotency key from the business event (I4), and decide the dedup window.
5. Decide the reconciliation loop: what you compare, how often, over what window, and whether a
   discrepancy alerts or auto-heals (I1). At n=1, alert-first.
6. Name the failure path per step: retry with jitter, compensate, dead-letter, or halt (I11).
7. For any human gate, state the timeout decision and who may approve — before it ships (I13).
8. Establish how you will learn it stopped (I8), and what it costs per run (I10).
9. Emit a compact handoff when downstream work is expected.

## Route by job

| User intent | Reference | Expected contribution |
|---|---|---|
| Prove what actually happened — catch what the webhook missed, diff against the vendor, close the gap | `references/reconciliation.md` | **Flagship.** Reconcile against the vendor's authoritative state, never your own record; tiered cadence; ID-set diff before field diff; matched / within-tolerance / exception; alert-first at n=1 |
| Stop duplicates and missed work — delivery semantics, dedup, at-least-once | `references/integration-reliability.md` | Quick Acknowledgment (ack fast, process async); dedup keyed on the business event; the completion-check false positive; per-vendor delivery guarantees |
| A step failed after an earlier one already sent, charged or wrote | `references/compensation-and-recovery.md` | Compensation is a forward action, not a rollback; hardest-to-revert last; compensation as a human act; resume-vs-restart before any irreversible step |
| Manage API keys and OAuth across many vendors; something silently stopped authenticating | `references/credentials-and-connections.md` | The credential fleet; silent-expiry traps; scheduled pre-expiry refresh; credential health as its own monitored resource; the shared-account bus factor |
| Put a human in the loop — who approves, what happens on timeout | `references/approval-and-authority.md` | Translating meeting-paced GRC (maker-checker, delegation of authority) into machine-timeout policy; no engine ships a default; the n=1 compensating control |
| Decide what starts the workflow; a trigger fires too often, too broadly, or twice | `references/trigger-design.md` | Trigger taxonomy; over-broad conditions; the cron/DST comparison; trigger idempotency across two delivery paths |
| Keep two systems in step; records duplicated, deleted rows diverging, a loop | `references/sync-semantics.md` | The A→B→A loop; deletes are invisible to incremental sync; `updated_at` is a lie; conflict policy as a decision; backfill-to-incremental cutover |
| Tell whether it is still running, and what "green" does not mean | `references/workflow-observability.md` | A workflow that stopped is not a workflow that failed; no engine alerts by default; missing-heartbeat over failure notification; audit of what ran on whose authority |
| Cap what this costs; a loop or a retry is burning quota | `references/cost-and-quota.md` | Per-task billing; the quota is the vendor's and its blast radius is the whole account; retry × 429; the workflow circuit breaker |
| Choose or leave a platform — no-code, self-hosted, code-first | `references/platform-selection.md` | The four tiers; resume-capability as a selection criterion; licence and liveness; exit cost asked up front |
| Test a workflow that spans vendors you cannot control | `references/workflow-testing.md` | What is genuinely untestable and what replaces it — dry run, narrow canary, first-then-bulk gate, fixture replay |
| Turn a business rule into a workflow — or decide not to automate at all | `references/process-capture.md` | Capturing the rule at n=1; the control-flow vocabulary worth having; when not to automate; prefer the API, and what you buy when there isn't one |

Surface overlays (`surface-hosted-ipaas`, `surface-self-hosted-engine`, `surface-code-first-durable`,
`surface-platform-native`, `surface-agentic`) reshape the primary job for that engine's shape.
`surface-hosted-ipaas` is the default when nothing else applies. Always stack `surface-agentic`
additively on top of a base surface — it applies only when a model is a step or the trigger, never in
place of the base.

## Outputs and completion

| Output | Complete when |
|---|---|
| Trigger and idempotency design | The idempotency key is derived from the business event's identity, not the delivery mechanism, and every trigger's false-positive class is named |
| Irreversibility inventory | Every step that sends, charges, writes to a system of record, or contacts a person is named and tiered, with the hardest to revert ordered last |
| Reconciliation loop | Comparison method, cadence, and classification (matched / within-tolerance / exception) are stated, or the artifact says plainly that drift will go undetected |
| Compensation and failure path | Every irreversible step names its compensating action, or states explicitly that none exists and escalates to a person |
| Credential register | Every vendor credential in use has a type, scope, expiry trigger, and a health check independent of whether a workflow ran |
| Approval gate | Who may approve is never the requester; the timeout decision (deny / allow / escalate) is named before the gate ships |
| Observability | A missing-heartbeat check exists per automation and per credential, alerting on absence rather than on failure |
| Cost and quota | The per-run cost and the account-wide ceiling are both stated, with a circuit breaker for retry storms |

When downstream work is expected, provide the `handoff.yaml` companion with artifact paths, the business
rule and its owner (or its stated absence), every irreversible step and its compensation path, the
idempotency key, the reconciliation loop (or its absence), credential expiries, `volatile_facts` (fact /
as-of / re-verify-at), and the recommended next skill — typically `operate` to deploy and watch it, or
`quality` to verify it before it ships — without duplicating the full artifact.
