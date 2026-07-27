# Surface: Platform-native (Actions, cron, cloud schedulers)

Purpose: State how the twelve automation jobs reshape when there is no engine at all — the platform
is the scheduler, and every reliability property an engine would otherwise supply (retry, resume,
alerting) has to be built by hand.

Read when:
- The workflow is a scheduled script or job on GitHub Actions, a cloud scheduler (EventBridge
  Scheduler, Cloud Scheduler, Vercel Cron), or plain cron — with no workflow engine underneath it.
- You are deciding whether a small periodic job needs an engine at all
  (pair with [platform-selection](platform-selection.md)).
- You need the specific DST behaviour of the platform you're scheduling on before shipping a schedule.

Skip when:
- A vendor runs a connector-based builder for you → [surface-hosted-ipaas](surface-hosted-ipaas.md).
- You run a workflow engine yourself → [surface-self-hosted-engine](surface-self-hosted-engine.md).
- The workflow is code with engine-level durability → surface-code-first-durable.
- A model is a step or the trigger → add surface-agentic **on top of** this surface, don't replace it.

Inputs:
- The specific scheduling platform and its timezone/DST configuration.
- The job(s) you're implementing from the router.

Produces:
- This surface's I8/I9 posture, stated explicitly, since neither is given by the platform.
- A DST-safe schedule decision, or an explicit statement that DST risk was accepted.

## Contents
- No engine, no built-in reliability primitive
- Silent-stop story (I8)
- DST — the sharpest platform-specific split in the family (verified 2026-07-27, re-verify)
- Resume-vs-restart (I9) — the sharpest negative case
- Credentials
- Cost model
- Job-by-job reshape
- When this is the wrong call

## No engine, no built-in reliability primitive

This tier is defined by absence: no durable step state, no dedup, and — on GitHub Actions
specifically — no native retry primitive at the platform level, which is why third-party actions exist
solely to fill that gap. Every reliability property another surface gets from its engine is yours to
assemble here: retries with backoff, an idempotency key, a resume mechanism if you want one at all.
That is not automatically the wrong trade — see the closing section — but it means nothing in this
tier protects you by default.

## Silent-stop story (I8)

**GitHub Actions scheduled workflows on public repos auto-disable after 60 days of repo inactivity** —
a genuine silent-stop mode specific to this platform, distinct from a run failing: the schedule simply
stops firing, with no failure to alert on, because nothing ran to fail. This is the platform-native
tier's sharpest version of I8 — there is no run at all to observe.

More generally, across every engine this family's research could get a real answer from — Temporal,
Inngest, n8n, Step Functions, **and GitHub Actions** — **none alerts by default** when a workflow
silently dies. On this surface specifically there usually isn't even a product UI to check manually;
you are down to whatever generic account/repo notification preferences the platform offers, which are
not workflow-specific. Build the missing-heartbeat check described in
[workflow-observability](workflow-observability.md) — on this tier it is not a supplement to the
platform's own alerting, it is the only alerting there is.

## DST — the sharpest platform-specific split in the family (verified 2026-07-27, re-verify)

Four platform-native schedulers handle a clock change four different ways, and the difference decides
what monitoring would even catch:

- **AWS EventBridge Scheduler** — skips a schedule invocation that falls on a non-existent
  spring-forward time; on fall-back, runs **once** and does not repeat.
- **GitHub Actions** — shifts a schedule that falls in a skipped hour to the next valid time (e.g. a
  non-existent 2:30am becomes 3:00am).
- **Google Cloud Scheduler** — wall-clock-based with an explicitly undefined guarantee; the vendor's
  own docs say a job "might observe execution anomalies" and recommend UTC rather than promising
  behaviour in local time.
- **Vercel Cron** — UTC-only by design, structurally immune to DST ambiguity; the trade-off is you do
  the local-time conversion yourself and must re-derive it if the relevant local time ever changes.

These are not interchangeable "cron has DST issues" hand-waves — skipped, doubled, shifted, and
undefined are four different failure signatures, and only some of them are visible in a run-count
graph. Get the full comparison table, including the self-hosted-engine tier's n8n gap, from
[trigger-design](trigger-design.md) before committing a schedule across a clock-change boundary; record
the platform and its behaviour in `../assets/trigger-audit-sheet.md`.

## Resume-vs-restart (I9) — the sharpest negative case

There is no resume mechanism on this tier at all: a re-run starts from the top of the script, every
time. That makes this the sharpest I9 case in the family — not "restart-only if the engine fails to
resume," but *no engine, therefore no resume, full stop*. This surface is correct for a workflow with
no irreversible step, or where every step is naturally idempotent; it becomes the wrong tier the moment
a step sends, charges, or writes somewhere that a second identical run would duplicate. See
[compensation-and-recovery](compensation-and-recovery.md) for what to do about an irreversible step you
cannot avoid, and log it in `../assets/irreversibility-inventory.md` before scheduling the job.

## Credentials

Credentials on this tier are platform secrets — GitHub Actions repository/environment secrets, a cloud
scheduler's service-account identity, or equivalent — scoped to the platform's own secret store rather
than a workflow-engine credential vault. See
[credentials-and-connections](credentials-and-connections.md) for the health-check discipline this
still needs; a platform secret store does not check its own expiry for you.

## Cost model

Cost on this tier is usually measured in compute minutes, not per-task or per-operation billing — a
materially different shape from the hosted-iPaaS tier, and one that rarely produces the same
account-wide blast radius on your side. It does not remove the called vendor's own quota, which
remains theirs regardless of what runs the schedule — see
[cost-and-quota](cost-and-quota.md) for that half of the picture.

## Job-by-job reshape

| Job | How this surface reshapes it |
|---|---|
| [reconciliation](reconciliation.md) | No engine execution log to lean on at all — reconciliation has to run as its own separate scheduled job |
| [integration-reliability](integration-reliability.md) | Retry and dedup are entirely yours to write; nothing is bolted on for you |
| [compensation-and-recovery](compensation-and-recovery.md) | No resume — a retry is a full restart, so idempotency on irreversible steps is mandatory, not optional |
| [credentials-and-connections](credentials-and-connections.md) | Platform secret store; you still own the expiry check |
| [approval-and-authority](approval-and-authority.md) | No native human-gate primitive; an approval step has to be built as its own mechanism (e.g. a manual-dispatch gate) |
| [trigger-design](trigger-design.md) | DST behaviour differs sharply by platform — check the specific one before scheduling |
| [sync-semantics](sync-semantics.md) | Unaffected by hosting choice — the vendor-side delete-visibility problem is the same |
| [workflow-observability](workflow-observability.md) | The platform's own alerting is generic account/repo notification prefs, not workflow-specific — build your own |
| [cost-and-quota](cost-and-quota.md) | Cost is compute minutes; the called vendor's quota is unaffected by which scheduler calls it |
| [workflow-testing](workflow-testing.md) | No dry-run/preview mode exists at the platform level; test the script itself, then canary the schedule |

## When this is the wrong call

This surface is often correct for a small periodic job with no irreversible step — cheapest possible
tier, minimal moving parts. It is wrong the moment a step becomes irreversible and you have not built
your own idempotency and resume story, because the platform will not build it for you, and a retry
here means starting over, not picking up where you left off.
