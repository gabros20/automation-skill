# Synthesis — `automation` (the build gate)

Date: 2026-07-27. Controller-authored from 11 stage-2 workers + 5 stage-1 workers + the controller's
trained-knowledge channel and independent verification.

**Writers: this document is the gate. Where it and a raw worker file disagree, this wins — except
where a worker's primary source contradicts it, in which case tell the controller.**

---

## 1. Verdict, wedge, and how it must be stated

**BUILD IT — NARROW.** Tenth skill in the family. Build tier, completing
`frontend · backend · data · ai · automation`.

**The wedge is SYNTHESIS, not discovery. State it this way in `SOURCES.md` and never dress it up:**

> The knowledge exists and is **fragmented by frame across literatures that do not cite each other.**
> Distributed systems teaches idempotency and saga **for services you own**. Hohpe's conversation
> patterns teach compensation **for parties you don't** — and are CC BY, twenty years old, and
> largely unread. Fintech teaches reconciliation **as a ledger control** and never generalises it.
> Enterprise GRC teaches approval authority **at meeting pace**, decades deep, and never answers what
> a system should decide at 3am. The 2026 agentic wave teaches guardrails **for models**. And the
> iPaaS vendors, whose users need all of it at once, teach almost none of it, because their business
> is making it look easy.
>
> The reader wiring their business across vendors they cannot deploy to has to assemble one
> discipline out of five literatures that were never introduced to each other.

