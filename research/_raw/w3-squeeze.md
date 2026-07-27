# W3 — The Squeeze Test (automation vs. shipped packs)

Read-only recon. No files modified in any `*-skill` repo.

## Per-term grep count table — backend-skill/skills/backend/references/*.md

| term | files w/ hit | total hits |
|---|---|---|
| idempotency | 4 | 20 |
| idempotency key | 4 | 6 |
| compensat | 3 | 10 |
| saga | 4 | 21 |
| reconcil | 0 | 0 |
| webhook | 3 | 19 |
| retry | 6 | 39 |
| backoff | 3 | 7 |
| dead letter | 0 | 0 |
| DLQ | 2 | 11 |
| rate limit | 4 | 12 |
| OAuth | 4 | 16 |
| credential rotation (phrase) | 0 | 0 |
| approval | 0 | 0 |
| human-in-the-loop / human in the loop | 0 | 0 |
| third-party | 5 | 12 |
| vendor | 5 | 13 |
| automation | 1 | 1 (surface-agentic.md:123, generic word "privileged automation" — NOT a routing decline) |

`reconcil` is also 0/0 in `ai-skill`. It exists elsewhere but in unrelated senses: `operate-skill` (4 files — GitOps reconciliation loop, backup/DR reconciliation), `data-skill` (1 file — CDC append-only "no updates to reconcile"), `quality-skill` (6 files — vocabulary/license/data-freshness reconciliation). None is "reconcile your ledger against a vendor because the webhook ack can't be trusted."

`vendor` in `auth.md` (5 hits) is exclusively about picking **one** auth-provider vendor for your own app (Better-Auth/Clerk/Auth0/Ory/Keycloak) — not managing N different third-party API credentials as a fleet.

## Claim-by-claim verdict

