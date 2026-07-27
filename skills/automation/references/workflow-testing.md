# Workflow Testing

Purpose: State honestly what can and cannot be tested when most of a workflow's steps belong to
vendors you do not control — and name what replaces the testing you cannot do, rather than pretending
a dry-run mode covers it.

Read when:
- You are about to trust a workflow with an irreversible external effect and want to know what
  verifying it *before* full release actually looks like.
- A workflow passed its dry-run or preview mode and you are deciding whether that is sufficient
  evidence to release it against the full population.
- You are choosing between testing against a vendor's sandbox, a local fixture, or the live endpoint,
  and are not sure which one is lying to you.

Skip when:
- The workflow's steps are entirely inside your own services — that is unit/integration testing for
  code you own, and the owning build skill's own testing reference (`frontend`/`backend`/`data`/`ai`)
  covers it, not this file.
- The question is whether the workflow may ship at all, who signs off, and what evidence a release
  gate requires — that is `quality`'s ship-gate decision; this file only produces the evidence, it
  does not grade it.
- The question is what order to run irreversible steps in, or what to do when one already ran before
  a later one failed — that is [compensation-and-recovery](compensation-and-recovery.md).
- The question is whether the run is still going, or how you'd know it silently stopped — that is
  [workflow-observability](workflow-observability.md).

Inputs: the step sequence with each step's external effect named — the same
[irreversibility inventory](../assets/irreversibility-inventory.md)
[compensation-and-recovery](compensation-and-recovery.md) uses; whether the vendor at each step
offers a test mode, a sandbox, or neither; the smallest real population you could safely run the
workflow against.

Produces: a stated verification plan per step — sandbox, fixture replay, canary, or "genuinely
untestable, mitigated by X" — and a release gate for the first live run that names who watches it and
what stops it if it goes wrong.

## Contents

- The honest starting point: sandbox is not production
- What a vendor test mode actually buys you, and its limit
- Local development: forwarding and tunnels
- Fixture replay: testing your own logic, not the vendor's current behavior
- What is genuinely untestable, and what replaces it
- The first-task-then-bulk gate
- The n=1 reality: your staging environment is a second free account, or nothing
- Boundary: `quality` grades the release, this file produces the evidence

## The honest starting point: sandbox is not production

Where a vendor test mode exists, it is a different environment running against a different dataset,
under different conditions, from the one your workflow will actually run against. A test mode can
confirm your workflow's logic executes as written; it cannot confirm the vendor's *live* endpoint will
behave the way its test mode implied on the day you ship. Field values that are always present in test
fixtures go null in production. Webhooks that fire reliably against a sandbox subscription can arrive
late, out of order, or not at all against the real one, because sandbox traffic volume and retry
behavior are not the same as production's. Treat every green result from a sandbox as evidence about
your own logic, never as evidence about the vendor's current live behavior — that distinction is the
whole reason this file exists as separate from ordinary test-writing guidance.

## What a vendor test mode actually buys you, and its limit

Where a vendor invests in one, a test mode typically gives you isolated test credentials, a set of
synthetic inputs that deterministically trigger specific scenarios (a decline, a retry, a delayed
response), and a way to fire the vendor's own webhook events on demand without touching real records.
That is a genuine, usable asset where it exists — it lets you exercise failure paths you could not
safely provoke against a live account. **The honest corollary is that most of the SaaS tools a small
business actually wires together — CRMs, spreadsheets, niche vertical tools, most email and messaging
platforms — have no equivalent.** No test mode, no synthetic failure trigger, no isolated sandbox.
Building your verification plan around "the vendor's test mode will catch it" only works for the
minority of vendors that built one; assume you do not have it unless you have specifically confirmed
that vendor does, and re-confirm before every major workflow change, since a vendor can retire or
narrow a test mode with no deploy on your side to notice it.

## Local development: forwarding and tunnels

