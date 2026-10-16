# Process Capture

Purpose: Turn a business rule into a workflow when the reader is both the business owner and the
implementer — capture the rule, name the shape of what you built in a vocabulary a solo builder can
actually use, and decide, honestly, when not to automate it at all.

Read when:
- You are about to automate a process and no upstream ticket, workshop, or documented rule exists —
  you are the source of the rule as well as its builder.
- You need to name the shape of a workflow you already built (branches, parallel paths, a race between
  vendors) so it can be reviewed or handed off.
- You are unsure whether a process should be automated at all.

Skip when:
- The rule already exists in writing, owned by `product`, `marketing`, `sales`, or `success` — read it
  and cite the owner; do not recapture it here. (All four commercial upstreams are shipped skills;
  route to the owner rather than inventing one.)
- The step already has its rule and just failed partway →
  [compensation-and-recovery](compensation-and-recovery.md).
- You need the trigger's technical shape (schedule vs. webhook vs. poll), not the rule it fires →
  [trigger-design](trigger-design.md).
- You are choosing an engine, not capturing a rule → [platform-selection](platform-selection.md).
- A step in the rule needs a human sign-off → capture that it needs one here, then design the gate in
  [approval-and-authority](approval-and-authority.md).

Inputs:
- The rule as it exists today, however informal — a habit, a spreadsheet, a sentence you've said to a
  customer more than once.
- Rough frequency (how often this actually runs) and variability (how many real cases it must cover).

Produces:
- A one-page rule card: trigger statement, ordered steps, a decision table covering every branch, and
  an exceptions list — or an explicit decision not to automate, with the reason recorded.

## Contents
- 1. Capturing the rule when you are both the source and the builder
- 2. The rule card
- 3. A control-flow vocabulary worth having — and the rest, declined on purpose
- 4. When not to automate
- 5. Prefer the API — what you buy when there isn't one (I14)

## Procedure

### 1. Capturing the rule when you are both the source and the builder
Most process-discovery practice assumes an analyst, a workshop, and a room of stakeholders — a
facilitator drawing a rule out of someone else's head. That assumption doesn't survive contact with one
person automating their own business: there is no gap between the person who knows the rule and the
person who has to encode it, so the workshop has nothing to close.

Be explicit about what that rules out, rather than quietly skipping it:
- **Workshop-based discovery** (event storming and its BPM-workshop relatives) is built to close a gap
  between the people who know the questions and the people who know the answers. At n=1 those are the
  same person, and the method has no work left to do.
- **Process mining** discovers rules already running inside deployed systems, from event-log data those
  systems have already accumulated. It cannot capture a rule that hasn't been running yet — the wrong
  tool for a new or newly defined process, not merely the wrong altitude.
- **Decision tables survive.** They ask one person to fill in a table of conditions and actions — no
  facilitator or second reader required — and they make the missing case visible: a blank cell is
  obvious where a missing sentence in prose is not.