### Claim 1 — Idempotency across a boundary you don't control
**ALREADY COVERED.**
- `service-integration.md:69-72` (inbound webhooks): "Treat every inbound delivery as at-least-once... the handler MUST be idempotent — dedupe by the provider's event ID using the idempotency-key mechanics from `async-and-messaging` §2."
- `async-and-messaging.md:67-75` (§2, "owned here"): the idempotency-key primitive itself, explicitly applied "at two boundaries: the message-consumer boundary... and the API boundary (`service-integration` applies the same primitive to inbound webhooks — point there, don't redefine)."
This is explicitly cross-boundary, explicitly third-party-aware (Stripe's `Idempotency-Key` header is the cited pattern). `automation` gets nothing new here beyond what backend already teaches end-to-end.

### Claim 2 — Compensation instead of rollback
**PARTIALLY COVERED.**
- `async-and-messaging.md:105-125` (§4, "owned here") teaches saga fully: "replace the ACID transaction with a saga... failures are undone with compensating transactions, not automatic rollback," choreography vs orchestration, `on_failure_task()` hooks.
- But the frame throughout is **your own internal services** — "a business transaction spans multiple services/databases (each has private data)" (L106-107). `service-integration.md` (the ref that owns outbound vendor calls) never mentions saga or compensation at all — 0 hits.
- Genuinely absent: what to do when the compensating action **doesn't exist on the vendor's side** (no "uncharge," no "unsend the email," no cancel endpoint), or when compensation is inherently a human action (open a support ticket, issue a manual refund, post a correction message) rather than a second API call. Backend teaches the *shape* of compensation; it is silent on compensation against a participant you cannot script.

### Claim 3 — Reconciliation because you can't trust the ack
**GENUINELY ABSENT.** `grep -rli "reconcil" backend-skill/skills/backend/references/` → 0 files, 0 hits. Same for `ai-skill` (0/0). Backend's delivery-semantics story (`async-and-messaging.md §5`) stops at "prefer at-least-once + idempotent consumers" — it never teaches the third line of defense for the case where you can't even trust that the at-least-once mechanism fired (webhook silently dropped, vendor-side outage swallowed the notification, no DLQ on the vendor's side because you don't control their infra). The pattern of periodically pulling the vendor's own state (list payments, list contacts) and diffing against your local ledger to catch drift the ack-based system missed is not present anywhere in the corpus searched.

### Claim 4 — Multi-vendor credential lifecycle
**GENUINELY ABSENT.** `auth.md` (backend's only credential-adjacent ref) is entirely about **your app's own** authN/authZ: session vs JWT, OAuth2/OIDC flow for users, refresh-token rotation for **one** token family, and a single vendor pick for **who provides your app's login**. Zero hits for "credential rotation" as a phrase, zero for "API key rotation," zero for anything resembling: tracking expiry/scope across N unrelated third-party API keys/OAuth apps (Stripe, HubSpot, Slack, a payment processor, an email vendor), a rotation calendar per vendor, or a credential-revocation procedure on vendor offboarding. This is a different problem shape than `auth.md` solves — it's fleet management of externally-issued secrets, not designing your own identity system.

### Claim 5 — Human-approval-as-a-graph-node
**GENUINELY ABSENT in backend** (0 "approval" hits anywhere in `backend-skill/skills/backend/references/`). **Partially analogous in `ai-skill`** — `guardrails-and-safety.md:56` and `surface-autonomous-agent.md:31,38,58,101,115` teach "Approval-gate / HITL" as a default posture for autonomous agents: pausing a **model's own** risky tool call for human sign-off. That is a real, well-developed pattern, but it is scoped strictly to gating an agent's action — it assumes a model is in the loop. The case the hypothesis names — a wholly deterministic business process (e.g., an expense report, a contract, an onboarding step) where a human clicking "approve" is simply one node among many, with **no model anywhere in the graph** — is not covered by ai (out of scope by ai's own decline row: "the coordination is automation's") and is not covered by backend at all.

## The cession contract — verified

Grep across all nine shipped routers' `SKILL.md` for `"automation"`:

- **`ai-skill/skills/ai/SKILL.md:87`** — `| A deterministic multi-system workflow — even when one step calls a model | `automation` | Model-in-a-step ≠ model-driven; the coordination is automation's |`
- **`ai-skill/skills/ai/SKILL.md:10,26,102`** — frontmatter description and mission/invariants section also name `automation` as the deterministic-workflow owner (3 more cites, ~6 total across the ai reference set including `agent-construction.md:20`, `tool-and-mcp-integration.md:24`, `surface-batch-and-pipeline.md:16,18,102`, `surface-autonomous-agent.md:10,18`).
- **`operate-skill/skills/operate/SKILL.md:91`** — `| A business process spanning systems | `automation` |`
- **`data-skill/skills/data/SKILL.md:90`** — `| A deterministic multi-system business process — even when one step touches the warehouse | `automation` | Warehouse-in-a-step ≠ analytical plane; the coordination is automation's |` (plus `SKILL.md:29` mission-section cite, and `assets/handoff.yaml:1` naming `automation` in the handoff-envelope comment).
- **`backend-skill`** — **confirmed zero.** The only "automation" string in the entire repo's `skills/backend/` tree is `surface-agentic.md:123`, and it is the generic English word ("agent actions need the same auditability as any other privileged automation"), not a routing reference to a skill named `automation`. No decline row, no mission-section cite, nothing.
- **`quality-skill`** — also zero decline rows for `automation` (confirmed by grep). Its "automation" hits are all about browser/test automation engines, unrelated.
- **design-skill, frontend-skill, architecture-skill, product-skill** — zero hits, as expected (not adjacent).

**W3's verification of the controller's claim: CONFIRMED.** Backend cedes nothing in writing.

### What a coherent backend decline row would have to say
Something like: *"A business process orchestrating multiple third-party vendors with human-approval steps, where recovery means compensating a system you don't control (not rolling back your own transaction), tracking credentials across a vendor fleet, or reconciling because the ack itself can't be trusted → `automation`. `async-and-messaging`'s saga/idempotency/outbox assume the other participant is your own service or a webhook you can dedupe against; `automation` owns the case where the participant is opaque, un-scriptable, and partly human."* Backend's actual text contains no equivalent of this today — the omission is real, not an oversight in my reading.

## Summary matrix

| Claim | Verdict | Where |
|---|---|---|
| 1. Idempotency across an uncontrolled boundary | ALREADY COVERED | `service-integration.md:69-72`, `async-and-messaging.md:67-75` |
| 2. Compensation instead of rollback | PARTIALLY COVERED | `async-and-messaging.md:105-125` (mechanism, internal-services framing only) |
| 3. Reconciliation because you can't trust the ack | GENUINELY ABSENT | 0/0 grep, backend + ai |
| 4. Multi-vendor credential lifecycle | GENUINELY ABSENT | `auth.md` only covers single-vendor auth-provider pick + your-app's-own token rotation |
| 5. Human-approval-as-a-graph-node | GENUINELY ABSENT (backend); PARTIAL analog scoped to agent tool-calls only (ai) | 0 hits backend; `guardrails-and-safety.md:56`, `surface-autonomous-agent.md` (ai) |
