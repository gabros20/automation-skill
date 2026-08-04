# automation — Workflow Automation

**Family hub:** [digital-product-skill.vercel.app](https://digital-product-skill.vercel.app) — the 15-skill Digital Product family and its composer.

Build reliable cross-system and human-in-the-loop processes: the workflow that fires when a customer
upgrades, the nightly sync between two SaaS tools, the refund that waits for someone to approve it, the
cron job nobody has checked in six months.

It spans hosted iPaaS (Zapier, Make), self-hosted engines (n8n, Windmill, Activepieces, Kestra),
code-first durable execution (Temporal, Inngest, Restate, Step Functions), and plain cron. `automation`
owns the **decisions**, not the click-path: whether to automate a thing at all, which of the four
platform tiers to build it on, what triggers it, what order the steps run in, what happens when one
fails halfway, who approves the risky one, and how you find out it stopped.

Two properties shape every technique in this pack: **a step may belong to a vendor you cannot deploy
to, and a step may be a person.** Hence the through-line — you cannot deploy a fix into someone else's
system, and you cannot un-send.

## Install

```bash
npx skills add gabros20/automation-skill -g -y
```

Or use it in Codex with `$automation`.

## Examples

```text
$automation my automation fired twice and charged someone — I need to know why and stop it happening again

$automation the Stripe-to-CRM sync has been quietly dead for a week and nobody noticed

$automation a webhook never arrived and an order is missing from the CRM — find the gap and close it

$automation should this refund step wait for me to approve it, and what happens if I don't answer in time

$automation we're moving off Zapier onto n8n — tell me what actually breaks

$automation design a Stripe-to-CRM sync that survives a missed webhook
```

## What it does

A **faceted router**: pick one primary job × one base surface (the agentic overlay stacks additively on
top).

**Primary jobs** — **reconciliation ⭐** · integration-reliability · compensation-and-recovery ·
credentials-and-connections · approval-and-authority · trigger-design · sync-semantics ·
workflow-observability · cost-and-quota · platform-selection · workflow-testing · process-capture.

**Surfaces** — hosted iPaaS (default) · self-hosted engine · code-first durable execution ·
platform-native · **agentic** (additive).

## Route by job

| User intent | Reads | Contribution |
|---|---|---|
| Prove what actually happened — catch what the webhook missed, diff against the vendor, close the gap ⭐ | [reconciliation](skills/automation/references/reconciliation.md) | **Flagship.** Reconcile against the vendor's authoritative state, never your own record; tiered cadence; ID-set diff before field diff; matched / within-tolerance / exception; alert-first at n=1 |
| Stop duplicates and missed work — delivery semantics, dedup, at-least-once | [integration-reliability](skills/automation/references/integration-reliability.md) | Quick Acknowledgment (ack fast, process async); dedup keyed on the business event; the completion-check false positive; per-vendor delivery guarantees |
| A step failed after an earlier one already sent, charged or wrote | [compensation-and-recovery](skills/automation/references/compensation-and-recovery.md) | Compensation is a forward action, not a rollback; hardest-to-revert last; compensation as a human act; resume-vs-restart before any irreversible step |
| Manage API keys and OAuth across many vendors; something silently stopped authenticating | [credentials-and-connections](skills/automation/references/credentials-and-connections.md) | The credential fleet; silent-expiry traps; scheduled pre-expiry refresh; credential health as its own monitored resource; the shared-account bus factor |
| Put a human in the loop — who approves, what happens on timeout | [approval-and-authority](skills/automation/references/approval-and-authority.md) | Translating meeting-paced GRC (maker-checker, delegation of authority) into machine-timeout policy; no engine ships a default; the n=1 compensating control |
| Decide what starts the workflow; a trigger fires too often, too broadly, or twice | [trigger-design](skills/automation/references/trigger-design.md) | Trigger taxonomy; over-broad conditions; the cron/DST comparison; trigger idempotency across two delivery paths |
| Keep two systems in step; records duplicated, deleted rows diverging, a loop | [sync-semantics](skills/automation/references/sync-semantics.md) | The A→B→A loop; deletes are invisible to incremental sync; `updated_at` is a lie; conflict policy as a decision; backfill-to-incremental cutover |
| Tell whether it is still running, and what "green" does not mean | [workflow-observability](skills/automation/references/workflow-observability.md) | A workflow that stopped is not a workflow that failed; no engine alerts by default; missing-heartbeat over failure notification; audit of what ran on whose authority |
| Cap what this costs; a loop or a retry is burning quota | [cost-and-quota](skills/automation/references/cost-and-quota.md) | Per-task billing; the quota is the vendor's and its blast radius is the whole account; retry × 429; the workflow circuit breaker |
| Choose or leave a platform — no-code, self-hosted, code-first | [platform-selection](skills/automation/references/platform-selection.md) | The four tiers; resume-capability as a selection criterion; licence and liveness; exit cost asked up front |
| Test a workflow that spans vendors you cannot control | [workflow-testing](skills/automation/references/workflow-testing.md) | What is genuinely untestable and what replaces it — dry run, narrow canary, first-then-bulk gate, fixture replay |
| Turn a business rule into a workflow — or decide not to automate at all | [process-capture](skills/automation/references/process-capture.md) | Capturing the rule at n=1; the control-flow vocabulary worth having; when not to automate; prefer the API, and what you buy when there isn't one |

## Surfaces

| Surface | Reads | When |
|---|---|---|
| Hosted iPaaS — Zapier/Make-class, connectors and a visual builder | [surface-hosted-ipaas](skills/automation/references/surface-hosted-ipaas.md) | **Default** |
| Self-hosted engine — n8n/Windmill/Activepieces/Kestra | [surface-self-hosted-engine](skills/automation/references/surface-self-hosted-engine.md) | You run the engine |
| Code-first durable execution — Temporal/Inngest/Restate/Step Functions | [surface-code-first-durable](skills/automation/references/surface-code-first-durable.md) | The workflow is code, steps are durable |
| Platform-native — Actions, cron, cloud schedulers | [surface-platform-native](skills/automation/references/surface-platform-native.md) | No engine; the platform is the scheduler |
| **Agentic ⭐ (additive)** | [surface-agentic](skills/automation/references/surface-agentic.md) | **Stacks on a base surface.** A model is a step, or is the trigger |

Plus [handoff](skills/automation/references/handoff.md) — the `handoff.yaml` companion for downstream
work, typically to `operate` to run and watch the workflow, or to `quality` to verify it before it ships.

## Four things this pack does differently

**The substrate, not the industry, is the boundary — and the default reader has no second pair of
eyes.** `backend` owns async work inside a system you control: your queue, your workers, your database,
deployable and testable end to end. `automation` starts where most of the steps belong to vendors you
cannot deploy to, cannot unit-test, and cannot roll back — the API changes with no deploy on your side,
the quota belongs to someone else, and a person clicking "approve" is a node in the graph. That matters
more than it looks, because nearly every control this domain teaches assumes a counterparty: approval
assumes an approver who is not the requester, reconciliation assumes a reconciler who is not the
recorder. The *functions* survive at n=1; the second *body* does not, and the substitute is an
independent source, a clock, or a rule committed to in advance.

**The wedge is synthesis, not discovery, and it says so rather than dressing itself up.** Almost nothing
in this pack is unknown — it is known in five places that have never cited each other. Distributed
systems teaches idempotency and saga **for services you own**. Gregor Hohpe's *Conversation Patterns*
teaches compensation **for parties you don't** — and is CC BY, twenty years old, and largely unread.
Fintech teaches reconciliation exhaustively **as a ledger control** and never generalizes it past money
movement. Enterprise GRC (COSO, maker-checker, delegation of authority) teaches approval authority at
**meeting pace**, decades deep, and never answers what a system should decide at 3am. The 2026 agentic
wave teaches guardrails **for models**. A reader wiring their business across vendors they cannot deploy
to has to assemble one discipline out of five literatures that were never introduced to each other. That
assembly is the pack.

**Did what you think happened actually happen? That plain question is the pack's flagship — and four
independent channels converge on the answer, under the name reconciliation, without ever citing each
other.** Fintech owns the *word* and never generalizes it. General integration engineering teaches the
*mechanism* — poll a provider on a schedule to catch what a webhook missed — and never uses the word.
Hohpe names it exactly once in his 25-pattern catalogue, in a 2005 aside, and then walked away from it
for twenty years. And it is absent across every other shipped pack in this family. [reconciliation.md](skills/automation/references/reconciliation.md)
states the spine plainly: **reconcile against the vendor's authoritative state, never against your own
record of what you told it** — an ack is not evidence, and a webhook that never arrived leaves no trace
in your logs at all.

**The n=1 approval-and-reconciliation recursion is resolved, not just named.** COSO's own escape hatch
for missing segregation of duties *is* independent reconciliation — but reconciliation, as fintech
practices it, itself demands a reconciler who is not the recorder. For one person, the escape hatch leads
back into the room it was supposed to get you out of. The resolution this pack ships: independence has to
come from the source, the clock, or a rule committed to in advance — never from a second person who does
not exist. The function survives; the second body does not need to.

**Hohpe's vocabulary is used, credited — and the pack is explicit about where its own claim stops.**
Quick Acknowledgment, Compensating Action, Heartbeat, Lease, and half a dozen more already have names in
the *Conversation Patterns* catalogue, and this pack cites the specific pattern page rather than
reinventing a house term. But Hohpe's Quick Acknowledgment pattern never mentions duplicates or retries —
the reasoning that slow acknowledgment causes duplicate side effects is this pack's own addition, not
his, and it says so rather than letting a real citation quietly absorb an uncredited claim.

Two grounded numbers stand in for the pack's habit of naming its source rather than repeating a folk
figure. Google's own OAuth documentation caps refresh tokens at **100 per account per client ID**, and
reaching the cap invalidates the oldest token **"without warning"** — two vendor blogs report the cap as
50; both are wrong, and this pack cites Google's own docs instead. And Salesforce's `getDeleted()`
delete-tracking API covers **no more than 15 days**, with a background purge that can invalidate the
window *early* and return `INVALID_REPLICATION_DATE` — whose documented recovery is a full re-sync, not
a resumable cursor. Neither number is safe to memorize past this quarter; both carry a re-verify pointer
in the reference that cites them.

## Outputs

An automation artifact carries: the business rule and its owner · the trigger and what it will *also*
fire on · every irreversible step, named · the idempotency key and its window · the failure and
compensation path per step · the reconciliation loop, or an explicit statement that there is none · how
you learn it stopped · the credentials it uses and when they expire · and its cost per run with a
ceiling — plus fillable worksheets and a `handoff.yaml` companion, since a dependency in this domain can
change with no deploy on your side.

## Digital Product lifecycle

`automation` sits at the **Build** stage, alongside `frontend`, `backend`, `data`, and `ai` — the peer
that owns the case where the system on the other end of the wire is not one you deploy to. It does not
own async work, queues, or the idempotency-key primitive **inside a system you control** (`backend`); a
model's cognition or guardrails (`ai`); the warehouse or analytical plane (`data`); deploying or watching
the workflow in production (`operate`); the ship/claim decision (`quality`); or authoring the business
rule itself (`product` and the commercial skills). It consumes an upstream business rule or contract when
one is supplied, works standalone when it isn't, and hands off a compact artifact — typically to
`operate` to run and watch what got built, or to `quality` to verify it before it ships.

## Reference and asset library

18 references under `skills/automation/references/` (12 primary jobs, 4 base surfaces, 1 agentic
additive overlay, 1 handoff contract) and 7 fillable assets under `skills/automation/assets/`:

- **Assets:** `irreversibility-inventory.md` · `reconciliation-worksheet.md` · `credential-register.md` ·
  `approval-policy-card.md` · `trigger-audit-sheet.md` · `run-cost-table.md` · `handoff.yaml`

## Repository layout

```text
skills/automation/  runtime skill (SKILL.md + 18 references + 7 assets + agents/openai.yaml)
evals/               activation · traversal · output · compression-ablation fixtures
research/            5-channel research corpora + build-gate synthesis
docs/                installation, usage, and recipes
.codex-plugin/       plugin manifest
```

## Documentation & releases

- [docs/installation.md](docs/installation.md) · [docs/usage.md](docs/usage.md) ·
  [docs/recipes.md](docs/recipes.md)
- [CHANGELOG.md](CHANGELOG.md) — release history (current: v0.1.2)
- [SOURCES.md](skills/automation/SOURCES.md) — source attribution and license posture, including the
  four-clause licensing rule this skill follows and the numbers it refuses to ship
- [CONTRIBUTING.md](CONTRIBUTING.md) — local validation (`scripts/lint-skill`, `scripts/check-sync`)

## License

MIT — see [LICENSE](LICENSE).
