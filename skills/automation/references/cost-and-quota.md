# Cost and Quota

Purpose: Cap what an automation costs to run, and treat quota exhaustion as an availability event you
cannot fix by paying faster — because the quota belongs to the vendor, not to you.

Read when:
- A workflow's cost is rising and you don't yet know if that's growth or a runaway.
- A retry loop, a misconfigured trigger, or an agentic step might be burning quota unattended.
- You're deciding what a spend alert, a per-flow budget, or a kill switch should look like at n=1.
- You're about to retry into, or design around, a vendor's rate limit.

Skip when:
- The question is which platform tier to run on, not what running it costs —
  [platform-selection.md](platform-selection.md).
- The question is whether a workflow stopped, not what it costs while running —
  [workflow-observability.md](workflow-observability.md) (I8).
- The runaway is an agentic step specifically and the question is its failure semantics, not its
  cost — [surface-agentic.md](surface-agentic.md) (I12).
- You need the general cost-as-availability-control framing itself, not its cross-vendor extension —
  `operate`'s `capacity-and-cost.md` (I7), which this file extends rather than repeats.

Inputs: the workflows in scope, their billing unit on the platform they run on, and whatever spend
visibility the platform already exposes.
Produces: a per-workflow cost ceiling, a stated blast radius if that ceiling is exceeded, and a named
kill mechanism — recorded in [run-cost-table.md](../assets/run-cost-table.md).

## Contents

- Extending I7: cost scales with complexity here, not just activity
- I10 — the quota is the vendor's
- The runaway classes
- The workflow circuit breaker
- Cost attribution at n=1
- I11 — retrying into a 429 converts a transient failure into a sustained ban
- The n=1 minimum
- Failure modes and handoff

## Extending I7: cost scales with complexity here, not just activity

`operate`'s I7 already establishes the frame this file builds on: **cost is an availability control,
not a finance report; cap anything whose spend scales with activity rather than with users.** That
holds here unchanged — cite it, don't re-derive it.

The automation-specific twist is the billing unit. Per-task or per-operation billing, which most
hosted iPaaS platforms use, means cost scales with **workflow complexity** as much as with usage
volume: a flow with five steps and no filtering can cost several times what an equivalent two-step
flow costs per triggering event, independent of how many end users are involved. A workflow that looks
cheap because it runs rarely can still be expensive per run if it's deep — and a workflow that looks
fine in isolation can become expensive the moment someone adds a step to it, with no change in traffic
at all. Reviewing a workflow's cost means reviewing its step count and branching, not just its trigger
frequency.

## I10 — the quota is the vendor's

> **I10 — The quota is the vendor's. Exhausting it is an availability event you cannot fix by paying
> faster, and its blast radius is every flow on the account, including unrelated ones.**

This is the fact nobody frames as a decision. A vendor's quota — a rate limit, a monthly execution
allotment, a data-transfer ceiling — is enforced on the vendor's clock, not yours. Hitting it mid-month
can silently stop every workflow sharing that account or that vendor connection, including ones that
have nothing to do with whichever automation actually burned the quota. "All my automations on one
account" is therefore a blast-radius decision, whether or not anyone framed it as one at the time the
account was set up.

Two consequences follow directly:
- **Paying does not restore service instantly.** A quota reset runs on the vendor's billing cycle or
  invoicing process, not on the moment you decide to upgrade. Treat exhaustion as an outage with a
  vendor-controlled recovery time, not as a bill you can clear on demand.
- **Isolating blast radius is a real design choice, not overhead.** Separating unrelated automation
  groups into separate accounts or vendor connections trades convenience for a smaller failure domain —
  worth doing deliberately for anything where one workflow failing to respect its own limits should not
  take every other workflow down with it.

## The runaway classes

The same few shapes of failure recur across every platform tier, and each is a cost incident with the
same shape as an availability incident — because at this quota model, they are the same incident:

- **A trigger fires far more broadly than intended** — a "record changed" trigger firing on every field
  update instead of the one that matters, multiplying execution count with no corresponding increase in
  actual work done. See [trigger-design.md](trigger-design.md) for the taxonomy; this file's job is
  only to flag that an over-broad trigger is a cost problem before it's anything else.
- **An A→B→A synchronization loop** — two systems each reacting to the other's write, each execution
  triggering another, until a rate limit or quota stops it rather than any logic in the workflow itself.
  Zapier's own help docs make the cost link explicit, verbatim: *"Loops can quickly use up your plan
  tasks if they are not resolved"* (help.zapier.com, verified 2026-07-27) — the vendor billing for the
  loop is telling you, in its own documentation, that the loop is a cost problem before it's anything
  else. See [sync-semantics.md](sync-semantics.md) for the mechanism and mitigations; this file's job
  is only what the loop costs and how to bound it.