Webhook-triggered workflows need a public endpoint, which a local development machine does not have.
Where a vendor supports it, a forwarding CLI or tunnel lets you receive real (or sandboxed) webhook
deliveries on your own machine during development, without deploying anything or exposing your
machine directly to the internet. This tests delivery *shape* — payload structure, headers, signature
verification — against something closer to the real transport than a hand-written fixture. It still
does not tell you whether the vendor's production trigger conditions match what you assumed; that
requires a live run.

## Fixture replay: testing your own logic, not the vendor's current behavior

Recording a real (or representative) vendor response once and replaying it against your workflow
logic repeatedly — the general pattern behind consumer-driven contract testing, HTTP cassette/fixture
replay, and mock-server tooling — is directly useful for testing your own branching and
transformation logic deterministically, without touching a live account on every test run. Its limit
is structural, not a tooling gap: a fixture is a snapshot of what the vendor's contract looked like on
the day you recorded it, and that contract can drift silently — a field renamed, a value that used to
always be present starting to arrive null — with no signal on your side. A suite of green fixture
tests tells you your logic still does what it did when you recorded the fixture; it does not tell you
the vendor still behaves the way the fixture assumes. Re-record fixtures on a schedule, not once at
launch, and treat a long-unrefreshed fixture as itself a source of false confidence.

## What is genuinely untestable, and what replaces it

An irreversible mutation against a vendor with no sandbox — a live message sent, a live record
written, a live notification delivered — cannot be dry-run at all if the vendor gives you no test
mode. Check the [irreversibility inventory](../assets/irreversibility-inventory.md) for which steps
this applies to before deciding a dry-run mode's green result is sufficient. There is no clean
substitute for this; there are only mitigations that reduce the size of the mistake rather than
prevent it:

- **A narrow canary** — run the real workflow against one real record or account you control (or a
  single willing real user) before trusting it against the full population. This is what catches a
  trigger condition that is broader than intended before it fires against everyone at once.
- **Manual first-run review** — a person watches the first live execution end to end, rather than
  trusting a dry-run or preview mode's judgment about what would have happened. A preview mode cannot
  see what the vendor's live endpoint actually does with the request; only a real, watched run can.
- **Idempotency as a safety net even in production testing** — if a step must be exercised against a
  live, irreversible endpoint to be tested at all, make the step itself replay-safe first (I4), so an
  accidental second trigger during testing does not double the real-world effect.

None of this is a workaround you graduate out of once you find the right tool — for most of the
vendors a small business actually wires together, this is the ceiling of what testing this seam can
mean, and the honest thing to do is say so in the workflow's artifact contract rather than imply
coverage a dry-run mode does not provide.

## The first-task-then-bulk gate

Where a workflow acts on a batch — a list of records, a bulk import, a scheduled run over every open
item — do not release the trigger against the whole batch on faith that the single-item logic is
correct. Run it against exactly one real item first, inspect the actual side effect by hand, and only
then release it against the rest. This costs nothing beyond the wait and catches, cheaply, the exact
failure shape of an over-broad trigger condition or a field mapping that was correct on paper and
wrong against the vendor's actual current data — the same failure whether "35 records got touched
instead of 1" or "an unintended subset got a charge or a message." Make this gate a named step in the
workflow's rollout, not an ad hoc habit some runs get and others skip.

## The n=1 reality: your staging environment is a second free account, or nothing

At small scale, "set up a staging environment for this CRM" usually means a second free-tier account,
if the vendor's terms even permit one, disconnected from the production data and workflows you
actually need to test against realistic conditions. Frequently it means nothing exists that is not
the live account. Design the verification plan around this constraint rather than around advice
written for a team with a dedicated test tenant: favor the canary and first-task-then-bulk gate above,
which work with zero additional infrastructure, over recommendations that assume a parallel
environment you do not have and may not be able to get.

## Boundary: `quality` grades the release, this file produces the evidence

This file's job ends at producing the verification plan and its results: what was tested against a
sandbox, what was fixture-replayed, what was canaried, and what remains genuinely unverified against
the live vendor. Deciding whether that evidence is sufficient to ship, and issuing the go/no-go, is
`quality`'s independent verification and release-gate job, not this file's — hand the evidence to
`quality` rather than self-certifying that "we tested it" is the same claim as "it is safe to release."
