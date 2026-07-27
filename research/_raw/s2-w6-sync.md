# S2-W6 — Cross-system synchronisation semantics

Date of research: 2026-07-27. Method: WebSearch budget was exhausted session-wide before I could
run a single query (200/200 used by other workers) — every result below came from direct WebFetch,
either straight to a known/guessed doc URL or via `html.duckduckgo.com/html/?q=` as a search
substitute (several fetches 403'd: debezium.io, HubSpot community, salesforce.stackexchange.com —
noted as gaps, not papered over).

## Verdict per question

| # | Topic | Well-taught / originating? |
|---|---|---|
| 1 | A→B→A loop | **Well-taught, per-vendor, but only as incident response — not as a named pattern.** |
| 2 | Deletes invisible to incremental sync | **Real and confirmed, badly undertaught as a general principle — vendor docs bury it per-API.** |
| 3 | `updated_at` is a lie | **Thinly taught, scattered across data-eng blogs, no canonical source.** |
| 4 | Conflict resolution as policy | **Taught well, but only inside vendor marketing (named interest), never platform-neutral.** |
| 5 | Backfill vs. steady-state cutover | **Real vendor mechanisms exist (delta tokens); the *seam* itself is undertaught.** |
| 6 | Directionality framework | **No neutral decision framework found — only vendor blogs selling two-way sync.** |
| 7 | CDC/reverse-ETL transfer to n=1 | **Mostly does not transfer — see verdict below.** |

## 1. The A→B→A loop — CONFIRMED, with vendor-specific texture

This is real and it is the single best-documented failure mode in the whole channel, because every
major engine has hit it and written it up.

- **Workato** has a dedicated official doc, *Infinite loops* (`docs.workato.com/en/recipes/infinite-loops`,
  fetched 2026-07-27, no visible authorship byline — Workato Inc. product docs). Verbatim: infinite
  loops occur "most commonly when the recipe is performing a bi-directional sync, such as when data
  moves from application A to application B and back to A" — the exact shape the lead named. Workato's
  own detection is a heuristic, not a guarantee: "unexpectedly high transaction count" or "the recipe
  is triggered when there are no new trigger events." **No built-in loop counter or automatic kill
  switch is documented.** Mitigation is manual: trigger filters + a custom "synced by Workato" field
  on the target object.
- **Zapier**, official help article *Zap is stuck in a loop* (`help.zapier.com/hc/en-us/articles/
  8496232045453`, fetched 2026-07-27): names four loop shapes — cross-Zap triggering, self-triggering,
  "New or Updated" trigger feedback, and email auto-reply cycles. **Zapier does not auto-detect or
  auto-stop loops** — the article's remedy is "turn off the Zap immediately," plus the same
  source-tagging fixes (unique-ID filter field, "Processed by Zap" marker, Find-or-Create instead of
  Create).
- **Make.com**: no dedicated official doc found (one attempt 301-redirected to a generic help
  portal). Evidence is a Make Community thread, moderated by a named community moderator ("samliew"),
  *"scenario runs continuously in infinite loop"* (`community.make.com/t/.../99272`, thread date not
  independently re-verified beyond the fetch). Make **does** ship configurable safety valves — max
  cycles per run, consecutive-error limit, runs-per-minute cap — but the reporting user had them set
  to 1/3/100 and the loop still ran, because those caps bound a single scenario's own recursion, not
  a cross-scenario or cross-webhook feedback loop. Root cause per the moderator: a self-triggering
  webhook where the scenario's own update re-fires the trigger. Fix: don't let the scenario modify the
  resource its own webhook watches, or filter API-originated vs manual updates.
- **n8n**: no first-party "loop protection" feature or doc surfaced. Evidence is third-party
  (`agentforeverything.com`, undated blog) describing the identical shape — a notification workflow
  that logs its own output as a new database row and re-triggers itself — with the fix being
  application-level filtering, not a platform guard.

**Answer to the lead's specific question — do engines detect this by default:** **No engine
auto-detects or auto-kills an A→B→A loop by default.** Make's cycle/error/rate caps are the closest
thing to a platform-level guard, and even those are scoped to one scenario's internal recursion, not
cross-system feedback. Workato's "unexpected transaction count" detection is diagnostic (helps you
notice), not preventive. Every vendor's actual answer is the same three mitigations the consultant's
"35 records" anecdote implies: **source-tagging the write** (a "synced by X" field/flag), **an
updated-by filter** (skip records last touched by the integration user), and **manual disable** as
the backstop. A loop counter and a quiet/debounce window are the two mitigations from the lead's
brief that I found *no* vendor documenting explicitly — worth stating as our added value if we teach
them.

