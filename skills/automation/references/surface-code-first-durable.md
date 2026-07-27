# Surface: Code-First Durable Execution

Purpose: Reshape the twelve jobs for the surface where the workflow is written in code and the
engine durably persists step state — Temporal, Inngest, Restate, Trigger.dev, Cloudflare Workflows,
AWS Step Functions. This surface does not redefine any job; it changes what I9 (resume-vs-restart)
costs to get right, and it changes who else is now in the room (`backend`, `operate`).

Read when:
- The workflow is defined as code against an SDK, not a visual canvas — you will write functions,
  compile or deploy them, and the engine's own replay/journal mechanism is what survives a crash.
- You are choosing between this tier and a hosted/self-hosted visual builder specifically because an
  irreversible early step (a charge, a send, a CRM write) needs a real resume guarantee.

Skip when:
- There is no engine — a scheduler fires a script and nothing durably tracks step state → read
  [surface-platform-native](surface-platform-native.md).
- You run a visual builder (n8n, Windmill, Activepieces, Kestra) → read
  [surface-self-hosted-engine](surface-self-hosted-engine.md); several of these engines resume too,
  but the mechanism and the operational posture differ.
- A model is a step or the trigger → this surface still applies underneath, but add
  [surface-agentic](surface-agentic.md) on top; do not treat the agentic overlay as a replacement.

Inputs: the job's own reference (this file only reshapes it), an irreversibility inventory for the
flow, and — if a human gate exists — the timeout policy from
[approval-and-authority](approval-and-authority.md), because no engine below ships one.

Produces: an engine choice justified by its resume model (not its marketing), a named idempotency
strategy for every irreversible step, and an explicit statement of what silent-stop alerting this
surface does *not* give you for free.

## Contents

