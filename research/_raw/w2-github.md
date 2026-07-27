# W2 — GitHub competitor sweep: `automation` skill (Stage 1 recon)

Scope: competing Claude/agent skill collections, packaged automation knowledge (non-skill), and
direct probes of the five hypothesis differentiators. Read-only, no outward-facing actions taken.
Tooling: `ghrelay` (github-relay CLI, corpus at `research/automation/_raw/corpus.json`) + WebSearch.

## 1. The heavyweight peer: `alirezarezvani/claude-skills`

- 362 production-ready skills, 23,275 GH stars (ghrelay-measured, live 2026-07-27), MIT licence
  (root `LICENSE` read directly — Copyright (c) 2025 Alireza Rezvani, standard MIT text, no
  attribution-scrubbing detected). Last push 2026-07-17. Rank score 78.9/100 (build-on profile),
  coverage 7/7. — https://github.com/alirezarezvani/claude-skills
- Note: its own README badge claims "5,200+ GitHub stars" while the live API reports 23,275 —
  a stale/inconsistent self-reported number, not something I'm relying on for ranking (ghrelay's
  live count is authoritative here).
- **Top-level directories** (`ghrelay skim`, 4,721 files): `.claude-plugin .claude .codex-plugin
  .codex .gemini .github .hermes .vibe agents assets audit business-growth business-operations
  c-level-advisor commands commercial compliance-os custom-gpt docs engineering-team engineering
  finance loop-library markdown-html marketing-skill marketing orchestration product-team
  productivity project-management ra-qm-team research-ops research scripts standards templates`.
  **There is no `automation`, `integration`, or `workflow` top-level directory.**

### Grep probes against this repo (grep.app via `ghrelay code --repo`)

