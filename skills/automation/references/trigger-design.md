# Trigger Design

Purpose: Decide what starts a workflow, scope the condition so it fires on what you meant and not on
everything adjacent, and choose a schedule that behaves the way you expect across a clock change. A
trigger decision is incomplete until it also states how this trigger's execution collapses with any
other path that can deliver the same business event.

Read when:
- Deciding what should start a workflow, or choosing between a schedule, a webhook, and a poll.
- A trigger fires too often, too broadly, or twice for the same underlying change.
- Scheduling anything recurring and the platform's clock-change behavior is unverified.
- A webhook and a reconciliation poll both exist against the same resource.

Skip when:
- The question is a webhook's delivery mechanics — retry budget, signature verification, per-vendor
  dedup ID — rather than the decision of what should trigger at all →
  [integration-reliability](integration-reliability.md).
- The question is what happens to data after the trigger fires (loop risk, conflict policy, delete
  visibility) → [sync-semantics](sync-semantics.md).
- The question is the reconciliation loop's own cadence, window, and diff design →
  [reconciliation](reconciliation.md).
- The trigger is a model call or an agent's own decision to act → agentic guardrails live in
  [surface-agentic](surface-agentic.md), not here.
- The question is whether a scheduled or triggered workflow is still running at all →
  [workflow-observability](workflow-observability.md) (I8).

Inputs:
- The candidate business event, stated in one sentence, and every mechanism actually available to
  detect it (webhook support, a polling API, a schedule, a human, an agent).
- Any other trigger already wired against the same resource (a webhook and a poll both watching the
  same object is the case I4 exists for).
- The target platform's documented (or undocumented) clock-change behavior, re-verified, not assumed
  from this reference — see I15.

Produces:
- A stated trigger choice with its scope and a documented false-positive class.
- A schedule, if one is used, with its DST behavior stated rather than assumed.
- A single idempotency key derived from the business event's identity (I4), so two delivery paths for
  the same event collapse to one execution.
- A filled row in [trigger-audit-sheet](../assets/trigger-audit-sheet.md) per trigger shipped.

## Contents
- Trigger taxonomy
- Over-broad trigger conditions
- The cron/DST comparison
- The silent-stop schedule
- Overlapping runs
- I4 — trigger idempotency across two delivery paths
- Polling vs. rate limits vs. freshness
- One trigger, one consumer

## Procedure

### 1. Trigger taxonomy
Five shapes, each with a distinct cost, a distinct blind spot, and a distinct failure mode:

| Trigger | Cost | What it misses | How it fails |
|---|---|---|---|
| Schedule (cron) | Cheapest; no dependency on the source system's cooperation | Anything that happens between runs; cannot react to urgency | DST double-fire or zero-fire on the transition day (below); a stopped schedule gives no signal on its own — cede detection to [workflow-observability](workflow-observability.md), I8 |
| Webhook/event | Near-real-time, low cost per event | Requires the source to support delivery and to actually deliver it — a silent outage upstream is a silent gap downstream | At-least-once redelivery duplicates work absent dedup (owned by `backend`'s delivery mechanics, cited not re-taught) |
| Record-change/polling | No dependency on the source having webhooks at all | Freshness bounded by the poll interval; structurally blind to deletes (I5, [sync-semantics](sync-semantics.md)) | Rate-limited by the source — the three-way trade-off below |
| Manual | Zero engineering cost, highest available judgment | Doesn't scale; carries no audit trail unless one is built | The silent failure mode of "manual" is a person forgetting, not a system erroring |
| Agent-initiated | Can react to a judgment call no static rule encodes | Non-deterministic timing and reasoning | Owned by `ai`'s guardrail frame; automation's role is the graph the agent's decision drops into, via [surface-agentic](surface-agentic.md) |

Hohpe's Conversation Patterns already name three of these mechanisms, credited (CC BY on the pattern
name and problem/solution statements only, per pattern page): **Request-Response with Retry** and
**Polling** correspond to the record-change row, and **Subscribe-Notify** corresponds to the
webhook/event row. Use his names for the mechanism; the taxonomy's cost/miss/failure framing above,
and the cross-path idempotency problem in §5, are this reference's addition.

