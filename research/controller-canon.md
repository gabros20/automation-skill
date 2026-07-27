# Controller canon — `automation`

**Channel:** the controller's own trained knowledge.
**Written:** 2026-07-27, **before any stage-1 worker result landed**, deliberately, so it is an
independent channel rather than a summary of the others.

## Status of everything in this file

**This is a hypothesis generator, not a source.** Binding family rule: trained knowledge may
propose, prime, and structure — it may never ship as fact. Every claim below is one of:

- `[CANON]` — a named work, author, and year I am confident exists. Still verify the exact wording
  and date before citing; do not quote from this file.
- `[MECHANISM]` — a technical mechanism I am confident is real and widely implemented. Safe to
  reason from, unsafe to attribute to a specific vendor without checking.
- `[VOLATILE]` — a tool, licence, price, or version. **Assume stale.** The `ai` build shipped a
  hallucinated model table from exactly this class and it took a BLOCKER review to catch. Nothing
  here may be shipped without live re-verification.
- `[PRIOR]` — my own belief about how this domain behaves, with no source. Needs corroboration
  from a real channel or it is dropped.

Where a worker contradicts this file, **the worker wins.** They read sources; I recalled.

---

## 1. The strongest candidate canon: Enterprise Integration Patterns

`[CANON]` **Hohpe & Woolf, *Enterprise Integration Patterns*, Addison-Wesley, 2003.** 65 patterns
for message-based integration between systems. This is, I believe, the single most on-point body of
prior art for this skill, and it is routinely forgotten because it predates the microservices
literature that reheated half of it.

Patterns I expect to be directly load-bearing:

| Pattern | Why it matters here |
|---|---|
| **Idempotent Receiver** | The named ancestor of "handle the duplicate webhook" |
| **Dead Letter Channel** | The named ancestor of DLQ |
| **Guaranteed Delivery** | Where at-least-once comes from |
| **Correlation Identifier** | How you match an async vendor response to the request that caused it |
| **Process Manager** | A stateful orchestrator — the ancestor of the workflow engine |
| **Message Filter / Content-Based Router** | The trigger-condition layer every iPaaS ships |
| **Claim Check** | Payload-size management across vendor limits |
| **Scatter-Gather** | Fan-out to several vendors, aggregate |

`[CANON]` **Hohpe, "Your Coffee Shop Doesn't Use Two-Phase Commit", IEEE Software, 2005.** Argues
the real world runs on asynchrony, correlation, and **compensation** rather than distributed
transactions — a coffee shop takes your money, then handles the failure case with a refund or a
remake. **If my substrate hypothesis has a canonical ancestor, this essay is it.** Verify the exact
year and venue; I am confident of the argument and less of the metadata.

**Licence caution:** the book is a commercial Addison-Wesley title. `enterpriseintegrationpatterns.com`
publishes pattern summaries publicly. **No lift.** Ideas and citation only, exactly as the family
handled the CC BY-NC-ND Google SRE books. Verify the site's terms before quoting anything longer
than a phrase.

## 2. The transaction/compensation lineage

`[CANON]` **Garcia-Molina & Salem, "Sagas", ACM SIGMOD, 1987.** A long-lived transaction is
decomposed into sub-transactions T₁…Tₙ, each with a compensating transaction C₁…Cₙ. On failure at
step k, run C_{k-1}…C₁ in reverse. **The load-bearing property for us: a compensation is not a
rollback.** It is a *new forward action with its own side effects* that approximately undoes the
previous one. A refund is not an un-charge. An apology email is not an un-sent email.

`[PRIOR]` I believe this distinction is the sharpest teachable thing in the whole domain and is
almost universally taught in a microservices frame (service A, service B, both yours) rather than an
integration frame (you, and Stripe, and a CRM you cannot deploy to). **If a worker finds that
integration-framed compensation is well covered somewhere, my §1 wedge weakens substantially.**

`[MECHANISM]` **Exactly-once delivery is impossible; exactly-once *processing* is achievable.** The
Two Generals' problem forbids the former. The latter is reached by at-least-once delivery plus a
dedup key plus an idempotent handler. Every serious vendor states this; most automation users have
never heard it.

`[CANON]` **Transactional outbox / inbox** — Chris Richardson, `microservices.io`. Outbox for
"write my DB and publish the event atomically"; inbox for "record that I processed this message id."
Already owned by `backend`'s `async-and-messaging.md` in our family — check before claiming.

## 3. Retry, backoff, and the failure primitives