**This is well-taught — per-vendor, as incident response.** It is not taught as a transferable,
named pattern across vendors. That gap (naming the shape once, showing it recurs identically in
Zapier/Make/n8n/Workato) is real and is a legitimate small piece of synthesis wedge, consistent with
§4 of the stage-1 gate.

## 2. Deletes are invisible to incremental sync — CONFIRMED, and worse than the brief suspected

Vendor behaviour is inconsistent enough that this is a genuine, badly-undertaught trap:

- **Salesforce** has an explicit, dated mechanism *and* a hard trap: `getDeleted()`
  (`developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_calls_getdeleted.htm`, fetched
  2026-07-27, Salesforce's own SOAP API reference). Verbatim: results cover "no more than 15 days
  previous to the day the call is executed," and a background purge (every 2 hours, capacity formula
  = 15,000 × license count) can invalidate the window early and return `INVALID_REPLICATION_DATE` —
  at which point the documented recovery is **a full re-sync**, not a resumable cursor. This is a
  precise, checkable, teachable fact: **a sync that goes dark for >15 days on Salesforce has silently
  lost the ability to reconcile deletes and must re-baseline.**
- **Stripe** is the good case: deletion is a soft-delete (`docs.stripe.com/api/customers/delete`,
  fetched 2026-07-27) — the object stays retrievable with a `"deleted": true` flag, *and* a
  `customer.deleted` event fires on the Events API, so an incremental-event consumer sees it without
  a separate deletion feed.
- **HubSpot**: the official webhooks reference (`developers.hubspot.com/docs/guides/api/
  app-management/webhooks`, fetched 2026-07-27) documents a `DELETE` subscription action at the
  object-subscription level, but **does not specify which object types actually support it** — the
  documentation is silent on coverage. (I could not get through to HubSpot's own community threads —
  403 — to corroborate the practitioner-reported gaps the earlier squeeze pass presumably found; flag
  as unverified via community, verified only that the webhook mechanism exists and is under-specified
  in the official reference itself.)
- The general-case majority: **plain REST APIs with only an `updated_at`/`modified_since` cursor
  expose no deletion signal at all.** This is the default, not the exception, for the long tail of
  SaaS tools a solo operator actually connects — Salesforce/Stripe/HubSpot are the well-resourced
  minority.

