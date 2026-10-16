# Changelog

All notable changes to **automation** are documented here.

The release procedure synchronizes `.codex-plugin/plugin.json`, this changelog, git tag
`v<version>`, and the matching GitHub Release. Runtime `SKILL.md` contains no version metadata.

## [Unreleased]

### Added

- **Practitioner fold — scheduled agent jobs, durable-engine mechanics, and lying statuses.** New
  material folded into the existing references, every vendor fact re-verified at its primary source
  on 2026-10-17 and dated: `surface-code-first-durable` closes its Trigger.dev gap (a retry restarts
  the task and reuses only cached subtasks; waitpoint tokens default to no timeout), adds DBOS as the
  database-as-journal family, and gains "Code changes against open runs" (Temporal determinism and
  versioning, memoized output surviving a logic change, model calls in a step, claim check for large
  payloads); `surface-agentic` gains the checkpointer-is-not-an-engine point (vendor interest
  named), a deterministic gate before the model, three blast-radius refinements, graduated autonomy,
  provenance on model-written fields, and "Scheduled agent runs" (fresh session, pin the model per
  job); `approval-and-authority` gains draft-and-queue as the n=1 maker-checker for agent-proposed
  actions and the rule-vs-bulk line; `trigger-design` gains overlap policy (Kubernetes
  `concurrencyPolicy`) and "One trigger, one consumer"; `workflow-observability` gains "running" and
  "completed" as statuses that lie, and the quiet monitor that needs its own heartbeat;
  `platform-selection` gains the maintainer and worst-failure criteria and side-effect-free parallel
  runs; `process-capture` gains vendor terms that forbid automation and the hand-run-first rollout;
  `cost-and-quota` gains billing units as a shape decision, the shared unauthenticated pool, and
  pause-at-cap; `workflow-testing` gains opt-in live-vendor tests and the dry run as a cost forecast.
  SOURCES lists DBOS and Hatchet (MIT) and the new own-judgment items. Three eval cases added.

## [0.1.2] — 2026-07-27

### Changed

- **Repositioned the storefront — README, docs/usage.md, .codex-plugin/plugin.json.** A reader who
  read only the README and the site could not tell this was the skill for building workflow
  automations (n8n/Zapier/Make/Temporal/cron). Three faults, all in prose order, none in the pack
  itself: the README opened with the `backend` boundary argument (relevant only to the question "why
  isn't this `backend`?"), it led with the term "reconciliation" before the plain question it answers,
  and the tool names were buried inside the surfaces table where a scanning reader never reached them.
  The opening now states the subject first (cross-system and human-in-the-loop processes), names the
  four platform tiers once as scope, and states the two defining properties — a step may belong to a
  vendor you cannot deploy to, a step may be a person — as the rationale for the through-line rather
  than the headline. The `backend`-boundary argument and the n=1-reader point moved out of the lead into
  "Four things this pack does differently," where the reconciliation paragraph now opens with "did what
  you think happened actually happen?" before naming the term. `docs/usage.md`'s "Mission and boundary"
  section was reordered to match. No claim, number, or citation changed; reconciliation remains the
  flagship.

## [0.1.1] — 2026-07-27

### Fixed

- **Router sent test-writing to `quality`, which declines it.** The frontmatter description read
  "or tests (→ quality)"; `quality`'s own description says "Not for writing tests (→ frontend,
  backend, data, ai)". A user following the shorthand hit a dead end. The description now routes
  tests to `backend`, and "Not this skill" gains an explicit row naming the owning build skill and
  stating that `automation`'s workflow-testing covers only workflows crossing vendors you cannot
  deploy to. Found by smoke test.
- **Routing stalled when no platform was named.** Step 1 demanded one base surface with no guidance
  for requests that name none (an approval-policy question, for instance). It now says to proceed on
  the job alone or assume the default surface and state the assumption.

## [0.1.0] — 2026-07-27

### Added
- Initial release: faceted-router `automation` skill — 12 primary jobs × 4 base surfaces (agentic as
  additive overlay) + handoff, 18 references, 7 assets.
- Flagship reference: reconciliation — a load-bearing "reconcile against the vendor's authoritative
  state, never your own record of what you told it" spine (I1), tiered cadence (recent activity /
  daily accounting / periodic close), ID-set diff before field diff, a matched / matched-within-
  tolerance / exception classification, and the COSO/Stripe recursion resolved: at n=1, independence
  comes from the source, the clock, or a pre-committed rule, never from a second person who does not
  exist (I6).
- Universal invariants (I1–I15): reconcile against the vendor, never your own record; never let the
  system's own record of what it did be the only evidence that it did it; compensation is a forward
  action, not a rollback; derive the idempotency key from the business event, not the delivery
  mechanism; assume the incremental cursor cannot see deletes unless the vendor names a mechanism;
  independence at n=1 comes from the source, the clock, or a pre-committed rule; credential health is
  its own monitored resource; a workflow that stopped is not a workflow that failed; know whether the
  engine resumes or restarts before any irreversible early step; the quota is the vendor's; retrying
  into a 429 converts a transient failure into a sustained ban; an agentic step fails by continuing;
  timeout policy is a decision, not a config default; prefer the API; date-stamp every volatile vendor
  fact and name the interest.
- **The pack's deliberate framing of its own originality**: the wedge is synthesis, not discovery.
  Almost nothing in this pack is unknown — it is known in five literatures that have never cited each
  other (distributed systems, Hohpe's conversation patterns, fintech reconciliation, enterprise GRC,
  the 2026 agentic wave), and the pack states this plainly in `SOURCES.md` rather than dressing up an
  assembly as a discovery. Where it does add something genuinely new — the n=1 recursion's resolution,
  the credential fleet as a unit of management, the loop counter and quiet/debounce window, trigger
  idempotency across two delivery paths — `SOURCES.md` §4 names it explicitly as this pack's own
  judgment.
- Hohpe's *Conversation Patterns* vocabulary used and credited throughout, with the attribution trap
  named explicitly where the pack's own reasoning goes further than the cited pattern: Quick
  Acknowledgment names the ack-fast shape, but the duplicate-avoidance reasoning is this pack's
  addition, not Hohpe's; Compensating Action names the hardest-to-revert-last rule; Renewal Reminder is
  adjacent to, not identical with, this pack's requestor-side pre-expiry credential refresh.
- Value-adds no standalone iPaaS or integration-engineering source ships: the credential fleet as a
  unit of management across vendors that don't coordinate with each other
  (`credentials-and-connections.md`); the loop counter and quiet/debounce window as A→B→A sync-loop
  mitigations no vendor documents (`sync-semantics.md`); trigger idempotency across two delivery paths,
  naming that a reconciliation poll itself creates a second path for the same business event
  (`trigger-design.md`, `reconciliation.md`); a four-clause licensing rule verified by reading file
  bytes and per-pattern-page CC grants rather than trusting a site-wide licence claim.
- Behavioral eval suites: activation, traversal, output, compression-ablation.
- Research corpora + build-gate synthesis in `research/` (11 stage-2 workers + 5 stage-1 workers,
  date-stamped 2026-07-27).

[0.1.0]: https://github.com/gabros20/automation-skill/releases/tag/v0.1.0
