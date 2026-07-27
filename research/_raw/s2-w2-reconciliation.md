# S2-W2 — Reconciliation against a third-party system of record

## Verdict: generalised beyond payments — **NO on vocabulary, YES on mechanism (unnamed).** This is the wedge, and it is rigorous, not assumed.

Fintech (Modern Treasury, Formance, Stripe, Adyen, Banking Circle Connect) owns the *word*
"reconciliation" as a ledger-vs-settlement-report control, exhaustively. Modern Treasury: compare
an Internal Account (bank/vendor-reported) against a Ledger Account, resolve the *variance*
(docs.moderntreasury.com/reconciliation/docs/account-reconciliation-overview). Adyen: Settlement
Details Report reconciles payout batches transaction-by-transaction
(docs.adyen.com/reporting/settlement-reconciliation). Stripe: cross-reference payout/transaction
reports against accounting entries and bank deposits (stripe.com/resources/more/payment-reconciliation-101).
None of these generalise past money movement — every framing is ledger-balance-vs-external-source-of-truth.

The **mechanism** — poll a provider's API on a schedule to catch what a webhook missed, diff against
local state, backfill — is independently taught in **general, non-fintech integration engineering**
(Merge.dev's Unified API blog, generic SaaS/CRM/ATS integrations) — but that literature **never uses
the word "reconciliation."** Merge's own piece (webhooks-vs-polling) discusses polling as a
freshness trade-off, not as a named discipline, and never mentions reconciliation once. That is the
fragmentation stage-1 predicted, now confirmed by direct read: **same mechanism, two literatures,
zero shared vocabulary.** This is stronger evidence for the wedge than "nobody teaches it" — it's
"two camps each teach half, and don't know the other camp exists."

**Interest declared: Formance.** Their blog's "five-stage reconciliation pipeline" (normalized
ingestion → rules engine w/ per-rail tolerance → exception workflow → source-of-truth ledger →
resilient infra) reads as general best practice for ~80% of the post, then closes: *"This is how
Formance Ledger and Formance Reconciliation work together... reconciliation-grade operational
ledger"* — Formance sells "Reconciliation" as an Enterprise Edition managed service
(docs.formance.com/reconciliation). W5's flag is correct: cite the mechanics, not the "5 stages" as
if canonical — it's their feature list with an educational wrapper.

## arXiv 2607.15529 — **VERDICT: DO NOT CITE. Not credible independent work.**
Checked the raw arXiv HTML directly (not summarizer output). Solo author "Devam Gupta," **no
institutional affiliation anywhere on the page**, single version (v1 only, no revision), 7 pages,
submitted 17 Jul 2026. It is an explicit "companion paper" to arXiv:2607.12943 ("Salesforce
Messaging Architecture: Platform Events, Async Sends, and Multi-Tenancy at Scale" — same solo
author, same week), which itself describes "a production managed package deployed across
independent enterprise organizations" — i.e., **the author's own commercial Salesforce AppExchange
product**, not a neutral study. Also cross-posted as "SSRN Working Paper No. 7069378" (SSRN is
not peer-reviewed). No citations found, no other arXiv papers by this author turned up. This is
self-published vendor content wearing arXiv's credibility — a pattern worth naming for the corpus:
**check for a companion paper describing "a production managed package" before trusting a solo-author
arXiv "architecture paper."** The *mechanics it describes* (two-path webhook+poll, idempotent
upsert, sync-failure detection) are real and independently corroborated elsewhere — just not by this
paper.

## Best sources, ranked
1. **Modern Treasury** — Account Reconciliation Overview + "What is Transaction Reconciliation?" (official docs/learn, product-adjacent but conceptually clean, industry-standard vocabulary: internal account vs ledger account, variance)
2. **Adyen** — Settlement Reconciliation docs, transaction-level and batch-level (official docs, concrete report mechanics)
3. **Woovi** (dev.to, "delivering 100% of webhooks") — credible first-person practitioner account, not marketing: 4-state webhook state machine (PENDING/SUCCESS/FAILED/NOT_APPLY), 5-minute polling cron as reconciliation backstop for PENDING records, honest about failures discovered in production
4. **Stripe** — payment-reconciliation-101 + payout-reconciliation docs (official, practical: async payout retrieval on webhook receipt, batch alignment to bank deposits)
5. **Merge.dev** (webhooks-vs-polling) — non-fintech, general SaaS integration framing; useful *precisely because* it independently corroborates the mechanism while never saying "reconciliation" — cite for the generalization argument, name the interest (Content Marketing Manager author, closes with a demo CTA)
6. **Formance** — cite mechanics only (rules-engine tolerance bands, exception queue), flag the "5 stages" as product-shaped

## Mechanics to teach
- **Cadence**: tiered — 15–60 min for recent activity, daily for accounting checks, monthly for finance close (industry convergence across sources); Woovi runs a 5-min cron for its narrower PENDING-only sweep.
- **Compare**: not full-record diff by default — ID/count set diff first (cheap, catches misses), tolerance-banded amount/timing match second (Formance's per-rail tolerance), full-field diff only on suspected drift.
- **Classify a discrepancy**: matched / matched-within-tolerance / exception ("break," routed to a queue with context) — never binary match/no-match.
- **Auto-heal vs alert**: auto-resolve only high-confidence matches (many-to-many rules with tight tolerance); anything ambiguous goes to a human queue — auto-healing an unclear break is how you compound an error silently.
- **Avoid the reconciler double-applying**: separate *delivery status* (did the webhook/poll response arrive) from *processing status* (did we apply it) as two fields, not one; idempotent upsert keyed on the provider's own event/transaction ID; version/timestamp guard so a backfilled record already handled by webhook is a no-op, not a second write.

## n=1 minimum viable loop
Strip to: one cron job, calling the provider's "list since timestamp" endpoint, diffing the returned
ID set against local IDs (not full-field), alerting — not auto-healing — on any gap surviving past a
grace window (the 24–72h backfill window pattern), with idempotent upsert as the only safety net if
you do choose to auto-apply.

**What the literature assumes that a solo operator doesn't have**: a second independent source of
truth to check against (a real bank statement, not just the vendor's own report); a reviewer to route
breaks to (Stripe's own best practice explicitly requires reconciler ≠ recorder — a segregation of
duties a solo operator cannot satisfy); a tolerance-rule library refined over months of breaks. The
n=1 default must be *alert-first*, never *auto-heal-first* — the team literature can afford
auto-resolution because a human is downstream of the exception queue; a solo operator is often not
watching that queue in real time.

## Flagship call
**Yes, viable — arguably stronger than approval.** Genuinely 0-hit in the family (confirmed by
stage-1), and now confirmed fragmented-not-absent at the world level: fintech owns the vocabulary
and never generalises it; general integration engineering teaches the same mechanism under different
names and never uses the word. That two-literature non-citation gap is exactly the synthesis wedge
`quality` and now `operate` shipped on. Must be built as synthesis (state the fragmentation
explicitly in SOURCES.md), not framed as discovery — and the Formance/arXiv sources must be handled
exactly as flagged (mechanics only, interest named / excluded).