**Four-way convergence on the flagship** (independent channels, no shared sources):
fintech owns the *word* and never generalises · general integration engineering teaches the
*mechanism* and never uses the word · Hohpe names it **exactly once** in 25 patterns, as a 2005 aside
— *"named it and walked away"* · **0 hits across all nine shipped packs** (`operate`'s 16 are GitOps).

## 2. Through-line

> **You cannot deploy a fix into someone else's system, and you cannot un-send. Design for
> compensation, not rollback — and when you are the only one awake, get your independence from the
> source, the clock, or a rule you committed to in advance.**

## 3. Universal invariants — I1–I15, numbering is CANONICAL

References cite these **by number**. Do not renumber. (A prior build shipped numbering drift that
broke six references.)

- **I1 — Reconcile against the vendor's authoritative state, never against your own record of what
  you told it.** ⭐ The flagship invariant. An ack is not evidence; a webhook that never arrived
  leaves no trace in your logs.
- **I2 — Never let the system's own record of what it did be the only evidence that it did it.** Log
  the raw event and your interpretation of it as two separate facts, so a completion check can be
  *falsified* against the raw log rather than confirmed by your own prior write.
- **I3 — Compensation is a new forward action with its own side effects, not a rollback.** A refund
  is not an un-charge. Where no compensating action exists, **perform the hardest-to-revert action
  last** (Hohpe). Compensation may legitimately be a human act.
- **I4 — Derive the idempotency key from the business event's identity, not from the trigger
  mechanism that delivered it.** The same event arriving by webhook and by reconciliation poll must
  collapse to one execution.
- **I5 — Assume your incremental cursor cannot see deletes** unless the vendor names a specific
  mechanism — and then check its retention window.
- **I6 — At n=1, independence comes from the source, the clock, or a pre-committed rule — never from
  a second person who does not exist.** The functions survive; the second body does not.
- **I7 — Credential health is its own monitored resource**, checked on its own schedule, independent
  of whether any workflow happened to run.
- **I8 — A workflow that stopped is not a workflow that failed.** No engine alerts by default. The
  missing-heartbeat signal is yours to build — cite `operate`'s dead-man's-switch, do not re-teach it.
- **I9 — Before any irreversible early step, know whether your engine resumes or restarts.**
  Restart-only + an irreversible early step = a duplicate-side-effect generator on every retry.
- **I10 — The quota is the vendor's.** Exhausting it is an availability event you cannot fix by
  paying faster, and its blast radius is every flow on the account, including unrelated ones.
- **I11 — Retrying into a 429 converts a transient failure into a sustained ban.** Backoff with
  jitter, honour `Retry-After`, and budget retries as a fraction of successes rather than per-request.
- **I12 — An agentic step fails by continuing.** It fails loudly only to the extent someone bolted a
  deterministic ceiling onto it — **the fix for agentic failure is to reintroduce the property that
  made non-agentic automation fail loudly.**
- **I13 — Timeout policy is a decision, not a config default.** No engine ships one. Name
  deny / allow / escalate before the gate goes live.
- **I14 — Prefer the API.** Where there is none you have bought a maintenance liability with no
  deprecation notice — a UI-scraping bot consumes no versioned contract, so it gets no version signal.
- **I15 — Date-stamp every volatile vendor fact, and name the interest** of anyone selling what they
  measure — including when it makes their claim stronger.

## 4. Shape — 12 jobs × 5 surfaces (4 base + 1 additive) + handoff = 18 references

**Jobs.** ⭐ = flagship.
1. **reconciliation ⭐** · 2. integration-reliability · 3. compensation-and-recovery ·
4. credentials-and-connections · 5. approval-and-authority · 6. trigger-design · 7. sync-semantics ·
8. workflow-observability · 9. cost-and-quota · 10. platform-selection · 11. workflow-testing ·
12. process-capture-and-when-not-to-automate

**Base surfaces** (pick one): `surface-hosted-ipaas` (**default** — Zapier/Make-class; where most
business automation starts and where the reliability gaps are worst served) · `surface-self-hosted-engine`
(n8n/Windmill/Activepieces/Kestra) · `surface-code-first-durable` (Temporal/Inngest/Restate/Trigger.dev/
Cloudflare Workflows/Step Functions) · `surface-platform-native` (Actions/cron/cloud schedulers).

**Additive overlay** (stacks, never replaces): `surface-agentic` — a model is a step, or is the trigger.

### 4a. Hohpe already NAMED several things we were treating as ours — use his vocabulary, credited

Controller pulled the full Conversation Patterns catalogue (2026-07-27). **Before claiming novelty in
any reference, check this list.** Using Hohpe's canonical name, credited, is better than inventing a
term — and cheaper, since the name and its problem/solution statements are CC BY.

| Hohpe pattern | Our job | Relationship |
|---|---|---|
| **Quick Acknowledgment** | integration-reliability | **This is the ack-fast-then-process-async pattern W5 confirmed as universal. It already has a name. Use it.** |
| **Renewal Reminder** | credentials-and-connections | *Adjacent, not identical* — Hohpe's is **provider-side** (*"Have the provider periodically check whether the requestor still requires the resource"*); ours is **requestor-side** pre-expiry refresh. Cite the kinship, **do not claim it is the same pattern.** |
| **Heartbeat** | workflow-observability | The named ancestor of silent-stop detection |
| **Lease** | credentials-and-connections | Time-bounded resource holding |
| Acquire Token First · Rotate Tokens · User Grants Access | credentials-and-connections | The single-vendor mechanism; the **fleet** framing remains ours |
| Request-Response with Retry · Polling · Subscribe-Notify | trigger-design | Trigger taxonomy vocabulary |
| **Compensating Action** · Tentative Operation · Ignore Error · Coordinated Agreement | compensation-and-recovery | The compensation spine — Coordinated Agreement is **machine consensus, not human approval**; do not conflate |
| Scatter-Gather · Proxy · Relay · Load Balancer | — | Infrastructure altitude; decline |

**Still genuinely absent from the catalogue** (W1 verified structurally, by reading all 25, not by
search): reconciliation as a practice, the credential *fleet*, approval as a human decision node,
per-task cost ceilings, and bidirectional sync. Those remain ours.

## 5. CLEARED FACTS — **THIS LIST IS EXHAUSTIVE, NOT ILLUSTRATIVE**

**Read this sentence twice.** On the `operate` build an ambiguous version of this section caused two
writers to stop and ask. **Nothing outside this list may be shipped as a specific number, quote, or
named vendor behaviour.** If you need something not here, ask the controller — do not infer, and do
not "recall". Every item below carries its verification date; all are `verified 2026-07-27`.

**Licences (four-clause verified):**
- Hohpe / enterpriseintegrationpatterns.com — **CC BY 4.0 on pattern icon, pattern name, and the
  bold problem and solution statements ONLY.** Everything else © 2003, 2023 all rights reserved.
  Verbatim: *"You can reuse the following elements under the Creative Commons Attribution license:
  pattern icon, pattern name, problem and solution statements (in bold), and the sketch."* Badge
  links to CC BY **4.0**. **Collection effectively stalled since Jan 2017.**

  **⚠️ CONTROLLER CORRECTION — the grant is PER-PATTERN-PAGE, not site-wide.** Verified on two
  independent pattern pages (`CompensatingAction.html`, `RenewalReminder.html`). The **catalogue/index
  pages carry only "© 2003, 2023 • All rights reserved" with no CC statement at all.** Lift
  problem/solution statements **from the individual pattern page** where the grant is printed, and
  cite that page. **Do not describe the grant as site-wide** and do not lift from index pages.
- Nango — **Elastic License 2.0**, source-available, **not OSI open source**; GitHub reports
  `NOASSERTION`; not archived, actively pushed. Restriction: may not be offered as a competing hosted
  service. Irrelevant to self-hosting for internal use — but **do not call it "open source."**
- n8n — **Sustainable Use License, not OSI open source** (n8n's own docs concede this).
- Activepieces core MIT · Windmill AGPLv3 core + Apache-2.0 clients · Kestra Apache-2.0 ·
  Temporal MIT · `agentkitai/agentgate` MIT. **Pipedream is NOT open source** despite listicles.
- All 13 engine repos confirmed **live** (pushed within 72h of 2026-07-27).

**Vendor behaviours:**
- Google OAuth: **100** refresh tokens per account per client ID, oldest silently invalidated at the
  cap — *"without warning"*, Google's own docs. **Two vendor blogs say 50; they are wrong.**
- Google OAuth: a refresh token dies after **six consecutive months unused** — and **only an explicit
  `grant_type=refresh_token` POST resets the clock; ordinary API calls do not.**
- Salesforce `getDeleted()`: covers **no more than 15 days**; a 2-hourly purge can invalidate the
  window early and return `INVALID_REPLICATION_DATE`, whose documented recovery is a **full re-sync**.
- Stripe: soft-delete — object stays retrievable with `"deleted": true`, and a `customer.deleted`
  event fires.
- Stripe reconciliation, verbatim: *"To minimise the risk of errors and fraud, the person who records
  transactions should not be the same person who reconciles accounts."*
- DST: **AWS EventBridge** skips forward, runs **once** on fall-back · **GitHub Actions** shifts to
  the next valid time · **GCP Cloud Scheduler** undefined — *"might observe execution anomalies"* ·
  **Vercel Cron** UTC-only, structurally immune · **n8n — its docs never mention DST at all.**
- GitHub Actions: scheduled workflows on public repos **auto-disable after 60 days of repo inactivity.**
- Azure Durable Functions, verbatim: *"you can't retry an orchestration instance after it fails."*
- Activepieces' own docs on why durable execution exists: *"a worker that dies mid-flow would restart
  the whole run from the trigger and re-send emails, re-charge cards, and re-call APIs."*
- Inngest on approval timeouts, verbatim: *"There is no default-deny or default-allow… you decide."*
- **Silent-stop alerting: of every engine verifiable (Temporal, Inngest, n8n, Step Functions, GitHub
  Actions), NONE alerts by default.** n8n error workflows are opt-in per workflow.
- COSO, via Bonadio (Doyle, 2024-10-10): *"Where segregation of duties is not practical, management
  selects and develops alternative control activities."*
- `agentkitai/agentgate` `rbac.ts`: `hasAgentGatePermission()` checks only for the `approvals:decide`
  permission — **no comparison against the requesting identity. Zero self-approval enforcement.**
- CrewAI PR #6370: hard ceiling of **500** on `max_iter`, **100**-hop flow-router cap, citing
  **CWE-770** and **CWE-835**, to prevent *"denial-of-wallet attacks."*
- GitHub issues, citable as primary artifacts: langgraph **#7417** (checkpoint replay silently
  re-runs a completed side-effecting tool call) · autogen **#7071** (*"Termination condition evaluated
  to: True"* then the stream keeps processing) · n8n **#34916** (Salesforce OAuth2 refresh drops
  `instance_url`; runs fine ~a day, then fails every execution until manual reconnect).