| Probe | Command | Hits | What it actually is |
|---|---|---|---|
| `idempotency` | `ghrelay code "idempotency" --repo alirezarezvani/claude-skills --literal --limit 20` | 13 | Generic backend/API-design reference material: `engineering-team/skills/senior-backend/references/api_design_patterns.md` (§8 "Idempotency Patterns", HTTP header + DynamoDB key), `engineering-team/skills/aws-solution-architect/references/best_practices.md`, `engineering/skills/api-design-reviewer/SKILL.md`, `engineering-team/skills/stripe-integration-expert/SKILL.md` (webhook-signature + processed-events-table idempotency for **your own inbound** Stripe webhook handler). All of these teach idempotency **as the API provider** (protect your endpoint from duplicate client calls) or **as a single-vendor integration** (Stripe webhooks specifically) — none teach idempotency as the caller reconciling against a boundary you don't control, across many heterogeneous vendors, when the vendor's own retry/ack semantics are unreliable. |
| `saga` | `ghrelay code "saga" --repo alirezarezvani/claude-skills --literal --limit 20` | 1 | One incidental mention inside `aws-solution-architect/scripts/architecture_designer.py` — a Step Functions capability blurb ("Complex workflows, sagas..."). No dedicated saga/compensation content. |
| `compensat` | `ghrelay code "compensat" --repo alirezarezvani/claude-skills --literal --limit 20` | 15 | **Zero of these are compensating-transaction / saga-rollback content.** All 15 are sales/HR "compensation" (comp benchmarking, commercial deal exceptions, compensating commitments in discount policy). This is a false-positive-rich grep that, read in full, confirms an absence rather than a presence. |
| `reconcil` | `ghrelay code "reconcil" --repo alirezarezvani/claude-skills --literal --limit 20` | 16 | All either (a) Kubernetes-operator reconcile-loop content (`engineering/skills/kubernetes-operator/*` — reconcile lint script, reconcile skeleton, SKILL.md) — infra state reconciliation, not vendor-API reconciliation; or (b) `engineering/skills/migration-architect/references/data_reconciliation_strategies.md` — one-time data-migration reconciliation between two systems you control, not an ongoing loop against a third-party vendor whose ack you can't trust. |
| `human-in-the-loop` | `ghrelay code "human-in-the-loop" --repo alirezarezvani/claude-skills --literal --limit 20` | 11 | Scattered incidental mentions (vendor-management SLA notes, process-mapper bottleneck detector, marketing prompt-engineer-toolkit "human-in-the-loop gates" bullet, EU AI Act conformity planner). **No dedicated skill treating human approval as a first-class workflow graph node with timeout/escalation semantics.** |
| `credential rotation` | `ghrelay code "credential rotation" --repo alirezarezvani/claude-skills --literal --limit 20` | 14 | Owned by `engineering/skills/secrets-vault-manager/SKILL.md` and `engineering/skills/env-secrets-manager/SKILL.md` — single-vault / single-org secret-rotation hygiene (Vault, cloud KMS, CI runners). This is the *closest* adjacent content to "multi-vendor credential lifecycle," but it is vault-hygiene-shaped (one org's secrets store), not integration-platform-shaped (N vendors, each with its own OAuth flow, refresh-token expiry, and scope-drift, orchestrated from one automation layer). |
| `n8n` | `ghrelay code "n8n" --repo alirezarezvani/claude-skills --literal --limit 20` | 1 | One incidental mention in `c-level-advisor/skills/coo-advisor/references/process_frameworks.md`, listing n8n/Zapier/Make as "Tier 1 no-code automation" tools in an ops-advisory doc. Not a skill about building or operating automations. |

**Read in full, these six probes are the load-bearing finding**: the mega-repo has broad,
competent *generic backend* and *generic infra* knowledge that brushes past every one of the
five hypothesis differentiators, but it does not own any of them, and it has no
automation/workflow/integration category at all. This mirrors what killed 4/6 differentiators on
a prior build — but here the outcome is the opposite: the specific claims survive contact with
the grep.

## 2. Claude/agent skill collections & marketplaces — the wider set

Searched via `ghrelay search "topic:claude-skills topic:automation"` (30 results merged) plus
WebSearch for "awesome claude skills" lists. None add automation/workflow-specific packaged
knowledge beyond what §1 already covers:

- `anthropics/skills` (official repo) — https://github.com/anthropics/skills. Skill set:
  `algorithmic-art, brand-guidelines, canvas-design, claude-api, doc-coauthoring, docx,
  frontend-design, internal-comms, mcp-builder, pdf, pptx, skill-creator, slack-gif-creator,
  theme-factory, web-artifacts-builder, webapp-testing, xlsx` (per its own README, fetched via
  WebSearch). **No automation, workflow, or integration skill present.** Not a threat.
- `ComposioHQ/awesome-claude-skills`, `BehiSecc/awesome-claude-skills`,
  `travisvn/awesome-claude-skills`, `GetBindu/awesome-claude-code-and-skills` — curated *link*
  lists (pointers to other repos/skills), not original packaged knowledge of their own. Hydrated
  into corpus; none independently ranked above the noise floor (all below rank 76 on the
  build-on profile, several with only partial B/C/D coverage because they're thin
  link-aggregator repos rather than substantive codebases).
- `yusufkaraaslan/Skill_Seekers` (14,573★, rank 76.0) — a doc→skill *converter* tool, not
  automation domain knowledge.
- `jezweb/claude-skills`, `mhattingpete/claude-skills-marketplace`,
  `karanb192/awesome-claude-skills` — smaller marketplace/collection repos, hydrated and
  enriched; none surfaced automation-specific content in the ranked top 30 (see corpus.json).

## 3. Packaged automation knowledge that is *not* a "skill"

- **n8n template libraries** — `ScraperNode/awesome-n8n-templates` (8,697+ workflow JSONs, 25
  categories, 236 integrations — per repo description via WebSearch),
  `enescingoz/awesome-n8n-templates` (280+ templates, 24,174★, rank 76.1),
  `Danitilahun/n8n-workflow-templates` (2,053 workflows), `restyler/awesome-n8n` (community-node
  index). **These are workflow-config artifacts (JSON to import), not prose/pattern teaching.**
  None of them explain idempotency, compensation, reconciliation, credential lifecycle, or
  approval-as-node as concepts — they are recipes for specific automations, not a knowledge layer
  about building automations robustly. Confirmed by category structure reported in WebSearch
  results (Gmail/Telegram/Slack/Discord/Notion/OpenAI integration templates, not
  reliability-pattern docs).
- **Awesome-list directories** — `meirwah/awesome-workflow-engines`,
  `vchaitanyachowdari/Awesome-Workflow-Engines`, `stn1slv/awesome-integration`,
  `dariubs/awesome-workflow-automation` — all are curated *links* to engines/tools (Activepieces,
  Airflow, Argo Workflows, Conductor, Temporal, n8n, Svix, Activiti). Zero original teaching
  content; they exist to help you find a tool, not to teach the failure modes of operating one
  against third-party vendors.
- **Temporal saga samples** — `temporalio/samples-go/saga` (official SDK samples repo, MIT-style
  Temporal licence), `temporal-sa/temporal-order-saga`, `temporalio/sagas-temporal-trip-booking`,
  `kevinmichaelchen/temporal-saga-grpc` — all implement the saga pattern **across microservices
  you own** (order/inventory/payment services in the same trust domain), coordinated by a
  workflow engine you control end-to-end. None address the "you cannot deploy a fix into
  Stripe / you cannot un-send an email" case — the compensating actions in these samples call
  your own gRPC services, not an undeployable third-party API whose behavior can change without
  your involvement.
- **Idempotency libraries** — `ikyriak/IdempotentAPI` (.NET), `arun0009/idempotent` (Java),
  a Rack middleware implementation, `WendellAdriel/laravel-idempotency` (153★, rank 80.3 but
  4/7 coverage, no B/C/D data — thin single-purpose repo). **All of these protect a server you
  own from duplicate inbound client requests** — the mirror image of the hypothesis's concern
  (you, the automation, calling an unreliable/at-least-once-delivering third party and needing to
  dedupe *their* retries and *your own* re-attempts against a boundary you don't control).

### GitHub-wide grep: "compensating transaction" (not repo-scoped this time)

`ghrelay code "compensating transaction" --literal --limit 20` → **13 hits across 9 distinct
repos**: `OpenHands/OpenHands`, `aws-samples/serverless-patterns`, `bloomberg/comdb2`,
`bucket4j/bucket4j` (false-positive, unrelated token-bucket doc), `iluwatar/java-design-patterns`,
`jbosstm/quickstart`, `payara/Payara-Examples`, `simplyi/OrdersService`, `yahoo/elide`.
**Every genuine hit is a microservices/distributed-transaction example** (order-saga demos, a
Java design-patterns textbook repo, an AWS Step Functions serverless-pattern sample, a JBoss
Narayana MongoDB banking quickstart) — i.e., the compensating-transaction literature that exists
on GitHub is entirely owned by the backend/microservices niche, teaching rollback of operations
you own. Zero hits teach compensation in a third-party-SaaS-integration setting where you cannot
touch the vendor's internals. This is the single clearest piece of evidence for the hypothesis.

### Human-approval-as-workflow-node: one real product, not a knowledge competitor

- **`agentkitai/agentgate`** — https://github.com/agentkitai/agentgate ("Human-in-the-loop
  approval system for AI agents. Agents request. Policies decide. Humans approve.") 30★, MIT
  licence (badge + `LICENSE` file present per `ghrelay skim`), actively pushed 2026-07-26.
  TypeScript SDK + MCP server, policy engine (auto-approve/auto-deny/route-to-human), multi-channel
  (Slack/Discord/email/dashboard), webhooks with retry+backoff, full audit trail tagged to OWASP
  LLM Top-10 risks. **This is a real, working piece of infrastructure that implements exactly the
  "human approval as a node in the graph" idea** — strong validation that the concept is valuable
  enough to build a product around. But it is a *tool/service* you deploy, not packaged
  agent-consumable knowledge teaching the pattern, its timeout/escalation design space, or how to
  wire it into a broader automation with idempotency/reconciliation concerns. It competes with a
  hypothetical "automation" *product*, not with an "automation" *skill*. No SKILL.md, no
  Claude/agent-skill packaging of any kind found in the repo tree.

## 4. Licence/liveness notes (all four clauses)

- `alirezarezvani/claude-skills`: MIT, root `LICENSE` read directly, copyright by the actual
  claimed author — no derivative/byte-identical-corpus concern found (I did not diff its
  content against another corpus; flagging as unchecked, not clean, if stage 2 needs certainty).
  Live (pushed 2026-07-17, 10 days before this sweep).
  Considering it, but this is a MIT license, and it's important to know — if we adapt phrasing/structure of any reference doc (e.g. the idempotency or reconciliation material) it should still be written independently, not lifted, given the derivative-corpus gotcha from a prior build.
- `agentkitai/agentgate`: MIT, active (pushed 2026-07-26, yesterday). Live and recommendable as
  a reference for the approval-workflow design space, not a licensing concern since we'd only be
  studying its documented design, not vendoring its code.
- `temporalio/samples-go`: Temporal's own samples repo (MIT), live (see rank row, pushed
  2026-07-27) — safe to study the saga sample's *structure* as a contrast case (microservices
  saga vs. vendor-boundary compensation) but it is not itself a competitor for our niche.
