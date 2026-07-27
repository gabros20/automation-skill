# Surface: Hosted iPaaS (Zapier/Make-class)

Purpose: State how the twelve automation jobs reshape on a hosted, connector-based, vendor-run
builder — the **default** surface, and the one where the reliability gaps are worst served, because
the product's entire job is to make the wiring look easy.

Read when:
- The workflow runs on Zapier, Make, Workato, Tray, Pipedream, IFTTT, or a comparable no-code,
  vendor-hosted builder — you rent execution, you do not run a server.
- You are deciding whether this tier is still the right call (pair with [platform-selection](platform-selection.md)).
- You need to know, before wiring an irreversible step, what this surface silently does *not* give
  you.

Skip when:
- You run the engine on your own infrastructure → [surface-self-hosted-engine](surface-self-hosted-engine.md).
- The workflow is code and steps are durable by the platform (Temporal/Inngest/Restate/Trigger.dev/
  Cloudflare Workflows/Step Functions) → surface-code-first-durable.
- There is no engine at all, only a scheduler → [surface-platform-native](surface-platform-native.md).
- A model is a step or the trigger → add surface-agentic **on top of** this surface, don't replace it.

Inputs:
- The job(s) you're implementing (from the router) and the vendor's actual connector list for this run.
- The vendor's own current plan docs for ceiling, retry, and resume behaviour, re-verified against the
  live page — not recalled (I15).

Produces:
- A per-job list of what the platform gives you free vs. what you still have to build.
- This surface's I7/I8/I9/I10 posture, carried into the artifact the job reference produces.

## Contents
- What the substrate gives you free
- What you must build yourself
- Credentials and their blast radius (I7)
- Silent-stop story (I8)
- Resume-vs-restart (I9)
- Cost model and ceiling behaviour (I10)
- Testability
- Exit cost
- Job-by-job reshape
- When this is the right call, stated fairly

## What the substrate gives you free

The connector catalogue removes the auth handshake and the API-shape work for every wired vendor —
this is the entire value proposition of the tier, and for a reader below some volume and complexity
threshold it is the correct trade. You also get a visual trigger/action canvas, a managed execution
environment with no server to patch, and (per the vendor, unverified here — see
[cost-and-quota](cost-and-quota.md)) some form of run-history UI.

## What you must build yourself

Everything the connector doesn't cover reappears as your problem, just later and less visibly:
reconciliation against the vendor's authoritative state (I1) — the platform tells you a step
succeeded, not that the record on the other end still says so; dedup keyed on the business event
rather than the platform's own retry mechanism (I4); a credential-health check independent of whether
a workflow happens to run (I7); and any approval/timeout policy beyond a bare pause step (I13). None
of these are connector-shaped problems, so the connector catalogue's completeness tells you nothing
about whether they're solved.

## Credentials and their blast radius (I7)

The connector's OAuth flow is the tier's best feature and its sharpest cost: **your credentials now
live inside a vendor you cannot deploy to, patch, or inspect the token store of.** You cannot rotate a
token out-of-band the way you could on infrastructure you run; you are dependent on the vendor's own
UI for reconnect, and a silent scope or expiry failure surfaces only as a stopped workflow, not a
credential alert. See [credentials-and-connections](credentials-and-connections.md) for the fleet-wide
discipline and the shared-account bus-factor problem — this surface just makes custody itself
non-negotiable: it is the vendor's, not yours, for as long as the workflow lives there. Track every
connected credential in `../assets/credential-register.md` regardless of where it's stored; the
register is what tells you a reconnect is overdue before the workflow tells you by stopping.

## Silent-stop story (I8)

A held or failed run on this tier is invisible unless the vendor's own notification happens to be
switched on and happens to be configured to reach you — see
[workflow-observability](workflow-observability.md) for the missing-heartbeat discipline this
implies. Don't assume a dashboard marked green means the workflow ran; it usually means the vendor's
own UI hasn't recorded a failure, which is a narrower claim.

## Resume-vs-restart (I9)

