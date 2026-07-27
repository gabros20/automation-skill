# Integration reliability — delivery semantics on the inbound side

Purpose: Handle what arrives at your endpoint from a vendor you don't control — at-least-once
delivery, no ordering guarantee, the trap where acknowledging slowly turns a success into a duplicate,
and the specific way a completion check can lie to itself.

Read when:
- You are writing or reviewing a webhook receiver, and need to know what the vendor's delivery
  contract does and does not promise.
- Something fired twice, or fired out of order, and you need the general mechanism before you debug
  the specific vendor.
- A completion check ("have we already done this?") needs to be trustworthy, not just present.

Skip when:
- The gap you're catching is one that never arrived at all, discovered only by comparing against the
  vendor's full state later — that is reconciliation's job, not a delivery-semantics job — →
  [reconciliation.md](reconciliation.md), the flagship.
- The question is what to do once you know a step already had a side effect and must be undone or
  compensated — → [compensation-and-recovery.md](compensation-and-recovery.md).
- You need the idempotency-key storage mechanism itself (the primitive: a dedup table, a unique
  constraint, TTL storage) for a system you run — that belongs to `backend`; this file only tells you
  what key to derive it from and why the check can lie.
- The failure is a trigger firing on conditions broader than intended — → [trigger-design.md](trigger-design.md).

Inputs: a vendor's webhook or event-delivery contract (whatever it documents about retries, ordering,
and signing) and your handler's current completion-check logic.

Produces: a delivery-semantics checklist for the handler — ack timing, signature verification,
dedup key, and a completion check that can be falsified rather than merely trusted.

## Contents

- 1. At-least-once is the norm; ordering is not guaranteed
- 2. Quick Acknowledgment — Hohpe's name and shape; the duplicate reasoning is ours
- 3. The ack-timeout duplicate trap
- 4. Signature verification: the raw body, and the replay dimension
- 5. Delivery IDs as dedup keys — and the two-identifier trap
- 6. Manual replay is a designed feature, not a workaround
- 7. The completion-check false positive (I2)
- 8. Per-vendor delivery guarantees — the shape differs, look it up per vendor

---

## 1. At-least-once is the norm; ordering is not guaranteed

Treat every inbound delivery as **at-least-once, never exactly-once**, and treat **ordering as
unguaranteed** even when a vendor's events look like they should arrive in a natural sequence
(created, then updated, then completed). A vendor that fires related events off internal systems
running at different speeds will sometimes deliver them out of the order they logically occurred in.
A handler that assumes "created always arrives before updated" will misprocess the events that don't.

The design consequence is the same one `backend` already teaches for at-least-once delivery inside
your own system — dedup by the event's own identity, don't assume sequence — applied here to a
boundary you don't control and can't fix by changing your own code.

## 2. Quick Acknowledgment — Hohpe's name and shape; the duplicate reasoning is ours

The ack-fast-then-process-async pattern already has a name, and it predates most of the vendors that
now enforce it structurally. Gregor Hohpe's Conversation Patterns collection names it **Quick
Acknowledgment** — verbatim, problem: *"How can a client be sure the service accepted a request, even
if processing the request takes a long time?"* Solution: *"The service provider sends Quick
Acknowledgment message shortly after receiving the request, followed by the operation results later."*
(Gregor Hohpe, Enterprise Integration Patterns — Conversation Patterns,
enterpriseintegrationpatterns.com/patterns/conversation/QuickAck.html, © 2003, 2023, CC BY 4.0 —
problem/solution statements only; everything else on the site is paraphrase-only.) Use his name; do not
invent a term for something the field already named.

**The role mapping needs stating explicitly, because it inverts on first read.** Hohpe's pattern is
written from the *provider's* side: a service accepts a request from a client and acks it before the
slow work finishes. In a webhook relationship, the vendor is the one issuing the request — it is the
Hohpe-sense *client*, waiting to know its delivery was accepted. **Your receiving endpoint is the
Hohpe-sense *provider*** — the webhook consumer occupies the provider role, not the client role, even
though "consumer" sounds passive. State this mapping up front or a reader who already knows the
pattern will read your handler as having the roles backwards.

