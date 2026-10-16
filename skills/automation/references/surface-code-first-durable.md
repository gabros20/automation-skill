# Surface: Code-First Durable Execution

Purpose: Reshape the twelve jobs for the surface where the workflow is written in code and the
engine durably persists step state — Temporal, Inngest, Restate, Trigger.dev, DBOS, Cloudflare
Workflows, AWS Step Functions. This surface does not redefine any job; it changes what I9 (resume-vs-restart)
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
- [Code changes against open runs, and what belongs in a step](#code-changes-against-open-runs-and-what-belongs-in-a-step)
- [Approval/HITL is a mechanism here, not a policy](#approvalhitl-is-a-mechanism-here-not-a-policy)
- [Silent-stop is still opt-in (I8)](#silent-stop-is-still-opt-in-i8)
- [Licence and liveness, briefly](#licence-and-liveness-briefly)
- [Handoff](#handoff)

## What this surface solves for you: I9

**I9 — before any irreversible early step, know whether your engine resumes or restarts.** On this
surface, every named engine caches completed work — but at which unit, and whether a retry re-runs
the code around that unit, differs (see the per-engine table). Step memoization or
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

- **`backend`** — the workflow's code is ordinary application code once it's written: it becomes
  reviewable if there is a second pair of eyes to review it, and it wants its own test suite and the
  same craft discipline as any other service regardless. `automation` writes
  the workflow logic and its idempotency/compensation decisions; it does not re-teach `backend`'s
  testing or persistence practice for the code housing them.
- **`operate`** — something must deploy this code, run the worker/engine process, and notice if it
  goes down. A crashed Temporal worker or a dead-lettered Inngest dev server is an availability
  incident like any other; `automation` designs the workflow's failure semantics, `operate` runs and
  recovers the process that executes them.

## Resume-vs-restart, per engine

Verified 2026-07-27 against each vendor's own docs (`docs.temporal.io`, `inngest.com/docs`,
`docs.restate.dev`, `developers.cloudflare.com/workflows`, `docs.aws.amazon.com/step-functions`;
Trigger.dev and DBOS 2026-10-17, `trigger.dev/docs`, `docs.dbos.dev`) — re-verify before depending
on exact mechanics, this class of doc changes without a deploy on your side (I15).

**The mechanism family decides what *your* code must obey, not just what survives.** A replay engine
re-runs the workflow function itself, so the function must be deterministic — Temporal states this
outright (see "Code changes against open runs" below); journal, memoization and checkpoint engines (Restate, Inngest,
Cloudflare, Trigger.dev, DBOS) cache only at their own unit — a journaled action, a `step.run()`, a
named step, a subtask, a step function — and re-run whatever code sits between units. In every family the rule is the same one
I9 asks for: **an irreversible call lives inside the unit the engine caches, never between units.**

| Engine | Resume mechanism | What survives a crash/retry |
|---|---|---|
| **Temporal** | Event-sourced replay is the core execution mechanism, not an add-on — every continuation *is* a replay of history. | Only in-flight (not-yet-completed) Activities re-execute; completed ones are not repeated. |
| **Inngest** | `step.run()` memoization — once a step completes successfully, its result is saved in the function's run state, and that step is skipped rather than re-executed on any later resume of the same run. | Step-level — a retried/resumed function skips already-completed steps by design. |
| **Restate** | Journal-based, invocation-level replay: completed steps are skipped and execution resumes from wherever it left off. Also ships a first-class idempotency-key header — duplicate requests return the identical prior result, the cleanest built-in dedup primitive of the tier (relevant to I4). | Whole invocation, journal-backed. |
| **Cloudflare Workflows** | Memoization keyed on deterministic step names: a step's result is cached under its name, so re-entry skips any step whose name already has a cached result. | Same family as Temporal — completed steps skipped on re-entry. |
| **AWS Step Functions** | **Redrive**: resumes a failed execution from the unsuccessful step using the same input, and preserves the results and history of the steps that already succeeded rather than rerunning them. Eligibility is bounded by execution age, elapsed time since completion, and history-event count, all vendor-defined — read AWS's current limits before relying on it rather than assuming a fixed window; retry counts reset to zero on redrive. | The strongest resume primitive in this table — an explicit, bounded, named recovery path rather than an implicit replay side effect. |
| **Trigger.dev** | **Checkpoint-restore**: on a long wait the task's whole process state is checkpointed and restored into a new environment. **A retry after an error is a restart** — Trigger.dev's own docs, verbatim: *"When retried, it starts from the beginning, but leverages cached results for completed subtasks"*, each subtask's output cached under its idempotency key (verified 2026-10-17). | Completed **subtasks** only. A side effect written inline in the task body re-executes on every retry — put each irreversible call in its own subtask. |
| **DBOS** | **Database-as-journal**: a library inside your app checkpoints workflow inputs and step results to Postgres; *"no separate orchestration server"* (verified 2026-10-17). | Recovery re-runs the workflow from its saved inputs; a step with a saved result returns it instead of running again. |

## The Azure Durable Functions boundary case

Azure Durable Functions is not one of this surface's named engines, but it is the sharpest
illustration of what "durable" does *not* promise, and worth checking your own engine against.
Microsoft's own docs, verbatim: *"If there's an unhandled exception in an orchestrator function, the
orchestration instance finishes in a Failed state. You can't retry an orchestration instance after it
fails."* Retry only works if it's attached to the specific Activity call **before** an unhandled
exception propagates to the orchestrator; once the orchestrator itself fails, there is no resume — you
start a new instance. Event-sourced replay is still Azure's core mechanism, but it replays *for
continuation*, not *of a terminal failed run*. **Durable does not mean infinitely retryable** — confirm
which failure modes your chosen engine actually resumes from, not just that it has a replay mechanism
at all.

## Code changes against open runs, and what belongs in a step

Durable runs outlive deploys — a run waiting a week for an approval will resume on code you shipped
after it started. Temporal's docs, verbatim: *"Workflow code must be deterministic to support
replay"*; change it incompatibly under an open execution and *"The Workflow Execution would fail and
return a nondeterminism error"* — their remedy is Workflow Versioning (verified 2026-10-17). Three
rules follow on this surface:

- **Treat every deploy as a migration of open runs.** Before shipping a changed workflow, know how
  many executions are open and whether the change is replay-safe; version or patch it if not.
- **Memoized output survives a logic change.** A run resuming past a completed step keeps that
  step's old result even if you since fixed the step — include the version of anything that shapes
  a step's output (its code, its prompt template) in the step's identity where you need a fresh
  result. *This is the pack's own inference from the memoization mechanism, not a vendor statement.*
- **Model calls belong in a step, and large outputs belong outside the history.** An LLM call is
  non-deterministic and paid; inside a cached step, replay reuses its output instead of re-calling
  and re-billing the model. Engine payloads are bounded — Temporal's is 2 MB by default (verified
  2026-10-17) — so store a large output in an object store and pass a reference, what Temporal's
  docs call the claim check pattern.

## Approval/HITL is a mechanism here, not a policy

Every engine on this surface ships a pause-and-resume primitive. **None ships a default answer to
what happens on timeout.** The policy — deny / allow / escalate — routes to
[approval-and-authority](approval-and-authority.md) (I13); what follows is mechanism only, verified
2026-07-27 against each vendor's own docs — **re-verify any specific number below before relying on
it; this is exactly the class of vendor detail that moves without a deploy on your side (I15).**

| Engine | Primitive |
|---|---|
| **Temporal** | Signals + await-with-timeout — a durable wait on an external signal, raced against a timer. |
| **Inngest** | `step.waitForEvent(event, { timeout })`; on timeout it resolves to `null`. Inngest's own docs, verbatim: *"There is no default-deny or default-allow… you decide."* — the most honest single statement found on this question anywhere in the tier. |
| **Restate** | "Suspensions" let a handler pause for an external event without paying for wait time on serverless. Timeout mechanics **not independently verified this session** — flag before relying on a specific default. |
| **Cloudflare Workflows** | `step.waitForEvent()`, recommended for longer waits rather than short ones (verified 2026-07-27, re-verify against Cloudflare's current guidance for the exact threshold). No approval-specific primitive beyond this building block. |
| **AWS Step Functions** | `.waitForTaskToken` — AWS's own docs name "Human in the loop" as a first-class use case (e.g. a funds-transfer confirmation). `HeartbeatSeconds`/`TimeoutSeconds` plus a `Catch` on `States.Timeout` give you the scaffolding; AWS ships no default outcome. |
| **Trigger.dev** | Waitpoint tokens — `wait.forToken()` returns `ok: false` on timeout, and the timeout is set when the token is created. Trigger.dev's own docs, verbatim: *"If omitted, the token has no timeout"* (verified 2026-10-17) — **the default is wait forever**, the pending-indefinitely failure in [approval-and-authority](approval-and-authority.md). |

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
routinely under-disclosed in comparison content) · **Trigger.dev** Apache-2.0 · **DBOS** MIT (re-verified 2026-10-17, all live — pushed within 24h). Cloudflare Workflows
and AWS Step Functions are cloud-proprietary managed services with no distributable core at all —
"self-hostable" is not a question that applies to them. Full selection criteria (licence as a
selection factor, exit cost, the vendor-lock recursion of running your glue logic somewhere you don't
control) live in [platform-selection](platform-selection.md); this is a pointer, not the treatment.

## Handoff

When this surface's build is done, fill [handoff.yaml](../assets/handoff.yaml) with
`surface: surface-code-first-durable`, the resume model actually confirmed for the chosen engine, and
route the deployed worker/process to `operate` per [handoff](handoff.md).
