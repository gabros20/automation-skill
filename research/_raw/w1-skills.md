# W1 — Local + discoverable SKILLS sweep for `automation` (Stage 1 recon)

Scope: `~/.claude/skills/` (72 installed dirs) + `npx skills find` (skills.sh ecosystem, 700K+ install-count leaderboard). Read-only. No outward side effects.

---

## 1. Discoverable ecosystem (skills.sh) — verdict: fragmented, no generalist competitor

Ran `npx skills find` against: automation, workflow, zapier, n8n, webhook, integration platform, idempotency, human in the loop, durable execution, rpa, business process, cron scheduling (12 queries, commands reproducible verbatim).

**Pattern across all 12 queries: every result is either (a) single-vendor tool docs, or (b) a narrow point-task automation, never a cross-vendor business-process discipline.**

| Query | Top hits | Category |
|---|---|---|
| automation | `reddit-automation` (102K), `ci-cd-and-automation` (14K), `excel-automation` (13K), `billing-automation` (9K) | point-task automations, one per vertical |
| workflow | `lark-workflow-meeting-summary` (481K), `lark-workflow-standup-report` (481K), `expo-cicd-workflows` | single-vendor (Lark/Feishu) or CI |
| zapier | `zapier/sdk`, `zapier/agent-skills@workflows-create/modify`, `zapier-make-patterns` (715) | Zapier's own vendor skill + a small third-party "patterns" pack |
| n8n | `czlonkowski/n8n-skills@n8n-workflow-patterns` (9K) + 5 sibling n8n-only skills | single-vendor (n8n), node-config/expression-syntax level |
| webhook | `clerk-webhooks` (25.7K), `stripe-webhooks` (457), `setup-zoom-webhooks` (1.4K) | per-vendor webhook setup, not a cross-vendor discipline |
| integration platform | `make-platform-skills@make-integration` (58), Salesforce `integration-connectivity-generate` (149) | low-install, vendor-specific |
| idempotency | `idempotency-handling` (406/296, prompt-pack style), `payment-idempotency` (82, VTEX), `stripe-webhook-idempotency` (50) | scattered single-vendor or generic-prompt treatments, none framed as a cross-boundary reconciliation discipline |
| human in the loop | `langgraph-human-in-the-loop` (11.5K) | AI-agent HITL (interrupt/resume in an agent graph), not business-process approval-as-node |
| durable execution | `cloudflare/skills@durable-objects` (29K), `aws-lambda-durable-functions` (71), `restate` (9) | infra/runtime primitives, not process-orchestration-across-vendors |
| rpa | no relevant hits (search term collided with "Karpathy" abbreviation matches) | **RPA has no discoverable skill at all** |
| business process | `bpmn` (2.9K, a diagramming notation skill), `azure-business-process-tracking` (90) | modeling notation / one Azure product, not an execution discipline |
| cron scheduling | `iii-cron-scheduling` (249), `render-cron-jobs` (143) | infra-level scheduling, not business-trigger semantics |

**Falsification check:** I looked specifically for a skill that generalizes "idempotency across a boundary you don't control + compensation + reconciliation + multi-vendor credential lifecycle + human-approval-as-a-node" as one coherent discipline. None exists. The closest near-misses (`zapier-make-patterns`, `langgraph-human-in-the-loop`, `idempotency-handling`) each cover exactly one slice and stay inside one vendor or one runtime. This is evidence *for* the hypothesis's "wide open" framing at the discoverable-skill layer — but it is also evidence the space is currently served by low-install, thin, single-vendor skills, i.e. real demand may be diffuse rather than absent. Stage 2 should verify this isn't just an artifact of skills.sh's own search recall.

---

## 2. Local installed skills — inventory

For each: name / source / licence (4-clause) / lines / covers / does-not-cover (grep + count).