**What Hohpe's pattern does not say, and what is genuinely ours to claim:** the pattern's own text
never mentions duplicates or retries — its scope is "ack first, do the time-consuming work after,"
full stop. It does not argue "ack fast *or the vendor will redeliver and you will get a duplicate*."
That causal link — slow acknowledgment causes duplicate side effects, because the sender's own retry
logic treats a timeout as a failure — is this pack's addition, not Hohpe's. Credit him for the shape
and the name; the duplicate-avoidance reasoning in §3 is ours to own, and misattributing it to him
would be exactly the kind of error I15 warns against.

The solution shape is the one every serious webhook sender now leaves you no choice about: acknowledge
receipt immediately, enqueue the work, process it out of band, and treat any downstream call — a
database write, a third-party API request — as something that must never sit in the request/response
path. Tight response-time budgets on the sending side are exactly what force this; a handler that does
real work synchronously before returning is racing a clock it did not set.

## 3. The ack-timeout duplicate trap

Crossing a vendor's acknowledgment deadline is treated by most senders the same way a 5xx or a network
failure is treated — as a delivery failure, triggering the automatic retry track. If your handler was
actually still working and later succeeded, the vendor has no way to know that; it resends. **A slow
success becomes a duplicate**, not because anything failed, but because success arrived after the
window the sender was willing to wait.

Where a sender does not retry automatically at all, this does not make you safer — it moves the same
trap to a different trigger. The delivery is simply logged as failed and never automatically revisited;
the duplicate risk shifts to whoever later looks at that failure list and manually replays it, without
knowing your out-of-band handler already completed the work asynchronously. Same trap, human-triggered
instead of vendor-triggered. Either way, the fix is the same: acknowledge fast enough to never cross the
deadline, and make the eventual processing idempotent regardless, because you cannot fully control
either trigger.

## 4. Signature verification: the raw body, and the replay dimension

Verify a webhook's signature over the **exact raw request body bytes**, not a body your framework has
already parsed and reserialised. Popular web frameworks that parse JSON before your handler sees it —
reordering keys, adjusting whitespace, changing encoding — silently break an HMAC computed over the
original bytes, because the signature was computed over bytes that no longer exist by the time you
verify. This is a framework-integration footgun independent of which vendor sends the payload; check
that your route sees the body before any body-parsing middleware touches it.

Signature verification alone only proves **authenticity** — that the payload came from the vendor,
unmodified. It says nothing about **freshness**. A signature check with no timestamp component, or a
tolerance set to disable the recency check entirely, leaves a replay window open indefinitely: anyone
who captures one validly-signed payload (an insecurely stored log, a leaked test fixture) can resend it
and have it verify as authentic. Treat freshness as a second, separate check from authenticity, not a
detail folded into "verify the signature."

## 5. Delivery IDs as dedup keys — and the two-identifier trap

Every reliable sender gives you an identifier to dedup on. The trap worth naming explicitly: some
vendors expose **two** distinct identifiers — one scoped to the individual delivery attempt, and a
separate one correlating multiple deliveries that all stem from one underlying action. Conflating
them is a real bug class: deduping on the per-attempt identifier alone will treat two related
deliveries of the same underlying event as unrelated, while deduping on the correlating identifier
alone will collapse legitimately distinct actions into one. Read which identifier your vendor scopes
to which level before choosing your dedup key, and prefer the identifier scoped to the *business
event*, not the transport attempt — the same principle I4 states for reconciliation's own idempotency
key (`reconciliation.md` §7, §10): derive the key from what happened, not from how it was delivered.

## 6. Manual replay is a designed feature, not a workaround

