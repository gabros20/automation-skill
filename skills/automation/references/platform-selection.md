# Platform Selection

Purpose: Decide which of the four platform tiers to build on — using resume-capability, default
alerting, licence-and-liveness, and exit cost as the criteria that actually decide it, not a feature
checklist a vendor wrote to be read in isolation.

Read when:
- Choosing between a hosted iPaaS, a self-hosted engine, a code-first durable-execution framework, or
  platform-native scheduling for a new automation.
- A recommendation is about to name "self-hosted" or "open source" as the reason to pick an engine.
- An irreversible early step exists (a charge, a send, a write to a system of record) and the retry
  behaviour of the candidate engine hasn't been checked yet.
- Migrating off a platform, or sizing what leaving one would cost, before signing up for it.

Skip when:
- The platform is already chosen and the question is how to build reliably on it — go to the matching
  surface file: `surface-hosted-ipaas.md`, `surface-self-hosted-engine.md`,
  `surface-code-first-durable.md`, or `surface-platform-native.md`.
- The question is whether a workflow stopped silently, not which platform to run it on —
  [workflow-observability.md](workflow-observability.md) (I8).
- The question is what this will cost to run, not which tier to run it on —
  [cost-and-quota.md](cost-and-quota.md) (I10, I11).

Inputs: the irreversible-step inventory (I3), whether there is anyone — a team, or you alone — who
can and will operate infrastructure, and expected run volume and growth.
Produces: a tier decision with its resume-capability, default-alerting posture, licence, and exit cost
recorded against it — not just a vendor name.

Before committing, price the tier using [run-cost-table.md](../assets/run-cost-table.md) — a choice
made on features and licence alone still omits the number that decides whether it's the right choice
next year.

## Contents

- The four tiers
- I9 — resume-capability as a first-class selection criterion
- Silent-stop alerting — none of them default to it
- Licence and liveness
- Exit cost, asked up front
- Sequencing the decision
- Failure modes and handoff

## The four tiers

| Tier | What it buys | What it costs | Who it suits |
|---|---|---|---|
| **Hosted iPaaS** (Zapier/Make-class) | A visual builder, a pre-built connector catalogue, and execution you don't operate. Fastest path from zero to a running workflow. | No distributable core — there is no local artifact to inspect, fork, version-control, or migrate off of a repo for. Per-run pricing that scales with volume, not with the value the workflow delivers. | Low-to-moderate volume, shallow branching logic, a non-technical team, and coverage by the vendor's connector catalogue. This is the default base surface for exactly that reason. |
| **Self-hosted engine** (n8n/Windmill/Activepieces/Kestra-class) | You run the engine on your own infrastructure — version control, code review, and CI over the workflow definition become possible. | Someone operates the engine: patching, scaling, backup. "Self-hosted" answers *where it runs*, not *what you're allowed to do with it* — see licence below. | A team that can and will run infrastructure, and wants version-controlled workflow logic without going fully code-first. |
| **Code-first durable execution** (Temporal/Inngest/Restate/Trigger.dev/Cloudflare Workflows/Step Functions-class) | The workflow is code: diffable, testable in the ordinary software sense, and — on the resume-capable engines — step output is preserved across a crash or retry. | Engineering time. This tier assumes whoever is building would rather write and test a workflow than configure one. | Volume or reliability requirements that outgrow a visual builder's retry/idempotency model, or a need for the workflow logic to go through the same review process as the rest of the codebase. |
| **Platform-native** (Actions/cron/cloud schedulers) | The platform you're already running on becomes the scheduler — no separate engine to operate or pay for. | No durable step state and no built-in retry primitive at the platform level. Reliability properties come entirely from what you bolt on yourself. | A small number of simple, mostly-independent scheduled jobs where a whole workflow engine would be more infrastructure than the job justifies. |

## I9 — resume-capability as a first-class selection criterion

> **I9 — Before any irreversible early step, know whether your engine resumes or restarts.
> Restart-only + an irreversible early step = a duplicate-side-effect generator on every retry.**

Engines split cleanly into two camps, and this split — not the connector catalogue, not the pricing
page — is the highest-leverage fact to check before wiring anything that sends, charges, or writes to
a system of record early in a flow.

**The negative case, stated by the vendor itself:** Azure Durable Functions, verbatim: *"you can't
retry an orchestration instance after it fails."* Once the orchestrator itself throws unhandled, the
run is terminal — there is no resume, only a new instance from the top. If step one of that instance
sent an email or charged a card, a retry sends or charges it again.

**The positive case, stated by a vendor about its own competitors' failure mode:** Activepieces' own
docs on why durable execution exists at all, verbatim: *"a worker that dies mid-flow would restart the
whole run from the trigger and re-send emails, re-charge cards, and re-call APIs."* That sentence is
the engine vendor describing, in its own marketing copy, exactly what a restart-only engine does to an
irreversible early step — worth citing precisely because it is unusually candid for a vendor page.

The practical rule this supports: **before wiring a workflow with an irreversible early step, ask
whether the candidate engine's retry model reuses completed-step output (resume) or starts over from
the trigger (restart).** If it restarts, that early step needs its own idempotency key (I4) or it
becomes a duplicate-side-effect generator on every retry — full stop, not a tuning problem.

## Silent-stop alerting — none of them default to it

