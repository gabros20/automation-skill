# Irreversibility Inventory

One row per step in a workflow that reaches outside your own system. Fill this in **before** you
decide the run order — the whole point is to find out which step must go last before you wire it,
not after something has already been sent twice. Source: `../references/compensation-and-recovery.md`
(I3, I9) and `../references/workflow-testing.md`.

**How to classify a step — three tiers, not two.** Most people reach for "reversible / irreversible."
That collapses a distinction worth keeping:

- **Reverses cleanly** — nothing outside your system has changed yet. A held reservation never
  confirmed, a draft saved but not submitted, an authorized-but-not-captured payment. Voiding it
  leaves no trace anywhere else.
- **Compensable only** — the external state changed, and you cannot undo that fact, but a *new*
  forward action can neutralize its effect. A captured payment (a refund is not an un-charge — the
  charge, the statement line, and any fee already happened; the refund is a second transaction that
  offsets it). A record created in a partner CRM (you can delete or correct it, but the write and its
  timestamp already occurred, and anything the partner's own system did off that write in the
  meantime did not get undone with it).
- **Cannot be taken back, by any mechanism, compensation included** — the effect left your system
  entirely and something on the other side already consumed it. A sent email, once opened. A message
  posted to a shared or public channel, once seen. A webhook payload already acted on by a partner's
  own downstream automation — deleting your copy of the record does not reach into their system and
  undo what they triggered off it. Hohpe's *Compensating Action* illustrates this tier with a letter
  already in the post: what offsets it is a phone call asking the recipient to disregard it. The
  sending is permanent; the call only offsets what it caused next. (Paraphrased from Hohpe,
  *Compensating Action*, enterpriseintegrationpatterns.com — see
  `../references/compensation-and-recovery.md`.)

The tier a step lands in is not fixed by the action type alone — a captured payment sitting alone is
tier 2 (refundable); the same payment after the customer has already spent the refund, moved country,
or closed the account it would land in effectively behaves like tier 3. Classify the step as it
actually stands in your workflow, not by its category label.

| Step | External effect | Tier (reverses cleanly / compensable only / cannot be taken back) | Compensating action, if any | Must run last? |
|---|---|---|---|---|
| *Example:* Reserve inventory unit | Hold placed, not yet confirmed | Reverses cleanly | Release the hold | No |
| *Example:* Capture payment | Charge posted, statement line generated | Compensable only | Refund (new transaction, not an un-charge) | Usually — see below |
| *Example:* Send confirmation email | Message delivered and likely read | Cannot be taken back | None — a follow-up email corrects content, it does not un-send the first one | Yes, if nothing later is harder |
| | | | | |
| | | | | |
| | | | | |

**Ordering rule once the table is filled:** run the step with the fewest rows below it that outrank
it in irreversibility — in practice, put every tier-3 step last, tier-2 steps before that, and
tier-1 steps first. Where two steps are both tier-3, order does not matter between them; it only
matters relative to steps you could still cleanly abort. This is **PERFORM HARDEST TO REVERT ACTION
LAST**, Hohpe's own rule, applied mechanically: it does not remove risk, it just makes sure you are
never stuck having already done the tier-3 thing while a tier-1 or tier-2 thing still fails behind it.

**Self-audit:** a step with no tier assigned is not classified — treat it as tier 3 until proven
otherwise. That is the safe default, not the accurate one: an un-inspected step earns the strictest
ordering constraint, not the loosest.
