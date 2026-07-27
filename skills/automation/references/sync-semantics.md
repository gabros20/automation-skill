# Sync Semantics

Purpose: Decide how two systems stay in step over time — directionality, conflict policy, delete
visibility, and the seam between an initial backfill and steady-state incremental sync — and prevent
the sync itself from becoming the incident.

Read when:
- Two systems are kept in sync and records are duplicating, deleted rows are diverging, or a sync is
  visibly looping.
- Choosing whether a sync should be one-way or bidirectional.
- Designing or debugging an incremental cursor/watermark against a vendor API.
- Cutting over from an initial backfill to steady-state incremental polling.

Skip when:
- The question is what triggers the sync (schedule, webhook, poll) rather than what happens once data
  moves → [trigger-design](trigger-design.md).
- The question is provider-redelivery dedup or the completion-check false positive for a single
  inbound path → [integration-reliability](integration-reliability.md).
- The question is diffing against the vendor's authoritative state as a periodic ground-truth pass,
  its cadence, and its window → [reconciliation](reconciliation.md).
- The dataset's semantics, modeling, or warehouse-side shape is the actual question, including when
  the destination is reached via reverse ETL → `data` owns the dataset; this reference owns what
  happens the instant that write lands in an **operational system of record** that humans and other
  processes act on next (see §7, Boundary).
- The idempotency-key primitive itself, or async mechanics inside a system you own → `backend`.

Inputs:
- The two (or more) systems involved and which one, if any, is the source of truth per field.
- Whatever the vendor documents (or fails to document) about a deletion signal, and its retention
  window if one exists.
- The current cursor/watermark design, if a sync already exists.

Produces:
- A stated conflict-resolution policy — not "last-write-wins by default," a decision.
- A delete-detection plan, or an explicit statement that deletes are invisible to this sync and drift
  will go undetected until the next full reconciliation pass.
- A named cutover point between backfill and steady-state incremental, with the gap/duplicate risk at
  that seam addressed.
- A loop-prevention mechanism, if the sync is bidirectional or feeds back toward its own source.
- A cross-check against [trigger-audit-sheet](../assets/trigger-audit-sheet.md) wherever this sync's
  trigger overlaps a webhook or a reconciliation pass on the same resource — the loop in §1 and the
  two-path hazard I4 exists for are the same shape, seen from two different references.

## Contents
- The A→B→A loop
- I5 — deletes are invisible to incremental sync
- `updated_at` is a lie
- Conflict resolution as a stated policy
- Backfill vs. steady-state incremental
- Directionality
- Boundary with `data`

## Procedure

