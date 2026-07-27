# Claude Code repository guide

This is the released `automation-skill` (runtime skill `automation`, under `skills/automation/`). Read
[AGENTS.md](AGENTS.md) for the ownership boundary and non-negotiable invariants — especially:
**reconcile against the vendor's authoritative state, never your own record of what you told it;
compensation is a forward action, not a rollback; and the default reader is one person with no second
pair of eyes**, where independence at n=1 comes from the source, the clock, or a pre-committed rule, never
a second person who does not exist. This skill does not write jobs/queues inside your own system
(`backend`), model cognition (`ai`), the analytical plane (`data`), deploy or monitoring (`operate`), or
the ship/claim decision (`quality`).

Run `scripts/check-sync` before any release. Keep `SKILL.md` the router; keep versions out of it.