- **An agentic step retrying or looping without a deterministic ceiling** — I12 names why this class is
  distinct: an agentic step fails by continuing, and it fails loudly only to the extent someone bolted
  a hard stop onto it. Absent that ceiling, an agentic step is a cost runaway with no natural floor,
  because nothing in the step itself will decide to stop. See
  [surface-agentic.md](surface-agentic.md) for the deterministic-ceiling pattern.

All three classes share a property worth naming explicitly: **none of them look like a failure from
the outside while they're running.** A dashboard showing green, successful executions is exactly what
a misconfigured trigger firing constantly, a sync loop, or a looping agent step all look like — the
cost line is often the first signal, not the workflow's own status.

## The workflow circuit breaker

A workflow circuit breaker, in the sense this file means it, is a mechanism that stops a workflow after
some bound on consecutive failures or runaway executions — the automation-layer equivalent of a
service-level circuit breaker, applied to an integration you don't operate. What exists is narrower
than that, and worth being precise about rather than assuming the worst or the best uniformly.

**Where a platform gets this right, say so:** Zapier holds runs rather than discarding them once a
plan's task allotment is hit, offers replay once tasks are available again, and sends an
approaching-limit email before the ceiling is reached (help.zapier.com, verified 2026-07-27) — a
genuinely well-designed ceiling behaviour, not a silent cliff. n8n's overage model is similarly
non-destructive: workflows keep running past the plan's included execution quota, with overage billed
rather than blocked, and unresolved overage isn't invoiced until 45 days out (n8n.io/pricing, verified
2026-07-27) — a long enough window to notice and act before it becomes a bill.

**That same good behaviour does not extend to loops.** Neither Zapier's nor Workato's own docs
describe an automatic stop for a cross-system A→B→A loop — both hand the problem back to the operator:
Workato's loop indicators are explicitly diagnostic, not preventive, and Zapier's documented remedy is
manually turning off the looping Zap. This is the convergent finding worth carrying: **no engine
auto-detects or auto-kills a cross-system loop by default**, even on platforms whose quota-ceiling
behaviour is otherwise a model of doing it right. A per-account task ceiling and a per-workflow loop
breaker are different mechanisms, and having the first does not imply the second.

**A platform's own per-scenario safety valve isn't the same thing as a loop breaker, either.** At least
one iPaaS platform (community-reported, not vendor-documented — cite as such, not as a confirmed
default) ships configurable caps on cycles-per-run, consecutive errors, and runs-per-minute, and by the
same report those caps still did not stop a cross-system loop — because they bound one scenario's own
recursion, not feedback that runs out through a second system and back. The lesson generalizes: a
circuit breaker scoped to a single workflow's own execution count cannot see a loop whose other half
lives in a different system entirely.

**Given that, the loop counter and the quiet/debounce window are your responsibility, not the
platform's.** Both are defined in [sync-semantics.md](sync-semantics.md) §1 "The A→B→A loop", which
owns them — along with the source-tagging and updated-by filters they complement but do not replace.
Neither is documented by any vendor surveyed here; **they are this pack's own addition, not a cited
practice.**

What this file adds is the **spend** reason for reaching for them, which is different from the
correctness reason. A source-tag prevents the *wrong* write; a loop counter bounds the *number* of
writes. On a per-task or per-operation plan those are separate failure modes: a loop that is
correctly tagged and therefore harmless to your data can still empty a month's quota before anyone
notices, because every wasted execution is billable and none of them is an error. **Set the counter's
threshold against your quota, not against your data model.**

## Cost attribution at n=1

**Can a solo operator even tell which automation burned the quota?** Often not, without deliberate
effort. A platform's own usage surface is usually the only attribution mechanism available, and that
surface is frequently scoped at the account or plan level — not broken out per workflow — which means
the invoice or the quota-exhaustion event can arrive before there's any way to point at the specific
flow responsible. Where a platform does expose per-workflow usage, use it; where it doesn't, external
instrumentation (a scheduled read of whatever execution log exists, correlated against known workflow
run times) is the only substitute, and it has to be set up before the runaway, not after.

**This gets worse, not better, one layer down — at the vendor you're calling into, not the platform
you're calling from.** Salesforce meters API usage as a single rolling 24-hour allocation **per org**,
shared by every integration and automation that calls it — a Developer Edition org gets 15,000
requests per 24 hours, as one dated example (developer.salesforce.com, verified 2026-07-27; the exact
number varies by edition and is not worth reciting in full, since it will drift — read your own plan's
figure rather than trusting a table copied from elsewhere). The shape is what matters: one runaway
automation calling that org can exhaust the shared bucket for every other integration on it, and
Salesforce's own usage surface attributes consumption to the org, not automatically to the specific
automation responsible — the same attribution gap as the platform side, one hop further out.

## I11 — retrying into a 429 converts a transient failure into a sustained ban