**Verdict: this is a real, vendor-confirmed, badly undertaught principle** — not one blog post I
found states it as a general rule ("assume your incremental cursor cannot see deletes unless the
vendor names a specific mechanism, and even then check its retention window"). Every treatment found
was vendor-specific and buried in API reference docs, never elevated to a design principle. This is
close to a genuine gap we can own.

## 3. `updated_at` is a lie — thin, no canonical source

Found only third-party/blog treatments, none rising to canonical status:
- `wickedsmartdata.com`, *Incremental Loading Patterns: Timestamps, CDC, and Watermarks* — covers
  clock skew and late data but reads as SEO content, no named author surfaced.
- A "failure modes" page (`systemoverflow.com`) gives one concrete, checkable mechanism worth
  teaching regardless of source quality: **read-replica lag** — if the sync reads from a replica with
  even a 10-second lag behind the primary, a naive `WHERE updated_at > last_cursor` query against the
  replica will miss rows written in that window, and because the cursor advances past them, they are
  **never picked up on the next poll either** unless an overlap window is built in.
- The overlap-window + composite-cursor (timestamp + record ID, or timestamp + dedup-by-ID) pattern
  recurs across three low-authority sources, which suggests it's real practitioner folklore rather
  than a documented standard — nobody I found cites where it originates (it is essentially the
  well-known watermarking technique from streaming systems, e.g. Kleppmann's *Designing Data-Intensive
  Applications* on out-of-order event handling, but none of the automation-specific sources make that
  connection).

**Verdict: confirmed as a real mechanism (clock skew, replica lag, bulk-update-without-timestamp-
touch all genuinely break naive `updated_at` cursors), but there is no canonical, citable source that
teaches it for the iPaaS/vendor-API context specifically.** This is a legitimate synthesis-wedge
candidate: the *general* watermarking theory exists in streaming-systems literature; nobody has
brought it down to "your Zapier polling trigger against a vendor REST API."

## 4. Conflict resolution as a stated policy — taught, but only as vendor marketing

The lead's prior — "most automations pick LWW by not deciding" — is corroborated, and the corrective
writing that exists is **100% vendor content, self-interested, and needs the interest named every
time**:
- **ZigiWave** (Sofia-based; sells **ZigiOps**, a no-code bidirectional integration platform for
  ITSM/DevOps/CRM — Fortune-500-marketed), Medium post *When Two Systems Disagree* (published
  2026-06-17 per fetch): "Last-write-wins is operating silently in a lot of environments right now...
  it is also wrong more often than most people realize." Names three deliberate alternatives: source-
  system-priority-per-field, field-level merge, human-in-the-loop queue for high-stakes records.
- **Stacksync** (sells real-time bidirectional CRM/ERP/DB sync-as-a-service), founder-authored guide
  *Bi-Directional Sync Explained* (Ruben Burdin, CEO, published 2025-09-11,
  `stacksync.com/blog/bi-directional-sync-explained-3-real-world-examples`, fetched 2026-07-27):
  the most complete single treatment found — covers all four conflict policies (timestamp LWW, system
  priority, field-level rules, manual review), **and** independently describes the identical
  source-tagging loop-prevention mechanism found in §1 ("tags or tracks the origin of each change and
  ignores updates that originated from the sync process itself"), **and** covers backfill/incremental
  cutover via "differential sync" + "chunked initial loads." This single vendor post is functionally
  a compressed version of everything the lead asked about in questions 1, 4, and 5 — evidence that
  practitioners who actually build sync engines for a living converge on the same four mitigations
  independently. Cite it, but the interest must be named every time: Burdin is selling the exact
  product category this analysis is about.

**Verdict: taught, but exclusively by vendors selling bidirectional-sync tooling, with zero
platform-neutral treatment found.** This matches the "no discovery wedge, but a synthesis wedge"
finding of stage 1 — the neutral, non-selling version of this advice does not appear to exist yet.

## 5. Backfill vs. steady-state incremental — real mechanism, undertaught seam

Concrete vendor evidence of the *mechanism* (not the *seam*): Microsoft Graph's delta query
(`imrizwan.com/blog/microsoft-graph-delta-query-incremental-sync-2026`, third-party, undated author)
describes the real `deltaLink`/`nextLink` token pair Microsoft Graph issues — the API itself
distinguishes "give me everything" (initial, paginated via `nextLink`) from "give me what changed"
(steady-state, via the persisted `deltaLink`), which is a genuine example of a vendor doing the
backfill→incremental cutover *correctly* at the API contract level. Stacksync's "chunked initial
loads" + "differential sync" is the vendor-tooling equivalent. What's missing from everything found:
**nobody addresses the actual seam** — the moment a backfill (typically bulk/paginated, tolerant of
being interrupted and resumed) hands off to incremental polling, and the specific failure of that
handoff: records changed *during* the backfill window that the backfill's snapshot missed and the
first incremental poll's cursor start-point also misses (an off-by-one gap), or the inverse
duplicate-processing case if the cursor start-point is set too early. This seam is where I'd
concentrate original synthesis.

## 6. Directionality — no neutral framework found

Only vendor content surfaced (Stacksync, ZigiWave), both selling bidirectional sync and therefore
incentivized to make two-way sync look more tractable than one-way, not less — worth flagging as a
bias risk if we lean on them. **No decision framework was found that helps someone choose one-way vs.
two-way** independent of a vendor's product pitch. This looks like a real gap, though I could not
push deep enough (search-budget-constrained) to be fully confident nothing exists in the CRM/MDM
("master data management") literature, which is the more likely home for it than iPaaS blogs.

## 7. CDC / reverse-ETL adjacency — how much transfers to n=1

- **Debezium** (Red Hat, Apache 2.0 — stated from trained knowledge; I could not verify the licence
  or liveness live, `debezium.io` 403'd every fetch attempt today) is the reference implementation of
  **log-based CDC**: reads the DB transaction log (WAL/binlog) directly, so deletes are captured
  natively as discrete events — this is the mechanism, not a teachable pattern, transferable to a solo
  operator only in the sense of *explaining why* vendor REST-API polling (query-based, the only
  option a solo operator actually has against a SaaS tool) structurally cannot see deletes the way
  log-based CDC can. Corroborated third-party (Conduktor — sells a Kafka/data-streaming gateway,
  interest named — glossary entry by Stéphane Derosiaux, published 2026-07-23, fetched 2026-07-27):
  "Hard deletes cannot be captured without additional tracking tables" under query-based CDC.
  **Verdict: the log-based/query-based distinction transfers as an explanatory frame (why your sync
  can't see deletes) but the Debezium tooling itself does not transfer** — a solo operator has no WAL
  access to Salesforce or HubSpot; they are structurally stuck in the query-based regime CDC
  literature treats as the inferior fallback.
- **Reverse ETL** (Hightouch — coined the term, self-reported; Census/Fivetran) positions itself
  explicitly against iPaaS on directionality and control model (Hightouch, *iPaaS vs. Reverse ETL*,
  Alexis Jones, published 2022-12-02, `hightouch.com/blog/ipaas-vs-reverse-etl`, fetched 2026-07-27):
  warehouse-as-hub, declarative "state the end state" batch sync vs. iPaaS's imperative
  step-by-step/point-to-point model. **Name the interest: both Hightouch and Census sell reverse-ETL
  and have an obvious motive to make iPaaS look worse.**
- **CRDTs / offline-first sync**: essentially does not transfer. That literature solves
  automatic, commutative merge without a central authority for arbitrary concurrent edits — relevant
  to someone *building* a sync engine, irrelevant to someone *configuring* Zapier/Make/n8n between two
  SaaS tools that neither expose CRDT-compatible merge semantics nor need one, because there's always
  a single source of truth per field available if someone decides on it (§4). The one transferable
  idea, worth a sentence not a section: CRDTs exist *because* LWW is lossy, which is the same warning
  ZigiWave/Stacksync give from the vendor side — convergent evidence, different literatures.

### My verdict on the `data`/`automation` reverse-ETL ruling

**The ruling holds, but reverse ETL sits exactly on the boundary and needs an explicit two-part
statement, not a single-sentence assignment.** Evidence for a split:
- The **outbound batch mechanism** (what changed in the warehouse, chunked/differential loading,
  scheduling against a model) is squarely `data`'s existing mechanics — it's an ELT job reading a
  governed dataset.
- But the moment that job **writes into a CRM/support tool that humans and other automations also
  edit**, it inherits every problem this channel investigated: idempotent upsert (so a re-run doesn't
  duplicate), conflict against a human's concurrent edit in the CRM UI, and — the sharpest evidence
  for the ruling — **the A→B→A loop risk is real for reverse ETL too** if the destination CRM has its
  own automation that writes back toward analytics (e.g., a Salesforce flow that logs an activity,
  which a tracking pipeline reads back into the warehouse). Hightouch and Census both had to build
  "sync run" idempotency and match-key upsert logic into their own products specifically because
  landing in an operational system of record is not the same problem as landing in another warehouse
  table — which is independent, vendor-side confirmation that the write-path disciplines this channel
  covers are a real, separate concern from `data`'s modeling concern.

**Recommended precise wording for the boundary doc:** `data` owns *what* gets synced and its
warehouse-side shape and cadence, including when the destination is reverse-ETL'd; `automation` owns
*the write itself* — idempotency, conflict against the destination's own edits, loop risk, and
reconciliation — the instant the destination is an operational system of record, regardless of
whether the job originated as a warehouse batch (reverse ETL) or a point-to-point trigger (iPaaS).
This is narrower and more defensible than either "data owns reverse ETL" or "automation owns reverse
ETL" as a blanket rule.

## Gaps I could not close

WebSearch was fully exhausted (200/200) before my first query ran, so every citation above is a
WebFetch either to a guessed/known URL or through DuckDuckGo HTML as a substitute — several
first-party sources 403'd (debezium.io docs, HubSpot and Salesforce community threads, salesforce.
stackexchange.com) and I could not independently re-verify community-reported HubSpot deletion-object
coverage gaps beyond the official (and silent-on-coverage) webhooks reference. Enterprise GRC/MDM
literature on directionality (§6) is unexplored — flagging it as the most likely place a neutral
framework actually lives, not iPaaS blogs.
