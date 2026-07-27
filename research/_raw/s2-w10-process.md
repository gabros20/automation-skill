# S2-W10 — Process capture, trigger design, workflow vocabulary, RPA decline

Worker: W10. Date: 2026-07-27. Constraint hit: **session WebSearch budget was already exhausted
(200/200) before my first call** — every finding below comes from direct WebFetch against known/
guessed URLs plus my trained knowledge, flagged where I could not independently verify. No outward
side effects; read-only throughout.

---

## 1. Capturing the business rule — what survives n=1

Tested four candidate methods against "one person, an afternoon, no room of stakeholders":

| Method | Verdict for n=1 | Evidence |
|---|---|---|
| **Event storming** | **DECLINE** | Wikipedia, confirmed by fetch: "EventStorming is a workshop-based method... requires having the right people present" — explicitly needs someone who "know[s] the questions to ask (typically developers) and those who know the answers (domain experts)." Alberto Brandolini's own framing is inherently multi-role. A solo founder is both roles at once, which the method doesn't anticipate — it's built to close a *gap between* two people, and there is no gap to close. |
| **Process mining (Celonis, van der Aalst)** | **DECLINE, harder than event storming** | Fetched celonis.com directly: process mining requires **event log data already sitting in systems of record**, and is positioned for "enterprises," "thousands of organizations," multi-system landscapes, departmental silos. It doesn't capture a *new* rule at all — it discovers rules already executing inside deployed systems. A pre-launch or newly-defined business rule has no event log to mine. Wrong tool entirely, not just wrong altitude. |
| **BPM process-discovery workshops (swimlane diagramming, "as-is/to-be")** | **DECLINE** | Same shape as event storming — facilitator + stakeholder room is baked into the practice, not incidental to it. |
| **Decision tables** | **SURVIVES — verdict: use this** | Wikipedia, confirmed by fetch: dates to 1960s–70s business programming (DETAB/65, 1965; FORTAB, 1962), explicitly framed as letting "developers and policy experts work from the same information, the decision tables themselves" and "easier to understand and review than code." No facilitator or workshop requirement anywhere in the practice — it is a table one person fills in. |