`[CANON]` **Marc Brooker, "Exponential Backoff and Jitter", AWS Architecture Blog, ~2015.** Full
jitter vs equal jitter vs decorrelated jitter, with simulation results. Retries without jitter
synchronise clients into a thundering herd.

`[CANON]` **Michael Nygard, *Release It!*, Pragmatic Bookshelf, 2007 (2nd ed. 2018).** Circuit
Breaker, Bulkhead, Timeout, Fail Fast, Steady State, Test Harness. Commercial title — ideas and
citation only.

`[MECHANISM]` **Retry budgets / client-side throttling.** Cap retries as a *fraction of successful
requests* rather than per-request, so a broad outage cannot multiply your load against a vendor who
is already failing. I associate this with the Google SRE book's handling of overload. Verify.

`[PRIOR]` **The retry/rate-limit interaction is the specific trap here.** Retrying into a 429
against a vendor you do not control converts a transient failure into a sustained ban. Vendors
publish very different schemes — token bucket, leaky bucket, sliding window, secondary/abuse limits
that are deliberately undocumented. **A retry policy written without reading the specific vendor's
limit document is a guess.** I expect this to be badly undertaught.

## 4. Webhooks: the highest-density hazard cluster

`[MECHANISM]` Things I am confident are true of webhook delivery in general, each needing a specific
vendor citation before shipping:

1. **Delivery is at-least-once.** Duplicates are normal, not exceptional.
2. **Ordering is not guaranteed.** A `created` can arrive after an `updated`.
3. **Slow endpoints cause duplicates.** If you process synchronously and exceed the vendor's
   timeout, they redeliver — so your slow success becomes a duplicate side effect. **The fix is
   ack-fast-then-process-async**, and I believe this is the single most common production defect in
   this domain and is undertaught relative to its frequency. `[PRIOR]` on the frequency claim.
4. **Signature verification is mandatory and has a replay dimension** — HMAC over the raw body plus a
   timestamp with a tolerance window. Verifying the signature but not the timestamp leaves you
   replayable. Stripe's `Stripe-Signature` with a default tolerance (I recall 5 minutes — `[VOLATILE]`,
   verify) is the reference implementation.
5. **The raw body matters.** Parsing JSON before verifying invalidates the HMAC. A classic
   framework-middleware footgun.
6. **Delivery ids exist and should be your dedup key** — e.g. GitHub's `X-GitHub-Delivery`.
   `[VOLATILE]` on the exact header names.
7. **Endpoints must be idempotent under replay**, because every serious vendor ships a manual
   "resend" button that support staff will eventually press.

`[CANON]` **The `Idempotency-Key` HTTP header field** is, I believe, an IETF HTTPAPI working-group
draft (`draft-ietf-httpapi-idempotency-key-header`). **Verify its status precisely** — draft vs RFC
matters and I am not confident. Stripe popularised the header; the standardisation effort came after.

## 5. Sync semantics — the second hazard cluster

`[MECHANISM]` Cross-system synchronisation failure modes I am confident are real:

- **The infinite loop.** A writes to B; B's change event triggers a sync back to A; A's change event
  triggers B. Classic iPaaS incident. Mitigations: source-tagging the write, a loop-detection
  counter, or an updated-by filter. `[PRIOR]` that this is the #1 self-inflicted iPaaS outage.
- **Incremental sync cannot see deletes.** A cursor over `updated_at` never returns a deleted row.
  You need tombstones, a deletion feed, or a periodic full reconcile. **This is a genuine silent
  data-divergence generator.**
- **`updated_at` is a lie under clock skew** and under bulk edits that do not touch it. Watermarks
  need overlap windows and dedup.
- **Conflict resolution must be a stated policy**, not an accident: last-write-wins, source-of-truth
  per field, or manual queue. Most automations pick LWW by not deciding.
- **The initial backfill is a different program from the incremental sync** and is where rate limits
  actually bite.

## 6. Reconciliation — the third cluster, and a likely wedge

`[PRIOR]` My belief: **event streams lose events, and the only defence is a periodic comparison
against the system of record.** Fintech knows this as reconciliation — compare your ledger against
the PSP's settlement report daily, produce a drift report, and have a defined path for each
discrepancy class. I believe the engineering writing lives with ledger/payments companies (Modern
Treasury and Increase both publish substantial engineering content — `[VOLATILE]`, check liveness
and whether it is teaching or marketing) and **is essentially never generalised to "any third-party
integration."**

