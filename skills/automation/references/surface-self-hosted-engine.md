# Surface: Self-hosted engine (n8n/Windmill/Activepieces/Kestra)

Purpose: State how the twelve automation jobs reshape when you run the engine yourself — you trade
the vendor's operational burden for your own, and you take on a real licensing decision the hosted
tier never asks you to make.

Read when:
- The workflow runs on an engine you deploy and operate — n8n, Windmill, Activepieces, Kestra,
  Node-RED, or comparable.
- You are choosing whether self-hosting is worth the operational and licensing trade
  (pair with [platform-selection](platform-selection.md)).
- You need the licence position on a specific engine before adopting or redistributing it.

Skip when:
- The vendor runs the platform for you → [surface-hosted-ipaas](surface-hosted-ipaas.md).
- The workflow is code and durability is the engine's core primitive at the language level
  (Temporal/Inngest/Restate/Trigger.dev) → surface-code-first-durable.
- There is no engine at all, only a scheduler → [surface-platform-native](surface-platform-native.md).
- A model is a step or the trigger → add surface-agentic **on top of** this surface, don't replace it.

Inputs:
- The specific engine and version in use, and its current licence file — re-verified against the repo
  root, not recalled (I15).
- The job(s) you're implementing from the router.

Produces:
- A licence and liveness statement for the chosen engine, fit for the artifact contract.
- This surface's I7/I8/I9 posture, carried into the job artifact.

## Contents
- Licence, not just "open source" (verified 2026-07-27, re-verify)
- Ownership: you now run the substrate
- Silent-stop story (I8)
- Resume-vs-restart (I9)
- Credentials and their blast radius (I7)
- Cost model
- Job-by-job reshape

## Licence, not just "open source" (verified 2026-07-27, re-verify)

"Self-hostable" and "open source" are not the same claim, and the four engines named in this surface
split three different ways — re-verify before you cite any of this, licences and their enterprise
carve-outs change without a deploy on your side (I15):

- **n8n** — **Sustainable Use License**, not OSI open source; n8n's own docs concede the distinction.
- **Activepieces** — core **MIT**.
- **Windmill** — core **AGPLv3**, client libraries **Apache-2.0**.
- **Kestra** — **Apache-2.0**.

None of the four repos was archived or dormant as of the last check (2026-07-27) — but liveness is a
point-in-time fact, not a property of the project, and belongs in your own re-check before you commit
to one, not in this reference.

The practical consequence: choosing n8n because "it's self-hostable" answers *where it runs*, not
*what you're allowed to do with it* — redistribution, forking, and offering it as a competing service
are governed by the licence you actually chose, and the SUL terms are materially narrower than MIT or
Apache-2.0. Read the licence file itself before assuming parity across the four.

## Ownership: you now run the substrate

Self-hosting moves uptime, backups, and upgrades onto you — **that is an `operate` concern, not an
`automation` one.** This surface does not re-teach deployment, backup verification, or incident
response for the engine itself; route there. What stays here is the engine's *workflow-level* failure
semantics: what it does with a run that fails partway, and what it tells you about a run that stopped.

## Silent-stop story (I8)

**n8n's error workflows are opt-in, per workflow** — you must manually set an error workflow in that
workflow's settings and start it with an Error Trigger node, or nothing fires on failure at all.
Silence is the default, not the edge case, and it is the same posture found across every engine
checked in this family's research (Temporal, Inngest, n8n, Step Functions, GitHub Actions: **none
alerts by default**) — this is not an n8n-specific defect, it is the tier's baseline, and it means the
missing-heartbeat check in [workflow-observability](workflow-observability.md) is not optional on this
surface, it is the only thing standing between a stopped workflow and a workflow you believe is still
running.

A second, sharper gap on this engine specifically: **n8n's own Schedule Trigger documentation makes no
mention of DST behaviour at all** — not a documented-and-acceptable gap like Vercel Cron's UTC-only
design, an undocumented one. If you schedule on n8n across a clock-change boundary, you cannot look up
what will happen; you either force the trigger to UTC or test the transition empirically. Cross-
reference the full platform comparison in [trigger-design](trigger-design.md)'s cron/DST table before
shipping a schedule on this engine.