Treat manual replay of a past delivery as something that **will** happen, not an edge case: most
serious webhook senders ship a designed, supported replay action (a dashboard button, a CLI command),
scoped to a bounded lookback window that is frequently *longer* than the automatic retry budget. A
sender that retries automatically for a short window but allows manual replay for a much longer one
means your idempotency-key storage has to outlive the longer of the two, not just the automatic retry
period — sizing dedup storage against retries alone silently exposes you to a duplicate the moment
someone (a support engineer, a developer investigating a past failure) presses replay outside that
window. Some senders also explicitly warn that a manual resend does not suppress the automatic retry
track, meaning both can independently deliver the same event — one more reason the dedup key has to be
authoritative regardless of which path delivered it.

## 7. The completion-check false positive (I2)

This is the sharpest failure mode this file teaches, and it inverts the direction most engineers
guard against. The usual worry is a completion check missing a duplicate. The one that actually
burned a real business: a retry corrupted the event log, and the workflow's own "have we already done
this?" check read that corruption as **confirmation of completion** — and self-terminated a paid
sequence having sent nothing at all. Verbatim, from the practitioner who caught it:

> "There was an issue with the event logging because of a retry and our n8n scenario thought the
> client already received the upgrade proposal, marked the sequence as 'completed,' and stopped all
> further steps. In reality, nothing was sent… The only reason we caught it – one of my team members
> manually reviewed the 'failed' queue while doing a dumb routine audit I usually skip."

The provider-event-ID dedup this file already teaches in §5 does not catch this — dedup by event ID
protects you against *processing the same delivery twice*; it says nothing about a workflow trusting
its own possibly-corrupted record of what it already did. That is exactly **I2 — never let the
system's own record of what it did be the only evidence that it did it.** The fix, converging
independently with reconciliation's own delivery-status/processing-status split (`reconciliation.md`
§6): log the raw event and your interpretation of it as two separate, comparable facts, so a
completion check can be *falsified* against the raw log rather than confirmed by your own prior
write. Fill the same two fields on the
[reconciliation worksheet](../assets/reconciliation-worksheet.md) for any workflow with a completion
check worth trusting, whether or not it also runs a reconciliation loop.

## 8. Per-vendor delivery guarantees — the shape differs, look it up per vendor

§1–7 teach the mechanisms; this table is the evidence they aren't hypothetical. **Don't memorise
these — look each one up per vendor before you build.** Primary docs, verified 2026-07-27, re-verify.

| Vendor | Ordering | Ack deadline | Automatic retry | Dedup key(s) | Manual replay |
|---|---|---|---|---|---|
| Stripe | Not guaranteed (named example: related events out of sequence) | No fixed number; return success before complex logic | Multi-day, backoff | `event.id` (+ object ID + type for the rare two-events-one-action case) | Self-serve, weeks-scale — does **not** suppress the automatic track |
| Shopify | Not guaranteed | Hard, single-digit seconds | **8 retries over ~4h** — anchor for "budgets are finite and vendor-owned" | Two distinct IDs, two scopes (§5) | Not self-serve; vendor's own fix is a periodic reconciliation job — corroborates `reconciliation.md` from the sender's side |
| GitHub | Moot — one attempt only | Hard, ~10s | **Zero** — anchor for "no-retry is a shipped policy, not a bug" | One GUID per attempt | Self-serve redelivery, days-scale — the usual trigger for §3's human-replayed duplicate |
| Slack | Not stated | Hard, tightest of the four | Small fixed count, short named backoff | One global event ID | Not self-serve in pages checked |

Some vendors publish exact numbers in crawlable docs; others gate them behind an authenticated portal.
Treat "read the vendor's docs" as sometimes genuinely unexecutable at build time — say so and point
the reader at their own dashboard rather than inventing a number.

What survives across every row regardless of exact figures: ordering is never contractual, every
deadline is short enough that synchronous processing is structurally unsafe (§2), retry budgets run
zero to multi-day and are the sender's choice not yours, and manual replay exists somewhere in most of
these programs. Design the handler against that shape; verify the numbers per vendor before you ship.
