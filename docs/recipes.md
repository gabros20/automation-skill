# Recipes

Use the invocation form supported by your client. The examples below use Codex's explicit
`$automation` form.

## My automation fired twice and charged someone

Use when: a customer was charged twice, an email went out twice, or a CRM record was written twice by
the same workflow, and you need to know why before you decide how to fix it.

```text
Use $automation to figure out why this workflow charged someone twice, and stop it from happening
again.
```

Route: primary job `integration-reliability` for the delivery-side mechanism — at-least-once delivery is
the norm, ordering is never guaranteed, and the sharpest failure mode inverts the usual worry: a retry
corrupted an event log, and the workflow's own "have we already done this?" check read the corruption as
*confirmation of completion*, self-terminating a paid sequence having sent nothing at all (caught only
because someone manually reviewed a normally-skipped failed-queue audit). Cross to `compensation-and-
recovery` once the duplicate is confirmed: a duplicate charge is compensated with a refund, which is a
new forward action with its own side effects, not an un-charge (I3) — the original charge, its statement
line, and any processing fee stay true forever. Output: a dedup key derived from the business event's
own identity rather than the delivery mechanism (I4), the raw-event-vs-interpretation split (I2) so a
completion check can be falsified rather than merely trusted, and — if a refund is owed — a named
compensating action with its own audit trail, not a silent "undo."

## The sync has been quietly dead for a week

Use when: nobody got an error, nothing looks broken in the dashboard, and you only found out the sync
stopped because someone noticed stale data by accident.

```text
Use $automation to find out why this sync has been silently dead, and make sure I'd know immediately
next time.
```

Route: primary job `workflow-observability` — I8, a workflow that stopped is not a workflow that failed:
a failure throws and (if wired) alerts, but a stoppage does none of that, because the trigger simply
never fired again or a credential died with no error surfaced. The decisive finding across every engine
checked (Temporal, Inngest, n8n, Step Functions, GitHub Actions): **none alerts by default** when a
workflow silently stops — n8n's own error workflows are opt-in, wired per workflow, and must be attached
by hand. Cross to `credentials-and-connections` first, since a dead credential is the most common cause
of exactly this symptom — Google's own OAuth docs note a refresh token invalidates after six consecutive
months unused, and only an explicit refresh call resets that clock; ordinary API calls do not. Output: a
missing-heartbeat check per automation and per credential, alerting on the *absence* of a ping rather
than on a failure event, built outside the platform since no engine ships it.

## A webhook never arrived and the order is missing

Use when: a customer says they paid, or a partner system says a record exists, and your side has no
trace of it at all — not a failed job, not an error log, nothing.

```text
Use $automation to find the gap between what the vendor actually has and what our system thinks
happened, and close it.
```

Route: primary job `reconciliation` ⭐ — the flagship. I1 is the spine: reconcile against the vendor's
authoritative state, never against your own record of what you told it, because an ack is not evidence
and a webhook that never arrived leaves no trace in your logs to notice. The method: diff the vendor's
ID set against your local IDs first (cheap, catches exactly this gap), then a tolerance-banded field
comparison only on IDs present in both sets, classified into matched / matched-within-tolerance /
exception — never a binary match/no-match. At n=1 the default flips to alert-first, not auto-heal-first,
because there is no second person sitting downstream of the exception queue. Output: a filled
`reconciliation-worksheet.md` with comparison method, tiered cadence, and an idempotent-upsert backfill
path keyed on the business event (I4) — since the poll itself becomes a second delivery path for the
same event the moment it exists.

## Should this step wait for me to approve it?

Use when: a workflow is about to do something hard to reverse — a refund, a delete, an external send —
and you're not sure whether it should pause for a human, and what should happen if nobody answers.

```text
Use $automation to decide whether this refund step needs a human approval gate, and what happens if
nobody responds in time.
```

Route: primary job `approval-and-authority` — translating meeting-paced enterprise GRC (maker-checker,
delegation of authority) into a policy an unattended workflow can execute at 3am, which that canon never
had to answer. The rule that is not a config option: the requester may never also be the approver — a
system that lets the party that proposed an action also sign off on it has implemented a rubber stamp,
not an approval. At n=1 this looks paradoxical; the resolution is COSO's own escape hatch, cashed out as
owner review of everything plus an independent reconciliation, not "approve your own step" (I6). Every
engine gives the same three primitives — pause, timer, resume — and **not one ships a default timeout
policy**; Inngest says so outright: *"There is no default-deny or default-allow… you decide."* Output: a
filled `approval-policy-card.md` naming who may approve, the timeout duration, and the deny/allow/escalate
decision for that specific action class — fail closed for irreversible or high-value steps, fail open
only where the cost of a false block is stated and accepted.

## We're about to move off Zapier — what breaks?

Use when: the team is planning to migrate a Zapier setup onto a self-hosted engine or a code-first
platform, and wants to know the real cost before signing up for the destination, not just its feature
list.

```text
Use $automation to tell me what actually breaks if we move this off Zapier onto n8n.
```

Route: primary job `platform-selection` for the sequencing — inventory the irreversible steps first
(I3), since resume-capability (I9) can eliminate candidates before anything else is weighed: a
restart-only engine replaying an irreversible early step on retry is a duplicate-side-effect generator,
full stop, and this is confirmed by a vendor describing its own competitors' failure mode verbatim
("a worker that dies mid-flow would restart the whole run from the trigger and re-send emails, re-charge
cards, and re-call APIs"). Then the exit cost itself, asked up front rather than after the migration
becomes necessary: there is no portable workflow format across tiers, every migration is a from-scratch
re-implementation of trigger conditions and error handling, and every connected credential has to be
re-authorized against the new host, not copied — see `credentials-and-connections` for what that
re-authorization actually touches. Cross to `surface-hosted-ipaas.md` for what the current tier was
quietly giving you for free (reconciliation is not built by the platform; dedup logic usually lives in
your own step) so the destination's gap list is complete, not just its selling points. Output: a tier
decision recorded against resume-capability, default-alerting posture, licence, and exit cost — not just
a vendor name — plus a priced `run-cost-table.md` before committing.