## Resume-vs-restart (I9)

Know your specific engine's answer before wiring an irreversible step — this varies by engine and is
not a property of "self-hosted" as a category, so don't generalize across the four named here without
checking the one you actually chose. Activepieces' own documentation states the failure mode plainly,
and it is worth citing exactly because it is a vendor naming its own worst case rather than marketing
around it: *"a worker that dies mid-flow would restart the whole run from the trigger and re-send
emails, re-charge cards, and re-call APIs"* — that sentence describes what happens **without** the
engine's durable-execution mechanism, i.e. the failure mode any restart-only engine exhibits by
default. The rule this supports: **before wiring an irreversible early step, confirm whether your
engine resumes from the failure point or restarts from the trigger** — restart-only plus an
irreversible early step is a duplicate-side-effect generator on every retry (I9). See
[compensation-and-recovery](compensation-and-recovery.md) for the compensation design this forces
where resume isn't available, and log the affected steps in `../assets/irreversibility-inventory.md`
before the workflow goes live.

## Credentials and their blast radius (I7)

Credentials now live in your own instance, which is strictly better for custody than a vendor's token
store — you can rotate, inspect, and revoke on your own timeline — and strictly worse if you have no
secret-management discipline to put in that better position. A concrete illustration of what a silent
credential failure looks like on this tier: a documented n8n issue (n8n **#34916**) reports a
Salesforce OAuth2 refresh that drops the `instance_url`, after which the workflow **runs fine for
roughly a day and then fails on every execution until a manual reconnect** — exactly the kind of
failure I7 exists to catch (credential health checked on its own schedule, independent of whether a
workflow happened to run), and exactly the kind that a green dashboard will not surface until it's
already been failing for a while. Register every engine credential in
`../assets/credential-register.md`; see [credentials-and-connections](credentials-and-connections.md)
for the fleet-wide refresh and rotation discipline this surface still needs even though custody
improved.

## Cost model

Self-hosting trades the hosted tier's per-task/per-operation billing for compute cost plus your own
operating time — there is no vendor ceiling to hit, but there is also no vendor absorbing the
infrastructure risk. See [cost-and-quota](cost-and-quota.md) for the ceiling behaviour that still
applies to any third-party API this engine calls (the quota on the *called* vendor's side doesn't
disappear just because you host the caller).

## Job-by-job reshape

| Job | How this surface reshapes it |
|---|---|
| [reconciliation](reconciliation.md) | Same discipline as any surface — reconcile against the vendor's state, not your engine's execution log |
| [integration-reliability](integration-reliability.md) | You control the engine's retry/dedup configuration directly; confirm your chosen engine's actual defaults rather than assuming |
| [compensation-and-recovery](compensation-and-recovery.md) | Resume-vs-restart is engine-specific — check it before ordering irreversible steps |
| [credentials-and-connections](credentials-and-connections.md) | Custody is yours; build the health check, don't rely on the engine noticing |
| [approval-and-authority](approval-and-authority.md) | Engine-native approval/pause nodes exist but timeout defaults are inconsistent across engines — name deny/allow/escalate yourself |
| [trigger-design](trigger-design.md) | Check your specific engine's DST posture before scheduling across a clock change |
| [sync-semantics](sync-semantics.md) | Unaffected by hosting choice — the vendor-side delete-visibility problem is the same |
| [workflow-observability](workflow-observability.md) | Error-workflow wiring is opt-in on at least one major engine (n8n) — verify yours, don't assume it's on |
| [cost-and-quota](cost-and-quota.md) | Your cost is compute + time, not per-task; the called vendor's quota still applies |
| [platform-selection](platform-selection.md) | The licence table above feeds directly into this decision |
| [workflow-testing](workflow-testing.md) | Engine-native dry-run/preview validates your own logic, not the vendor's live behaviour |