### slackrelay
- **Source/owner:** Tamas's own personal CLI wrapper skill (project-local tool, `slackrelay` binary). No `LICENSE*` file anywhere in the skill dir (`find ~/.claude/skills/slackrelay -iname "LICENSE*"` → 0 hits). No README grant found (single-file skill, no README). Not a derivative of a third-party corpus — this is first-party tooling documentation Tamas wrote for his own CLI. **Licensing is a non-issue for lifting concepts**, but note: this is Tamas's private tool, not something `automation` can assume the end-user of the family skill has installed.
- **Lines:** 1105 (single `SKILL.md`, no references/ subdir).
- **Covers:** Slack API surface as a *read/write relay* — history/thread/search/files/reminders/canvases/user-groups/scheduled messages/presence/ephemeral sends. Explicitly documents `retryable` flag semantics for rate-limited calls (`grep -n "retryable" SKILL.md` → line 182: "`retryable` indicates whether the same request might succeed if retried (e.g., rate limiting)").
- **Does NOT cover:** no multi-step business process, no other vendor, no idempotency-key pattern, no human-approval gate, no compensation/rollback concept. `grep -niE "idempoten|compensat|reconcil|approval" slackrelay/SKILL.md` → **0 hits**. It is a single-vendor read/write API relay, not a workflow engine.
- **Lift for automation:** the `retryable`-flag pattern (distinguishing "safe to retry" from "do not retry" errors from a vendor API) is a small, real, liftable primitive for automation's retry/idempotency reference.

### slack-to-clickup
- **Source/owner:** Tamas's own skill. Backend is explicitly a third-party binary: `triptechtravel/clickup-cli` (per SKILL.md line: "the `triptechtravel/clickup-cli` clickup binary handles every ClickUp call"). No LICENSE file in the skill dir. `triptechtravel` recurs elsewhere in Tamas's installed skills (`clickup-to-code`), consistent with being Tamas's own org/tooling rather than an unrelated third party — treat as first-party, not a licensing risk, but flag for stage 3 to confirm ownership before citing code verbatim.
- **Lines:** 1193.
- **Covers:** a genuine **two-system business pipeline**: prerequisite check → mode detection → interview → collect → identify tasks → preview → **duplicate-sweep against the existing list** → **first-task gate** (create one, pause, confirm shape, then bulk) → bulk create + **image upload** → cross-link → final report. This is the single richest local artifact for automation patterns: it already encodes (a) a dedup/reconciliation step against downstream state, (b) a human-approval gate before bulk write, (c) a "preview then commit" pattern, (d) cross-linking two systems' records.
- **Does NOT cover:** no retry/idempotency-key language for the ClickUp writes themselves (relies on the `clickup-cli` binary's own idempotency, undocumented here); no rollback/compensation if bulk-create partially fails; no scheduling/trigger (it's user-invoked, not webhook- or cron-driven). `grep -niE "idempoten|rollback|compensat|retry" slack-to-clickup/SKILL.md` → **0 hits**.
- **Lift for automation:** the "first-task gate then bulk" human-checkpoint pattern and the duplicate-sweep-before-write pattern are directly reusable as canonical automation-reference patterns (human-approval-as-node, reconciliation-before-write).

### slack-to-jira
- Same author/shape as slack-to-clickup, 1112 lines, no attachment upload (older/simpler variant — SKILL.md itself says clickup version is "the big upgrade" over this one). Same gaps: no idempotency/rollback language (`grep` → 0 hits). No LICENSE file. Redundant with slack-to-clickup for automation purposes; the ClickUp version is the more complete pattern source.

