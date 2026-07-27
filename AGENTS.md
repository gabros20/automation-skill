# Agent guide — `automation` (Workflow Automation)

This repository is the released `automation-skill`: an installable agent skill for building business
processes that span systems you do not own. The runtime skill lives under `skills/automation/`; the
repository and Codex plugin use the `-skill` suffix. Read this before editing.

## Ownership boundary (non-negotiable)

`automation` builds processes that span systems, schedules, events and human approvals — reconciliation,
integration reliability, compensation and recovery, credentials and connections, approval and authority,
trigger design, sync semantics, workflow observability, cost and quota, platform selection, workflow
testing, and process capture. The distinguishing property is the substrate: most of the steps belong to
vendors you cannot deploy to, cannot unit-test, and cannot roll back — the API changes with no deploy on
your side, the quota belongs to someone else, and a person clicking "approve" is a node in the graph. It
does **not** own:

- jobs, queues, outbox, saga **inside your own system**, or the idempotency-key primitive itself →
  **backend** (`automation` applies the same discipline across a boundary it doesn't own; it never
  re-teaches the primitive)
- the model's cognition — prompts, agent loop, retrieval, evals, model-level guardrails → **ai**
  (`automation` owns the graph a model's decision drops into, via `surface-agentic.md`, not the model's
  reasoning)
- the warehouse, ETL/ELT, analytical modelling, the governed dataset → **data** (`automation` owns the
  write path into an operational system of record that humans and processes act on next, even when that
  write originates as a reverse-ETL batch)
- deploying the workflow, running the monitoring platform, incident response → **operate**
- independent verification and the ship/claim decision → **quality**
- authoring the business rule, or customer-facing comms → **product** / **marketing** / **sales** /
  **success** (`automation` captures a rule explicitly via `process-capture.md` when none is supplied;
  it never invents one)
- system shape, NFR budgets, threat model → **architecture**
- coordinating agents inside a development session → **orchestrate** (not a lifecycle skill)

`automation` consumes upstream artifacts (a business rule from `product`, a contract from `backend`, an
NFR budget from `architecture`) when they exist, works standalone when they don't, recommends siblings
for work it doesn't own, and never silently invokes them.

## Non-negotiable invariants

1. **Reconcile against the vendor's authoritative state, never against your own record of what you told
   it (I1).** An ack is not evidence. A webhook that never arrived leaves no trace in your logs.
2. **Never let the system's own record of what it did be the only evidence that it did it (I2).** Log
   the raw event and your interpretation of it as two separate facts, so a completion check can be
   falsified against the raw log rather than confirmed by your own prior write.
3. **Compensation is a new forward action with its own side effects, not a rollback (I3).** A refund is
   not an un-charge. Where no compensating action exists, perform the hardest-to-revert action last.
   Compensation may legitimately be a human act.
4. **Derive the idempotency key from the business event's identity, not the trigger mechanism that
   delivered it (I4).** The same event arriving by webhook and by reconciliation poll must collapse to
   one execution.
5. **Assume your incremental cursor cannot see deletes (I5)** unless the vendor names a mechanism — then
   check its retention window.
6. **At n=1, independence comes from the source, the clock, or a pre-committed rule — never from a
   second person who does not exist (I6).** The functions survive; the second body does not.
7. **Credential health is its own monitored resource (I7)**, checked on its own schedule, independent of
   whether any workflow happened to run.
8. **A workflow that stopped is not a workflow that failed (I8).** No engine alerts by default; the
   missing-heartbeat signal is yours to build.
9. **Before any irreversible early step, know whether your engine resumes or restarts (I9).**
   Restart-only plus an irreversible early step is a duplicate generator on every retry.
10. **The quota is the vendor's (I10).** Exhausting it is an availability event you cannot fix by paying
    faster, and its blast radius is every flow on the account.
11. **Retrying into a 429 converts a transient failure into a sustained ban (I11).** Backoff with jitter,
    honour `Retry-After`, budget retries as a fraction of successes.
12. **An agentic step fails by continuing (I12).** It fails loudly only where someone bolted a
    deterministic ceiling onto it — the fix is to reintroduce the property that made deterministic
    automation fail loudly.
13. **Timeout policy is a decision, not a config default (I13).** No engine ships one. Name
    deny / allow / escalate before the gate goes live.
14. **Prefer the API (I14).** Where there is none you have bought a maintenance liability with no
    deprecation notice — a UI-scraping bot consumes no versioned contract, so it gets no version signal.
15. **Date-stamp every volatile vendor fact, and name the interest (I15)** of anyone selling what they
    measure — including when it makes their claim stronger.
16. **The wedge is synthesis, not discovery — state it that way.** Almost nothing in this pack is
    unknown; it is known in five literatures that have never cited each other. Never dress the assembly
    up as an original finding, and never claim novelty for something a cited source (Hohpe, COSO, fintech
    reconciliation practice) already teaches — `SOURCES.md` §4 is the exhaustive list of what genuinely
    is this pack's own judgment.

## Required behavior

1. Run `scripts/check-sync` (and `scripts/lint-skill`) before any release; never replace the generic
   gate with domain-only checks.
2. Keep runtime frontmatter to `name` and `description`. Versions/metadata live in
   `.codex-plugin/plugin.json`, `CHANGELOG.md`, tags, and releases — never in `SKILL.md`.
3. Keep `SKILL.md` the direct router: one primary job × one base surface (+ additive agentic overlay),
   plus the "Not this skill" decline table. References are flat, directly linked, self-describing,
   loaded only when their conditions apply.
4. Every reference begins with `Purpose / Read when / Skip when / Inputs / Produces`; add a
   `## Contents` when it exceeds ~100 lines.
5. Every volatile fact (vendor limit, retry schedule, retention window, price, licence) carries a
   verification date and a re-verify pointer. This domain churns without a deploy on your side — a
   dependency can change with no diff and no audit trail on your end.
6. Keep repository docs, eval fixtures, research, and site assets outside `skills/automation/`.
7. Release through matching plugin version, changelog entry, tag, and GitHub Release; set the GitHub
   About area (family-style description, canonical site alias as homepage, base + domain topics).
8. Attribute Hohpe's *Conversation Patterns* vocabulary correctly: the CC BY grant covers the pattern
   icon, pattern name, and bold problem/solution statements **on each pattern's own page only** — the
   catalogue/index pages carry no grant at all. Cite the specific pattern page. Never let this pack's own
   added reasoning (e.g., the duplicate-avoidance rationale layered onto Quick Acknowledgment) read as if
   it were part of the cited pattern.

Do not mark the repository complete because structural lint passes. Activation, traversal, and output
evaluations must show the skill changes agent behavior usefully.
