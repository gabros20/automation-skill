# Workflow Observability

Purpose: Tell, from outside the system, whether an automation is still running, whether it stopped
silently, and — when something is questioned after the fact — what ran, on whose authority, and with
what effect.

Read when:
- You need to know whether an automation stopped without erroring, not whether it errored.
- You are setting up a new automation and deciding what "failure" should even mean for it.
- Someone asks, after the fact, what ran, who or what authorized it, and what it actually did.
- A dashboard says everything is fine and you don't yet trust that.

Skip when:
- You need the loop that actively diffs your state against the vendor's — that's detection of *drift*,
  not of *stoppage* → [reconciliation](reconciliation.md) (I1).
- You are deploying or running the monitoring platform itself, or handling an incident once alerted →
  `operate`.
- The credential behind the workflow is the actual failure — diagnose it at the source →
  [credentials-and-connections](credentials-and-connections.md), then link back here for the
  detection mechanism.

Inputs:
- The engine(s) in use and whether any error/failure workflow, alerting subscription, or notification
  is currently wired for each automation.
- What "done" or "successful" currently means for the workflow — a status field, a log line, a
  human's assumption.

Produces:
- A missing-heartbeat monitor per workflow that must run regularly.
- An explicit statement of what "green" does and does not verify for that workflow.
- An audit-trail definition: what is logged, and whether it can be checked against something other
  than the workflow's own prior write.

## Contents