### 2. Over-broad trigger conditions
The failure pattern is a trigger condition written as a **positive match on a weak signal** — a
keyword, a sender-domain substring, a status-field value — instead of a check scoped against the
specific case it is meant to catch. A filter rule that fires on "contains the word invoice" catches
every newsletter that happens to use the word.

The discipline that generalizes: before shipping a trigger condition, write down **what else could
make this true** — the false-positive class — as an explicit line next to the condition, not an
afterthought discovered after it over-fires in production. If a business rule already exists as a
decision table (see [process-capture](process-capture.md)), the trigger condition is one row of it,
and the "what else could make this true" column is the row's negative-space check. A trigger
condition without a stated false-positive class is not finished. Record it on
[trigger-audit-sheet](../assets/trigger-audit-sheet.md).

### 3. The cron/DST comparison
Five platforms, five genuinely different behaviors on the clock-change day — this is not "cron has
DST problems," it is five distinct failure modes with five distinct monitoring implications. All
verified 2026-07-27 against each platform's own documentation; **re-verify before relying on any row**
(I15) — scheduler behavior is exactly the kind of fact a vendor can change without a deploy on your
side.

| Platform | Spring-forward (skipped hour) | Fall-back (repeated hour) | What monitoring would catch |
|---|---|---|---|
| **AWS EventBridge Scheduler** | Skipped entirely — the invocation for a non-existent time is silently dropped | Runs **once**, does not repeat the invocation | A missing-heartbeat check keyed to expected run count, since the platform itself gives no signal that a run was skipped |
| **GitHub Actions** | Shifts to the next valid time (e.g. a schedule that would land at a skipped hour runs at the next real one) | Not separately documented; treated as a schedule shift, not a skip | The run still happens, just off-schedule — a check on run *timing*, not run *presence*, is what would catch this |
| **GCP Cloud Scheduler** | Undefined — the vendor's own docs say only that the job "might observe execution anomalies," and recommend UTC rather than committing to a guarantee | Same undefined status | Nothing specific — you cannot monitor for a failure mode the vendor declines to name; treat any local-time schedule as a coin flip twice a year |
| **Vercel Cron** | Structurally impossible — the platform is UTC-only by design | Structurally impossible | N/A — this platform is immune, at the cost of doing the local-time-to-UTC conversion yourself and re-deriving it if the relevant local time ever changes |
| **n8n** | **Undocumented — the product's own docs never mention DST at all** | Same silence | **Nothing will catch it, because you were never told what to expect.** This is a different category from "undefined" (GCP at least names the *ambiguity*): here there is no stated behavior to fall short of. Force the trigger to UTC, or test the transition empirically before trusting it |

The point of the table is that the *specific* failure mode determines what monitoring would even
catch — a skip (AWS) needs a missing-run check, a shift (GitHub) needs a timing check, and on the
platform whose documentation is silent (n8n), no check can be designed against a stated behavior,
because none was ever stated. Do not hand-wave this as one generic "cron has DST issues" line.

