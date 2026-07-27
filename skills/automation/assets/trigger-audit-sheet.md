# Trigger Audit Sheet

Fill one row per trigger before calling a workflow's trigger design done. Source:
[trigger-design](../references/trigger-design.md). Self-audit count at the bottom — if any cell is
unchecked or blank, state why or fix it before handoff.

| Trigger | Type (schedule / webhook / poll / manual / agent) | Business event it stands for | False-positive class named? | DST behavior stated (schedules only) | Other trigger paths on same event? | Idempotency key = business event identity? | Reconciliation loop covers it? |
|---|---|---|---|---|---|---|---|
| | | | ☐ | ☐ / N/A | ☐ none / ☐ named: _______ | ☐ | ☐ / N/A |
| | | | ☐ | ☐ / N/A | ☐ none / ☐ named: _______ | ☐ | ☐ / N/A |
| | | | ☐ | ☐ / N/A | ☐ none / ☐ named: _______ | ☐ | ☐ / N/A |

**Self-audit count:** `___ / ___` cells checked. Any unchecked cell needs either a fix or an explicit
stated reason (e.g. "N/A — manual trigger, no schedule to check").

## Column definitions
- **Business event it stands for**: one sentence, in business vocabulary, not implementation
  vocabulary ("invoice #4471 marked paid," not "webhook received on `/hooks/stripe`"). This is the
  identity §7 of [trigger-design](../references/trigger-design.md) requires the idempotency key to be
  derived from.
- **False-positive class named?**: the "what else could make this true" check from
  [trigger-design](../references/trigger-design.md) §2 — a positive match on a keyword or field value
  written down alongside every case that could satisfy it without meaning what you intended.
- **DST behavior stated**: for any schedule, one of the five documented behaviors in
  [trigger-design](../references/trigger-design.md) §3 (skip / run-once / shift / UTC-immune /
  undocumented) — or confirmation the schedule was forced to UTC to sidestep the question. N/A for
  non-schedule triggers.
- **Other trigger paths on same event?**: whether a webhook, a poll, and/or a reconciliation pass can
  all independently discover this same business event. If yes, name them — this is the condition I4
  exists for.
- **Idempotency key = business event identity?**: checked only if the key is derived from the event
  itself, not from the delivery mechanism (webhook delivery ID, poll run ID) that happened to carry it
  this time — required whenever the previous column names more than one path.
- **Reconciliation loop covers it?**: whether the periodic reconciliation pass
  ([reconciliation](../references/reconciliation.md)) also observes this event's resource, which is
  precisely what creates the two-path hazard this sheet exists to catch. N/A only if no reconciliation
  loop touches this resource at all.