### 2. The rule card
Capture every rule as one page with four parts, in order:
1. **Trigger statement** — one sentence, in the vocabulary of §3 ("when a subscription moves from
   `trialing` to `active`…").
2. **Steps in order** — a plain numbered list (the Sequence pattern, §3).
3. **A decision table for every branch point** — one row per real case, including the case you'd rather
   not think about (the customer who downgrades the day they upgraded; the payment that fails on retry
   three). The table's rows double as the automation's test cases — the load-bearing reason to prefer a
   table over prose is that a table's blank cell is visible and prose's missing case is not.
4. **Exceptions** — what happens when a step fails partway. That is not this reference's material; hand
   it to [compensation-and-recovery](compensation-and-recovery.md). If a row instead requires a human
   sign-off before proceeding, hand that row to
   [`assets/approval-policy-card.md`](../assets/approval-policy-card.md) rather than encoding "ask
   someone" as a step with no owner or timeout.

This card is not a BPMN diagram, a swimlane chart, or an event-storming board — all three are built for
a second reader who wasn't in the room. The rule card assumes the reader wrote it.

### 3. A control-flow vocabulary worth having — and the rest, declined on purpose
Naming the shape of a workflow is useful even alone: it lets you check "did I actually build what I
think I built" against a small, stable vocabulary instead of reasoning from scratch every time. The
academic anchor is the 2003 workflow-patterns catalogue (van der Aalst, ter Hofstede, Kiepuszewski,
Barros, "Workflow Patterns," *Distributed and Parallel Databases*, 2003; later collected as the 2016
MIT Press book of the same name). Cite that, not workflowpatterns.com — the site no longer serves a
working page (verified 2026-07-27, re-verify).

Eight patterns are worth having, at the altitude of someone building on top of an engine rather than
building one:
- **Sequence** — steps run in a fixed order.
- **Parallel Split** — one path fans out into several that all run.
- **Exclusive Choice** — exactly one of several paths runs, chosen by a condition.
- **Simple Merge** — the paired close for Exclusive Choice: because the branches never ran in
  parallel, rejoining them needs no synchronization at all.
- **Synchronising Merge** — an OR-join: wait for however many branches actually fired, not a fixed
  count. This is the sharper pick over a plain AND-join for automation specifically, because a common
  shape ("notify via whichever channels the user opted into") doesn't know at design time how many
  branches will be active — that's exactly what this pattern is for.
- **Discriminator** — race several paths (vendors, providers, retries), take the first to finish, and
  cancel the rest. Without a name for this, people reinvent it badly — usually by forgetting to cancel
  the losers, which leaks work.
- **Cancel Region** — a group of steps that must all be aborted together once some condition fires.
- **Multi-Instance** — the same step runs once per item in a set (one send per recipient, one charge
  per invoice); decide up front whether the count is known before the steps start.

**Everything past these eight is declined on purpose, and the decline is the finding, not a silent
omission.** The remaining several dozen control-flow patterns, plus the entire data-, resource-, and
exception-handling-pattern families in the same catalogue, are aimed at people building a workflow
*engine* (Camunda, Flowable, YAWL) — not people composing automations on top of one. The cut is
defensible, not merely convenient: a peer-reviewed critique of this exact catalogue (Egon Börger,
"Approaches to Modeling Business Processes: A Critical Analysis of BPMN, Workflow Patterns and YAWL,"
*Software and Systems Modeling*) argues the frameworks were validated against their own pattern
catalogues rather than a rigorous shared semantics — which means the full enterprise-BPM canon this
pack declines is itself unresolved among its own specialists. Harvesting a small, named,
practically-motivated subset is the more defensible choice, not a lesser one.

### 4. When not to automate
No single source assembles this as a framework; treat it as this pack's own synthesis, not a citation.
Weigh three axes before building anything:
- **Frequency** — how often does this actually run. A rule exercised twice a year rarely earns back
  its build-and-maintenance cost, however clean the logic.
- **Variability** — how many rows of the decision table (§2) are real cases versus hypothetical ones.
  A table that is 90% one `else → escalate to a person` row is a sign the process wasn't ready to
  automate, not a sign the automation is nearly done.
- **Consequence of error** — what breaks, and who notices, when the automation gets it wrong. A
  high-consequence step needs a human approval node
  ([approval-and-authority](approval-and-authority.md)) regardless of how deterministic the rest of the
  flow is.

A fourth check overrides all three: **does the vendor's own agreement forbid automating this
step?** LinkedIn's User Agreement §8.2, verbatim, bars members from using *"bots or other
unauthorized automated methods to access the Services, add or download contacts, send or redirect
messages"* (effective 2025-11-03, verified 2026-10-17). A step like that stays manual whatever the
three axes say — automate the preparation around it, and leave the act itself to a person —
because the penalty lands on the account, and the account's blast radius is every flow that uses it
(I10).

**Run it by hand, then automate the hand run, then schedule it.** Do the process once manually with
the tooling you will automate, capture that run as the rule card, automate it, watch it run on
demand, and only then put it on a trigger. Each stage surfaces a different class of mistake — the
rule, the mapping, the trigger — and skipping straight to the schedule meets all three at once,
unattended. An **imported template** — a community workflow export, a marketplace recipe — skips the
first two stages by construction: treat it as a workflow you did not write, and fill the
[irreversibility inventory](../assets/irreversibility-inventory.md) and
[trigger audit](../assets/trigger-audit-sheet.md) for it before it is switched on.

Two failure modes to name explicitly rather than discover in production: automating a process that was
broken to begin with (automation reliably makes an inefficient process cost more, faster — it does not
fix it), and a maintenance cost that quietly exceeds the manual cost it replaced. The decision table
from §2 makes the second one checkable: a table that keeps growing new rows every quarter is a process
that hadn't stabilized enough to automate yet.

### 5. Prefer the API — what you buy when there isn't one (I14)
Where a vendor exposes an API, use it — a versioned contract that gives you a signal before it breaks.
Where it doesn't, and the only path in is a UI, you have knowingly bought a maintenance liability with
no deprecation notice: a script that drives a page through its DOM/CSS gets no version signal at all,
because it isn't consuming a contract the vendor committed to — it is imitating a person clicking
through a page that owes it nothing. The published critique of exactly this failure mode — MIT Sloan
Management Review, Chris DeBrusk, "Five Robotic Process Automation Risks to Avoid," 2017-10-24 (name
the interest: DeBrusk was an Oliver Wyman partner — a transformation-consulting interest, not an
RPA-vendor one, milder but real; quoted here via Wikipedia's citation of the piece) — names the same
shape independently: this class of automation creates "a more complex maintenance environment" than
the software it automates around, and cannot adapt on its own when the underlying process changes out
from under it. Teach the boundary, not the scraping tools:
knowingly choosing UI automation because no API exists is a legitimate, bounded decision; not noticing
you made that choice is the failure.

## Validation
- The rule card names its owner, and if no upstream owner exists, that absence is written down rather
  than papered over.
- Every branch in the decision table has a row, including the case you'd rather not think about.
- The workflow's shape is named in the §3 vocabulary, or declared out of that vocabulary's range on
  purpose.
- If a UI-driven step was chosen over an API, that choice — and the maintenance liability it buys — is
  written down, not merely implemented.

## Failure modes and handoff
- **The decision table is mostly one `else` row** — the process is not stable enough to automate yet;
  say so rather than shipping a workflow that will need rewriting every quarter.
- **No owner exists for the rule** — do not invent one. Record the gap and route to the nearest
  commercial skill once it exists (`product`, `marketing`, `sales`, `success`).
- Downstream: hand the filled rule card to whichever job builds the flow —
  [reconciliation](reconciliation.md) for a fact-checking loop, [trigger-design](trigger-design.md) for
  what starts it, or [compensation-and-recovery](compensation-and-recovery.md) for what happens when a
  step fails partway.
