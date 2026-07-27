# Surface: Agentic (Additive Overlay)

Purpose: Add the guardrails a base surface needs when a model is a step, or is the trigger. **This
is an overlay. It stacks on top of a base surface — surface-hosted-ipaas,
surface-self-hosted-engine, surface-code-first-durable, or surface-platform-native — and never
replaces one.** Read your base surface first; this file only adds what changes once cognition enters
the graph.

Read when:
- A model decides which tool to call, in what order, or whether to call one at all — not a fixed
  sequence with a model bolted on as one deterministic step.
- A model is the trigger — it initiates the workflow rather than reacting to a fixed condition.

Skip when:
- The model performs a bounded, deterministic task inside one step (classify this, draft this
  summary) and the surrounding graph's control flow, retries, and branching are unaffected by what it
  returns — that is a base-surface workflow with a model-shaped function call in it, not this overlay.
- You need the model's own guardrails — prompts, evals, retrieval quality, the approval gate on *a
  model's own tool call* — that is `ai`'s ground; see the decline row below before assuming this file
  covers it.

Inputs: the base surface already chosen, and an inventory of which steps in the flow are
model-decided rather than fixed.

Produces: a named spend ceiling, step/iteration limit, wall-clock deadline, kill switch, and
blast-radius scope for every agentic step — filled into
[run-cost-table.md](../assets/run-cost-table.md) and
[irreversibility-inventory.md](../assets/irreversibility-inventory.md) — plus an explicit statement
of which parts of the flow are non-deterministic and therefore untestable in the ordinary sense.

## Contents

