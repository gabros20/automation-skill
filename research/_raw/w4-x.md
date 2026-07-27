# W4 — X/Twitter practitioner probe: automation skill (stage 1 recon)

Scope: scoped probe, not exhaustive. Question (a) does real practitioner evidence exist vs vendor marketing;
(b) what breaks, first-person, with specifics. No writes performed (read/archive only).

## Queries run (product=Latest unless noted; counts = results returned, not all relevant)

1. `zapier broke` — 40 results. Mostly irrelevant ("broke" as slang/emotion, unrelated news). ~3 relevant.
2. `n8n workflow failed` — 40 results. Moderate yield — several genuine + several vendor listicle accounts.
3. `automation silently stopped OR silently failed` — 30 results. Almost entirely noise (word "silently"
   overloaded across politics/relationships/unrelated tech). 2 relevant.
4. `duplicate emails sent OR sent the same invoice twice` — 30 results. Mostly generic engineering-advice
   tweets (idempotency 101 explainers) and unrelated consumer complaints, not incident narratives. ~1 relevant.
5. `webhook fired twice OR retry sent duplicate` — 30 results. Dominated by old Twitter-client "duplicate
   tweet" bug reports (2011–2023, irrelevant domain) and generic idempotency-explainer tweets. 1 standout
   (Tidianez, agentic retry-storm).
6. `automations while I sleep OR automation while I sleep` — 30 results. Pure noise — "passive income"
   marketing filler, zero incident narratives. Confirms this angle is saturated with hustle-marketing, not
   failure testimony.
7. `oauth token expired workflow OR api changed broke my automation` — 8 results (query narrow). 2 good
   first-person hits (Niv_98, frog_omo-adjacent billing story).
8. `waiting on approval agent OR ai agent asked before` — 30 results. Almost entirely unrelated AI-hype
   content flood. 1 marginal hit (a reply asking how to distinguish stalled vs. awaiting-human-approval —
   not a narrative, a genuine open question, 0 likes).
9. `reconciliation job OR compensating action rollback` — 30 results. Near-total noise: "reconciliation" is
   dominated by US political usage (Senate reconciciliation bill) and astrology/relationship content. 2
   marginally relevant (webhook-miss reconciliation-cron replies in an unrelated thread).
10. `charged customer twice automation OR automation charged twice` — 7 results. Mostly Tesla FSD billing
    complaint (duplicate self-post) and vendor ad copy. Low value.
11. `solo founder automation broke OR my automation almost cost me` — 10 results. No true incident narratives
    surfaced; mostly YouTube-automation income-farming content.
12. `agent kept retrying OR agent looped forever production` — 25 results. **Highest-yield query of the
    sweep** — 6+ concrete, specific agentic-retry-loop stories, though nearly all from accounts building an
    "AI agent reliability" product (see astroturf section).

Total unique candidate tweets surfaced across all queries: ~35 flagged as topically relevant out of ~325
returned rows (~11%). Of those 35, after author vetting, roughly **10** hold up as specific-and-attributable
enough to cite; the rest are generic advice/listicles or too vague to count as a "narrative."

## Surviving material (full attribution)

Legend: F = followers, V = X "verified" (blue check / paid, NOT identity-verified), interest = stated
commercial tie to automation/AI-agent tooling.

### Agentic retry-loop / silent-failure narratives (strongest cluster)

