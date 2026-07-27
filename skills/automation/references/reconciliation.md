# Reconciliation against a vendor's authoritative state

Purpose: Design the recurring job that catches what your triggers missed — the diff against a
vendor's own record of truth, run on a schedule, classified, and either healed or escalated. This is
the flagship reference for `automation`: everything else in the pack assumes this loop exists
somewhere, or states plainly that it does not.

Read when:
- Something is quietly wrong and nothing alerted — a charge, a status, a record exists on one side
  and not the other, and you only found out by accident.
- You are designing a new integration and need to decide whether a reconciliation loop is required,
  and if so its cadence, comparison method, and escalation policy.
- You are the only person who will ever look at the exception queue.
- A webhook-only integration has no answer to "what if the webhook never arrived."

Skip when:
- The failure mode is a duplicate or a missed trigger on the *inbound* path, not a drift you'd only
  catch by comparing full state later — → [integration-reliability.md](integration-reliability.md).
- The fix, once a discrepancy is found, involves undoing or compensating a side effect — →
  [compensation-and-recovery.md](compensation-and-recovery.md).
- The question is which event should re-trigger the same logical action twice — →
  [trigger-design.md](trigger-design.md) (I4).
- You need the idempotent-write primitive itself (upsert semantics, transaction isolation) for a
  system you run — that mechanism is `backend`'s; this file only tells you what key to reconcile on.

Inputs: the vendor's list/query API (or export), your own local record of what you believe happened,
and an owner for the exception queue (even if that owner is one person, one hour a week).

Produces: a reconciliation loop specification — comparison method, cadence, classification rule,
auto-heal boundary, and escalation path — plus a filled
[reconciliation-worksheet.md](../assets/reconciliation-worksheet.md).

## Contents

- 1. The wedge, stated plainly
- 2. I1 is the spine: an ack is not evidence
- 3. Cadence is tiered, not uniform
- 4. Compare the ID set before the fields, then classify — never binary
- 5. Auto-heal only on high confidence; alert-first at n=1
- 6. Delivery status and processing status are two fields, not one (I2)
- 7. The idempotent upsert is the safety net that makes backfill safe
- 8. The n=1 minimum viable loop
- 9. The recursion — the escape hatch that leads back into the trap (I6)
- 10. A reconciliation poll is a second delivery path — route the duplicate to trigger-design (I4)

---

## 1. The wedge, stated plainly

This reference is synthesis, not discovery. Fintech owns the *word* "reconciliation" exhaustively —
Modern Treasury frames it as comparing a bank- or vendor-reported Internal Account against a Ledger
Account and resolving the variance; Adyen frames it as matching a settlement report against payout
batches transaction-by-transaction; Stripe frames it as cross-referencing payout and transaction
reports against your own accounting entries. None of these three generalises the practice past money
movement — every framing is ledger-balance-against-external-source-of-truth, full stop.

General integration engineering teaches the identical *mechanism* — poll a provider's API on a
schedule to catch what a webhook missed, diff against local state, backfill — independently and
without ever borrowing the word. Merge.dev's own comparison of webhooks against polling discusses
polling purely as a freshness trade-off and never says "reconciliation" once (name the interest: a
content-marketing piece closing on a demo CTA — the mechanism claim still holds independent of the
pitch). That is two literatures teaching half of the same discipline each, neither aware the other
exists.

Gregor Hohpe's Conversation Patterns — the closest thing integration engineering has to a canon —
names reconciliation exactly once across the whole catalogue, and only in the 2005 IEEE Software
article that preceded it: describing operators who periodically ran reconciliation reports to close
out billing accounts they'd already written off, then moving on without ever developing cadence,
tolerance banding, or a system-of-record framing into a pattern (Gregor Hohpe, "Your Coffee Shop
Doesn't Use Two-Phase Commit," IEEE Software, March/April 2005, pp. 64–66; paraphrased, © 2005 IEEE —
not the CC BY pattern-page material). Twenty years and a full 25-pattern catalogue later, there is
still no reconciliation pattern. He named it and walked away.

Formance's blog describes a five-stage pipeline — normalised ingestion, a tolerance-aware rules
engine, an exception workflow, a source-of-truth ledger, resilient infra — that reads as genuine
mechanics for most of its length; it closes by naming this "how Formance Ledger and Formance
Reconciliation work together." Cite the mechanics; do not repeat the five stages as if they were an
industry standard rather than a vendor's own product shape (named interest: Formance sells
Reconciliation as a managed feature).