If that generalisation is genuinely absent, it is a strong wedge candidate: *every* automation that
depends on webhooks needs a reconciliation loop, and almost none have one, because the literature
that teaches it is filed under payments.

## 7. Human-in-the-loop — the flagship candidate, and my honest doubt

`[MECHANISM]` The primitive exists in every serious engine, which weakens a naive "nobody covers
this" claim:

| Engine | Approval primitive |
|---|---|
| BPMN / Camunda / Flowable / Zeebe | **User Task** with assignee, candidate groups, due date, and boundary timer events for escalation |
| Temporal | Signals + await-with-timeout |
| AWS Step Functions | `.waitForTaskToken` |
| Inngest | `step.waitForEvent` with a timeout |
| n8n / Zapier / Make | Approval/wait nodes `[VOLATILE]` |

`[PRIOR]` **So the mechanism is covered and the policy is not.** What I have never seen taught
coherently in one place:

- **What happens on timeout — default-deny or default-allow?** This is a security decision dressed
  as a config field. Default-allow-on-timeout is how an unattended workflow does something nobody
  approved.
- **Who may approve**, and whether the approver may be the requester. Separation of duties collapses
  at n=1 exactly as incident-command roles do in `operate` (I13) — and the honest answer for a solo
  operator is *not* "approve your own step", it is "which class of action must wait for a human at
  all, given that the human is you and you are asleep."
- **Escalation** when the approver does not respond.
- **The approval's evidence** — what the approver actually saw. An approval on a summary is not an
  approval of the payload.
- **Bulk approval** as an anti-pattern: an approve-all button converts a gate into a formality.

This maps directly onto the family's own `solo-founder-agent-operating-model.md`, which assigns
`automation` the enforcement half of autonomy governance: *"enforces triggers, execution limits,
retries, idempotency, and human-in-the-loop steps."* **If BPM turns out to teach this well, the
flagship claim moves to reconciliation or compensation.** I want a worker to try hard to falsify it.

## 8. Formal workflow theory — my prior is that it is mostly residue

`[CANON]` **van der Aalst et al., Workflow Patterns** (`workflowpatterns.com`, ~2003 onward; 20
original control-flow patterns, later extended past 40, plus data and resource pattern sets). Also
BPMN 2.0 (OMG, 2011), YAWL, WfMC's 1995 reference model, Petri-net workflow modelling.

`[PRIOR]` **This is rigorous and mostly useless to our reader.** A solo founder wiring Stripe to a
CRM does not need Deferred Choice or Multiple Instances Without A Priori Runtime Knowledge. The one
place it earns its keep is as *vocabulary*: naming the control-flow shape you actually built
(sequence, parallel split, synchronising merge, discriminator, cancel region) so you can reason
about failure inside it. **Recommendation to stage 2: harvest 5–8 patterns as vocabulary, cite the
source, and explicitly decline the rest.** Ship the decline as a finding, not a silence.

`[PRIOR]` **RPA is a related trap.** UiPath/Automation Anywhere/Blue Prism/Power Automate Desktop
automate the *UI* of systems that have no API. It is real, enterprise, and largely a debt-generating
technology — a screen-scraping bot breaks on a CSS change with no version signal at all. I expect it
is out of scope for our reader, but the *reason* it is out of scope is a teachable boundary: **prefer
the API, and when there is no API, know you have bought a maintenance liability with no deprecation
notice.**

## 9. The tool landscape — ALL `[VOLATILE]`, none shippable from this file

Listed to shape search queries, not to be cited. Every licence below must be re-verified against the
actual root licence files under the four-clause rule; several of these are known-tricky.

- **Hosted iPaaS / no-code:** Zapier, Make (ex-Integromat), Workato, Tray, IFTTT, Pipedream
  (code-friendly).
- **Self-hostable workflow engines:** **n8n — licence is *not* OSI open source** (Sustainable Use
  License / "fair-code"; verify precisely, this is exactly the trap clause 1 exists for) · Windmill ·
  Activepieces · Kestra · Node-RED (Apache-2.0, OpenJS Foundation).
- **Code-first durable execution:** Temporal · Inngest · Restate · Hatchet · Trigger.dev · DBOS ·
  Cloudflare Workflows · Azure Durable Functions · AWS Step Functions · Google Cloud Workflows.
  **Note the collision:** `backend`'s router already names Temporal and Hatchet by name.
- **Unified API / auth layers:** Merge.dev, Nango, Apideck, Paragon. `[PRIOR]` This is an
  under-discussed category that directly serves the multi-vendor credential problem — one integration
  surface instead of N OAuth dances. Worth a real look.