- [I12: an agentic step fails by continuing](#i12-an-agentic-step-fails-by-continuing)
- [The evidence: three primary artifacts](#the-evidence-three-primary-artifacts)
- [The refined claim](#the-refined-claim)
- [Do not overclaim: bounded agents do fail loudly](#do-not-overclaim-bounded-agents-do-fail-loudly)
- [What's `ai`'s, what's ours](#whats-ais-what-is-ours)
- [Non-determinism as an operational property](#non-determinism-as-an-operational-property)
- [The `ai` decline row — confirm it holds](#the-ai-decline-row-confirm-it-holds)
- [Handoff](#handoff)

## I12: an agentic step fails by continuing

**I12 — an agentic step fails by continuing. It fails loudly only to the extent someone bolted a
deterministic ceiling onto it.** A deterministic step that breaks throws, times out, or dead-letters —
something stops and something is recorded. An unbounded agentic step has no equivalent native
behaviour: absent a configured limit, it keeps calling tools, keeps consuming budget, and keeps
running past the point where a human would already call it broken.

## The evidence: three primary artifacts

Not vendor claims — filed bug reports and a merged fix, which is stronger evidence than any retelling:

- **langgraph #7417** (opened 2026-04-05, Mario Alessandro Napoli, label `external`): *"Long tool
  calls (~180s+) silently re-executed from checkpoint on LangGraph Cloud."* A checkpoint replay
  **silently re-runs a completed side-effecting tool call** — the textbook duplicate, filed as a live
  open bug.
- **microsoft/autogen #7071** (opened 2025-10-07, closed): *"SelectorGroupChat termination
  conditions fail to terminate conversation despite evaluating to True."* The reporter's own logs
  print `"Termination condition evaluated to: True"` — and the stream keeps processing messages
  indefinitely. This is not the agent erroring; it is **the agent continuing after its own stop
  signal fired.**
- **CrewAI PR #6370** (merged 2026-06-27): adds a hard ceiling of **500** on `max_iter` (default
  remains 25) and a **100-hop cap** on flow-router loops, citing **CWE-770** (unbounded resource
  consumption) and **CWE-835** (loop with unreachable exit), explicitly to prevent *"denial-of-wallet
  attacks where a misconfigured config (e.g. `max_iter=10_000_000`) would burn unbounded API
  credits."* The framework's own maintainers naming runaway cost as the failure mode, and fixing it
  with a deterministic ceiling.

## The refined claim

**An agentic step fails by continuing by default. It fails loudly only to the extent someone bolted a
deterministic ceiling onto it — and the mechanism a framework ships to make failure loud again is
itself a deterministic guardrail.** That is the sharp version of I12: the fix for agentic failure is
to reintroduce the property that made non-agentic automation fail loudly in the first place. This
overlay is that reintroduction, scoped to what the base surface was already doing before a model
entered the graph.

## Do not overclaim: bounded agents do fail loudly

Falsify the claim before shipping it: LangGraph's `recursion_limit` and CrewAI's `max_iter` **do**
raise hard, visible errors when configured — `GraphRecursionError`, *"Recursion limit of 20 reached
without hitting a stop condition"* (langgraph #6731, closed 2026-02-20). Bounded agents fail loudly.
The amendment that matters is narrower and more important: **the bound is a human decision, not
native behaviour.** Left unbounded, the failure mode is cost and time with no system-native error at
all — CrewAI **#6414** (open, 2026-07-01), a feature request, states the unbounded case plainly:
*"these loops run indefinitely, burning thousands of dollars in LLM API credits before the user
manually kills the process or hits a blind max_iter limit."*

## What's `ai`'s, what is ours

`ai` owns the model's cognition: prompts, retrieval, evals, and the approval gate on *a model's own
tool call*. Route those there — this overlay does not re-teach them.

**We own the deterministic envelope around the step**, regardless of what the model inside it
decides:

- **Spend ceiling** — a hard, physical cap, not a request to the model to behave. The pattern (budget
  enforced by the credential itself, not by agent self-restraint) is real independent of any vendor:
  an Ask HN thread on monitoring agents in production (2026-03-08) describes pre-funded API keys with
  hard spend limits — *"you can hand one to an agent and it physically can't exceed the budget you
  set."*
- **Step/iteration ceiling** — CrewAI #6370 above, CWE-classified, the most rigorously labelled
  guardrail found in this evidence set.
- **Wall-clock deadline and loop/repeat detection** — a hard stop independent of whether the model
  thinks it is making progress.
- **Blast-radius scoping** — which systems the agent may write to, decided by construction, not by
  instruction. The same Ask HN thread names the pattern directly: *"llm does not act on production...
  clone your customer data and run everything blank."* The sharpest real case for why this is ours and
  not a prompt: the **Replit incident** (2025-07; reported by Business Insider; discussed on HN,
  179 pts/160 comments) — an agent deleted a production database **during an explicit code freeze**.
  The failure was not the model saying something wrong. It was the agent holding write access it
  should never have been scoped to hold. Idempotency keys, dry-run scopes, and staging clones are
  what prevent this — not a stronger instruction.
- **Kill switch** — a mechanism to stop the run from outside it, independent of the agent's own
  loop-exit logic.

Fill spend ceiling and step limit into [run-cost-table.md](../assets/run-cost-table.md); fill
blast-radius scope into [irreversibility-inventory.md](../assets/irreversibility-inventory.md)
against every system the agent can write to, not just the one it was asked to.

## Non-determinism as an operational property

The same trigger can produce a different sequence of actions on two different runs — that is the
point of an agentic step, not a bug in it. But it is also an operational cost, not a free variable:
it breaks replay, it breaks testing, and it breaks the very idea of a "re-run" that the rest of this
skill leans on. An open LangGraph discussion (`#7855`) names the concrete costs of leaving a workflow
non-deterministic once its plan is actually known, verbatim: *"unnecessary model calls; harder
replay/debugging; more variance between runs; less clear failure boundaries; more expensive
execution; more complicated testing."* Nobody teaches this as a discipline yet — it is one
practitioner's issue-tracker post, not a canon — but the argument (selectively compile stable agent
paths back into deterministic subflows once the plan is known) is sound on its own terms.

Two direct consequences for this skill: **testing** — [workflow-testing](workflow-testing.md)'s
canary and first-then-bulk gates are what you have left when a step's own behaviour can't be
fixture-replayed run to run; and **reconciliation** — if the agent's chosen action varies, your own
log of "what the agent decided to do" is not a reliable record of what happened (I2), which makes
diffing against the vendor's authoritative state (I1, see [reconciliation](reconciliation.md)) the
only way to know, rather than one of several ways.

## The `ai` decline row — confirm it holds

The boundary holds: **model-in-a-step is not the same claim as model-driven.** A model classifying an
input inside one deterministic step is `ai`'s cognition running inside our graph; it is not this
overlay. But one real-practice case shows exactly where the two get colocated in code, and it's worth
naming so the boundary doesn't look fictional the first time you meet it: **langgraph PR #8167**,
*"SHACKLE pre-execution guard node for agent tool calls"* (fixes #6731; auto-closed unmerged by a bot
for a process/assignment reason, not rejected on technical merit — report it as a proposal, not a
shipped feature) — proposes a single guard node handling spend budget remaining, repeat-call/loop
detection, error-signal amplification, wall-clock timeout, **and** HITL escalation for high-risk
tools, all in one interception point immediately before a tool call fires. In real agent code, the
envelope guardrails this overlay owns and the approval gate `ai` owns are frequently the same node,
because they trigger at the same choke point operationally. That does not break the decline row — the
row is about **authorship of the coordination**, not about whether the mechanisms live in the same
function. If you find SHACKLE-shaped code, that is one node with two authors' concerns in it, not
evidence the boundary is fictional.

## Handoff

Record which base surface this overlay sits on, the spend/step/deadline ceilings actually configured,
and the blast-radius scope in [handoff.yaml](../assets/handoff.yaml) — an agentic step with no ceiling
recorded is not a completed handoff, it's an unbounded one. See [handoff](handoff.md).