### github-relay
- **Source/owner:** Tamas's own tool (`ghrelay` CLI + MCP server + skill). No LICENSE file in dir.
- **Lines:** 366.
- **Covers:** explicit rate-limit handling as a first-class concern — `RATE_LIMITED` probe type with its own `retryAfterMs` that **replaces** the default inter-request delay, and "per-probe failure isolation" (one failing probe doesn't kill the batch). This is a genuine capacity/backoff pattern.
- **Does NOT cover:** no workflow/webhook/trigger content — it's a research/ranking tool, not a process automation. `grep -niE "webhook|workflow|trigger|cron" github-relay/SKILL.md` → 0 hits for workflow/webhook/cron; not automation-domain content beyond the rate-limit pattern.
- **Lift:** the `retryAfterMs`-overrides-default-backoff pattern and per-item failure isolation in a batch are both good automation-reference material for "rate limit as the capacity unit."

### x-relay
- **Source/owner:** Tamas's own tool. No LICENSE file.
- **Lines:** 394.
- **Covers:** explicit rate-limit awareness ("account rate-limited fast... back off by `error.retryAfterMs`"), read/archive/**write** split (post/reply/like/follow/delete = real side effects on a third-party system with no rollback — "you cannot un-send a tweet" is *literally instantiated* here, matching the hypothesis's "you cannot un-send an email" framing).
- **Does NOT cover:** no idempotency-key pattern for the write actions, no compensation logic, no approval gate before a write fires (relies on the calling agent's judgment/user confirmation, undocumented as a formal gate). `grep -niE "idempoten|undo|compensat|rollback" x-relay/SKILL.md` → 0 hits.
- **Lift:** strong real-world confirmation of the hypothesis's "undeployable, partly irreversible" framing — a write to X/Twitter is exactly the class of action `backend` never has to reason about (no local DB to roll back).

### cloudflare (+ durable-objects, workers-best-practices, wrangler)
- **Source/owner:** installed via the `claude-plugins-official` marketplace (`anthropics/claude-plugins-official`, confirmed in `~/.claude/plugins/known_marketplaces.json`), i.e. Anthropic-distributed Cloudflare-docs-derived content, explicitly "biases towards retrieval from Cloudflare docs over pre-trained knowledge" (own SKILL.md description). No LICENSE file inside the skill dir itself, but provenance is a named official marketplace, not an anonymous scrape — this is the same content class already used as a deployment-surface reference in the shipped `backend-skill`, `ai-skill`, and `data-skill` builds per prior convention (see `[[backend-skill-build]]`, `[[ai-skill-build]]`). No new licensing risk introduced by citing it again here.
- **cloudflare/references/workflows/** (5 files, 712 lines total: api/configuration/gotchas/patterns/README): this is the single most relevant **infra-layer** find. Contains, verbatim-pattern level:
  - `waitForEvent<PayloadType>('wait', {type: 'webhook-type', timeout: '24h'})` — a durable step that pauses for an external webhook or **human approval**, with a timeout (README.md:50 lists "Events: `waitForEvent()` for webhooks/approvals").
  - A named failure mode: **"Idempotency Violation"** — `gotchas.md:40-42`: "Cause: Step operations not idempotent, causing duplicate charges or actions on retry." This is a vendor doc independently naming the exact failure class the automation hypothesis is built on.
  - `patterns.md:121-122`: "Granular steps: one API call per step (unless proving idempotency)" and "Idempotency: check-then-execute; use idempotency keys."
- **cloudflare/references/queues/** (5 files, 872 lines): `patterns.md:138` has a named "Idempotency Pattern" section; `gotchas.md:70`: "Design consumers to be idempotent by tracking processed message IDs in KV with expiration TTL" — at-least-once delivery semantics made explicit.
- **cloudflare/references/cron-triggers/** (5 files, 864 lines): scheduling primitive docs (infra cron, not business-trigger semantics).
- **durable-objects/references/rules.md:256**: "Retry: Alarms auto-retry on failure. Use idempotent handlers." — one line, same theme.
- **Verdict on this cluster:** genuinely useful **infra substrate** (durable execution engine, retry/idempotency vocabulary, webhook-wait-step, at-least-once queue semantics) — but it is Cloudflare-specific infrastructure for *building your own* durable backend, not knowledge about *integrating third-party vendor APIs you don't control* (no Stripe/HubSpot/Salesforce/CRM-specific content anywhere: `grep -rniE "stripe|hubspot|salesforce|crm" cloudflare/references/workflows cloudflare/references/queues` → **0 hits**). This is a candidate **deployment-surface reference** (Cloudflare Workflows as one runtime to build automation ON), same role Cloudflare plays in every prior family skill — not the wedge itself.

### orchestrate — boundary test (critical per brief)

Read `orchestrate/SKILL.md` in full (156 lines) plus grepped all 28 reference files (2356 lines total) for automation-domain leakage: `grep -rniE "webhook|zapier|make\.com|n8n|vendor|third.party|rate.limit|reconcil|compensat|approval|human.in.the.loop|business process|crm|stripe|hubspot|salesforce" orchestrate/`.

**Result: 0 hits for zapier/n8n/make.com/hubspot/salesforce/stripe/crm/vendor/third-party/reconcil/compensat/business process.** The only matches are:
- "approval" — always in the sense of a **human approving an AI agent's plan or a CLI's permission mode** inside a dev session (e.g. `strategy-team.md:55`: "Plan-approval gate for risky work... the teammate stays read-only until you approve its plan"), never a business-process approval step.
- "rate limit" — always **CLI/subscription rate limits** (e.g. `shared-safety-rails.md:42`: "Rate-limited external CLI → report to the user; no retry loops against subscription quotas"), never a third-party vendor API rate limit as a capacity unit.
- "vendor" — always **vendor docs for the coding-CLI hosts themselves** (Codex/Antigravity/Kimi flag surfaces), never a business SaaS vendor.

**The team-lead's draft boundary line holds and is not leaking:** orchestrate's own SKILL.md states its scope explicitly — "orchestrate owns **how work is assigned across agents**... does not decide which product-lifecycle domains are required" — and every primitive it defines (worktrees, task briefs, review gates in `.orchestrate/`, model routing, `trigger=schedule:"cron"` for *re-invoking the agent loop*) operates entirely inside one dev session/host, writing to a local `.orchestrate/` directory, coordinating **agents**, never an external vendor API, webhook, or a human clicking "approve" on a business record. Even orchestrate's `trigger=schedule:"cron"` dimension — the one surface-level overlap with automation's cron/trigger concern — is scoped to re-running the *orchestration itself* on a schedule, not to a business event arriving from outside.

**Conclusion: the line is clean.** Orchestrate = coordinating AI agents, in a session, to produce code/artifacts, with review gates that are agent-to-agent or agent-to-human-developer. Automation = running a business process across external systems, unattended, in production, where the "ack" comes from a vendor you don't control and the retry/rate-limit/approval concerns are about that vendor, not about a coding CLI. No overlap requiring de-duplication between the two skills.

### handoff
- 15 lines. Compacts a conversation into a handoff doc for another *agent*. Same category as orchestrate (dev-session tooling) — not automation-domain. No further action needed.

### webdesign — 10-minute dry-check (per brief, time-boxed)
- `grep -rniE "workflow|webhook|integration|cron|zapier|automation|n8n|make\.com|ipaas" webdesign/` → **13 hits total**, all false positives on inspection:
  - "workflow" used exclusively as a *design-process* term (`section-design-workflow.md`, "The workflow arc") — a craft pipeline for building a webpage section, unrelated to business-process automation.
  - "automation"/"webhook" appear twice, both about **browser-automation tooling for screenshots** (`frontend-build-patterns.md:255`, `art-review.md:41,51`) and once as "a person manages notifications, not webhook config" (`frontend-design-principles.md:167`) — a line arguing *against* over-engineering, not automation content itself.
- **Confirmed dry for automation purposes**, consistent with the prior build's "FULLY MINED" verdict (checked in ~6 minutes). 0 usable findings.

---

## 3. Load-bearing findings for the controller

1. **The discoverable-skill ecosystem confirms no generalist competitor exists** — every automation-adjacent skill on skills.sh is either single-vendor (n8n, Zapier, Clerk, Stripe webhooks) or single-task (changelog, billing, excel), never a cross-vendor discipline covering idempotency/compensation/reconciliation/credential-lifecycle/human-approval-as-node together. RPA has literally zero discoverable skills.
2. **`slack-to-clickup` is the single richest local pattern source**: it already encodes a duplicate-sweep-before-write (reconciliation), a first-item-then-bulk human gate (approval-as-node), and a preview-then-commit pipeline across two real third-party systems — worth mining directly as a canonical automation reference pattern in stage 2/3.
3. **`x-relay` and `github-relay` independently confirm the hypothesis's "partly irreversible, rate-limit-as-capacity-unit" framing** with concrete vendor examples (can't un-send a tweet; `retryAfterMs` overriding default backoff; per-probe failure isolation) — real evidence, not speculation.
4. **Cloudflare Workflows/Queues references are a legitimate deployment-surface candidate** (durable webhook-wait steps, named "Idempotency Violation" failure class, at-least-once queue semantics) but are infra-for-building-your-own-durable-backend, not third-party-vendor-integration knowledge — do not let this cluster masquerade as the wedge.
5. **The orchestrate/automation boundary is clean and non-leaking** — verified by exhaustive grep across all 2356 lines of orchestrate's references, zero business-vendor or business-process-approval content found.

## 4. Verdict

**WIDE OPEN**, with the caveat that "wide open" at the discoverable-skill layer coexists with a lot of *diffuse, thin, single-vendor* prior art (Zapier's own skill, n8n-skills, Make patterns) that stage 2 (GitHub sweep) will need to check isn't secretly deep in any one repo. Nothing found here contradicts the controller's hypothesis; several local artifacts (slack-to-clickup, x-relay, github-relay, Cloudflare Workflows gotchas) independently *corroborate* pieces of it with concrete evidence rather than assertion.

**Single most important thing for stage 2 to investigate:** whether any of the single-vendor skills.sh entries with real install counts (`zapier/agent-skills@workflows-create/modify`, `czlonkowski/n8n-skills` cluster at ~9K, `langgraph-human-in-the-loop` at 11.5K) — despite being narrow — collectively amount to a de facto standard vocabulary/pattern set (e.g. a shared idempotency-key convention, a shared HITL interrupt/resume shape) that `automation` would need to be compatible with or explicitly differentiate from, rather than reinvent from first principles.
