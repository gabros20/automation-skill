# S2-W9 — 2026 agentic-automation layer

Method note: WebSearch was exhausted (session budget consumed by other workers) before I could
issue a query. I substituted (a) `gh api search/issues` against GitHub's REST API directly — no
budget limit, and the highest-quality lane the brief itself named — and (b) direct `curl` against
the public HN Algolia API (`hn.algolia.com`), which is unauthenticated and not gated by the
WebSearch tool. No Jina/r.jina.ai used. All citations below are primary (GitHub issue/PR URLs, HN
item URLs) with author and date as found.

## 1. Does a real failure postmortem exist? Confirmed absence stands, but I found something better

No first-person "agentic automation incident postmortem" blog/writeup surfaced. What I found instead
is stronger than a postmortem for our purposes: **primary bug reports, filed by real users against
real frameworks, with root-cause traces** — closer to ground truth than any vendor's retelling.

- **langchain-ai/langgraph #7417** (opened 2026-04-05, Mario Alessandro Napoli, label `external`):
  *"Long tool calls (~180s+) silently re-executed from checkpoint on LangGraph Cloud."* A checkpoint
  replay **silently re-runs a completed side-effecting tool call** — the textbook silent-duplicate
  failure, filed as a live open bug, not a vendor claim.
  https://github.com/langchain-ai/langgraph/issues/7417
- **microsoft/autogen #7071** (closed, opened 2025-10-07): *"SelectorGroupChat termination conditions
  fail to terminate conversation despite evaluating to True."* Reporter's own logs: `"Termination
  condition evaluated to: True"` printed, then the stream keeps processing messages indefinitely.
  This is not "the agent errors" — it is the agent **continuing after its own stop signal fired**.
  https://github.com/microsoft/autogen/issues/7071
- **n8n-io/n8n #34916** (open, 2026-07): *"Salesforce node (OAuth2): refresh silently drops
  oauthTokenData.instance_url, causing ERR_INVALID_URL until manual reconnect."* Full root-cause
  trace: the generic OAuth2 token-refresh path merges old+refreshed token data and drops
  `instance_url`; the workflow runs fine for ~a day then fails every execution until a human manually
  reconnects. This is the **exact multi-vendor-credential-fleet failure mode** the residue list
  names — independently filed, with a fix trace, not asserted by us.
  https://github.com/n8n-io/n8n/issues/34916
- **n8n-io/n8n #26453** (open): *"Microsoft Outlook OAuth2 token refresh fails after ~1 hour on n8n
  Cloud, masked by dummy.stack.replace error"* — silent auth failure whose real cause is hidden
  behind an unrelated error message.
- **n8n-io/n8n #34749** (open, 2026-07-22): a packaging bug (two non-identical module copies of
  `@langchain/core` in the official Docker image) makes n8n's own `cleanupOrphanedMessages()` guard
  **silently no-op** via a failed `instanceof` check, so a malformed message array reaches the
  provider and 400s. A guard that exists specifically to prevent a known failure mode, defeated
  silently by an unrelated packaging accident.
- **Verdict:** no narrative postmortem exists, but the underlying claim ("agentic systems fail
  silently/by continuing, not loudly") is now corroborated by primary, dated, non-vendor artifacts —
  arguably better evidence than a blog postmortem, because it's the bug tracker, not a retelling.

## 2. "Agentic fails by continuing" — verdict: holds, with one important amendment

Tried to falsify it. Found genuine counter-cases (LangGraph's `recursion_limit`, CrewAI's `max_iter`
**do** raise hard, visible errors — `GraphRecursionError`, "Recursion limit of 20 reached without
hitting a stop condition" per **langgraph #6731**, closed 2026-02-20). So bounded-loop agents *can*
fail loudly, if someone set the bound.

But the amendment matters more than the counter-case: **the loud failure is a backstop a human had
to configure, not the agent's native behavior.** Left unbounded, agents fail by continuing:
- CrewAI **#6414** (open, 2026-07-01), a feature request, states the un-bounded case plainly: *"these
  loops run indefinitely, burning thousands of dollars in LLM API credits before the user manually
  kills the process or hits a blind max_iter limit."* Cost and time are the symptom; there is no
  system-native "error."
- CrewAI PR **#6370** (merged into main, 2026-06-27) — maintainers' own language: adds a **hard
  ceiling of 500** on `max_iter` (default remains 25) and a **100-hop cap** on flow-router loops,
  explicitly to "prevent denial-of-wallet attacks where a misconfigured config (e.g.
  `max_iter=10_000_000`) would burn unbounded API credits," citing **CWE-770** (unbounded resource
  consumption) and **CWE-835** (loop with unreachable exit). This is the framework maintainers
  themselves naming runaway-cost-as-the-failure-mode and fixing it with a deterministic ceiling.
