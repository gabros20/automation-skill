# Credential Register

The starting artifact for fleet management: one row per externally-issued credential your
automations depend on. Source: `references/credentials-and-connections.md`. Nobody at this scale
publishes a template for this — it is originated here, not lifted from a citation.

**How to fill a new row:** write the detection method before the mitigation. If you cannot say how
you would *notice* this credential dying, that is the gap to close first — a rotation plan for a
credential you cannot detect the death of is theater. Never record a real key, token, or secret value
in this register — vendor, scope, and identity only.

| Vendor | Credential type | Scope granted | Bound to (person / role / service) | Known expiry or invalidation trigger | Detection (canary / heartbeat) | Refresh or rotation cadence | Owner | Last reviewed |
|---|---|---|---|---|---|---|---|---|
| | OAuth (user-delegated) / service-account / API key | | | e.g. six months' inactivity; a cap shared with other clients; dies on the bound person's password change | | | | |
| | | | | | | | | |
| | | | | | | | | |

**Self-audit:** an empty "last reviewed" column is itself a finding — a register nobody has revisited
no longer reflects which vendor, scope, or person actually holds this credential today. A row bound
to a named human rather than a role or service identity is a deliberate, written exception, not a gap
to quietly ignore (`credentials-and-connections.md` §5) — note why the vendor forces it if it does.

## Offboarding checklist (revoke by credential, not by hope it lapses)

When a person who holds a bound credential leaves, changes role, or is otherwise offboarded:

1. Find every register row bound to that person, before their access elsewhere is revoked — a
   credential revoked as a side effect of an HR action, with no warning to the automations depending
   on it, is the exact silent failure this register exists to prevent.
2. For each row, either transfer the credential to a role/service identity, or revoke it explicitly
   and confirm the dependent automation's failure path (does it fail loudly, or go quiet? — see
   `references/workflow-observability.md`).
3. Update "Bound to" and "Last reviewed" once the transfer or revocation is confirmed, not before.
