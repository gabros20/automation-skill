# S2-W8 — Cost, quota, and rate limits as availability controls

Channel: cost/quota/rate-limits. All fetches performed 2026-07-27; every number below is date-stamped
at either its page's own "last updated" date or the fetch date, whichever is more specific. Re-verify
before use — these platforms change pricing/limits without much notice (see §1, n8n's own overage
process explicitly runs on a 45-day invoice lag, which tells you how fast the underlying numbers move).

Framing this extends, per brief: `operate`'s I7 — *"Cost is an availability control, not a finance
report. Measure cost-to-serve per unit of value; cap anything whose spend scales with activity rather
than with users."* Not re-derived here, only extended: for third-party automation, **the quota
belongs to the vendor**, so exhausting it is an availability event no amount of your own money fixes
until the vendor's clock rolls over or your invoice clears their AR system — payment does not restore
service instantly, and on the free tiers checked below (Make) there is no pay-to-restore path at all,
only wait-or-upgrade.

**Research-budget note (so synthesis can tell thin-from-budget apart from thin-from-absence):** the
session's shared WebSearch budget was exhausted partway through this channel's research (after ~6
queries, all consumed before returning results). Everything after that point was gathered via
WebFetch on directly-constructed or search-engine-guessed URLs. This worked well for GitHub, Salesforce,
n8n, the AWS Architecture Blog, and the Google SRE book — all confirmed against primary/first-party
pages. It worked poorly for Make: `help.make.com` and `www.make.com/en/help/...` URLs 404'd on every
direct-URL guess attempted, so Make's official position on ceiling behavior and circuit-breaking is
sourced only from a community-forum reply and search-engine-summarized practitioner posts, not a
primary Make page — flagged inline at each such claim below, not asserted as vendor-confirmed.

## 1. Per-platform table