1. **@Tidianez** (handle: Tidianez, "Tidianez", F=222, V=yes, bio: "Building @saferunai — reliability infra
   for AI agents in prod"). **Interest: vendor — sells AI agent reliability infra.**
   > "an ai agent we were testing sent the same notification 47 times in a row last week. not a bug in our
   > code. the agent just kept retrying because it never got a clean confirmation signal... they don't fail
   > loud[ly]" — 3 likes, 40 views.
   https://x.com/Tidianez/status/2055485702612127964 (16 May 2026)

2. **@killix** (Issam Hakimi, F=1,202, V=yes, bio: "Building Orkia: your AI agents as Unix jobs you can see,
   kill, and audit"). **Interest: vendor — sells agent-observability tooling.**
   > "Production agents need PIDs, not dashboards. Yesterday one kept retrying a CRM sync. 14 minutes.
   > Dashboard green. It wasn't a process, just a prompt loop. ... If you can't SIGKILL an agent, you don't
   > have observability." — 2 likes, 26 views.
   https://x.com/killix/status/2073809673958887906 (5 Jul 2026)

3. **@malakhovdm** (Dmitrii Malakhov, F=1,308, V=yes, bio: "Ex-Amazon engineer. Built Galevox: autonomous SMM
   running 18 agents... This account is one of them. Maybe"). **Interest: vendor — sells an autonomous
   agent-swarm product; separately, ex-Amazon credential lends some independent technical weight.**
   > "Watched $12 burn through API calls because my agent kept retrying a dead browser tab. That's the real
   > loop engineering lesson, knowing when to stop." — 2 likes, 744 views (reply to @omarsar0, a well-known
   > AI-research account, which is likely why views are disproportionately high vs. likes).
   https://x.com/malakhovdm/status/2068019497680634133 (19 Jun 2026)

4. **@B20Unicorns** (F=651, V=yes, bio: an NFT-mint project on Base — **bio has nothing to do with
   automation/agents**, which is a credibility red flag; either a side-project post or a templated/bot
   account reusing a generic "war story" format). Identity unconfirmed as a genuine automation practitioner.
   > "4 AM. Two cron jobs start timing out. My agent - running in a Discord channel - notices the errors and
   > tries to fix them... Except the job IDs in its memory were stale. So every 'fix' attempt failed silently.
   > And it kept retrying." — 5 likes, 43 views.
   https://x.com/B20Unicorns/status/2023589086544454114 (17 Feb 2026)

5. **@Banshal_Yadav** (_Banshal✨, identity unconfirmed — not vetted via `user`, low-follower personal account
   by profile appearance).
   > "first in my bloodline to burn 40M tokens in 10hrs 🤡 the bug: agent kept reverting + retrying the same
   > failing call, forever the fix: 20 mins building NirCode" — 5 likes, 48 views. Note: also self-identifies
   > as building "NirCode" — likely another agent-tooling side-project, i.e. also vendor-adjacent.
   https://x.com/Banshal_Yadav/status/2081265839463174355 (26 Jul 2026)

### Non-agentic automation-platform failures (Zapier/n8n/Make)

6. **@AndreyK09474778** (Andrew, F=2,876, V=yes, bio: "Founder @..." AI/multi-agent systems consultancy,
   posts ~20 tweets/day at high volume — content-marketing cadence). **Interest: vendor/agency.** Uses a
   repeated "Friday ship confession" template across multiple weeks (seen at least 3 near-identical
   framings), which reads as serialized content marketing rather than one-off incident reporting — treat the
   specifics as illustrative, not a verified single event.
   > "my inbox automation broke at 11pm last night... the Zapier agent I'd built to sort incoming messages
   > kept misfiring because the Gmail filter conditions were too broad. Every newsletter hit the 'urgent
   > client' fo[lder]" — 3 likes, 81 views.
   https://x.com/AndreyK09474778/status/2077959051380437060 (17 Jul 2026)

7. **@cryptbent** (𝕮ryptbent, F=316, V=no, bio: "Automation & AI Consultant (n8n, Zapier, Airtable)").
   **Interest: vendor/consultant, explicit.**
   > "Disappeared for a bit because one automation kept creating 35 records instead of 1. It turned out to be
   > looping + line-item logic. Shipping systems are way harder than building them. And this is in
   > Zapier😆... What broke your flow this week?" — 2 likes, 35 views.
   https://x.com/cryptbent/status/2013230139484545478 (19 Jan 2026)

8. **@Niv_98** (Niv, F=81, V=no, bio: "Making automation feel like magic. Building Kadabra").
   **Interest: vendor — building an automation product.**
   > "I wasted 2 weeks building a bot that broke in 2 days... Saturday morning: 50 error notifications. An API
   > changed, a field was null, and the whole thing crashed 😵. I spent my entire weekend..." — 5 likes,
   104 views.
   https://x.com/Niv_98/status/1997374460387536938 (6 Dec 2025)

9. **@0xBvr** (Oscar · Beaver Co, F=85, V=yes, bio: "I help business owners win more customers... I build
   every system on my own business first"). **Interest: consultant/agency, but explicitly says this
   particular system was on his own business, not a client's — slightly more credible as a first-hand
   account.**
   > "had an oauth token silently expire on personal tg connection and a client automation once and didnt
   > notice till stuff just stopped firing for days." — 0 likes, 5 views (reply, essentially unseen).
   https://x.com/0xBvr/status/2081387268422631624 (26 Jul 2026)

10. **@sanketdattta** (Sanket Datta, F=125, V=yes, bio: "AI • Business • GTM || Founder @...", high-volume
    poster, 2,624 tweets). **Interest: founder describing his own community-business automation, build-in-
    public style — self-promotional framing but describing his own product, not selling automation
    services to others.**
    > "We f*cked up and 'almost' lost $7,000 yesterday... We had built an automated workflow that triggers a
    > $7,000 upgrade workflow once a customer hits certain ROI markers... Ideally, the system should tri[gger
    > only once, implying it misfired / over-triggered]" — 11 likes, 413 views.
    https://x.com/sanketdattta/status/1993602129408508351 (26 Nov 2025)

### Marginal / discarded but noted

- **@prantogoswamee**: "Founder paid $8k for AI automation. Stopped working in 2 weeks... the webhook
  silently failed and nobody was watching. If your builder can't explain what happens when a webhook fires
  twice, that automation is a countdown timer." 0 likes, 7 views. Reads as an agency cold-pitch hook
  (unverified whether this is a real client story or a composite marketing anecdote) — **not counted as a
  corroborating data point**, flagged as likely-marketing.
  https://x.com/prantogoswamee/status/2080679684858421543
- **@dimon3m**: Zapier-vs-n8n billing critique ("Zapier counts every step... as a task"), not a failure
  narrative but a real, specific operational complaint about cost opacity. 0 likes.
- **@viditchess** (812 likes) — chess grandmaster Vidit Gujrathi's "tried automating a workflow, failed
  repeatedly... feeling like a noob" — high engagement, but zero specifics on *what* broke; entertainment/
  relatability content, not evidentiary.

## Astroturf / vendor-interest ratio

Of the 10 tweets promoted to "surviving material," **8 of 10 authors have a direct commercial interest** in
automation or AI-agent-reliability tooling (consultant, agency, or building a competing/adjacent product).
Only 2 (sanketdattta describing his own unrelated business's mistake, and the marginal dimon3m billing gripe)
are arguably neutral operators rather than sellers of automation-adjacent services — and even sanketdattta's
account has a general "founder" build-in-public commercial framing.

Below the "surviving" bar, the ratio is worse: broad queries like "automations while I sleep," "solo founder
automation broke," and "reconciliation job" returned **>90% marketing/hustle-content or off-topic noise**,
not first-person failure testimony at all.

**Overall astroturf/marketing-content estimate across the full sweep: roughly 75–85%** of everything surfaced
was either vendor content, engagement-bait listicles, unrelated noise, or unverifiable "war stories" from
accounts whose bio reveals they sell the exact category of tool the story is meant to justify. The genuinely
neutral, no-commercial-interest, first-person "this broke and here's exactly what happened" tweet is **rare**
— maybe 1 in 30–40 relevant-looking results.

One account (**@WorkflowWhisper / Alton Syn**, F=13,340, 0 following, account 11 months old, 1,665 tweets,
bio "I read the AI release notes... Daily receipts") shows classic AI-content-farm signals — zero-following is
a strong synthetic/farm indicator, and claims like "I've built 847 n8n workflows, 90% failed before I
implemented these techniques" are unverifiable, round-number, listicle-shaped claims typical of engagement
farming rather than a real practitioner recounting a specific incident. Treated as non-credible; excluded from
"surviving material" even though it repeatedly ranked high in raw search results.

## Failure taxonomy actually observed (across all credible-enough hits)

1. **Silent retry loops in agentic automations** — an agent doesn't get a clean success/failure signal, so it
   retries indefinitely or repeatedly, burning tokens/API cost or re-firing an action (notification sent 47x,
   $12–40M-tokens burned on a stuck retry, CRM sync loop invisible on a "green" dashboard). This is the
   single most-repeated, most-specific failure mode in the whole sweep — but concentrated in accounts selling
   agent-reliability tooling.
2. **Stale/cached state driving a wrong "fix"** — an agent's own memory of job IDs/state goes stale, so its
   self-healing retries operate on data that no longer matches reality (B20Unicorns' cron-job story — lower
   confidence source).
3. **Silent auth/credential expiry** — an OAuth token expires without a loud failure; the automation just
   stops firing and nobody notices for days (0xBvr).
4. **Loop/line-item logic duplicating records** — a workflow re-processes the same trigger and creates N
   copies instead of 1 (cryptbent, Zapier).
5. **Upstream API/schema drift breaking a chain** — a third-party API changes a field (goes null), the whole
   chain crashes with a wave of error notifications on a weekend (Niv_98).
6. **Over-broad trigger conditions misrouting output** — Gmail filter conditions too broad, so unrelated mail
   lands in the wrong (urgent) bucket (AndreyK09474778 — discount for content-marketing template reuse).
7. **A single business-critical automation misfiring near-irreversibly** — an upgrade/charge workflow
   triggers when it shouldn't, nearly costing $7,000 before being caught (sanketdattta).
8. **Cost opacity as an operational failure mode**, distinct from outright breakage — Zapier's per-step task
   billing surprising operators (dimon3m), a $340 API bill for "basic" n8n workflows (frog_omo, seen in raw
   search, not promoted to main list).

## Verdict: does this corroborate or falsify the "third-party, undeployable, irreversible, partly-human" hazard?

**Partially corroborates, on thin and vendor-tilted evidence.** The specific failure mechanics that surfaced
line up well with the hypothesis:
- **Third-party**: nearly every incident is a third-party API/OAuth/webhook behaving unexpectedly (Niv_98's
  API field going null, 0xBvr's OAuth silent expiry, cryptbent's Zapier loop, the several idempotency/webhook-
  retry discussions).
- **Irreversible / partly-human**: the sharpest example (sanketdattta's near-$7k mis-triggered charge) is
  exactly the "an automated action that touches money/customers can't be quietly undone" hazard, and the
  agentic-retry-loop cluster (Tidianez, killix, malakhovdm) is precisely "nobody was watching, so the
  automation kept acting after it should have stopped" — no human checkpoint caught it before real cost
  accrued.
- **Undeployable** (my read: meaning "can't be tested/staged the way code can, because it depends on live
  third-party state") is not something anyone said explicitly, but it's implied by every "we didn't find out
  until it had already fired N times / for days" story — these are exactly the class of failure that a normal
  staging environment or unit test would not have caught, because the failure mode is about *live* external
  state (a real OAuth grant, a real webhook redelivery, a real customer's ROI crossing a real threshold).

**But the evidentiary base is weak**: 8 of the 10 corroborating sources sell automation or agent-reliability
tooling, so their incentive is to tell exactly this story (it validates their product). I did not find a
single high-engagement, no-commercial-interest account describing a specific *named* irreversible/partly-human
incident in detail — the closest neutral-ish signal (sanketdattta) is still a founder in build-in-public mode.
The **honest read for stage 2**: this hazard is plausible and mechanically consistent with everything
observed, but stage 2 should not lean on X as its main evidentiary channel for it — this platform is
dominated by people whose livelihood depends on saying "automation breaks in scary undeployable ways, buy my
reliability layer," and a wide net here mostly returns marketing. If stage 2 wants X evidence specifically, it
should go narrower and deeper on the ~5 agentic-retry-loop accounts (thread-read their full incident writeups,
if any) rather than casting a wider net, since broader queries returned almost pure noise.