- [1. I8 — a workflow that stopped is not a workflow that failed](#1-i8--a-workflow-that-stopped-is-not-a-workflow-that-failed)
- [2. The decisive finding: no engine alerts by default](#2-the-decisive-finding-no-engine-alerts-by-default)
- [3. What "green" does not mean](#3-what-green-does-not-mean)
- [4. Build the missing-heartbeat signal — cite, don't re-teach](#4-build-the-missing-heartbeat-signal--cite-dont-re-teach)
- [5. Scheduled workflows can be disabled out from under you](#5-scheduled-workflows-can-be-disabled-out-from-under-you)
- [6. The audit dimension: what ran, on whose authority, with what effect](#6-the-audit-dimension-what-ran-on-whose-authority-with-what-effect)
- [Validation](#validation)
- [Failure modes and handoff](#failure-modes-and-handoff)

## 1. I8 — a workflow that stopped is not a workflow that failed

**I8 — A workflow that stopped is not a workflow that failed.** These are different events with
different signatures. A failure throws, logs an error, and — if anything is wired — triggers a
notification. A stoppage does none of those things: the trigger simply never fired again, a step
silently marked itself "done" without doing the work, or a credential died with no error surfaced
(see [credentials-and-connections](credentials-and-connections.md) §2). Nothing in the system's own
error path catches this, because nothing errored. **The missing-heartbeat signal is yours to build** —
no engine ships it, and this reference exists because that gap is not vendor-specific, it is the
default posture of the entire landscape.

## 2. The decisive finding: no engine alerts by default

Across every engine where a real answer could be confirmed against primary docs — Temporal, Inngest,
n8n, AWS Step Functions, and GitHub Actions — **none alerts by default when a workflow silently
stops.** Verified 2026-07-27, re-verify; this is exactly the kind of vendor behaviour that changes
without a deploy on your side.

- **n8n is the clearest, most citable case.** Error workflows are **opt-in, per workflow**, configured
  manually in Workflow Settings, and must start with an Error Trigger node — nothing fires unless the
  builder wires it by hand. This is the direct mechanism behind the well-known small-operator failure
  mode of an OAuth token expiring quietly and nothing firing for days before anyone notices.
- **Step Functions and Inngest both require an explicit event subscription** before failure reaches a
  human. Step Functions failures are listenable via EventBridge — opt-in wiring. Inngest emits an
  `inngest/function.failed` system event you must subscribe to; the failure is visible in Inngest's own
  UI, but nothing is pushed anywhere unless you ask for it.
- **GitHub Actions has nothing workflow-specific at all** — only generic repo-level notification
  preferences that have nothing to do with any particular workflow's health.

The pattern holds across a hosted no-code tool, two code-first durable engines, and a platform-native
scheduler. It is not one vendor's oversight; it is the default shape of the category, and it is why
this job exists as its own reference rather than a footnote to reliability.

## 3. What "green" does not mean

A workflow showing no failure state is not the same claim as "the work completed correctly." A step
that is retrying is, by construction, not yet in a failed state — most engines' retry mechanics keep a
task in an in-progress or pending status through every retry attempt, precisely so that a transient
failure doesn't prematurely mark the whole run dead. That is the right default for retries, and it has
a cost: **a workflow can be actively retrying, minutes past when it should have completed, while every
dashboard still reads as healthy**, because "not yet failed" and "not yet succeeded" render identically
until a maximum-attempts ceiling is actually hit. Treat a status of "green" or "no alert" as meaning
only "nothing has crossed the failure threshold yet" — not "this finished, and finished correctly."
The gap between those two claims is exactly what a missing-heartbeat check (§4) and a reconciliation
loop ([reconciliation](reconciliation.md), I1) are for: one confirms the process is still moving, the
other confirms what it produced actually matches the vendor's state.

## 4. Build the missing-heartbeat signal — cite, don't re-teach

The mechanism is a scheduled check-in, not a passive wait for an error: a workflow (or the credential
behind it, per [credentials-and-connections](credentials-and-connections.md) §3) should ping a
dead-man's-switch on a cadence shorter than its expected run interval, and the alert fires on the
**absence** of that ping, not on a failure event. `operate` already owns this mechanism in depth —
see its dead-man's-switch treatment (`operate-skill/skills/operate/references/recoverability.md`
§4, "Managed-platform hazards") for the tooling (Healthchecks.io, BSD-3-Clause, self-hostable) and
the general pattern; do not re-teach it here. What belongs in this pack specifically is the
instruction to wire it **per
automation and per credential**, given §2's finding that no engine will do it for you, and given that
a missing heartbeat is the only signal shaped correctly to catch a stoppage rather than a failure.
The per-credential instance of this same check is what
[credential-register](../assets/credential-register.md)'s "Detection (canary / heartbeat)" column
is for — fill it with the actual mechanism (a canary call, a heartbeat ping), not left blank on the
assumption that a dead credential will announce itself.

## 5. Scheduled workflows can be disabled out from under you

**GitHub Actions auto-disables scheduled workflows on public repositories after 60 days of repository
inactivity** (verified 2026-07-27, re-verify). This is a distinct failure mode from anything in §1–§4:
the workflow doesn't error, doesn't silently mis-complete, and doesn't even attempt to run — the
platform itself turned the trigger off. A missing-heartbeat check (§4) catches this correctly, since
the absence of a ping is the same signal regardless of *why* the workflow stopped firing — but it is
worth naming this specific cause explicitly, since "the repo went quiet for two months" is an easy
condition to hit by accident on a low-traffic automation repo, and the fix (a commit, or re-enabling
the workflow) is trivial once you know to look for it.

## 6. The audit dimension: what ran, on whose authority, with what effect

Observability here is not only "is it running" — it is also "when someone asks, can you answer what
ran, on whose authority, and what it actually did." Three things make this answerable rather than a
matter of trust in the system's own word:

- **Log the raw event and the workflow's interpretation of it as two separate facts, not one** (I2).
  A completion check that can only confirm itself against its own prior write is unfalsifiable — it
  cannot distinguish "this genuinely completed" from "something upstream corrupted the record in a
  way that reads as completion." This is not a hypothetical — see
  [integration-reliability](integration-reliability.md) §7 for the practitioner case where exactly
  this happened and how it was caught; the fix here is the same one that incident points to: log
  source and interpretation separately, and auto-detect every mismatch between them, rather than
  trusting the interpretation alone.
- **Authority, not just occurrence.** When a human step or an approval gate is in the graph, the audit
  record needs to capture *who* acted, not only *that* an action happened — this is the record
  [approval-and-authority](approval-and-authority.md) depends on when a timeout or an escalation
  decision is later questioned; this reference owns capturing it, that one owns deciding what to do
  with a timeout.
- **Effect, not status.** "Ran successfully" is a claim about the workflow engine's own bookkeeping;
  "produced this specific external effect" is a claim about the world. Where the two are conflated,
  the reconciliation loop ([reconciliation](reconciliation.md)) is what closes the gap — this
  reference's job is making sure the raw material for that comparison (the actual event, not just the
  workflow's summary of it) was captured in the first place.

## Validation

- Every automation that runs on a schedule or a trigger has a missing-heartbeat check on a cadence
  shorter than its expected run interval, alerting on absence rather than on failure.
- For every engine in use, you can state plainly whether failure alerting is wired, and confirm it is
  not simply assumed to be the vendor's default (§2).
- The raw event and the workflow's own completion status are logged as two separable facts for any
  step whose completion state matters (I2), not merged into a single self-referential record.
- You can name, for at least the highest-stakes automations, what ran, on whose authority, and what
  effect it had — without relying solely on the workflow's own "succeeded" status.

## Failure modes and handoff

- **A workflow appears healthy but its last real output is older than expected.** Treat the absence of
  recent output as the signal, not the absence of an error — that is precisely what §1–§4 describe.
- **A completion check can only be confirmed against the workflow's own prior write, never falsified
  against anything else.** That is the exact shape of the false-positive failure in §6 — restructure
  the logging before trusting the check again.
- **The workflow stopped because a credential died, not because the logic broke** → diagnose at
  [credentials-and-connections](credentials-and-connections.md); this reference's job ends at
  detecting *that* something stopped, not *why*.
- **The dashboard is green but the vendor-side state has drifted from what you expect** → that is a
  reconciliation question, not an observability one → [reconciliation](reconciliation.md) (I1).
- **An audit question turns into an incident** (unauthorized action, a compromised credential's
  effects need tracing) → hand off to `operate`'s incident process.