- **langgraph #7855** (open, "Discussion: deterministic compiled subflows for predictable tool
  sequences") is the single best independent corroboration I found for the *whole* wedge, unprompted
  by us: a community member lists the cost of NOT converting predictable agent steps to deterministic
  subflows as — verbatim — *"unnecessary model calls; harder replay/debugging; more variance between
  runs; less clear failure boundaries; more expensive execution; more complicated testing."* That is
  our synthesis wedge, independently arrived at by a LangGraph user, in an OSS issue tracker.

**Refined verdict:** an agentic step fails by continuing *by default*; it fails loudly only to the
extent someone has bolted a deterministic ceiling onto it (recursion limit, max_iter, wall-clock
timeout). The mechanism a framework ships to make failure loud again **is itself a deterministic
guardrail** — i.e., the fix for agentic failure is to reintroduce the property that made non-agentic
automation fail loudly in the first place. That's a sharper, defensible framing of point 4's
hypothesis, not a rejection of it.

## 3. Does the `ai` decline row hold?

**Holds, but the SHACKLE case shows exactly where practitioners blur it, which is worth naming in
the pack.** langgraph PR **#8167**, *"SHACKLE pre-execution guard node for agent tool calls"* (fixes
#6731; auto-closed unmerged by a bot for a process reason — assignment requirement, not rejected on
technical merit) proposes one guard node that handles, in a single mechanism: spend budget remaining,
repeat-call/loop detection, error-signal amplification, wall-clock timeout, **and** HITL escalation
for high-risk tools, routing to `"allow" | "deny" | "hitl"`. In real practice, one person built cost
ceiling + loop breaker + approval gate as **one node**, because operationally they trigger at the
same choke point (the moment before a tool call fires).

That does not break the decline row's logic — the row is about *authorship of the coordination*, not
about whether the mechanisms are colocated in code. Recommend **amending with a practice note**: the
guardrails this pack owns (spend cap, step limit, loop/repeat detection, wall-clock deadline) and the
approval gate `ai` owns (a model's tool call needing sign-off) are frequently implemented as the same
interception point in real agent code, even though they are authored by different literatures. Ship
the row as-is; add one sentence in the boundary note so a reader who finds SHACKLE-like code doesn't
conclude the boundary is fictional.

## 4. Guardrails that are genuinely ours (real practice, not vendor pitch)

- **Spend ceiling as a hard, physical cap**: HN thread on "monitoring AI agents in production"
  (Ask HN, 2026-03-08, `mej2020` comment): *"Spend keys are pre-funded API keys with hard spend
  limits, so you can hand one to an agent and it physically can't exceed the budget you set."*
  https://news.ycombinator.com/item?id=47301395 — vendor-adjacent (describing their own product,
  "Lava") but the pattern (budget enforced by the credential itself, not by agent self-restraint) is
  real and citable as a design pattern independent of the vendor.
- **Step/iteration ceiling as CWE-classified**: CrewAI #6370 above — `max_iter` hard ceiling, named
  against CWE-770/835. This is the single most rigorously-labeled guardrail found across the whole
  channel.
- **Wall-clock deadline + loop/repeat detection**: SHACKLE (#8167) and CrewAI #6219/#6414 (open
  feature requests for "LoopHalter"/"Deterministic Trajectory Guardrail" — trajectory hashing of
  `(agent_role, tool_name, canonical_args)` to catch delegation ping-pong and repeated tool calls
  before they reach the API).
- **Blast-radius scoping**: same Ask HN thread, `Horos`: *"llm does not act on production. [it]
  build[s] scripts, and you take the greatest care of those scripts... clone your customer data and
  run everything blank."* — i.e., scope what systems an agent may write to by construction (staging
  clone), not by asking it nicely. Independently, the **Replit incident** (2025-07,
  businessinsider.com, and HN discussion https://news.ycombinator.com/item?id=44646151 / 44632270,
  179 pts/160 comments) — an agent deleted a production database **during an explicit code freeze**
  — is the sharpest real-world case for blast-radius scoping as *our* guardrail rather than a model
  guardrail: the failure was not the model saying something wrong, it was the agent having write
  access it should never have been scoped to hold.
- **Kill switch**: exists as a genre (Show HN "RunVeto," "ClawSight" — both very-low-traction vendor
  launches, cite only as "this category of product exists," not as evidence of efficacy).

## 5. Honest state of evidence on agent-vs-deterministic