| Platform | Billing unit (verified date) | Behavior at ceiling | Blast radius | Warning | Circuit-breaker |
|---|---|---|---|---|---|
| **Zapier** | A "task" = one successful action-step execution. Triggers, filters, and certain built-in tool steps are free. (`help.zapier.com/hc/en-us/articles/8496181445261-Zap-limits`, page states last updated 2026-05-29, fetched 2026-07-27) | Runs are **held**, not deleted, once the monthly allotment is hit; held runs can be replayed once tasks are available again. Pay-per-task billing can be enabled to keep running past the included quota. (Same page, fetched 2026-07-27) | Per-Zap — the doc's own wording is "your Zap runs will be held," i.e. the specific over-quota Zap's runs queue, not an account-wide stop. **Not independently confirmed against a second primary source** — flag for re-verification. | Yes — official doc states "Zapier sends email notifications as you approach and reach your limit." (fetched 2026-07-27) | None documented. Zapier's own doc describes graceful holding, not an automatic account/Zap shutoff after repeated *errors* (distinct from hitting the *task quota* — see §3 on auto-replay, which retries with growing intervals but does not auto-disable a Zap). |
| **Make** | An "operation" = one module execution in a scenario. **Separately**, a byte-based **data-transfer** ceiling also gates execution, independent of the operations count. | On the Free plan specifically, a Platinum-Partner-confirmed community answer states Make **pauses all scenarios account-wide** once the 512MB/mo data-transfer ceiling is hit — even with operations still unused (`community.make.com/t/reached-limit-issue-in-make/83447`, thread dated 2025-05-27, fetched 2026-07-27). This is a **named-interest, non-official source** (a Make reseller partner, not Make staff) — treat as corroborated practitioner testimony, not vendor-guaranteed behavior, and re-verify against Make's current official docs (Make's own help-center pages 404'd repeatedly on direct fetch this session; could not obtain a first-party citation). | **Account-wide on Free plan**, per the above — not scenario-scoped. This is the single clearest "vendor quota stops everything" data point found this session. Paid-plan blast radius not independently confirmed. | Not confirmed from a primary source this session. | A widely-repeated practitioner claim (found via search snippets, not confirmed against a Make first-party page) holds that Make **auto-deactivates a scenario after a run of consecutive execution errors, by default**, silently, unless "Store incomplete executions" is enabled to allow replay. The exact error-count threshold could not be confirmed against a Make first-party page this session (Make's own help center 404'd on every direct-URL attempt) and is dropped here rather than shipped with a caveat attached. **The mechanism — not the count — is the finding: this is the closest thing to a documented workflow circuit-breaker found across all three iPaaS platforms.** |
| **n8n (Cloud)** | An **execution** = one complete workflow run, regardless of step count or data volume — explicitly contrasted with per-step billing on the pricing page: "It doesn't matter how many steps are in the workflow... it's still a single execution." (`n8n.io/pricing`, fetched 2026-07-27) | Workflows **keep running past the plan's included quota**; overage is billed, not blocked: "your workflows will continue running without interruption, but overage charges may apply if you do not upgrade." Business-tier overage is billed in fixed buckets (300K-execution increments) and **invoiced 45 days after the overage occurs** if unresolved. (Same page, fetched 2026-07-27) | Not a hard stop at all on paid Cloud tiers — the model trades blast radius for delayed, potentially surprising bills. Self-hosted n8n has no vendor quota (your own infra's limits apply instead). | Sales proactively contacts accounts nearing 80% of their **annual** quota (same page) — a soft, sales-driven warning, not an automated in-product alert threshold like Salesforce's (below). | No account/workflow auto-disable found. n8n's own error-handling mechanism is an **Error Trigger → Error Workflow** pattern (`docs.n8n.io/build/flow-logic/handle-errors-gracefully.md`, fetched 2026-07-27) plus a manual **"Stop And Error"** node — both are *notify-on-failure*, not *stop-after-N-failures*. No per-node max-retry ceiling or auto-deactivation surfaced in the fetched docs. |
| **GitHub REST API** (representative of a *called* vendor rather than an iPaaS orchestrator — the other side of the same blast-radius question) | Primary limit: request count per hour — 60/hr unauthenticated by IP, 5,000/hr per authenticated user/app token, 15,000/hr for Enterprise Cloud orgs, `GITHUB_TOKEN` in Actions capped at 1,000/hr per repo (15,000/hr for Enterprise Cloud). (`docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api`, fetched 2026-07-27) | Requests over the primary limit get `429`/`403` until the hourly window resets (`x-ratelimit-reset` header gives the exact epoch second). | Per-token/per-app/per-repo, not account-wide across all of a user's integrations — narrower blast radius than the iPaaS platforms above. | The four rate-limit response headers (`x-ratelimit-limit/-remaining/-used/-reset`) are the *entire* warning mechanism — polling them yourself is the only way to see the ceiling coming; there is no push notification. | N/A (vendor doesn't run your workflow) — but see §4: GitHub layers a **second, deliberately undocumented** limit on top of the numeric one. |
| **Salesforce REST API** (second called-vendor example, chosen because its ceiling design differs materially from GitHub's) | Rolling 24-hour **total request allocation per org** (not per user): Developer Edition 15,000/24h; Enterprise/Professional 100,000 + per-license allotments; Full Sandbox 5,000,000/24h. (`developer.salesforce.com` limits cheatsheet, fetched 2026-07-27) | Salesforce runs a **grace buffer past the nominal limit** on paid, active orgs — "Salesforce still lets the operations proceed by a certain amount" past the stated ceiling before a hard cap engages — explicitly **not** extended to trial orgs, Developer Edition, or sandboxes. (Same source, fetched 2026-07-27) | **Org-wide** — every integration and every automation calling that Salesforce org shares one 24-hour bucket; a runaway automation can exhaust API capacity for every other integration on the same org. | Configurable: "email is sent to a designated user when the number of API requests has exceeded a specified percentage of the amount allotted" — an opt-in, admin-configured threshold, not a default. (Same source) | N/A (vendor-side) |

## 2. The blast-radius finding the brief asked about

Confirmed at least once, cleanly, on two different platforms' account-scoped resources:
- **Make, Free plan**: data-transfer ceiling pauses *every* scenario on the account, unrelated to which
  scenario burned the bytes (community-corroborated, not primary-sourced — see table caveat).
- **Salesforce**: the 24-hour API bucket is per-org, so one misbehaving automation can starve every
  other integration on that org.

Zapier and n8n's *own* documentation, by contrast, describes narrower, per-Zap/per-workflow queuing or
overage-billing rather than an account-wide stop — meaning **the "one bad automation kills everything"
failure mode is real but platform-dependent, not universal**, and is most severe exactly where a solo
operator is most likely to be: **free/entry tiers of iPaaS tools, and any workflow calling into a
vendor whose own rate-limit bucket is org-wide** (Salesforce-style), not per-integration.

## 3. Circuit-breaker verdict

**No platform ships a documented, guaranteed, first-party "stop this workflow after N consecutive
failures" circuit breaker that I could confirm from primary sources this session.** The closest
approximations:
- **Make**: widely reported (practitioner sources, not a Make first-party page fetched successfully
  this session) to auto-deactivate a scenario after a run of consecutive errors. The specific error
  count some practitioner sources attach to this could not be confirmed against Make's own docs this
  session and is deliberately omitted here — the mechanism is the finding, not the number.
- **Zapier**: auto-replay retries a failed run with a growing interval between attempts (help doc
  confirms increasing intervals; exact retry count not found in fetched sources) but does not
  auto-disable the Zap — a human has to notice and turn it off.
- **n8n**: purely notify-on-failure (Error Trigger → Error Workflow), no auto-disable found in docs.

**Teaching implication**: none of the three majors give you the workflow-level circuit breaker you'd
want for a runaway automation. The mechanism a solo operator has to build themselves — external
monitoring of execution/error counts plus an out-of-band kill switch — is exactly what stage 1's
corroborated failure taxonomy describes needing (47× duplicate notification sends, a CRM sync retrying
14 minutes behind a green dashboard) and what none of the vendors close for you.

## 4. Rate limits as the capacity unit, and the retry×rate-limit trap

**GitHub's secondary/abuse limits are the canonical deliberately-undocumented example**: GitHub's own
docs state "these secondary rate limits are subject to change without notice. You may also encounter a
secondary rate limit for undisclosed reasons," while still publishing some concrete triggers — over
100 concurrent requests, more than 900 points/minute to a single REST endpoint (2,000 for GraphQL), 90
CPU-seconds consumed per 60 real seconds, ~80 content-creating requests/minute, over 2,000 OAuth token
requests/hour (`docs.github.com`, fetched 2026-07-27). The teaching point: **you can be rate-limited
for reasons the vendor will not name, at a threshold the vendor will not fix** — which is the strongest
argument for backing off generously rather than tuning a backfill to skim just under a published number.

**The retry×rate-limit trap, with the citation verified**: Marc Brooker, **AWS Architecture Blog**,
"Exponential Backoff And Jitter," originally published **March 4, 2015**, updated **May 2023**
(fetched and author/venue/date confirmed 2026-07-27) — the canonical source is correctly attributed.
Core teaching: naive exponential backoff still synchronizes retrying clients into request waves;
adding randomization ("jitter") spreads them into a roughly constant rate. The post evaluates **Full
Jitter**, **Equal Jitter**, and **Decorrelated Jitter** and reports over 50% fewer calls under
contention with jitter vs. without, in its own benchmark. **The post itself does not cover retry
budgets** — that concept comes from a different canonical source:

**Retry budgets are taught by Google's SRE book**, chapter "Addressing Cascading Failures" (`sre.google/
sre-book/addressing-cascading-failures/`, fetched 2026-07-27), verbatim: *"Consider having a
server-wide retry budget. For example, only allow 60 retries per minute in a process, and if the retry
budget is exceeded, don't retry; just fail the request."* Same chapter separately teaches "Limit
retries per request. Don't retry a given request indefinitely" and "Always use randomized exponential
backoff when scheduling retries" — the jitter and the budget are companion, not competing, ideas.

**Who this is taught for, and the gap that matters for us**: both canonical sources — Brooker's post
and the SRE book chapter — are written for **your own services calling your own downstream
dependencies inside one organization's control**. Neither is framed for the case an automation builder
actually faces: **calling a third party you cannot deploy to, whose 429 policy you cannot inspect, and
whose secondary/abuse limit (GitHub-style) may not even be documented.** That reframing — retry budgets
and jittered backoff **as applied to a vendor call you don't control** — is not something either
canonical source states explicitly, and is squarely in the "fragmented by frame" synthesis gap stage 1
already identified for compensation and reconciliation. This is the same shape of gap, in a fifth
literature (distributed-systems reliability engineering).

**Retry-After compliance**: not independently re-verified this session against a primary HTTP spec
source, but is standard practice layered on top of both canonical sources above — when a vendor
response carries `Retry-After`, that value should override your own backoff schedule, not just seed it.

**Designing a backfill against a rate limit you can't raise**: the practical synthesis (general
engineering practice, not a single vendor's documented feature) is to size the backfill's request rate
to a *fraction* of the documented ceiling — leaving headroom for the account's live/production traffic
sharing the same bucket — and to prefer the vendor's cheapest possible read shape (bulk/batch endpoints
where offered) over N individual per-record calls, since it's request *count*, not data volume, that
most REST rate limiters meter (GitHub and Salesforce both meter this way per the table above).

## 5. Cost attribution — what a solo operator can actually see

Each platform's own usage surface is the only attribution mechanism confirmed this session:
- **n8n Cloud**: pricing page frames usage strictly in total monthly executions; per-workflow
  breakdown was not confirmed from a fetched source this session (plausible from the product's
  execution-list UI, but not verified as a first-party claim — flag before asserting it as a feature).
- **Zapier / Make**: both expose account-level task/operation counters in their own docs and community
  threads referenced above; per-Zap or per-scenario granularity is implied by the tooling but not
  independently confirmed against a primary doc this session.

**What is confirmed**: none of the three iPaaS platforms' *billing* pages (as fetched) advertise a
built-in per-automation cost *alert* comparable to Salesforce's opt-in "email at X% of allotment"
threshold — that pattern exists on the vendor-API side (Salesforce), not confirmed on the
workflow-orchestration side (Zapier/Make/n8n).

## 6. The n=1 minimum — synthesis, not a single citation

For one person running a handful of automations with no FinOps function, the defensible minimum,
built from the confirmed facts above rather than asserted independently:
1. **A spend/usage alert wherever the platform offers one** — Salesforce's opt-in percentage-threshold
   email is the closest first-party model found; Zapier's "approaching your limit" email is the iPaaS
   equivalent. Turn it on; none of these are default-on across the board.
2. **A per-flow task/operation budget**, checked manually against the account dashboard, since no
   platform confirmed an automated per-flow cap.
3. **A manual kill switch** — since no platform ships an automatic circuit breaker (§3), the "kill
   switch" is a human checking a dashboard, or an external monitor (e.g., a scheduled check hitting the
   platform's own API for execution/error counts) wired to actually disable the flow, not just alert.
4. **Isolate the blast radius deliberately** — given confirmed account-wide/org-wide ceilings on Make's
   free tier and on Salesforce API buckets, "all my automations on one account" is a real, named
   decision, not a neutral default: separate accounts/orgs for unrelated automation groups trade
   convenience for a smaller blast radius, matching operate's I7 framing of cost as an availability
   control rather than a bookkeeping concern.

## Sources
- [Zapier — Zap limits](https://help.zapier.com/hc/en-us/articles/8496181445261-Zap-limits) (page states last updated 2026-05-29, fetched 2026-07-27)
- [Make community — "Reached limit issue in Make"](https://community.make.com/t/reached-limit-issue-in-make/83447) (thread 2025-05-27, fetched 2026-07-27) — Platinum Partner reply, not Make staff
- [n8n pricing](https://n8n.io/pricing/) (fetched 2026-07-27)
- [n8n — Handle errors gracefully](https://docs.n8n.io/build/flow-logic/handle-errors-gracefully.md) (fetched 2026-07-27)
- [GitHub — Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) (fetched 2026-07-27)
- [Salesforce — App limits cheatsheet, Platform API](https://developer.salesforce.com/docs/atlas.en-us.salesforce_app_limits_cheatsheet.meta/salesforce_app_limits_cheatsheet/salesforce_app_limits_platform_api.htm) (fetched 2026-07-27)
- [AWS Architecture Blog — "Exponential Backoff And Jitter," Marc Brooker](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) (orig. 2015-03-04, updated 2023-05, fetched 2026-07-27)
- [Google SRE Book — Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/) (fetched 2026-07-27)
