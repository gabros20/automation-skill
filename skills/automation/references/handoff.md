# Handoff

Purpose: Decide what `automation` consumes from upstream, what it hands to `operate` and `quality`,
and what the [assets/handoff.yaml](../assets/handoff.yaml) companion carries beyond the family shape
— not verification technique, and not the ship gate itself.

Read when:
- Downstream work is expected: `operate` will deploy and watch the workflow, or `quality` will
  independently verify the reconciliation loop and the irreversible-step claims.
- Upstream artifacts exist (a business rule, a contract, an NFR budget) and must be consumed without
  silently overriding them.
- You are filling or checking `assets/handoff.yaml` itself.

Skip when:
- The request is standalone with no downstream consumer in view ("wire this webhook to that Slack
  channel", "fix this sync loop") — build the workflow and stop; an unread `handoff.yaml` is clutter.
- You need a job's own procedure, not the envelope — the twelve job references in
  [SKILL.md](../SKILL.md) own the actual decisions this file only carries forward.
- No upstream rule exists and none is being produced right now — read
  [process-capture](process-capture.md) on capturing it, or stating explicitly that nobody upstream
  supplied one.

Inputs: the business rule and its owner (`product`, or state its absence), any contract or NFR
budget `backend`/`architecture` already produced, and everything decided while building the
workflow — the irreversible steps, the idempotency key, the reconciliation loop, credential
expiries, and any human-gate timeout policy.

Produces: a filled [assets/handoff.yaml](../assets/handoff.yaml) beside the workflow artifacts —
never a second copy of its schema written into prose here.

## Contents

- [What this skill consumes](#what-this-skill-consumes)
- [What this skill emits, and to whom](#what-this-skill-emits-and-to-whom)
- [The asset is the single source of truth](#the-asset-is-the-single-source-of-truth)
- [What automation adds beyond the family shape](#what-automation-adds-beyond-the-family-shape)
- [The shared evidence vocabulary](#the-shared-evidence-vocabulary)
- [Running standalone](#running-standalone)
- [Validation](#validation)
- [Failure modes](#failure-modes)

## What this skill consumes

| From | Consumes | If absent |
|---|---|---|
| `product` (or whoever owns the business rule) | The rule this workflow implements | Do not invent one — state explicitly that no upstream rule was supplied, per [process-capture](process-capture.md) |
| `backend` | A contract or API shape the workflow calls into, when the workflow writes into a system `backend` owns | Treat the write path as unverified at the contract layer; say so |
| `architecture` | NFR budgets or a threat model, when this run is inside a larger pipeline | Verify against the risk model in this skill's jobs alone; do not fabricate a budget |

Consuming an upstream artifact means using it without silently overriding it — a supplied business
rule is a constraint this skill implements, not a starting point it is free to revise. A conflict
between the supplied rule and what the vendor actually does is a finding to report (`unresolved`,
`defects`), not a discrepancy to resolve unilaterally.

## What this skill emits, and to whom

`automation` sits at the Build stage, spanning vendor boundaries. It hands two distinct things to two
distinct consumers:

- **To `operate`:** the deployed workflow's process (worker, function, scheduled job) to run and
  watch, the missing-heartbeat gap this skill deliberately leaves unfilled by default (I8), and the
  credential expiries that need their own monitored schedule (I7).
- **To `quality`:** every claim this skill made about its own reliability — that a step is
  idempotent, that the reconciliation loop actually catches drift, that a human gate's timeout policy
  is enforced — as something to independently verify, not to re-run and call independent.

Both consumers read `assets/handoff.yaml`; neither is required to act on it, and both must tolerate
any field but `objective` being empty.

## The asset is the single source of truth

`assets/handoff.yaml` **is** the schema. This file explains what the fields mean and what automation
specifically contributes to the family shape; it does not contain a second, inline copy of the YAML.
If this document and the asset ever disagree, the asset wins — update the asset, then fix this file's
prose to match, never the reverse. (A prior build in this family shipped a reference and its asset
with two incompatible schemas; the fix is structural, not a discipline to remember each time — there
is only one copy to keep current.)

## What automation adds beyond the family shape

`handoff_version`, `skill`, `status`, `objective`, `surface`, `inputs_used`, `artifacts_created`,
`residual_risks`, `not_verified`, `defects`, `volatile_facts`, `unresolved`, and `recommended_next`
follow the same shape as `operate`'s and `quality`'s handoffs. Six blocks are automation-specific,
required whenever the corresponding job produced a real answer — an empty block is a silent omission,
not a shorter handoff:

- **`irreversible_steps`** — every step that sends, charges, writes to a system of record, or
  contacts a person, each with its order position, its compensating action (or "none — human act
  required," per I3), and whether the engine resumes past it or restarts and repeats it (I9).
- **`idempotency`** — the key derived from the business event's identity, its dedup window, and
  which delivery paths (webhook, poll) must collapse into it (I4).
- **`reconciliation_loop`** — what is compared, against the vendor's authoritative state, on what
  cadence and window, and whether a discrepancy alerts or auto-heals (I1). `exists: no` is a valid,
  required answer when there is no loop — leaving the block blank is not the same statement.
  Consumers must not read an empty block as "nothing to reconcile."
  See [reconciliation](reconciliation.md).
- **`credentials`** — per vendor, expiry, refresh mechanism, and how health is checked on its own
  schedule, independent of whether a workflow happened to run (I7). See
  [credentials-and-connections](credentials-and-connections.md).
- **`human_gates`** — approvers (never the requester), the timeout, and the named on-timeout
  decision (deny / allow / escalate), stated before the gate went live, not discovered at 3am (I13).
  See [approval-and-authority](approval-and-authority.md).
- **`evidence`** — see below.

## The shared evidence vocabulary

`evidence_state` uses the same four values as `quality`'s `evidence` ledger and `operate`'s
`rollout` ledger — `observed | inferred | not_tested | blocked` — under the same field name, so a
downstream consumer parses one vocabulary across the whole family rather than three dialects of it.
For `automation`, this ledger answers a narrower question than `quality`'s: not "did the product
pass," but "was this specific reliability claim (idempotent under retry, reconciles correctly, credential
refresh actually fires pre-expiry) checked against the live vendor, or only assumed from a doc." Most
of this domain's claims will legitimately be `inferred` — few vendors offer a test mode
(see [workflow-testing](workflow-testing.md)) — and that is a fact to report, not a gap to paper
over with `observed`.

## Running standalone

When no upstream business rule, contract, or NFR budget was supplied, say so explicitly in
`inputs_used` or leave it empty and state the absence in `objective`'s surrounding report — do not
infer a rule that was never stated. A fabricated business rule is worse than none: it launders an
assumption into the vocabulary of a supplied constraint, exactly the silent-omission failure this
skill's artifact contract exists to prevent elsewhere.

## Validation

Before emitting: `objective` is one sentence and non-empty; every `irreversible_steps` row has a
`resume_or_restart` answer, not a blank; `reconciliation_loop.exists` is `yes` or `no`, never
implied; every `human_gates` row names an `on_timeout` decision; every `credentials` row has a
`health_check` independent of workflow execution; every `unresolved` item has an owner;
`recommended_next` names an actual sibling skill (typically `operate` or `quality`), not a vague call
for more work.

## Failure modes

- **A second inline YAML in this file** — forbidden; it is exactly the drift that produced a prior
  BLOCKER in this family. Edit the asset, then this prose, never introduce a parallel schema.
- **An empty `reconciliation_loop` block read as "reconciliation not needed"** — always state
  `exists: no` explicitly when there is none.
- **`evidence_state: observed` for a claim never checked against the live vendor** — most SaaS
  webhook providers have no test mode; call it `inferred` and say so.
- **A `human_gates` row with no `on_timeout`** — no engine ships one; the gate is not complete
  without it (I13).
- **An `irreversible_steps` row with no `resume_or_restart` answer** — this is the single highest-
  leverage field in the whole envelope; a blank here means the duplicate-side-effect question was
  never actually checked.
- **Handing `quality` the same canary run automation already trusted and calling that independent
  verification** — `quality` re-derives its own verification against the reconciliation loop and the
  idempotency claims; it does not simply accept automation's own evidence rows at face value.