> **I11 — Retrying into a 429 converts a transient failure into a sustained ban.** Backoff with
> jitter, honour `Retry-After`, and budget retries as a fraction of successes rather than per-request.

This is the trap most retry logic walks into by accident: a vendor's rate limit rejects a request, the
caller retries immediately or on a fixed schedule, and the retry itself becomes part of the load the
vendor is already struggling to serve — converting what would have been a brief, self-resolving
slowdown into a sustained block. It gets worse under a broad outage: if every caller's retry logic
fires on the same schedule, the retries synchronize into waves that hit the vendor exactly as it's
recovering, prolonging the very failure the retries were meant to route around.

The mitigations, in order of how much each one costs to skip:
- **Honour `Retry-After` when the vendor sends it.** GitHub's own docs state the rule plainly:
  *"If the `retry-after` response header is present, you should not retry your request until after
  that many seconds has elapsed"* (docs.github.com, verified 2026-07-27) — the vendor is telling you
  exactly how long to wait; overriding it with your own backoff schedule discards information the
  vendor gave you for free.
- **Back off with randomized jitter, not a fixed or purely exponential schedule.** A schedule with no
  randomization synchronizes every retrying caller into the same request waves; jitter spreads them
  out, which is the entire point of backing off in the first place. This is the mechanism Marc
  Brooker's "Exponential Backoff and Jitter" (AWS Architecture Blog, 2015, updated 2023) is the
  canonical reference for — cited here for the concept and attribution, not reproduced at length.
- **Budget retries as a fraction of successful requests, not per-request.** A fixed per-request retry
  count still lets total retry volume scale up during a broad outage, exactly when the vendor can least
  absorb it. Capping retries as a share of what's actually succeeding — the retry-budget concept Google's
  SRE book teaches in its chapter on cascading failures — keeps retry volume from multiplying against a
  vendor that is already failing.

**Rate-limit schemes differ by vendor, and that difference matters more than any general rule above.**
GitHub's REST API is a clean illustration of why reading the specific vendor's own limit documentation
is not optional: alongside its published numeric ceilings — **60/hr unauthenticated, 5,000/hr for an
authenticated personal-access-token request, 5,000/hr for a non-Enterprise GitHub App installation, and
1,000/hr per repository for the `GITHUB_TOKEN` used inside Actions** (docs.github.com, verified
2026-07-27) — GitHub's own docs add a second, deliberately undocumented layer on top: *"These secondary
rate limits are subject to change without notice. You may also encounter a secondary rate limit for
undisclosed reasons."* A vendor stating outright that you cannot know all of its limits is the clearest
possible argument against tuning a retry policy to skim just under a published number — back off
generously, because the ceiling you can see is not necessarily the whole ceiling.

A retry policy written without reading the specific vendor's own limit documentation is a guess dressed
up as an implementation. Read it before writing the retry logic, and re-verify it before reusing that
logic against a different vendor — the scheme itself (token bucket, leaky bucket, sliding window, or an
undisclosed secondary layer as above), not just the numeric ceiling, is what changes from vendor to
vendor.

## The n=1 minimum

For one person running a handful of automations with no dedicated cost function watching them, the
defensible floor:

1. **A spend or usage alert wherever the platform offers one, turned on deliberately.** None of these
   are reliably default-on — confirm the setting exists and is active rather than assuming it.
2. **A per-flow cost ceiling**, checked against the account's own usage dashboard, even if only
   manually — recorded in [run-cost-table.md](../assets/run-cost-table.md).
3. **A kill switch that actually disables the workflow**, not merely alerts on it — a human checking a
   dashboard on a schedule, or an external monitor wired to a real stop, since no confirmed automatic
   breaker exists to rely on (see above).
4. **A deliberate blast-radius decision** — whether unrelated automation groups share one account and
   one quota bucket, or are isolated into separate ones, stated as a choice rather than left as
   whatever the signup flow defaulted to (I10).

## Failure modes and handoff

- A cost review that looks only at trigger frequency and misses step count/branching will miss the
  complexity-driven cost growth this file opens with — check both.
- Treating "the dashboard is green" as evidence nothing is burning quota is exactly the blind spot the
  runaway classes above share — the cost line, not the status line, is often the first honest signal.
- Assuming a well-designed quota ceiling implies a loop breaker is the specific mistake this file warns
  against above — a platform can get task-holding and overage billing right and still ship no automatic
  stop for a cross-system loop. Verify each mechanism separately; a vendor's competence in one area is
  not evidence for the other, the same discipline §5 already establishes for default alerting (I8).
- If a cost review surfaces that a workflow's design is the actual problem — an unbounded loop, a
  trigger that's simply wrong — route the fix to [trigger-design.md](trigger-design.md),
  [sync-semantics.md](sync-semantics.md), or [surface-agentic.md](surface-agentic.md) as appropriate;
  this file caps and alerts, it does not redesign the flow that's misbehaving.