This is the tier's thinnest ground, and workflow-testing.md and compensation-and-recovery.md carry the
detail — but state the posture plainly here: no-code error-handling on this surface is expressed as a
small set of named per-step directives (retry / skip / stop), not as a documented resume-from-failure
guarantee for the whole run. Where the platform doesn't tell you whether a retried run replays
completed steps or restarts from the trigger, **assume restart-only** until you've confirmed
otherwise, and put the idempotency key on every irreversible step regardless (I4, I9). Order the flow
so the hardest-to-revert action runs last (I3) — on this surface you often cannot verify the engine
will protect you if it doesn't.

## Cost model and ceiling behaviour (I10)

Billing on this tier is per-task or per-operation, which means **cost scales with workflow
complexity, not with the value the workflow produces** — a workflow with more steps or more retries
costs more per run regardless of outcome. The ceiling behaviour, its warning mechanism (if any), and
its blast radius (per-workflow vs. account-wide) are vendor- and plan-specific and change without much
notice; get the current specifics from [cost-and-quota](cost-and-quota.md) rather than assuming last
quarter's plan page still holds (I15). Record the current ceiling and its blast radius in
`../assets/run-cost-table.md` before depending on it.

## Testability

This is the surface's weakest point structurally, not incidentally: most vendors wired together on
this tier offer no sandbox, no synthetic failure mode, and no isolated test endpoint for their side of
the integration — you can validate your own trigger/action logic in the builder's preview, but that
validates your logic, not what the vendor's live endpoint will actually do. See
[workflow-testing](workflow-testing.md) for the mitigations that exist despite this (canary, first-then-
bulk gate, manual first-run review) — none of them are iPaaS-specific, because nothing genuinely
iPaaS-specific exists yet.

## Exit cost

State this up front, before the workflow is built, not after: there is no portable workflow format off
this tier. A migration is a from-scratch re-implementation of trigger conditions, field mappings, and
error handling, read by hand out of a UI that may not even export its full configuration — and every
connected credential has to be re-authorized against the new host, not copied. The exit cost is the
highest of any surface in this family precisely because the ease that makes the tier attractive is
built by hiding the portability question. See platform-selection.md for the exit-cost checklist to run
*before* committing, not after outgrowing the tier.

## Job-by-job reshape

| Job | How this surface reshapes it |
|---|---|
| [reconciliation](reconciliation.md) | The platform's own run log is not evidence the vendor's state agrees — reconcile against the vendor's API/export, not the builder's history view |
| [integration-reliability](integration-reliability.md) | Dedup logic usually has to live in your own step (e.g. a lookup/filter), since the platform's delivery guarantee is rarely documented per-connector |
| [compensation-and-recovery](compensation-and-recovery.md) | Assume restart-only until proven otherwise; the hardest-to-revert step goes last |
| [credentials-and-connections](credentials-and-connections.md) | Custody is the vendor's; your job is detection and rotation cadence, not storage |
| [approval-and-authority](approval-and-authority.md) | A pause/approval step is usually available but its timeout default is rarely documented — name deny/allow/escalate yourself (I13) |
| [trigger-design](trigger-design.md) | Over-broad connector filters are the tier's characteristic failure; write the false-positive class explicitly |
| [sync-semantics](sync-semantics.md) | Incremental triggers on this tier are the most likely to silently miss deletes — check the connector's own polling semantics |
| [workflow-observability](workflow-observability.md) | Build the missing-heartbeat check outside the platform; its own notification is opt-in and vendor-specific |
| [cost-and-quota](cost-and-quota.md) | Per-task billing; get the current ceiling and blast radius before committing |
| [workflow-testing](workflow-testing.md) | Canary and first-then-bulk are close to the only mitigations available |
| [process-capture](process-capture.md) | Unaffected by substrate — capture the rule the same way regardless of surface |

## When this is the right call, stated fairly

For low volume, a small non-technical team, and coverage by the vendor's connector catalogue, this
tier is genuinely the correct choice — that is the entire reason it is the default and a large market.
The obligation this reference imposes is not "leave the tier," it is: know exactly which of the above
you have not built, and don't let the product's ease of use stand in for having built it.