The reader wiring a business across vendors they cannot deploy to has to assemble one discipline out
of literatures that were never introduced to each other. That is the whole justification for this
file existing.

## 2. I1 is the spine: an ack is not evidence

**I1 — reconcile against the vendor's authoritative state, never against your own record of what you
told it.** A 200 response, a queued job, a webhook subscription you believe is active — none of these
are evidence that the vendor's side actually holds what you think it holds. A webhook that never
arrived leaves no trace in your logs at all; there is nothing to notice, because nothing failed
*loudly*. The only way to find that gap is to ask the vendor directly, on a schedule, what it
actually has — and compare that answer against what you believe.

This is why reconciliation cannot be replaced by better retry logic or a more reliable message queue.
Retries and dedup protect you against a delivery you know was attempted. Reconciliation is the only
control that catches a delivery that was never attempted, or attempted and silently dropped before it
reached you.

## 3. Cadence is tiered, not uniform

There is no single correct interval — this is not one job, it is three, running at different
altitudes:

- **Recent activity** — frequent, tight-window checks against whatever the vendor just processed,
  catching missed webhooks while they're still cheap to backfill.
- **Daily accounting checks** — a full pass over the prior period, closing out anything the frequent
  pass left in an ambiguous state.
- **Periodic close** — a slower, wider pass (monthly or per accounting period) that is the last
  backstop before numbers get reported anywhere external.

Running only the fastest tier gives you low latency but no backstop against a gap that survives past
its window. Running only the slowest tier means drift sits undetected for a full period. Both are
needed; neither substitutes for the other.

## 4. Compare the ID set before the fields, then classify — never binary

Full-record diffing on every pass is expensive and mostly wasted — most records match. The efficient
order:

1. **ID/count set diff first.** Pull the vendor's current ID set for the window and diff it against
   your local IDs. This is cheap and catches the two failure modes that matter most: something the
   vendor has that you don't (a missed webhook), and something you have that the vendor doesn't
   (a local record with no vendor backing, or a vendor-side delete — see I5, `sync-semantics.md`).
2. **Tolerance-banded comparison second**, only on IDs present in both sets — amount, timing, and
   status fields compared with an explicit tolerance, not exact equality, because timing skew and
   rounding are normal, not drift.
3. **Full-field diff only on suspected drift** — when the tolerance-banded pass flags something, not
   as the default comparison.

**Classify every discrepancy into three buckets, never two:** matched, matched-within-tolerance, or
**exception**. A binary match/no-match forces every timing skew and rounding difference into the same
bucket as a genuinely missing record, which either drowns the exception queue in noise or trains
whoever watches it to stop reading it closely. The three-way split is what makes the queue worth
watching.

## 5. Auto-heal only on high confidence; alert-first at n=1

Auto-resolving a match is safe only when the match rule is tight and the confidence is genuinely
high — a many-to-many rule with a narrow tolerance band, applied to a bucket that has proven reliable
over time. Anything ambiguous routes to a human queue, because auto-healing an unclear break is how
you compound an error silently: the record now matches, the alert never fired, and the underlying
cause is still there for the next run to hit again.

**At n=1 the default flips: alert-first, not auto-heal-first.** Team-scale reconciliation can afford
auto-resolution because a human sits downstream of the exception queue, checking it as part of a job.
A solo operator is often not watching that queue in real time — auto-healing without a human in the
loop removes the only signal that something needed attention at all. Start every reconciliation loop
alerting on every exception; earn auto-heal later, on a rule you have watched hold for a real period,
not on day one.

## 6. Delivery status and processing status are two fields, not one (I2)

**I2 — never let the system's own record of what it did be the only evidence that it did it.** The
practical form of this in a reconciliation loop: track *whether the webhook or poll response arrived*
and *whether you applied it* as two separate fields, not one collapsed "handled" flag. If the two are
merged, a reconciler double-applies work whenever delivery and processing disagree — for example,
when a response arrived but processing failed partway, and the record still reads "handled" because
delivery succeeded.