**I8 — a workflow that stopped is not a workflow that failed.** Do not choose a tier expecting it to
tell you when a workflow silently dies: **of every engine verifiable, none alerts by default.** n8n's
own error-workflow mechanism is opt-in, wired per workflow, and must be attached manually to an Error
Trigger node — nothing fires unless the builder wires it first. This holds across every tier surveyed,
not just the no-code one: the missing-heartbeat signal is something you build regardless of which tier
you pick. See [workflow-observability.md](workflow-observability.md) for the mechanism; cite
`operate`'s dead-man's-switch rather than re-deriving it there.

## Licence and liveness

**Licence and OSI status are separate facts from whether the project is alive, and a tier choice made
on one without the other is incomplete.** Read the licence text itself — not the marketing page, not
the "open source" label a comparison listicle attached to it — and confirm the repo is still pushed
to, not merely correctly licensed and abandoned.

| Project | Licence | OSI open source? |
|---|---|---|
| **n8n** | Sustainable Use License | **No** — n8n's own docs concede this; do not describe it as open source. |
| **Activepieces** (core) | MIT | Yes |
| **Windmill** | AGPLv3 (core) + Apache-2.0 (clients) | Yes, for the licensed portions |
| **Kestra** | Apache-2.0 | Yes |
| **Temporal** | MIT | Yes |
| **Pipedream** | — | **No** — despite comparison listicles routinely listing it alongside the MIT/Apache engines above as if it belonged in the same column. |

(Verified 2026-07-27, against each project's own licence text; re-verify — licence terms and
enterprise carve-outs change, and a licence you verified a year ago is a licence you haven't verified.)

**Liveness:** all engine repos in this comparison were confirmed live — pushed to within 72 hours of
the 2026-07-27 verification date. That is a snapshot, not a standing fact: check push activity again
before recommending any of these by name, the same discipline I15 asks for on every volatile vendor
claim. A correctly licensed, abandoned project is still the wrong recommendation.

**Naming n8n's licence as SUL is not a knock on n8n** — it's a fact a reader needs before they build a
business's glue logic on top of it and later discover what "your own internal business purposes only"
does and doesn't permit them to do with what they built.

## Exit cost, asked up front

The honest question almost nobody asks before adopting a platform: **what does leaving it cost, and
what does that cost buy you if you never leave?** Ask it before commitment, not after the migration
becomes necessary.

- **There is no portable workflow format across tiers or vendors within a tier.** A workflow built in
  one hosted iPaaS does not export into another vendor's format, a self-hosted engine's format, or a
  code-first engine's definition language. Every migration is a from-scratch re-implementation of
  trigger conditions, field mappings, and error-handling logic.
- **The reliability assumptions you never had to think about don't transfer.** If a tool's retry and
  idempotency behaviour was invisible to you because the vendor handled it, migrating away exposes
  every place you were implicitly relying on that default — see I9 above for exactly one such
  assumption that will not survive a platform change unexamined.
- **Credentials have to be re-established, not copied.** OAuth grants, API keys, and webhook URLs are
  usually bound to the vendor account that registered them, not portable to a new host without
  re-authorizing every connected app — see
  [credentials-and-connections.md](credentials-and-connections.md).
- **Self-hosting is not exit-cost-free.** Choosing a self-hosted engine because it's "self-hostable"
  still leaves you inside that project's licence — SUL, AGPL, or otherwise. Self-hosted answers *where
  it runs*; it does not answer *what you're allowed to do with what you built on it*.
- **The recursion worth stating plainly:** if your automation logic *and* your vendor credentials both
  live inside a hosted iPaaS you do not control the infrastructure of, then the thing coordinating
  every other vendor relationship your business has is itself a dependency you cannot deploy,
  redeploy, patch, or recover on your own timeline. If that layer's outage, policy change, or account
  suspension is the incident, `operate`'s usual incident toolkit — rollback, redeploy, restore — is not
  available to you for the automation layer itself.

**Name the interest:** every platform comparison in circulation was written by someone selling one of
the options being compared, including this reference's own sources — read the licence and the exit
cost yourself rather than taking a vendor's or a competitor's framing of either on faith (I15).

## Sequencing the decision

Work in this order rather than picking a tier by feature list first: (1) inventory the irreversible
steps (I3) — if the earliest one is irreversible, resume-capability (I9) may eliminate several
candidates before anything else is weighed; (2) confirm none of the tier's default alerting
assumptions are wrong — assume silent-stop by default everywhere; (3) read the licence text of any
specific engine under consideration, and check it was pushed to recently; (4) price the tier with
[run-cost-table.md](../assets/run-cost-table.md); (5) only then compare connector catalogues and
builder ergonomics — those are real, but they are the least consequential axis on this list.

## Failure modes and handoff

- Choosing a tier on connector-catalogue breadth alone, without checking resume-vs-restart against the
  actual irreversible steps in the flow, is the single most common way this decision goes wrong.
- Calling a project "open source" because a comparison page said so, without reading the licence file,
  is a decision made on someone else's unverified summary — read the text.
- A tier decision with no exit-cost line is a decision made as if the platform will never need to be
  left; state the exit cost even when the answer is "acceptable for now."
- If the tier choice surfaces that the workflow's real requirement is an irreversible-step problem, not
  a platform problem, route to [compensation-and-recovery.md](compensation-and-recovery.md) before
  re-platforming to fix it.