- **Reverse ETL:** Hightouch, Census. (Grouparoo — I believe dead; a liveness-clause case if so.)
- **Agentic layer, 2026:** n8n AI agent nodes, Zapier's agent product, Make AI, Lindy, Gumloop,
  Relay.app, plus MCP-connected everything. **Maximum marketing density; minimum evidence density.**

## 10. Cost and quota — a clean transfer from `operate`

`[MECHANISM]` Hosted automation is billed **per task / per operation / per step**, not per user.
That makes spend scale with *activity*, which is precisely the class `operate`'s I7 says must carry
a circuit breaker. A misconfigured trigger, a sync loop, or an agent step in a retry loop burns
quota with no user-visible symptom until the bill or the hard stop arrives.

`[PRIOR]` The distinctive twist versus `operate`: **the quota is the vendor's, so exhausting it is
an availability event you cannot fix by paying more quickly.** Hitting a plan ceiling mid-month
silently stops every workflow on the account, including unrelated ones. Multi-tenanting all your
automations on one account is a blast-radius decision nobody frames as one.

## 11. Failure taxonomy I expect the evidence to confirm or destroy

Ranked by my confidence, highest first. Every one of these needs corroboration from W4 (X) or W5
(canon) before it survives.

| # | Failure | Confidence | What would falsify it |
|---|---|---|---|
| 1 | Duplicate side effects from webhook redelivery or retry | High | Practitioners reporting it as rare/solved |
| 2 | Silent stop — the automation stopped firing and nobody noticed | High | Vendors shipping default failure alerting that works |
| 3 | The sync loop (A→B→A) | High | Engines detecting it by default |
| 4 | Partial completion with irreversible earlier steps | High | Evidence that engines auto-compensate |
| 5 | Credential/token expiry mid-flow | Medium-high | Refresh being reliably automated everywhere |
| 6 | Vendor changed the API/schema under a running flow | Medium-high | Adequate deprecation notice being the norm |
| 7 | Rate-limit cascade caused by the retry policy | Medium | Engines defaulting to jittered, budgeted retries |
| 8 | Test/staging data reaching a real customer | Medium | — |
| 9 | Scheduler timezone/DST ambiguity (a job that runs twice or zero times) | Medium | — |
| 10 | Approval timeout defaulting to allow | Low-medium `[PRIOR]` | Engines defaulting to deny |

**Note on #2:** `operate`'s `recoverability.md` §4 already teaches the mechanism (a dead-man's-switch
/ heartbeat check-in; Healthchecks.io named, BSD-3-Clause). `automation` must **cite** that, not
re-teach it. This is exactly the kind of overlap the review process catches late and expensively.

## 12. Positioning risks I already believe

1. **"Automation" is a 2026 marketing word.** The skill must be legible to someone who has been sold
   the term ten times this week. Being the *unhyped* pack is probably the correct posture — the same
   move that worked for `operate` ("the night nobody is awake") and `quality` ("writes no tests").
2. **`orchestrate` collision.** Our own shipped non-family skill owns "how work is assigned across
   agents". "Orchestration" is also the standard word for what workflow engines do. **The skill must
   avoid the word or define it explicitly on first use.** A decline row is not enough; the vocabulary
   itself is contested.
3. **`backend` collision is the real one.** See the squeeze test. If W3 comes back "mostly already
   covered", the honest output of this build may be **three reference files donated to `backend`**
   plus a router patch, not a tenth repo. That is an acceptable outcome and I should say so plainly
   to the user rather than build a pack to avoid an awkward conversation.
4. **The upstreams do not exist.** `marketing`, `sales`, and `success` are the canonical rule-owners
   per §4.8 of the lifecycle doc, and none are shipped. `automation` must therefore carry its own
   lightweight *capture-the-business-rule* step and be strongly standalone.

## 13. What I most want falsified

In priority order — a worker who kills one of these saves the build more than one who confirms all
four:

1. **That integration-framed compensation is genuinely undertaught.** If Hohpe's coffee-shop essay
   plus the saga literature plus vendor docs already cover it well, the wedge is much narrower.
2. **That human-approval *policy* (timeout default, who-may-approve, escalation, evidence) is a real
   gap.** BPM's User Task with boundary timer events is suspiciously close to a full answer.
3. **That reconciliation is filed only under payments** and never generalised.
4. **That `backend`'s `async-and-messaging.md` + `service-integration.md` do not already hold the
   substrate.** This is W3's whole brief and it is the one that can end the build.