- [What this surface solves for you: I9](#what-this-surface-solves-for-you-i9)
- [What it costs: you now write and deploy code](#what-it-costs-you-now-write-and-deploy-code)
- [Resume-vs-restart, per engine](#resume-vs-restart-per-engine)
- [The Azure Durable Functions boundary case](#the-azure-durable-functions-boundary-case)
- [Approval/HITL is a mechanism here, not a policy](#approvalhitl-is-a-mechanism-here-not-a-policy)
- [Silent-stop is still opt-in (I8)](#silent-stop-is-still-opt-in-i8)
- [Licence and liveness, briefly](#licence-and-liveness-briefly)
- [Handoff](#handoff)

## What this surface solves for you: I9

**I9 — before any irreversible early step, know whether your engine resumes or restarts.** On this
surface, for five of the six named engines, the answer is: it resumes. Step memoization or
event-sourced journal replay means a completed step's output is reused, not re-executed, when the
run continues after a crash or a retry. That is precisely what makes an irreversible early step
(charge the card, send the email, write the CRM record) safe to place early in a flow: the engine's
own durability mechanism, not a bespoke idempotency key you built by hand, is what stops it firing
twice. Fill [irreversibility-inventory.md](../assets/irreversibility-inventory.md) against your
chosen engine's actual resume model — not against the tier's reputation — before trusting this.

This is not the same claim as "the flow cannot fail" or "every failure is recoverable" — see the
Azure boundary case below, and see I8: resuming past a completed step says nothing about whether
anyone gets told the run stopped.

## What it costs: you now write and deploy code

The trade this surface makes explicit: you get I9 largely solved, but the workflow is now source
code with a build step, a deploy target, and a runtime process (a worker, a dev server, a managed
function) that must itself stay up. Two siblings become relevant in a way they are not on a visual
builder:

- **`backend`** — the workflow's code is ordinary application code once it's written: it wants code
  review, its own test suite, and the same craft discipline as any other service. `automation` writes
  the workflow logic and its idempotency/compensation decisions; it does not re-teach `backend`'s
  testing or persistence practice for the code housing them.
- **`operate`** — something must deploy this code, run the worker/engine process, and notice if it
  goes down. A crashed Temporal worker or a dead-lettered Inngest dev server is an availability
  incident like any other; `automation` designs the workflow's failure semantics, `operate` runs and
  recovers the process that executes them.

## Resume-vs-restart, per engine

Verified 2026-07-27 against each vendor's own docs (`docs.temporal.io`, `inngest.com/docs`,
`docs.restate.dev`, `developers.cloudflare.com/workflows`, `docs.aws.amazon.com/step-functions`) —
re-verify before depending on exact mechanics, this class of doc changes without a deploy on your
side (I15).

| Engine | Resume mechanism | What survives a crash/retry |
|---|---|---|
| **Temporal** | Event-sourced replay is the core execution mechanism, not an add-on — every continuation *is* a replay of history. | Only in-flight (not-yet-completed) Activities re-execute; completed ones are not repeated. |
| **Inngest** | `step.run()` memoization: *"When step.run() finishes successfully, the response is saved in the function run state and the step will not re-run."* | Step-level — a retried/resumed function skips already-completed steps by design. |
| **Restate** | Journal-based, invocation-level replay: *"skips completed steps and resumes from exactly where it left off."* Also ships a first-class idempotency-key header — duplicate requests return the identical prior result, the cleanest built-in dedup primitive of the tier (relevant to I4). | Whole invocation, journal-backed. |
| **Cloudflare Workflows** | Memoization: *"Steps should be named deterministically... This ensures that their state is cached, and prevents the step from being rerun unnecessarily. Step names act as the 'cache key.'"* | Same family as Temporal — completed steps skipped on re-entry. |
| **AWS Step Functions** | **Redrive**: *"Step Functions continues the failed execution from the unsuccessful step and uses the same input. Step Functions preserves the results and execution history of the successful steps, which are not rerun."* Eligible within 14 days of completion, execution not `SUCCEEDED`, under 1 year open, under 24,999 history events; retry counts reset to 0 on redrive. | The strongest resume primitive of the six — an explicit, bounded, named recovery path rather than an implicit replay side effect. |
| **Trigger.dev** | **Not independently verified this session** — the fetched docs page covered retry/error semantics only; no resume-vs-restart claim was confirmed. Apache-2.0, self-hostable, live (pushed within 72h as of 2026-07-27, per the licence/liveness check). | **Gap, not a claim.** Re-verify against `trigger.dev/docs` before relying on any specific resume behaviour. |

## The Azure Durable Functions boundary case

Azure Durable Functions is not one of this surface's six named engines, but it is the sharpest
illustration of what "durable" does *not* promise, and worth checking your own engine against.
Microsoft's own docs, verbatim: *"If there's an unhandled exception in an orchestrator function, the
orchestration instance finishes in a Failed state. You can't retry an orchestration instance after it
fails."* Retry only works if it's attached to the specific Activity call **before** an unhandled
exception propagates to the orchestrator; once the orchestrator itself fails, there is no resume — you
start a new instance. Event-sourced replay is still Azure's core mechanism, but it replays *for
continuation*, not *of a terminal failed run*. **Durable does not mean infinitely retryable** — confirm
which failure modes your chosen engine actually resumes from, not just that it has a replay mechanism
at all.

## Approval/HITL is a mechanism here, not a policy

Every engine on this surface ships a pause-and-resume primitive. **None ships a default answer to
what happens on timeout.** The policy — deny / allow / escalate — routes to
[approval-and-authority](approval-and-authority.md) (I13); what follows is mechanism only.

| Engine | Primitive |
|---|---|
| **Temporal** | Signals + await-with-timeout — a durable wait on an external signal, raced against a timer. |
| **Inngest** | `step.waitForEvent(event, { timeout })`; on timeout it resolves to `null`. Inngest's own docs, verbatim: *"There is no default-deny or default-allow… you decide."* — the most honest single statement found on this question anywhere in the tier. |
| **Restate** | "Suspensions" let a handler pause for an external event without paying for wait time on serverless. Timeout mechanics **not independently verified this session** — flag before relying on a specific default. |
| **Cloudflare Workflows** | `step.waitForEvent()`, recommended once a timeout exceeds 30 minutes. No approval-specific primitive beyond this building block. |
| **AWS Step Functions** | `.waitForTaskToken` — AWS's own docs name "Human in the loop" as a first-class use case (e.g. a funds-transfer confirmation). `HeartbeatSeconds`/`TimeoutSeconds` plus a `Catch` on `States.Timeout` give you the scaffolding; AWS ships no default outcome. |
| **Trigger.dev** | Not independently verified this session. |

## Silent-stop is still opt-in (I8)

Resume capability and failure alerting are two different axes — this tier solves the first and not
the second. Of every engine independently checked (Temporal, Inngest, and — outside this surface —
n8n, Step Functions, GitHub Actions), **none alerts by default when a workflow silently dies.** A
resume-capable engine can sit paused or dead-lettered indefinitely with nothing pushed anywhere unless
you wire the subscription yourself (an `inngest/function.failed` event, an EventBridge rule on
`TIMED_OUT`). Cite [workflow-observability](workflow-observability.md) for the missing-heartbeat
design; do not assume durability bought you an alert.

## Licence and liveness, briefly

Verified 2026-07-27 against each repo's root `LICENSE` file: **Temporal** MIT · **Restate** Business
Source License 1.1 (not OSI open source; converts to Apache-2.0 four years after each version's
release; explicitly prohibits offering it as a competing managed service) · **Inngest** Server Side
Public License 1.0 (not OSI open source — the same non-permissive family as MongoDB's licence,
routinely under-disclosed in comparison content) · **Trigger.dev** Apache-2.0. Cloudflare Workflows
and AWS Step Functions are cloud-proprietary managed services with no distributable core at all —
"self-hostable" is not a question that applies to them. Full selection criteria (licence as a
selection factor, exit cost, the vendor-lock recursion of running your glue logic somewhere you don't
control) live in [platform-selection](platform-selection.md); this is a pointer, not the treatment.

## Handoff

When this surface's build is done, fill [handoff.yaml](../assets/handoff.yaml) with
`surface: surface-code-first-durable`, the resume model actually confirmed for the chosen engine, and
route the deployed worker/process to `operate` per [handoff](handoff.md).