### 1. The A→B→A loop
The classic self-inflicted sync outage: system A writes a record, the sync pushes it to B, B's own
change (or B's own downstream automation) writes it back, the sync reads that as a new change in B and
pushes it back to A — and now the "sync" is the incident, not the systems it connects. This is a
structural property of **any** bidirectional sync, not a bug in one implementation of it.

**The headline finding, and it is the pack's thesis in miniature:** no engine auto-detects or
auto-kills a cross-system A→B→A loop by default. Two vendors' own official docs confirm this
independently, each handing the problem straight back to the user — every vendor documents the same
failure separately, and none names it as a shared, cross-vendor pattern:

- **Workato**'s official docs on *Infinite loops* state the shape by name: loops occur "most commonly
  when the recipe is performing a **bi-directional** sync, such as when there is more than one
  application and data moves from application A to application B and back to A." Its own three
  indicators — "unexpectedly high transaction count," triggering "when there are no new trigger
  events," and "many duplicates of an object" — are **diagnostic, not preventive**: the docs describe
  no automatic stop and place the architecture burden on the user. Workato's own prescribed mitigations
  are trigger filters and a custom "already synced" field on the target object.
- **Zapier**'s official help article *Zap is stuck in a loop* names four distinct shapes: a two-Zap
  loop ("an action in one Zap that triggers another Zap and the second Zap has an action that triggers
  the first"), a single-Zap loop ("an action in a Zap that also triggers that same Zap"), an email
  auto-reply loop, and — the shape most readers will actually hit — a **"New or Updated" trigger
  loop**, where "the Zap updates the same record that triggered it." Zapier's own remedy is manual:
  "Turn off the Zap that is looping right away." Prevention is the same shape as Workato's: unique
  identifier fields plus Filter steps, or Find-or-Create in place of Create.
- **Make** is cleared only as a downgraded source — a community-reported case, not official
  documentation. Make **does** ship configurable safety valves (a max-cycles-per-run cap, a
  consecutive-error limit, a runs-per-minute cap), and a reported case still looped past all three.
  The point survives regardless of the exact configuration reported: those caps bound **one
  scenario's own internal recursion**, not a feedback loop that crosses two systems and two separate
  triggers — which is exactly why a platform's own safety valves are not a substitute for designing
  against this loop directly.
- **n8n's loop behavior is asserted nowhere in this reference, in either direction** — the sole source
  found was an undated third-party blog, which fails provenance and liveness and is excluded on that
  basis. This is a different silence from n8n's DST gap in
  [trigger-design](trigger-design.md) §3: there, n8n's *own* docs are silent on a documented platform
  behavior, which is itself a citable finding. Here, no source — official or otherwise — exists to be
  silent or loud about at all, so silence licenses no claim about n8n's loop behavior one way or the
  other.

Mitigations, in the order they're usually reached for. The first two are vendor-documented practice
(Workato and Zapier both converge on the same shape independently); **the last two are this pack's own
addition — no vendor documents them, label them as ours, not as established practice:**
- **Source-tagging the write** — stamp a field or flag on the record the sync itself writes ("synced
  by automation," Workato's and Zapier's own term), so the sync can recognize its own prior write and
  skip re-processing it.
- **An updated-by filter** — skip records whose last modification was made by the integration's own
  service account/API user, not a human or another process — the Filter-step/unique-identifier
  approach both Workato and Zapier prescribe.
- **A loop counter** *(ours)* — a hop count carried alongside the record; past a small threshold, halt
  rather than keep forwarding.
- **A quiet period** *(ours)* — a short debounce window after the sync's own write, during which a
  change on the same record is assumed to be an echo rather than a new edit.

Whenever this sync's own trigger (a webhook, a poll, or both) shares a resource with a reconciliation
pass, record it on [trigger-audit-sheet](../assets/trigger-audit-sheet.md) — the same overlap that
risks a loop here is exactly what I4 requires a single business-event-derived idempotency key to
collapse.

**A loop is also a quota event, in the vendor's own words:** Zapier's help article makes the connection
directly — "Loops can quickly use up your plan tasks if they are not resolved." An undetected loop
isn't just a data-correctness incident, it's an availability event against the vendor's own quota
(I10) — see [cost-and-quota](cost-and-quota.md) for the blast radius once that quota is exhausted.

### 2. I5 — deletes are invisible to incremental sync
This is the best-verified fact in this reference, and it generalizes further than any single vendor's
documentation states it. A cursor over `updated_at` (or any field scoped to *changed* records) cannot
return a deleted row — deleting a record doesn't touch its timestamp, it removes the row from the
result set entirely, which is indistinguishable from "unchanged, and outside this page." The vendor
landscape, verified 2026-07-27:

- **Salesforce** — `getDeleted()` covers **no more than 15 days**, and a background purge can
  invalidate the window *early*, returning `INVALID_REPLICATION_DATE`. The documented recovery from
  that state is a **full re-sync**, not a resumable cursor. A sync that goes dark on Salesforce for
  more than 15 days has silently lost the ability to reconcile deletes at all and must re-baseline.
- **Stripe** — the good case: deletion is a soft-delete (the object stays retrievable with
  `"deleted": true`), and a `customer.deleted` event fires on the Events API, so an incremental-event
  consumer sees the deletion without needing a separate mechanism.
- **The general-case majority** — plain REST APIs exposing only an `updated_at`/`modified_since`
  cursor carry **no deletion signal at all**. Salesforce and Stripe are the well-resourced minority;
  the long tail of SaaS tools a solo operator actually connects behaves like this by default.

State the principle no source states as a general rule, because none does: **assume your incremental
cursor cannot see deletes unless the vendor names a specific mechanism — and then check its retention
window**, because a named mechanism (Salesforce's) can still expire silently and force you back to a
full re-sync. Where no mechanism exists, deletes are a job for periodic full-set reconciliation
([reconciliation](reconciliation.md)), not incremental polling — the two are not substitutes for each
other, they cover different gaps.

### 3. `updated_at` is a lie
An incremental cursor keyed on `updated_at` is trusting a value that quietly fails in ordinary
operation, not just under an obvious bug:
- **Clock skew** between the source system's application servers and its database, or between the
  source and your own poller's notion of "now."
- **Replica lag** — if the query reads from a read replica running even seconds behind the primary, a
  `WHERE updated_at > last_cursor` query misses rows written in that lag window, and because the
  cursor advances past them regardless, they are **never** picked up on a later poll unless an overlap
  window is built in.
- **Bulk edits that don't touch the timestamp** — a backend migration, an admin console bulk update,
  or an import job can change a row's data without going through the code path that stamps
  `updated_at`, depending entirely on how disciplined the *source* system is about it — something you
  cannot verify from the consuming side.
- **Boundary granularity** — a cursor compared with `>` rather than `>=`, or a timestamp truncated to
  a coarser unit than the source actually writes, silently drops rows that land exactly on the
  boundary.

The mitigation is a **watermark with an overlap window plus dedup**: re-query a small window behind
the last cursor position on every poll (rather than starting exactly where the last poll ended), and
dedup the re-fetched overlap by record ID so the same row processed twice collapses to one effect —
the same idempotency discipline this reference relies on throughout, applied to the cursor itself
rather than to a single event.

### 4. Conflict resolution as a stated policy
Most automations pick last-write-wins **by not deciding** — nobody wrote a policy, so whichever system
happened to write most recently wins, silently, on every record, forever. That is a policy; it is just
an unstated one, and it is wrong exactly as often as the two systems disagree about which one held the
truth.

State one of these explicitly, before the sync ships:
- **Last-write-wins** — acceptable only when you have actually decided timestamp recency is the right
  tie-breaker for this data, not as the default nobody chose.
- **Source-of-truth per field** — field A always comes from system X, field B always from system Y,
  regardless of which was touched more recently. Stronger than LWW whenever the two systems aren't
  peers (one genuinely owns a given field).
- **A manual queue** — for records where an automatic rule is worse than a person deciding; route the
  conflict to a human rather than silently resolving it either way.

Pick one, name it in the artifact, and apply it consistently — an undocumented mix of the three is
worse than any single one of them chosen deliberately.

### 5. Backfill vs. steady-state incremental — two different programs
An initial backfill (bulk, typically paginated, usually tolerant of being interrupted and resumed) and
steady-state incremental polling (cursor-based, running indefinitely) are two different programs, not
one program with a flag. The seam between them is where the actual risk concentrates: records changed
*during* the backfill window, after the backfill's snapshot was taken but before the first incremental
poll's cursor start-point, can fall into a gap neither program covers — or, if the incremental
cursor's start-point is set too conservatively, the same records get processed twice. Name the exact
cutover moment and the cursor value the incremental phase starts from, rather than leaving it implicit
in "backfill finished, now poll."

### 6. Directionality
One-way sync is qualitatively simpler than bidirectional: a one-way sync has no conflict-resolution
question (§4) and no A→B→A loop risk (§1) by construction, because there is only one direction for a
write to travel. Bidirectional sync inherits both problems the moment it's chosen, plus the
loop-prevention mechanism §1 requires. Treat "does this actually need to be bidirectional, or does one
system genuinely own this data" as the first question, not an implementation detail decided after the
fact — every problem in §1 and §4 is conditional on the answer being yes.

### 7. Boundary with `data`
`data` owns the dataset, its semantics, and warehouse-to-warehouse or warehouse-to-BI movement,
including the outbound batch mechanics of a reverse-ETL job reading a governed model. `automation`
owns **the write path into an operational system of record** — a CRM, a support tool, a ledger — that
humans and other processes act on immediately afterward, regardless of whether that write originated
as a warehouse batch or a point-to-point trigger. That write is irreversible in the same sense every
other write this pack covers is irreversible (I3): it can collide with a human's concurrent edit in
the destination's own UI, it can trigger the destination's own automation back toward the source (§1's
loop, unchanged whether the sync is iPaaS-native or reverse-ETL'd), and it needs the same idempotency
and reconciliation discipline as any other write this pack teaches. State this ruling explicitly when
a reverse-ETL job is in scope — do not let "it's a data pipeline" excuse it from §1–§5 above.

## Validation
- [ ] A conflict-resolution policy is named explicitly, not defaulting silently to LWW
- [ ] Deletes are either covered by a named vendor mechanism (with its retention window checked) or
      the artifact states plainly that deletes are invisible and will surface only at the next full
      reconciliation
- [ ] The incremental cursor uses an overlap window and dedups by record ID, not a bare `>` compare on
      `updated_at`
- [ ] If bidirectional, a loop-prevention mechanism (source-tag, updated-by filter, hop counter, or
      quiet period) is actually built in, not assumed to be covered by the platform's own caps
- [ ] The backfill-to-incremental cutover states the exact handoff point and cursor start-value
- [ ] A reverse-ETL write into an operational system of record carries the same idempotency/conflict/
      loop discipline as any other sync target

## Failure modes and handoff
- The question is what triggers the sync, not what happens to the data once it moves →
  [trigger-design](trigger-design.md).
- The question is a periodic ground-truth diff against the vendor's authoritative state, its cadence
  and window → [reconciliation](reconciliation.md).
- The question is the dataset's modeling, warehouse shape, or BI consumption, and the destination is
  not an operational system of record that humans/processes act on next → `data`.
- The question is async mechanics or the idempotency-key primitive inside a system you own →
  `backend`.