Logging the raw event and your interpretation of it as two separate facts is what makes a completion
check *falsifiable*. If your only record is "we marked this done," a corrupted or ambiguous retry can
read as confirmation instead of failure — see [integration-reliability.md](integration-reliability.md)
for the practitioner case where exactly this self-terminated a paid sequence having sent nothing. That
same raw-vs-interpreted split is a field on the
[reconciliation worksheet](../assets/reconciliation-worksheet.md); fill it before the loop runs, not
after something goes wrong.

## 7. The idempotent upsert is the safety net that makes backfill safe

Reconciliation exists to backfill what was missed — which means the backfill write must be safe to
run against a record that was *also* already handled by the original webhook or trigger. The
mechanism: an idempotent upsert keyed on the provider's own event or transaction ID, guarded by a
version or timestamp check, so a backfilled record already handled by webhook is a no-op rather than
a second write. Without the version guard, reconciliation itself becomes a duplicate-generator — the
exact failure it exists to catch.

This is where I4 connects directly to this file: the idempotency key must come from the business
event's identity, not from which path delivered it, precisely because reconciliation guarantees the
same event will sometimes arrive twice, by two different mechanisms. See §10.

## 8. The n=1 minimum viable loop

Stripped to the smallest version that still does the job: **one cron job**, calling the provider's
"list since timestamp" endpoint, diffing the returned ID set against local IDs (not a full-field
diff), and **alerting — not auto-healing — on any gap that survives a grace window** past the fastest
tier. If you do choose to auto-apply anything at this scale, the idempotent upsert from §7 is the only
safety net standing between that decision and a duplicate.

This is deliberately smaller than what team-scale reconciliation literature assumes. It assumes no
second independent source of truth beyond the vendor's own report, no separate reviewer to route
exceptions to, and no tolerance-rule library refined over months of observed breaks. Build the
smallest version first; add tiers and tolerance rules only once the smallest version has run long
enough to show you what actually shows up in the exception queue.

## 9. The recursion — the escape hatch that leads back into the trap (I6)

This is the intellectual core of the file, and it is worth sitting with rather than skimming past.

COSO's own framework treats independent reconciliation as the standard **escape hatch** for missing
segregation of duties: *"Where segregation of duties is not practical, management selects and
develops alternative control activities"* (COSO, via Bonadio, Doyle, 2024-10-10) — and reconciliation
is the textbook example of that alternative control.

But Stripe's own guidance on reconciliation states the opposite requirement in the same breath: *"To
minimise the risk of errors and fraud, the person who records transactions should not be the same
person who reconciles accounts."* Reconciliation, as fintech actually practices it, **itself demands
segregation of duties** — a reconciler distinct from the recorder.

Put those two next to each other and the trap is exact: for one person, the standard escape hatch
from missing segregation of duties *is* independent reconciliation — and the standard practice of
reconciliation requires a second person you do not have. The escape hatch leads back into the room
it was supposed to get you out of.

**The resolution, not just the naming of it: independence has to come from the source, not from a
second person (I6).** A solo operator cannot manufacture a second body to record and a different body
to reconcile. What they can do is reconcile against a record they did not write and cannot bias — the
vendor's own authoritative state, produced independently of their own local system regardless of who
operates it. The segregation-of-duties property that matters is architectural, not organisational: the
comparison side of the reconciliation must be something you do not control, not someone you are not.
That is exactly what §2's framing of I1 already requires — reconcile against the vendor's state, never
your own record of what you told it — and it turns out to be the same property that rescues n=1 from
the COSO/Stripe contradiction. The function survives; the second body does not need to.

## 10. A reconciliation poll is a second delivery path — route the duplicate to trigger-design (I4)

Adding a reconciliation loop is not a free safety net. The moment it exists, the same business event
can now reach your system two ways — once by webhook, once by the reconciliation poll's backfill —
which is a second delivery path you did not have before, and therefore a new duplicate class you did
not have before either.

Do not treat this as a reason to skip reconciliation; treat it as a reason the idempotency key must be
derived from the business event's own identity rather than from whichever path delivered it (I4), so
the two paths collapse to one execution instead of two. The trigger-level taxonomy for this — how to
design an idempotency key that survives multiple delivery mechanisms for the same logical event — is
[trigger-design.md](trigger-design.md)'s job, not this file's; this file only names the obligation the
moment you add the second path. Fill the idempotency-key field of the
[reconciliation worksheet](../assets/reconciliation-worksheet.md) with the business-event key, not a
per-path one, before the loop goes live.
