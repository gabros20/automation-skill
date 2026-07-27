# Reconciliation Worksheet

Fill this out completely **before** the loop runs its first cycle — not after an exception queue has
already gone unread for a month. A comparison method or tolerance chosen after you've seen a few
breaks is not a control, it stops being independent of the data it's supposed to be judging. Source:
[`references/reconciliation.md`](../references/reconciliation.md).

**How to fill a new card:** name the vendor's authoritative source first — the exact endpoint or
report you compare against, not "the vendor's dashboard" in general. Then fix the cadence, the
comparison method, and the classification thresholds before the loop is live. The hard judgment is the
independence source (bottom row): at n=1 there is no second person to name, and writing "TBD" there is
how a reconciliation loop quietly becomes reconciliation-in-name-only (§9 of the reference — the
recursion).

## Worked example

| Field | Filled |
|---|---|
| Job / integration | Stripe charges vs. internal order records |
| Vendor's authoritative source | Stripe's list-events / list-charges API, not a cached local copy |
| Cadence (tiered) | frequent pass for same-day activity; daily pass closing out the prior day; periodic pass before any external report is generated |
| Compare method | ID-set diff first (Stripe charge IDs vs local order IDs); tolerance-banded amount/status match second, on IDs present in both sets; full-field diff only if the tolerance pass flags something |
| Classification thresholds | matched (exact) / matched-within-tolerance (amount within rounding, timestamp within the processing window) / **exception** — anything else |
| Auto-heal vs alert | alert-first for every exception; auto-heal reserved for the matched-within-tolerance bucket only, and only after that rule has held clean for a real observation period |
| Delivery status field | did a webhook or poll response for this charge ID arrive at all (yes/no, with timestamp) |
| Processing status field | did we apply it to the order record (yes/no, with timestamp) — kept separate from delivery status, never collapsed into one flag |
| Idempotency key | the vendor's event/charge ID — the business event's own identity, not "arrived via webhook" vs "arrived via reconciliation poll" |
| Independence source (I6) | the vendor's API response itself — not a second person; nobody who recorded the order also reconciles it, because the comparison side is the vendor's own state, not a colleague's |
| Escalation path | exception queue reviewed by the one person running this, on a fixed schedule, not "whenever I remember" |

## Blank worksheet

| Field | Filled |
|---|---|
| Job / integration | |
| Vendor's authoritative source | |
| Cadence (tiered) | |
| Compare method | |
| Classification thresholds (matched / within-tolerance / exception) | |
| Auto-heal vs alert (default: alert-first at n=1) | |
| Delivery status field | |
| Processing status field | |
| Idempotency key (business event, not delivery path) | |
| Independence source (I6) | |
| Escalation path | |

Adding this loop creates a second delivery path for every event it backfills — the same event can now
arrive by webhook and by reconciliation poll. If the idempotency key above is not derived from the
business event's own identity, this loop is a new duplicate class, not just a safety net
(`reconciliation.md` §10; route the trigger-level fix to `trigger-design.md`, I4).

**Self-audit:** if the independence-source row names a colleague you don't actually have, or is blank,
stop before shipping the loop — that is the recursion in `reconciliation.md` §9 showing up in your own
worksheet, not a formatting gap.