**The n=1 method (synthesis, originated — flagging clearly, this composite is not itself a named
method in the literature):** a **rule card** — one page, four parts:
1. **Trigger statement** — one sentence, in the vocabulary of §3 below ("when a Stripe subscription
   moves from `trialing` to `active`...").
2. **Steps in order** — a plain numbered list (this is what Workflow Patterns' *Sequence* names —
   see §2).
3. **A decision table for every branch point** — condition columns, action columns, one row per
   case *including the case you'd rather not think about* (customer downgrades same day they
   upgraded; payment fails on retry #3). The table's rows double as the automation's test cases —
   this is the load-bearing reason to prefer a table over prose: prose hides the missing row, a
   table's blank cell is visible.
4. **Exceptions** — what happens when a step fails partway (this is where §4's compensation
   literature and the family's saga/compensation material take over; out of my lane, ceded to W2).

This card is deliberately *not* a BPMN diagram, a swimlane chart, or an event-storming board — all
three assume a second reader who wasn't in the room. The rule card assumes the reader wrote it.

---

## 2. Workflow-patterns vocabulary harvest

**Liveness verified, and it is dead exactly as Stage 1 found:** `WebFetch` on
`https://www.workflowpatterns.com` returned `SSL routines:OPENSSL_internal:TLSV1_ALERT_UNRECOGNIZED_NAME`
— an SNI/TLS-level failure, not a 404 or a redirect. The domain does not serve a working TLS
handshake. **Do not link to workflowpatterns.com in the shipped pack.** (I could not reach the
Wayback Machine either — "Claude Code is unable to fetch from web.archive.org" — so I cannot offer
an archived mirror as a citation target; cite the book instead, see below.)

**Citable anchor confirmed to exist (partially):** the 2016 MIT Press book *Workflow Patterns: The
Definitive Guide* (Russell, ter Hofstede, van der Aalst — ISBN 9780262029833) — I could not read the
publisher page itself (403 Forbidden on `mitpress.mit.edu`), but the ISBN/title/author match is a
real, findable book (trained-knowledge, medium confidence, not independently fetched — flagging per
the citation rule). The **original academic anchor I did verify by fetch**: Wikipedia's Workflow
Patterns article, confirming the foundational paper is van der Aalst, ter Hofstede, Kiepuszewski,
Barros, **"Workflow Patterns," *Distributed and Parallel Databases*, 2003** (the "original 20
workflow patterns" — later expanded across control-flow, data, resource, and exception-handling
families).

**My verdict on the 5–8 ruling: affirm it, at 8, with one substitution note.** The brief's seven
(sequence, parallel split, synchronising merge, exclusive choice, discriminator, cancel region,
multi-instance) are the right shape-vocabulary for someone building *on top of* existing tools
(Zapier/n8n/Temporal/code), not building a workflow *engine*. I'd add **Simple Merge** (the trivial
XOR-join pairing with Exclusive Choice — "branches never run in parallel, so merging them back is
free, no synchronization needed") as the 8th, because once Exclusive Choice is explained, Simple
Merge is one sentence and closes the pair the way Parallel Split/Synchronization already closes
theirs. Two calibration notes worth stating in the pack:
- **"Synchronising Merge" (the brief's choice, WP7 in van der Aalst's numbering — an OR-join) is the
  sharper pick over plain AND-join Synchronization** for automation specifically, because real
  automations built on OR-splits ("notify via whichever channels the user opted into") don't know at
  design time how many branches will actually be active — the OR-join's whole point is waiting for
  *however many branches actually fired*, not a fixed count. This is a materially better vocabulary
  choice than the "textbook" AND-join and is worth calling out as such in the pack, not just listing
  flatly.
- **Discriminator** earns its slot for a genuinely common automation shape absent from most casual
  writing on this: race N providers/paths, take the first to finish, silently drop the rest (fallback/
  failover across vendors) — without Discriminator as a name, people re-invent it badly (usually by
  not cancelling the losers, which leaks work).

**Everything else — declined, explicitly, as enterprise-BPM altitude:** the remaining ~30+ control-
flow patterns (Interleaved Parallel Routing, Milestone, Critical Section, Deferred/Blocking
Discriminator variants, structured vs. arbitrary cycles, Implicit Termination, etc.) plus the entire
data-pattern, resource-pattern, and exception-handling-pattern families are aimed at people
*implementing* workflow engines (Camunda, Flowable, the original YAWL engine), not people composing
automations on top of one. **Ship the decline as a finding**, per instruction: name the excluded
families explicitly in `SOURCES.md` rather than silently omitting them, so a reader who goes looking
for pattern #23 knows it was cut on purpose, not missed.

**Börger's critique (DOI verified to resolve via Springer's redirect chain: `10.1007/s10270-009-0119-2`,
*Software and Systems Modeling*; full text paywalled — could not fetch past the Springer auth wall,
so the argument below is trained-knowledge, flagged lower-confidence, not independently read this
session):** Egon Börger, **"Approaches to modeling business processes: a critical analysis of BPMN,
workflow patterns and YAWL"** (2010/2011), argues the three frameworks never converged on a shared
formal semantics — each is validated against the *pattern catalog itself* (does this notation support
pattern #47?) rather than against a rigorous ground model, and proposes Abstract State Machines as
the missing rigorous layer. **This is exactly the ammunition the decline argument needs**: it is a
non-vendor, peer-reviewed voice saying the "enterprise altitude" version of this vocabulary is itself
fragmented and unresolved among its own specialists — which makes harvesting a small, named,
practically-motivated subset (rather than deferring to "the full BPMN/YAWL canon") the *more*
defensible choice, not a lesser one. State this framing explicitly if the pack cites Börger: he is
attacking the rigor of the *whole field*, which argues for our narrow harvest, not against it.

---

## 3. Trigger design

**Taxonomy, cost/miss/failure-mode per type:**

| Trigger | Cost | What it misses | How it fails |
|---|---|---|---|
| Schedule (cron) | Cheapest, no dependency on source system cooperation | Anything that happens between runs; can't react to urgency | DST double/zero-fire (below); silent stop with no signal (cede to `operate`'s dead-man's-switch, don't re-teach) |
| Webhook/event | Near-real-time, low cost per event | Requires the source to support delivery and to actually deliver (silent outage = silent gap) | At-least-once redelivery duplicates work absent dedupe (backend's territory, `service-integration.md:69-72`); webhook endpoint down = events dropped unless source retries |
| Record-change/polling | No dependency on source having webhooks | Freshness bounded by poll interval; misses deletes (ceded to W6 sync) | Rate-limited by the source; see trade-off below |
| Manual | Zero engineering cost, highest judgment | Doesn't scale, no audit trail unless built in | Forgotten entirely — the silent failure mode of "manual" is a person, not a system |
| Agent-initiated | Can react to judgment calls a rule can't encode | Non-deterministic trigger timing/reasoning, needs its own approval/guardrail layer | Owned by `ai` — approval-on-tool-call is their frame, not ours (per stage-1 gate) |

**Over-broad trigger conditions — the design discipline (against the Gmail-filter "every newsletter
lands in the urgent client folder" incident given in the brief):** the failure pattern is a trigger
condition written as a **positive match on a weak signal** (a keyword, a sender-domain substring)
instead of a **negative-space check against the specific case it's meant to catch**. The discipline
that generalizes: write the trigger condition as a decision-table row (§1) with an explicit **"what
else could make this true"** column before shipping it — the newsletter incident is what happens when
that column is never filled in. A trigger condition without a documented false-positive class is not
finished.

**Schedule ambiguity — cron/DST, verified this session, date-stamped 2026-07-27, four platforms:**

- **AWS EventBridge Scheduler** (docs.aws.amazon.com/scheduler, fetched 2026-07-27): explicit,
  documented, asymmetric handling — *"When time shifts forward in the Spring... if a cron expression
  falls on a non-existent date and time, your schedule invocation is skipped. When time shifts
  backwards in the Fall... your schedule runs only once and does not repeat its invocation."* Applies
  per the IANA timezone set on the schedule; UTC schedules are unaffected by definition.
- **Google Cloud Scheduler** (docs.cloud.google.com, fetched 2026-07-27): weaker guarantee, explicitly
  wall-clock-based — *"Cloud Scheduler runs on wall clock time... In instances where a time can occur
  twice... your scheduled job might observe execution anomalies."* GCP's own documentation does **not**
  specify whether spring-forward is skip-or-run, and explicitly recommends UTC to sidestep the
  question rather than guaranteeing behavior in local time.
- **GitHub Actions** (docs.github.com, fetched 2026-07-27): UTC by default, but supports IANA-timezone
  scheduling; on DST, *"scheduled workflows in skipped hours advance to the next valid time"* (e.g. a
  2:30am schedule that doesn't exist becomes 3:00am) — a **third distinct behavior** from AWS's "skip
  entirely." Also worth carrying into the pack regardless of DST: GitHub Actions schedules **can be
  delayed at the top of the hour under load**, and public-repo scheduled workflows **auto-disable
  after 60 days of repo inactivity** — a silent-stop mode specific to this platform.
- **Vercel Cron** (vercel.com/docs/cron-jobs, fetched 2026-07-27): sidesteps the entire problem by
  design — *"The timezone is always UTC"*, no local-time option exists at all. Structurally immune to
  DST ambiguity; the trade-off is the reader must do the local-time-to-UTC conversion themselves and
  re-derive it if their business's relevant local time ever changes (e.g. "9am store-opening" needs a
  bi-annual manual cron edit if it must track local wall-clock).

- **n8n Schedule Trigger** (docs.n8n.io, fetched 2026-07-27 — added per controller advisory): timezone
  resolves workflow-level setting → instance timezone (self-hosted default `America/New_York`; Cloud
  attempts to detect the owner's timezone, else GMT) → six-field cron incl. optional seconds. **The
  documentation makes no mention of DST behavior or caveats at all** — this is worse than any of the
  four platforms above, not merely undocumented-and-fine: n8n is the highest-install self-hosted
  automation tool in this family's own W1 findings (~9K installs), and its own docs are silent on what
  happens to a Schedule Trigger on the clock-change day. **Worth flagging as a standalone risk item in
  the pack**: if you build the schedule on n8n, you cannot look up the answer — you have to either
  force the trigger to UTC (sidestepping the question, per Vercel's model) or test it empirically
  across a real transition.

**Verdict for the pack:** these are genuinely different behaviors across five platforms (AWS:
skip-forward/run-once-back; GCP: undefined "anomalies," push to UTC; GitHub: forward-shift to next
valid time; Vercel: UTC-only, no ambiguity possible; **n8n: undocumented, a gap not a behavior**) —
worth a comparison table in the pack rather than a single "cron has DST problems" hand-wave, because
the *specific* failure mode (silently skipped vs. silently doubled vs. shifted an hour vs. simply
unknown) determines what monitoring catches it, and on n8n specifically, nothing will catch it because
the platform never told you what to expect.

**Polling frequency vs. rate limits vs. freshness — the three-way trade-off:** poll more often →
fresher data, but burns rate-limit budget faster and risks 429s that then force backoff, which
*widens* the actual freshness gap right when you needed it tightest (e.g., end of month batch
periods). No single source found this framed as a named trade-off triangle in the literature I could
reach this session (search budget exhausted before I could look); this reads as **origination** for
the pack rather than a citation — flag it that way, don't dress it up as discovered.

**Trigger idempotency — the same underlying change firing two triggers:** distinct from the
provider-redelivery dedupe backend already owns (`service-integration.md:69-72`, dedupe by the
provider's event ID). The automation-specific residue: the **same business event reaching the
automation via two different trigger paths** — a webhook fires *and* the next scheduled reconciliation
poll independently discovers the same change. The discipline: derive the idempotency key from the
**business event's identity** (e.g., "invoice #4471 marked paid"), not from the trigger mechanism that
delivered it, so a webhook-path execution and a polling-path execution of the same event collapse to
one. This is a genuine, narrow, unowned residue — worth stating explicitly as ours, distinct from
backend's redelivery framing.

---

## 4. The RPA decline

**Verdict: affirm the decline, evidence supports it, no evidence found that RPA has "legitimately
improved" enough to overturn it.**

- **Wikipedia (fetched 2026-07-27), citing MIT Sloan Management Review** — the one non-vendor,
  citable, named source found this session: **Chris DeBrusk, "Five Robotic Process Automation Risks
  to Avoid," *MIT Sloan Management Review*, October 24, 2017.** Quoted critique: RPA carries "risks of
  stifling innovation and creating a more complex maintenance environment of existing software that
  now needs to consider the use of graphical user interfaces in a way they weren't intended to be
  used." **Name the interest:** DeBrusk was an Oliver Wyman partner — a transformation-consulting
  interest (sells the surrounding advisory work), not an RPA-vendor interest; treat as a mild but real
  conflict, milder than a vendor's.
- **Wikipedia's own technical framing (fetched)**: *"Current RPA solutions demand continual technical
  support to handle system changes, therefore it lacks the ability to autonomously adapt to new
  conditions"* — this is the "maintenance liability with no deprecation notice" framing from the
  brief, independently corroborated: a UI-scraping bot has no version signal because it isn't
  consuming a versioned contract at all, it's imitating a human clicking through a page that owes it
  nothing.
- **What I could not verify this session (name the gap, don't paper over it):** I attempted to reach
  ThoughtWorks Technology Radar's specific historical RPA blip (there is a well-known "hold"-adjacent
  assessment I recall from trained knowledge, roughly 2019, but could not locate or fetch the specific
  archived page — current Radar Vol. 34, fetched directly, does not mention RPA at all, which is
  itself a data point: RPA has fallen off ThoughtWorks' current radar entirely, consistent with declining
  mindshare, but I cannot cite the historical blip's exact wording without the page). Also attempted
  Deloitte and EY RPA-failure-rate pages (both 404'd) and a Gartner RPA page (403) — could not reach
  the "30–50% of RPA projects fail" statistic that circulates widely; **do not cite that number without
  a live source**, it did not survive verification this session and should not ship unverified.
- **No evidence found of RPA "legitimately improving" enough to reverse the ruling.** Nothing fetched
  this session (vendor or independent) claims the screen-scraping-fragility problem is solved; the
  UiPath maintenance-debt blog I attempted (guessed URL) 404'd, so I have no vendor rebuttal to weigh
  either. **Ruling stands on the evidence available, with the caveat that the strongest independent
  citation (MIT Sloan/DeBrusk) is 2017 and I could not find anything more recent that engages the
  question directly — the decline is well-supported but the evidence base is thinner and older than
  I'd like.**

**Framing for the pack (affirms the brief's proposed boundary):** prefer the API; when there is no
API, you have knowingly bought a maintenance liability with no deprecation notice — a UI-scraping bot
breaks on a CSS/DOM change with zero version signal, unlike an API integration where a deprecation
header or changelog gives warning. Teach this boundary, don't teach the RPA tools.

---

## 5. When NOT to automate

**Originating, not covered** — I found no single source this session (or in trained knowledge) that
states a **frequency × variability × consequence-of-error** threshold framework as such. Related
fragments exist but none assembles the triangle:
- The general management-consulting aphorism (commonly attributed to Bill Gates, *The Road Ahead*,
  1995 — trained knowledge, not fetched this session, flag accordingly) that "automation applied to
  an efficient operation will magnify the efficiency; automation applied to an inefficient operation
  will magnify the inefficiency" is the closest **named, quotable** fragment for the "you automated a
  broken process" failure mode — but it's a one-liner, not a framework, and I could not independently
  verify the exact wording/sourcing this session.
- Nothing found (or recalled) that names the maintenance-cost-exceeding-manual-cost crossover as a
  deliberate decision point with a threshold test.

**Recommendation:** this section should be written as the pack's own synthesis, clearly labeled as
such in `SOURCES.md` (matching the family's existing pattern for originated content, e.g. `quality`'s
and `operate`'s precedent for naming what's original vs. cited) — proposed shape: three axes
(frequency: how often does this actually run; variability: how many of the decision-table's rows are
real vs. hypothetical; consequence-of-error: what breaks, and who notices, when the automation is
wrong) with the failure modes named against each: low-frequency + high-setup-cost automations that
never break even from disuse; high-variability processes forced into a decision table that's mostly
`ELSE → escalate to human` (a decision table that's 90% one row is a tell the process wasn't ready to
automate); high-consequence errors that need a human approval node regardless of how deterministic the
rest of the flow is (hands off to W3/`ai`'s approval material at that boundary).

---

## Sources actually fetched this session (2026-07-27) — provenance ledger

- `https://www.workflowpatterns.com` — SSL/SNI failure confirmed (dead)
- `https://www.enterpriseintegrationpatterns.com/patterns/conversation/CompensatingAction.html` —
  full text + licence scope extracted
- `https://en.wikipedia.org/wiki/Workflow_patterns` — foundational paper citation confirmed
- `https://idp.springer.com/...` → `link.springer.com/article/10.1007/s10270-009-0119-2` — DOI
  resolves (Börger paper exists), full text paywalled
- `https://en.wikipedia.org/wiki/Event_storming` — workshop-requirement confirmed
- `https://en.wikipedia.org/wiki/Decision_table` — history + framing confirmed
- `https://www.celonis.com/process-mining/what-is-process-mining/` — enterprise-scale framing
  confirmed, vendor interest named
- `https://en.wikipedia.org/wiki/Robotic_process_automation` — MIT Sloan citation + technical critique
  confirmed
- `https://en.wikipedia.org/wiki/Cron` — thin, no DST specifics found here (superseded by platform
  docs below)
- `docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html` — AWS DST behavior, full text
- `docs.cloud.google.com/scheduler/docs/configuring/cron-job-schedules` — GCP DST behavior, full text
- `docs.github.com/.../events-that-trigger-workflows` — GitHub Actions schedule/DST/delay/auto-disable
- `vercel.com/docs/cron-jobs` — Vercel UTC-only cron, full text
- `docs.n8n.io/.../n8n-nodes-base.scheduletrigger/` — n8n timezone resolution confirmed, DST
  documentation gap confirmed (added after controller advisory)
- Attempted and failed/blocked: `mitpress.mit.edu` (403), `web.archive.org` (tool-level block),
  `gartner.com` (403 ×2), `deloitte.com` (404 after redirect), `ey.com` (404),
  `thoughtworks.com/radar/techniques/robotic-process-automation-rpa` (404),
  `martinfowler.com/bliki/RoboticProcessAutomation.html` (404), `uipath.com` maintenance-debt blog
  (404, guessed URL). None of these are cited as live sources above; where trained knowledge fills
  the gap it is explicitly flagged as such.
- **WebSearch: 0 successful calls — session budget was already exhausted (200/200) before my first
  query.** This constrained me to WebFetch-only and trained knowledge for the entire task; flagging
  for the controller since this affects confidence across all five sections, not just one.
