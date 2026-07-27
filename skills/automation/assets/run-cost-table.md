# Run Cost Table

The quota is the vendor's (I10). Exhausting it is an availability event, not a bill you can pay your
way out of instantly — and on some platforms it stops every automation on the account, not just the
one that burned it. This table forces a per-workflow number and a stated ceiling before that happens,
rather than after. Source: [`references/cost-and-quota.md`](../references/cost-and-quota.md) and
[`references/platform-selection.md`](../references/platform-selection.md).

**How to fill a new row:** name the billing unit before the number — a task, an operation, an
execution, a request. Platforms don't share a unit, so a row copied from one platform's dashboard to
another without checking the unit will silently misstate the comparison. A workflow with no stated
ceiling is a workflow you are only reacting to after the invoice or the outage, not before.

| Workflow / automation | Billing unit | Normal run cost | Monthly ceiling | Warning set? | Circuit breaker / kill switch | Blast radius if exhausted | Owner |
|---|---|---|---|---|---|---|---|
| `[name]` | `[task / operation / execution / request]` | `[fill]` | `[fill]` | `[yes / no]` | `[fill — see below]` | `[this workflow only / this account / this vendor's shared bucket]` | |
| | | | | | | | |
| | | | | | | | |

**On "circuit breaker / kill switch":** do not write "the platform handles it" without checking —
[cost-and-quota.md](../references/cost-and-quota.md) covers what to verify before assuming one exists.
Where the platform provides no automatic stop, this column has to name a person or an external monitor
that actually disables the flow, not just alerts on it. An alert nobody is watching is not a breaker.

**On "blast radius if exhausted":** this column exists because "all my automations on one account" is
a decision, not a neutral default (I10). A workflow whose failure mode is "this workflow queues until
next cycle" is a materially different risk than one sharing a quota bucket with every other automation
on the account — record which kind each row is, don't assume the narrower one.

**On retries:** a workflow that retries into a rate limit converts a transient failure into a sustained
one (I11). If a row's normal run cost spikes under retry, that spike is the thing this table should
catch — a retry storm is a cost incident with the same shape as a runaway loop, not a separate class of
problem.

**Self-audit:** a row with a filled "normal run cost" and no ceiling is exactly the gap I10 names —
close it before this table is considered done, not after the first surprise invoice or the first
silent account-wide stop.