### 4. The silent-stop schedule
Independent of DST: **GitHub Actions auto-disables scheduled workflows on public repositories after
60 days of repository inactivity** (verified 2026-07-27, re-verify) — a silent-stop mode specific to
this platform, not a DST issue. This is exactly the
class of failure [workflow-observability](workflow-observability.md) exists to catch (I8, "a workflow
that stopped is not a workflow that failed") — cite that reference for the detection mechanism rather
than re-deriving a heartbeat check here.

### 4a. Overlapping runs — a schedule's concurrency policy is a decision
A scheduled run that outlasts its interval meets the next one. Kubernetes CronJob makes the choice
explicit and shows what you get by not making it — `concurrencyPolicy` is *"`Allow` (default): The
CronJob allows concurrently running Jobs"*; `Forbid` *"skips the new Job run"*; `Replace` kills the
running one (kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/, verified
2026-10-17). Most schedulers expose no such field, which means
`Allow` by omission: two runs over the same records, the same cursor, the same sends. Name one per
schedule — **skip** (and count the skip as an expected-run miss for
[workflow-observability](workflow-observability.md)), **queue**, or **replace** — and make the run
itself idempotent on the business event (I4) so an overlap you did not foresee collapses rather than
duplicates.

### 5. I4 — trigger idempotency across two delivery paths
This is distinct from the provider-redelivery dedup `backend` owns (one vendor, one delivery channel,
retrying the same webhook). The automation-specific residue is **the same business event arriving
through two different trigger paths at once**: a webhook fires the moment a record changes, and the
next scheduled reconciliation poll independently discovers the identical change before it has any way
of knowing the webhook already ran.

Adopting the flagship reconciliation loop ([reconciliation](reconciliation.md)) *creates* this hazard
— a reconciliation pass is, by design, a second path to the same events a webhook already delivers —
so the two must be taught and designed together, not treated as separable concerns. The discipline:
derive the idempotency key from the **business event's identity** ("invoice #4471 marked paid"), not
from the trigger mechanism that delivered it. A key built from "webhook delivery ID" or "poll run ID"
guarantees the two paths never collapse; a key built from the underlying event does.

### 6. Polling vs. rate limits vs. freshness — a three-way trade-off
This framing is ours, not a discovered citation — state it as such. Polling more often produces
fresher data, but it burns rate-limit budget faster and raises the odds of a 429. A 429 forces
backoff (I11), and backoff *widens* the freshness gap exactly when it needed to be tightest — commonly
at the busiest moment (e.g. a month-end batch), which is also when the vendor's own rate limiting is
most likely to bite. Treat polling frequency, rate-limit budget, and freshness requirement as one
three-way decision, not three independent settings.

### 7. One trigger, one consumer — unless you designed for more
The mirror of §5: one delivery path reaching **two consumers**. Three shapes, all silent, all this
pack's judgment rather than a cited practice:
- **A cloned deployment with the original's consumer credential.** Polling and webhooks are often
  exclusive per credential — Telegram's Bot API names *"two mutually exclusive ways of receiving
  updates"*, and its polling method *"will not work if an outgoing webhook is set up"*
  (core.telegram.org/bots/api, verified 2026-10-17). A staging copy, a new instance cloned from the
  old, or a second process started with the same token or webhook registration silently takes the
  events the live one was getting. Strip consumer credentials from every clone; register webhooks
  per environment.
- **Several agents or workflows listening on one shared channel.** Every listener that matches acts
  on the same message. Give each event class exactly one owner — an explicit address or mention
  rule, or a router — before a second listener joins.
- **A chat or command trigger is an authorization surface.** Anyone who can post the command can
  start the workflow. Allowlist who may fire it and default to deny; "who may trigger this" is the
  trigger-side twin of "who may approve this" ([approval-and-authority](approval-and-authority.md)).

## Validation
- [ ] The trigger's false-positive class is written down, not implied
- [ ] Every schedule states its platform's DST behavior (from §3) or has been forced to UTC
- [ ] A schedule on a low-activity repo/account has been checked against a silent-auto-disable policy
- [ ] If a webhook and a poll can both observe the same resource, one idempotency key derived from the
      business event covers both paths (I4)
- [ ] Polling frequency has been set against the rate-limit budget and the freshness requirement
      together, not independently
- [ ] Every schedule names its overlap policy (skip / queue / replace) rather than inheriting
      concurrent runs by omission
- [ ] Every trigger has exactly one consumer per environment, and a command trigger allowlists who
      may fire it
- [ ] [trigger-audit-sheet](../assets/trigger-audit-sheet.md) has one filled row per trigger shipped

## Failure modes and handoff
- The question is really about a webhook's delivery guarantees, not the trigger decision itself →
  [integration-reliability](integration-reliability.md).
- The question is what to do with the data once the trigger fires → [sync-semantics](sync-semantics.md).
- The question is the reconciliation loop's cadence and diff design, not why it collides with a
  webhook → [reconciliation](reconciliation.md).
- The question is detecting a workflow that silently stopped, DST-related or not →
  [workflow-observability](workflow-observability.md).
- The trigger is a model deciding to act, not a static condition → `ai`, via
  [surface-agentic](surface-agentic.md).