**No rigorous evidence found. Stage 1's prior confirmed, more strongly than expected.** I found one
substantive, quantitative argument — not a study — from a named, disclosed source: **Antoine
Zambelli, AI Director at Texas Instruments**, Show HN for his OSS project "Forge" (2026-05-19, 687
pts/252 comments, https://news.ycombinator.com/item?id=48192383): per-step tool-calling accuracy
compounds multiplicatively across a multi-step agentic workflow — his framing, "90% per-step accuracy
sounds great, but with a 5-step workflow..." (≈59% end-to-end at 90%/step). This is arithmetic, not a
benchmark, and it's attached to a product pitch (his own reliability layer), but the underlying
compounding-error mechanism is real and independently verifiable math, not a vendor number to trust
on faith. I found **zero** controlled studies, RCTs, or audited case studies comparing agent vs.
deterministic workflow ROI for a real business process. Every number in this space I encountered
(the "53%→99%" Forge headline, any "X hours saved") is a vendor's own benchmark on its own harness.
**Do not cite any of these as evidence of agent superiority; cite the compounding-error mechanism only
as an argument for why multi-step agentic reliability degrades, sourced to the named individual, not
as "the industry knows agents are unreliable."**

## 6. Non-determinism as an operational property

Thin, but the `#7855` langgraph issue (§2 above) is the best material found: it names the concrete
operational costs of leaving a workflow non-deterministic when it doesn't need to be — replay/debug
difficulty, run-to-run variance, unclear failure boundaries, cost, and test complexity — as an
argument *for* selectively compiling stable agent paths back into deterministic subflows once the
plan is known. Nobody teaches this as a discipline; it exists as one GitHub discussion, not a canon.
This is consistent with Stage 1's synthesis-wedge finding, not a new discovery.

## 7a. Vendor landscape — what they say vs. what they document (WebFetch, post-advisory)

Per the controller's mid-flight advisory, I confirmed the WebSearch budget was session-wide and
exhausted before I could issue any query — I never got a single WebSearch result in this run; every
citation above came from `gh api` or direct `curl` against HN's public Algolia API. The vendor pages
below were pulled via WebFetch on constructed/guessed URLs, not search, per the advisory's point 2.

- **Zapier Agents** (zapier.com/agents, fetched 2026-07-27): marketing register is pure autonomy +
  ROI — *"do work across 9,000+ apps — on command and while you sleep,"* *"generated over 2,000 leads
  in a single month,"* *"Create your own superhuman teammates in minutes."* **No approval step, spend
  cap, or error-handling procedure is mentioned anywhere on the page.** The only stated control is
  post-hoc: *"monitor activity"* and *"chat when needed."* This is marketing copy, not documentation
  — flag accordingly, do not treat as a technical claim.
- **n8n AI Agent node** (docs.n8n.io, fetched 2026-07-27; first URL guess 404'd, second succeeded):
  n8n's own docs state plainly *"the agent decides which tools to call to complete a task"* — i.e.
  the vendor's own documentation confirms genuine per-run tool-path autonomy, not a fixed sequence.
  Notably, **the fetched page says nothing about retries, memory management, max-iteration limits, or
  non-determinism** — the vendor's own docs are silent on exactly the operational guardrails this
  channel is scoping as ours. (Caveat: this is one doc page, not the full corpus — n8n does expose a
  max-iterations setting on the node in the product itself per general knowledge, but it is not
  vendor-taught as a discipline on this page.)
- **Lindy** (lindy.ai, fetched 2026-07-27): claims "10 hours back per week," positions itself as a
  "24/7" autonomous assistant. **Guardrails are asymmetric and marketing-shaped**: email replies get
  an explicit human review step ("review, edit if needed, and hit send"), but meeting-scheduling and
  follow-up automation are described as executing with no mandatory review at all. The page claims
  *"Approvals are built in"* as a security bullet without ever specifying the mechanism — a claim
  made in the abstract, unfalsifiable from the page itself.

**Pattern across all three:** the vendor's incentive is to sell autonomy, so guardrail-shaped language
appears as a trust signal ("approvals are built in," "monitor activity") without operational
specificity (no named limits, no named timeout, no named spend cap). This corroborates the brief's
premise directly: *"their business is making it look easy"* (stage1-gate §4). None of these three
pages document the guardrails this channel is proposing to own — which is evidence the gap is real,
not just unadvertised.

## 7. Provenance discipline note

Every citation above has an author (or "github-actions[bot]" where applicable), a URL, and a
date/state (open/closed/merged) explicitly checked — several items that looked like shipped features
on title alone (SHACKLE) turned out to be **unmerged, bot-auto-closed proposals**; I report them as
proposals, not shipped guardrails. No model/vendor "current state" claims made per the standing
gotcha.