- n8n template repos (`enescingoz/awesome-n8n-templates`, `ScraperNode/awesome-n8n-templates`):
  licence field reports `custom` for enescingoz's repo per `ghrelay rank` (`lic: "custom"`) —
  worth a manual README check in stage 2 if any template content were ever reused (it should not
  be; they're recipe artifacts, not prose we'd want to lift).
- No archived-but-properly-licensed repos encountered in this sweep (unlike the Grafana OnCall
  case from a prior build) — everything above is actively maintained.

## Verdict

**NARROW-TO-WIDE-OPEN, with the narrowness on the "automation" umbrella term and wide-openness on
the five specific differentiators.** Generic "automation/workflow" as a topic is crowded (n8n,
Temporal, Activepieces, Conductor, Dagster all rank 77-90 on raw popularity/maintenance — see
corpus.json top rows), so a skill that just says "how to build automations" would be competing
with well-funded OSS platforms and their own docs. But **none of those platforms, and no Claude
skill collection including the 362-skill heavyweight, packages the specific substrate this build
is targeting**: idempotency across a boundary you don't control (found: idempotency content is
either provider-side or single-vendor-Stripe-shaped, never multi-vendor-caller-shaped),
compensation instead of rollback (found: saga/compensation literature is 100% microservices-owned,
0% third-party-vendor-shaped, confirmed by a GitHub-wide grep), reconciliation against a vendor you
can't trust (found: reconciliation content is either k8s-infra or one-time-migration, never an
ongoing vendor-ack-distrust loop), multi-vendor credential lifecycle (found: closest analog is
single-vault secrets hygiene, not N-vendor OAuth lifecycle orchestration), and human-approval-as-
graph-node (found: one real product — agentgate — validates the concept but is infra, not
knowledge, and doesn't touch the other four differentiators).

## Most important thing for Stage 2

**Verify against vendor-official documentation, not just community/OSS repos.** Temporal, n8n,
and Inngest each publish their own "human-in-the-loop" / "reliability" guides (e.g.,
temporal.io/blog/human-in-the-loop-approvals, docs.temporal.io/guides/reliable-document-approvals
— found via WebSearch, not yet deep-read or grepped for repo/licence provenance since they're
vendor blog/docs pages, not GitHub repos, so out of my channel's remit). Stage 2 (or whichever
channel covers vendor docs/blogs) must check whether any single vendor's official documentation
already teaches the *combination* of idempotency + compensation + reconciliation + credential
lifecycle + human-approval-as-node in a vendor-agnostic way — if Temporal's own docs already
synthesize this for its own platform, the wedge for us is "vendor-agnostic, cross-platform"
synthesis specifically, and that framing needs to be explicit in the SKILL.md from the start.

## Corpus

Full ranked/enriched corpus (168 rows merged, 60 enriched, ranked top-30 shown above) at
`research/automation/_raw/corpus.json` in this directory — re-rankable with
`ghrelay rank corpus.json --profile build-on|dissect|ideas`.
