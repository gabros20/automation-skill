# Sources, licences, and what this skill claims for itself

This pack makes an unusual claim about its own originality, and states it plainly rather than
implying more.

## 1. The wedge is synthesis, not discovery

**Almost nothing in this pack is unknown. The problem is that it is known in five places that do not
cite each other.**

| Literature | What it teaches | What it never does |
|---|---|---|
| Distributed systems | Idempotency, saga, delivery semantics | Frames it for **services you own** — your queue, your workers, your deploy |
| Hohpe's *Conversation Patterns* | Compensation, acknowledgment, leases, token rotation — **explicitly for parties you do not control** | Is twenty years old, stalled since Jan 2017, and largely unread. Has no reconciliation practice, no credential fleet, no human approval node, no cost model |
| Fintech / ledger engineering | Reconciliation, exhaustively | Never generalises past money movement — every framing is ledger-vs-settlement-report |
| Enterprise GRC (COSO, ISO 27001, maker-checker, delegation of authority) | Approval authority, segregation of duties, and **the n=1 compensating-control answer** — decades deep, and unusually disinterested because it comes from audit standards bodies rather than vendors | Is paced by quarterly certifications and change-advisory-board meetings. **Never answers what a system should decide at 3am when nobody replies** |
| The 2026 agentic wave | Guardrails, approval gates, iteration ceilings | Frames all of it for **models**, not for deterministic business processes |
| iPaaS vendors | Their own product | Teach almost none of the above, because their business is making it look easy |

The reader wiring their business across vendors they cannot deploy to has to assemble one discipline
out of five literatures that were never introduced to each other. **That assembly is what this pack
is.** Where we add something genuinely new, §4 says so explicitly.

## 2. Licences — the four-clause check

Every clause exists because a previous build was caught by it: **(1)** reconcile every root licence
file · **(2)** check README and docs for a grant before concluding "unlicensed" · **(3)** check
provenance, because a byte-identical corpus claiming its own copyright is a derivative · **(4)**
check liveness, because **archived ≠ recommendable**.

| Source | Licence | What that permits us |
|---|---|---|
| **enterpriseintegrationpatterns.com** (Hohpe) | **CC BY 4.0 on the pattern icon, pattern name, and bold problem/solution statements ONLY.** Everything else © 2003, 2023, all rights reserved | **Verbatim quotation of problem/solution statements with attribution.** Paraphrase all explanatory prose and worked examples. **The grant is printed per-pattern-page — catalogue and index pages carry only the all-rights-reserved notice.** Cite the specific pattern page you took it from |
| Hohpe, *Your Coffee Shop Doesn't Use Two-Phase Commit*, IEEE Software | © IEEE — **not** covered by the site grant | Cite and paraphrase. No verbatim quotation |
| **Google SRE books** | **CC BY-NC-ND** | **No lift of any kind.** Ideas and citation only |
| **n8n** | **Sustainable Use License — NOT OSI open source**, as n8n's own docs concede | Describe accurately. Never call it "open source" |
| **Nango** | **Elastic License 2.0** — source-available, not OSI open source; GitHub reports `NOASSERTION` | Self-hosting for internal use is unrestricted. Never call it "open source" |
| Activepieces (core) · Temporal · `agentkitai/agentgate` | MIT | Cite freely |
| Windmill | AGPLv3 core + Apache-2.0 clients | Cite; note the split |
| Kestra · **Trigger.dev** | Apache-2.0 | Cite freely |
| **DBOS** | MIT (verified 2026-10-17, live) | Cite freely |
| **Restate** | **Business Source License 1.1**, converting to Apache-2.0 after four years | Source-available, not OSI open source today. Describe accurately |
| **Inngest** | **Server Side Public License 1.0** | Not OSI open source. Describe accurately |
| **Pipedream** | **Not open source**, despite listicles implying otherwise | Describe accurately |

All engine repositories were confirmed **live** (pushed within 72 hours of 2026-07-27), not merely
correctly licensed.

## 3. Sources we deliberately do not use

- **An arXiv preprint on webhook/polling verification.** Excluded after reading the raw HTML rather
  than a summary: solo author, **no institutional affiliation**, v1 only, cross-posted to SSRN, and
  an explicit companion paper describing *"a production managed package deployed across independent
  enterprise organizations"* — the author's own commercial product. **Undisclosed vendor content
  wearing arXiv's credibility.** The generalisable heuristic: before trusting a solo-author arXiv
  architecture paper, check for a companion paper describing a production managed package.