- MIT Sloan, DeBrusk 2017-10-24, on RPA — **name the interest: Oliver Wyman partner, consulting.**

**Practitioner quotes — ONLY these two, both with markers:**
- The idempotency-false-positive ($7,000 sequence self-terminated after a retry corrupted the event
  log; caught only by a normally-skipped audit of the failed queue). Founder describing his own
  business; closest to neutral in the survey.
- Scheduled **pre-expiry** credential refresh + fan-out + failure alert. **No commercial interest**,
  no product link — the only *working mitigation* the channel produced.

## 6. FORBIDDEN — do not ship any of these

- **Do not cite the "notification sent 47 times", the "CRM sync retrying 14 minutes", or the "API
  changed, field was null" items.** On full read all three are **advertisements** with an anecdote as
  the hook and a product link in the same post. Stage 1's capture truncated them before the link.
- **Do not cite arXiv 2607.15529.** Undisclosed vendor content: solo author, no affiliation, v1 only,
  companion paper describing the author's own Salesforce managed package.
- **Do not claim integration-framed compensation is undertaught.** Hohpe has taught it since 2003.
- **Do not claim the n=1 approval answer is unwritten.** COSO named it decades ago (compensating
  controls). Ship our contribution as a **translation** of COSO into machine-timeout policy, credited.
- **Do not present Formance's "5-stage reconciliation model" as canonical** — it is their feature list
  with an educational wrapper. Mechanics only, interest named.
- **Do not cite a specific count of Nango's supported APIs** — the vendor's own posts disagree.
- **No unverified magnitudes.** If a figure is not in §5, drop the magnitude and keep the mechanism.
  Naming a number in order to forbid it still ships it.
- **Do not state which model or product version is "current."**
- Do not re-teach: `backend`'s idempotency-key primitive and webhook dedup · `operate`'s
  dead-man's-switch, GitOps reconciliation, or incident process · `ai`'s model-level guardrails.

## 7. Boundaries and the required back-fill

| Sibling | The line |
|---|---|
| `backend` | Async **inside your own system**; `automation` spans systems you don't own. **`backend` currently cedes NOTHING in writing — a decline row is required.** |
| `ai` | Owns the step's cognition and model-level guardrails; we own the graph, its failure semantics, and its authority to act. Shipped row **holds — W9 confirmed.** |
| `data` | Owns the dataset and its semantics, incl. warehouse→warehouse/BI; **we own the write path into an operational system of record.** |
| `operate` | Runs and recovers the workflow as a production system; we design its failure semantics. |
| `quality` | Independent verification and the ship gate. |
| `orchestrate` | Agents in a dev session producing artifacts — **verified clean, 0 hits across 2,356 lines.** |

**BACK-FILL REQUIRED (needs user go — touches released packs):** a `backend` decline row naming the
vendor-spanning case, plus the four-clause licensing back-port still outstanding from `operate`.