- **Three widely-circulated practitioner "incident" posts.** On full reading, each is an
  advertisement with an anecdote as the hook and a product link in the same post. An early draft of
  our own research quoted one of them before the truncation was caught.
- **An undated third-party blog** as the sole source for a platform's loop behaviour. Fails
  provenance and liveness. The pack therefore **asserts nothing about that platform's loop
  behaviour in either direction** — silence with no source behind it licenses no claim.
- **A vendor's "five-stage reconciliation model."** Accurate for most of its length and then
  revealed as the vendor's own feature list. We use the mechanics and decline the framing.

**On the practitioner channel generally:** roughly 75–85% of what a deliberate search surfaces in
this domain is vendor or affiliate content, and **engagement correlates inversely with evidentiary
value** — the two testimonies we cite sit in single-digit likes, and the most-engaged material was
uniformly the least usable. One account with thousands of followers and **zero following** was
excluded on content-farm signals.

## 4. Facts this skill teaches as its own judgment

Named here so no reader mistakes them for established practice.

- **Reconciliation as a general integration discipline**, rather than a payments control. The
  mechanism is taught in general integration engineering without the word, and under the word only in
  fintech. Joining them is ours.
- **The recursion, and its resolution.** COSO's escape hatch from missing segregation of duties *is*
  independent reconciliation; Stripe's reconciliation practice requires that the recorder is not the
  reconciler. For one person the escape hatch leads back to the trap. **Our resolution — that
  independence must come from the source, the clock, or a pre-committed rule rather than a second
  person — is a translation of COSO, credited to COSO, not a discovery.**
- **The credential fleet as a unit of management.** Individual mechanisms are documented exhaustively
  by each vendor for its own product; **nobody documents the union.**
- **The loop counter and the quiet/debounce window** as loop mitigations. Source-tagging and
  updated-by filters are the vendors'; these two are not documented by any vendor we found.
- **Trigger idempotency across two delivery paths** — that adopting a reconciliation poll *creates* a
  second path for the same business event, and therefore a new duplicate class.
- **The polling / rate-limit / freshness trade-off** stated as a three-way tension.
- **"An agentic step fails by continuing"** — and that the fix is to reintroduce the deterministic
  ceiling that made non-agentic automation fail loudly.
- **Rotation calendars and a credential inventory** for a team with no IAM function.
- **Draft-and-queue as the n=1 maker-checker for agent- or rule-proposed actions**, and reviewer
  capacity as the limit on how many producers a queue can honestly take — COSO's segregation logic
  applied to a maker that is not the owner.
- **One trigger, one consumer** — that a cloned deployment, a shared channel, or a command anyone
  can post silently gives one event a second consumer — and a schedule's overlap policy stated as a
  decision. The `concurrencyPolicy` vocabulary is Kubernetes'; generalising it to every scheduler is
  ours.
- **"Running" and "completed" as statuses that lie by construction**, and the quiet-unless-wrong
  monitor that needs its own heartbeat. Lease and Heartbeat are Hohpe's names; this application is
  ours.
- **The tier criteria "who maintains it in six months" and "prototype the worst failure first."**
- **Binding a credential to a named human, and the offboarding revocation that follows** — the pack
  teaches the hazard and a checklist, not a succession plan. We did not search this to exhaustion and
  do not claim it is unwritten.

## 5. Numbers this skill refuses to ship

- **Any "hours saved" or "percent reduction" figure.** The entire supply is vendor-generated, and
  we found no primary source for any of it.
- **Full vendor quota and pricing tables.** We teach the *shape* — a shared org-wide bucket, per-task
  billing, a plan ceiling — and cite at most one dated anchor. A pack that recites five editions'
  limits is wrong within a quarter.
- **Any figure not verified against a primary source**, even with a caveat attached. Naming a number
  in order to forbid it still ships the number, and bolding one before saying the argument does not
  depend on it is laundering with extra steps.
- **Any claim about which model or product version is "current."**

Every volatile fact in this pack carries a verification date — **2026-07-27** for the original build,
**2026-10-17** for facts added since, marked individually — and a re-verify pointer. This domain
changes without your deploy.

## 6. Where this pack routes rather than competes

`backend` owns the idempotency-key primitive, queues, outbox and saga **inside a system you control**;
we apply them across a boundary you do not. `ai` owns model cognition and model-level guardrails.
`data` owns the dataset and the analytical plane. `operate` owns running, watching and recovering the
workflow in production — including the dead-man's-switch mechanism this pack cites rather than
re-teaches. `quality` owns independent verification and the ship gate. `orchestrate` coordinates
agents inside a development session and is not a lifecycle skill.
