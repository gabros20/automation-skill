# S2-W7 — Engine/platform landscape, build-vs-buy, testability

Worker: W7. Date of all verification below: **2026-07-27** unless stated otherwise. Every volatile
fact (licence, feature, pricing-adjacent claim) is marked "verified 2026-07-27, re-verify" — these
things change monthly and this file will be stale within a quarter.

Method note: this session's shared WebSearch budget was exhausted by other workers before I could
use it (hit "200 of 200" on my first two queries). Everything below comes from **direct WebFetch of
primary-source docs/GitHub, and `gh api`/`curl` against GitHub's REST API and raw content** — no
search-engine-mediated discovery, so coverage is uneven where a vendor's docs site blocked WebFetch
(several 404s from JS-rendered doc portals, noted inline). I did not spend budget re-trying every
dead end; gaps are flagged as gaps, not filled with unsourced recall.

---

## Part A — the four-tier landscape, with honest licences

### Tier 1 — Hosted iPaaS / no-code
**Zapier, Make, Workato, Tray, Pipedream, IFTTT.** All closed-source SaaS except Pipedream, which is
**source-available, not open source** (see below). None publish a licence for their core engine
because there is no distributable core — you rent execution, you don't run it. This is the tier
where the exit-cost question (Part D) bites hardest: there is no local artifact to inspect, fork, or
migrate off of a repo for.

### Tier 2 — Self-hostable engines
**n8n, Windmill, Activepieces, Kestra, Node-RED.** All distributable, all runnable on your own
infrastructure — but "self-hostable" and "open source" are **not the same claim**, confirmed below.

### Tier 3 — Code-first durable execution
**Temporal, Inngest, Restate, Hatchet, Trigger.dev, DBOS, Cloudflare Workflows, AWS Step Functions,
Azure Durable Functions, Google Cloud Workflows.** This tier splits further: Temporal/Restate/Hatchet/
DBOS are self-hostable engines with a permissive-or-source-available licence; Inngest is
self-hostable but SSPL; Cloudflare Workflows/Step Functions/Azure Durable Functions/GCP Workflows are
cloud-proprietary managed services with **no distributable core at all** (Azure ships its
*extension/SDK* as open source, but the execution substrate is Azure-only).

### Tier 4 — Platform-native
**GitHub Actions, cloud schedulers, cron.** Not workflow engines in the Part-B sense — no durable
step state, no built-in retry primitive at the platform level (see Part B). Their reliability
properties come entirely from what you bolt on.

---

### Licence and liveness table (verified 2026-07-27 against root LICENSE files + `gh api` repo metadata)

| Project | Licence (verbatim source) | OSI open source? | Liveness (pushed_at / stars via `gh api`) |
|---|---|---|---|
| **n8n** | "Sustainable Use License, Version 1.0" for the main tree; files with `.ee.` in name/dir require a **separate n8n Enterprise Licence** (`LICENSE_EE.md`) — quoted: *"it is forbidden to copy, merge, publish, distribute, sublicense, and/or sell the Software"* under the EE terms. SUL itself: *"You may use or modify the software only for your own internal business purposes or for non-commercial or personal use. You may distribute the software... only if you do so free of charge for non-commercial purposes."* | **No.** n8n's own docs/licence file self-identify this as distinct from Apache/MIT-style OSS; SUL is not on the OSI-approved list. | pushed 2026-07-27, 198,210★ |
| **Activepieces** (core) | MIT, confirmed from `LICENSE` root file; `packages/ee/` carve-out under a separate enterprise licence | Yes (core); No (ee/ subtree) | pushed 2026-07-27, 23,439★ |
| **Windmill** | Mixed: backend + frontend = **AGPLv3**, except proprietary EE code fragments that "must not" be included in forks; client libraries (python/deno/go/powershell) + OpenAPI/OpenFlow specs = **Apache-2.0** | Yes for the AGPLv3/Apache-2.0 portions; the EE fragments are proprietary and excluded from what you can legally redistribute even under AGPL | pushed 2026-07-27, 17,320★ |
| **Kestra** | Apache-2.0 at the repo root (`LICENSE` file, GitHub-detected `Apache-2.0`) | Yes for the core; `HumanTask` and other features are gated `editions="EE"` in the docs (see Part B) | pushed 2026-07-27, 27,483★ |
| **Node-RED** | Apache-2.0 (OpenJS Foundation project) | Yes | pushed 2026-07-24, 23,451★ |
| **Temporal** | MIT | Yes | pushed 2026-07-27, 21,876★ |
| **Inngest** | **Server Side Public License, Version 1.0** with a future Apache-2.0 grant. Quoted, Section 13: *"If you make the functionality of the Program or a modified version available to third parties as a service, you must make the Service Source Code available via network download to everyone at no charge, under the terms of this License."* | **No.** SSPL is not OSI-approved (same family as MongoDB's licence) — this is the surprise finding: Inngest is frequently described as "open source" in comparison listicles without qualifying that the copyleft-as-a-service clause is stricter than AGPL. | pushed 2026-07-27, 5,654★ |
| **Restate** | **Business Source License 1.1.** Quoted: *"is not an Open Source license."* Prohibits using it "as a managed service that allows third parties to access Restate's APIs and register their own service deployments." Converts to Apache-2.0 four years after each version's release. | No (source-available; converts to OSS on a rolling 4-year delay per version) | pushed 2026-07-27, 4,225★ |
| **Hatchet** | MIT | Yes | pushed 2026-07-27, 7,601★ |
| **Trigger.dev** | Apache-2.0 | Yes | pushed 2026-07-27, 15,773★ |
| **DBOS** (transact-py) | MIT | Yes | pushed 2026-07-24, 1,498★ |
| **Pipedream** | **Pipedream Source Available License Agreement Version 1.0** — a custom licence, not a recognized OSS licence, scope of "the Software" not delineated from the hosted platform in the file itself | **No.** This directly confirms the brief's flag: Pipedream is routinely listed alongside n8n/Activepieces as "open source" in comparison content; it is not. | pushed 2026-07-27, 11,574★ |
| **Azure Durable Functions extension** | MIT (the SDK/extension only — the Azure Functions runtime it deploys to is proprietary) | Yes for the client library; N/A for the execution substrate | pushed 2026-07-24, 764★ |

All thirteen repos checked are **live** — none archived, none disabled, all pushed within the last
72 hours of this check (2026-07-27), so "abandoned" is not a live concern for any of them right now.
Re-verify liveness before publishing; a repo's activity can change materially in months, and this
check has zero shelf life as evidence.

**Reconciliation against the brief's pre-loaded claims:** n8n-SUL, Activepieces-MIT, Windmill-mixed,
Kestra-Apache-2.0, Pipedream-not-OSS, Temporal-MIT all confirmed exactly as stated. One addition the
brief didn't ask me to check but which surfaced independently and is worth flagging hard: **Inngest
is SSPL, not a standard permissive/copyleft licence** — this is a second "surprise" alongside
Pipedream, and the "four-clause rule" (root licence + docs grant + undisclosed derivatives + liveness)
applies to it exactly as it does to n8n.

---

## Part B — the reliability-capability matrix

All rows below cite the specific doc fetched; "n/v" = not independently verified this session
(vendor docs blocked WebFetch or I ran out of turns to chase it — flagged, not guessed).

| Engine | Retries | Dedup/idempotency | Partial-failure resume | Replay | Approval/HITL | Silent-stop alerting default |
|---|---|---|---|---|---|---|
| **Temporal** | Per-Activity by default (Workflows do **not** retry as a whole — docs explicitly discourage it: *"retrying the whole Workflow would repeat the same logic without resolving the underlying issue"*). Configurable backoff coefficient (default 2.0), initial interval (default 1s), max interval (default 100× initial), max attempts (default unlimited). **No documented jitter field** on `RetryPolicy` in the page I fetched. | Not a built-in primitive in the pages fetched — Workflow IDs can be reused as a natural dedup key, but this is a pattern, not a flag. | **Yes, structurally.** Event-sourced replay reconstructs Workflow state from history on every continuation; only in-flight (not-yet-completed) Activities re-execute. | Deterministic replay is the core mechanism, not an add-on feature — every continuation *is* a replay of history. | Signals exist as the mechanism (seen referenced in Event History) but the fetched page didn't detail timeout/escalation semantics — **n/v this session**, though the stage-1 gate's controller already found Temporal's own HITL docs+blog cover timeout/escalation in depth. | **n/v** — no default-alerting claim found in the pages fetched; Temporal Cloud alerting exists as a product surface but I could not confirm on-by-default. | Source: [Temporal retry policies](https://docs.temporal.io/encyclopedia/retry-policies), [Temporal Workflows](https://docs.temporal.io/workflows) |
| **Inngest** | Step-level, not function-level: *"Each step.run() has its own retry counter."* Default = 4 retries after first attempt (5 total). Configurable via `retries` option, `retries: 0` disables. Backoff/jitter mentioned qualitatively ("retry... with backoff") but no numeric default documented in the page fetched. | Explicitly **not built-in** — docs put the burden on the developer: *"Retried code should be idempotent... upserting data, using deterministic IDs, or checking for existing records."* | **Yes.** `step.run()` memoizes: *"When step.run() finishes successfully, the response is saved in the function run state and the step will not re-run."* This is the direct answer to "avoid the duplicate-side-effect generator" — a retried/resumed function skips already-completed steps by design. | **Function-level, not step-level.** Dashboard "Replay" reruns whole functions in bulk, filterable by time range and status, deliberately rate-limited (*"spread out... as to not overwhelm your application"*). Original event payload use wasn't explicitly confirmed in the fetched page. | `step.waitForEvent()` pauses for a named event with a timeout (example: 3-day onboarding wait before falling back). Escalation-on-timeout is a pattern you build (branch on timeout), not a named primitive. | Failed functions are "marked as failed in the Inngest UI" and emit an `inngest/function.failed` **system event you can subscribe to** — this is opt-in wiring, not a default push notification. | Sources: [error-handling](https://www.inngest.com/docs/guides/error-handling), [multi-step functions](https://www.inngest.com/docs/guides/multi-step-functions), [replay](https://www.inngest.com/docs/platform/replay) |
| **Activepieces** | Retry re-queues and replays the run log from the failure point (see Resume column) — this is the same mechanism as resume, not a separate retry primitive. | Waitpoint completion is protected by a uniqueness constraint on `(flowRunId, stepName)`; docs state plainly: *"the engine never processes a resume twice."* No general step-level idempotency-key API described. | **Yes, and unusually well-documented.** Run log = one checkpoint file per run, written every 15s and on terminal states. On resume: *"every completed step is skipped and its recorded output reused. Only work that hadn't finished yet executes."* Docs name the honest boundary explicitly: *"The in-flight step re-runs... If it fired an external side effect before crashing, that effect can happen twice... At-least-once, not exactly-once."* This is the single most candid engine doc found in this whole survey. | Same run-log mechanism serves replay-on-crash, replay-on-retry, and replay-on-pause-resume uniformly — "resume is not a special path." | **Waitpoints**: `DELAY` (resumes at a timestamp, server-bounded max delay) or `WEBHOOK` (resumes on any HTTP call to a resume URL, can reply synchronously to the original trigger). Race-condition-safe (resume-before-pause handled explicitly). Escalation-on-timeout not documented as a named feature. | **n/v** — no default-notification claim found in the fetched pages. | Sources: [durable-execution.mdx](https://github.com/activepieces/activepieces/blob/main/docs/install/architecture/durable-execution.mdx), [waitpoints.mdx](https://github.com/activepieces/activepieces/blob/main/docs/install/architecture/waitpoints.mdx), [crash-recovery.mdx](https://github.com/activepieces/activepieces/blob/main/docs/install/guarantees/crash-recovery.mdx) |
| **Windmill** | Per-step, configured in each step's Advanced menu — **not** a flow-wide setting. Both constant delay and exponential backoff (`delay = multiplier * base^attempt`) supported. "Continue on error" option routes the error as the step's return value instead of halting. | **n/v** this session. | Per-step retry with "continue on error" branching gives partial control, but I found no explicit "resume whole flow from failed step" primitive distinct from per-step retry — **n/v** for flow-level resume. | **n/v** this session. | **Suspend/Approval**: a normal script with "Suspend" enabled calls `wmill.get_resume_urls()`. Default on timeout is **fail-closed**: *"The flow will remain suspended and will not proceed... until the exact number of required approval events is received."* Supports multiple-approval counts, flow-level pre-approval, Slack/Teams delivery, self-approval lockout, and group restriction. This is the most explicit default-deny-with-named-tradeoff of any engine checked. | **n/v** this session. | Sources: [flows/retries](https://www.windmill.dev/docs/flows/retries), [flow_approval](https://www.windmill.dev/docs/flows/flow_approval) |
| **Kestra** | Task-level: three backoff types — Constant (fixed interval), Exponential (`delayFactor`, default 2), Random (`minInterval`/`maxInterval`). `maxAttempts` + `maxDuration` caps. **Flow-level retry has two distinct modes**: `CREATE_NEW_EXECUTION` (starts over) vs `RETRY_FAILED_TASK` (retries only the failed task) — this is a named, first-class choice between the two failure modes the brief calls out (whole-rerun vs resume). | **n/v** this session. | **Yes, via `RETRY_FAILED_TASK`** at the flow level — an explicit alternative to `CREATE_NEW_EXECUTION`, i.e. Kestra names the exact choice the brief frames as "duplicate-side-effect generator vs not." | **n/v** for historical-run replay-with-original-payload; not found in the pages fetched. | **Pause task** (`io.kestra.plugin.core.flow.Pause`) — pauses execution; resumable from UI (single or bulk) or via `onResume` structured inputs (typed fields: BOOLEAN/STRING/DATE/SELECT) that downstream tasks can read. Full audit of who/when/what resumed. **`HumanTask`** (assign specific approvers) is gated `editions="EE"` — enterprise-only, same feature-fencing pattern as n8n's `.ee` files. **No documented timeout/escalation for Pause** in the pages fetched — a real gap versus Windmill's explicit fail-closed default. | **n/v** this session. | Sources: [retries](https://kestra.io/docs/workflow-components/retries), [pause-resume](https://github.com/kestra-io/docs/blob/main/src/contents/docs/15.how-to-guides/pause-resume/index.md), [approval-processes](https://github.com/kestra-io/docs/blob/main/src/contents/docs/use-cases/05.approval-processes/index.md) |
| **n8n** | Node-level "Retry On Fail" setting exists (general n8n knowledge; not re-confirmed against a fetched settings page this session — **n/v the exact field name/defaults**). | **Already covered by the family per stage-1 gate** (`service-integration.md:69-72`) — not re-derived here. | **n/v** — found no docs confirming resume-from-failed-node vs full workflow re-run; n8n's execution model is generally understood to re-run from the trigger on manual retry, which would make it a **CREATE_NEW_EXECUTION-only** engine unlike Kestra — flag for follow-up confirmation, do not assert without a source. | Manual "load data from previous execution into your current workflow" exists for **debugging** replay, not automated replay-with-original-payload at scale. | **Wait node**: pauses mid-execution, resumes "with the same data," triggered by time interval or an incoming webhook. No documented timeout/escalation-policy semantics (auto-approve/auto-reject/escalate) in the page fetched — thinner than Windmill's. | **Confirmed off by default, and this is decisive.** Error workflows are opt-in *per workflow*, set manually in Workflow Settings, and must start with an Error Trigger node: *"For each workflow, you can set an error workflow... It runs if an execution fails."* Nothing fires unless the builder wires it — this is the direct mechanism behind the stage-1 X-channel's "didn't notice till stuff just stopped firing for days" incident. | Sources: [handle-errors-gracefully.md](https://github.com/n8n-io/n8n-docs/blob/main/docs/build/flow-logic/handle-errors-gracefully.md), [wait.md](https://github.com/n8n-io/n8n-docs/blob/main/docs/build/flow-logic/wait.md) |
| **AWS Step Functions** | `Retry` field per Task/Parallel/Map state: `IntervalSeconds` (default 1), `MaxAttempts` (default 3), `BackoffRate` (default 2.0), `MaxDelaySeconds` cap, and a `JitterStrategy` field (`FULL`/`NONE`, default `NONE`) — **the only engine surveyed with a named, documented jitter toggle.** Whole-execution retry is not a thing; `Catch` routes to a fallback state instead. | Not a platform primitive — `ErrorEquals`/idempotency is the caller's responsibility, same pattern as everywhere else. | **Yes, and this is the strongest resume primitive found**: **Redrive**. *"Step Functions continues the failed execution from the unsuccessful step and uses the same input. Step Functions preserves the results and execution history of the successful steps, which are not rerun."* Eligibility: within 14 days of completion, execution not `SUCCEEDED`, under 1 year open, under 24,999 history events. Retry counts reset to 0 on redrive so the full attempt budget is available again. | Redrive **appends** to the existing execution history (`ExecutionRedriven` event) rather than starting a fresh history — closest thing to "replay a historical run with its original payload" found in this survey, though it's resume-oriented rather than a read-only "what would have happened" replay. | **Task Token callback pattern** (`waitForTaskToken`): a Task pauses and waits for an external `SendTaskSuccess`/`SendTaskFailure` call carrying the token; `HeartbeatSeconds` and `TimeoutSeconds` give explicit timeout semantics, catchable via `States.Timeout`/`States.HeartbeatTimeout`. This is a clean, generic building block for approval — not approval-specific but usable for it. | **n/v as "on by default"** — `TIMED_OUT`/failure events are listenable via **EventBridge**, but that's opt-in wiring, matching every other engine surveyed. | Sources: [error-handling](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html), [redrive-executions](https://docs.aws.amazon.com/step-functions/latest/dg/redrive-executions.html), [callback pattern](https://docs.aws.amazon.com/step-functions/latest/dg/callback-task-sample-sqs.html) |
| **Azure Durable Functions** | Retry policies attachable to Activity/sub-orchestrator calls (max attempts, delay) — exists per the fetched overview, exact default numbers **n/v** this session. | Not a platform primitive (same pattern as all above). | **No — and this is a real, decisive negative.** Quoted directly: *"If there's an unhandled exception in an orchestrator function, the orchestration instance finishes in a Failed state. You can't retry an orchestration instance after it fails."* Retry only works if attached to the specific Activity call **before** the unhandled exception propagates to the orchestrator; once the orchestrator itself fails, there is no resume — you must start a new instance. This is meaningfully weaker than Step Functions' redrive or Activepieces'/Kestra's resume. | Event-sourced replay is the core execution mechanism (orchestrator re-runs from scratch on every wake-up, consulting history to skip completed Activities) — but this is *replay-for-continuation*, not replay-of-a-terminal-failed-run (see above: failed = terminal). | **External events**: orchestrator can `waitForExternalEvent`, commonly used for human interaction/callbacks. Durable timers (`createTimer`) give timeout scaffolding; you build the escalation branch yourself, same as most engines here. | **n/v** — Application Insights integration exists for diagnostics but nothing found confirming default alerting. | Source: [Durable Orchestrations Overview](https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-orchestrations) |
| **Cloudflare Workflows** | Steps described as "self-contained, individually retryable" but exact retry-object defaults (limit/delay/backoff) **n/v** — the fetched page didn't surface the specific `retries` config schema. | **n/v** this session. | **Memoization-based, Temporal-style**: *"Steps should be named deterministically... This ensures that their state is cached, and prevents the step from being rerun unnecessarily. Step names act as the 'cache key.'"* Same family as Temporal/Azure/Activepieces — completed steps are skipped on re-entry. | Implied by the memoization model but not confirmed as a user-facing "replay this historical run" feature distinct from normal continuation. | `step.sleep()` for durable delays; `step.waitForEvent()` recommended once a timeout exceeds 30 minutes — no approval-specific primitive found beyond these two building blocks. | **n/v** this session. | Source: [Cloudflare Workflows rules](https://developers.cloudflare.com/workflows/build/rules-of-workflows/) |
| **Restate** | Configurable via service configuration (`/services/configuration#retries`); automatic exponential-backoff retry on handler timeouts is the documented default behaviour for calls to external APIs. Exact numeric defaults **n/v**. | **Yes — first-class and named as such.** Journal-based, invocation-level: *"If you add an idempotency key to your request headers, Restate will automatically ensure that requests are deduplicated"* — returns identical results for duplicate requests. This is the cleanest built-in idempotency primitive of any engine surveyed (Inngest/Temporal/Cloudflare all leave it to the developer; Restate makes it a header). | **Yes** — journal replay "skips completed steps and resumes from exactly where it left off," same family as Temporal/Azure/Cloudflare/Activepieces. | Journal-based replay is the continuation mechanism; explicit "replay a historical terminal run" as a separate product feature **n/v**. | "Suspensions" let a handler pause for external events/long-running tasks (e.g. awaiting approval) "without paying for wait time" on serverless — timeout mechanics for suspensions **n/v** in the page fetched (the term "awakeable," used by some Restate material, wasn't present in what I pulled). | **n/v** this session. | Source: [Restate durable execution](https://docs.restate.dev/concepts/durable_execution) |
| **Hatchet** | Task-level `retries` property, exponential backoff via `backoff_factor` (example 2.0) and `backoff_max_seconds` cap (example: sequence "2s, 4s, 8s, 10s, 10s..."). `NonRetryableException` lets a task opt out (e.g. for non-idempotent operations or 4xx responses) — a nice explicit escape hatch. | **Not built-in** — docs explicitly warn: *"you should ensure that the operation is idempotent... before enabling retries."* Same burden-on-developer pattern as Inngest/Temporal. | "Durable sleep" is referenced in the docs nav but details **n/v** this session; no explicit resume-vs-restart claim confirmed. | **n/v** this session. | **n/v** this session — durable-sleep primitive suggests a building block exists but I could not confirm an approval-specific pattern. | **n/v** this session. | Source: [Hatchet retries](https://docs.hatchet.run/home/features/retries/simple) |
| **GitHub Actions** | **No native step/job retry primitive.** Confirmed indirectly but strongly: the third-party Action `nick-fields/retry` ("Retries a GitHub Action step on failure or timeout," MIT, 562★, pushed 2026-06-16) exists specifically to fill this gap, and a second maintained fork (`step-security/retry`, explicitly billed as a "secure drop-in replacement") also exists — two independently maintained community actions solving the same absent-native-feature is itself the evidence. Manual "re-run failed jobs" exists in the UI/API but is operator-triggered, not policy-driven. | None — entirely the workflow author's problem. | Manual re-run of failed jobs only; no automatic step-level checkpoint/resume. | None found. | None found as a platform primitive — `workflow_dispatch` with manual approval via required-reviewers on an Environment is the closest built-in analogue, not independently re-verified this session. | No default alerting beyond GitHub's own UI/email-on-failure notification settings, which are account/repo notification preferences, not workflow-specific. | Source: [`gh api repos/nick-fields/retry`](https://github.com/nick-fields/retry), [`gh api repos/step-security/retry`](https://github.com/step-security/retry) |
| **Zapier** | Widely documented (general knowledge) to auto-retry failed Zaps on a schedule over several days and send failure-notification email — **I could not get a primary source to confirm exact counts/timing this session**; every `help.zapier.com` URL I tried 404'd via WebFetch (likely JS-gated help center). Flagged as a genuine gap, not asserted. | n/v | n/v | Manual "Replay" of a historical Zap run from the Zap History UI is a well-known feature; exact payload/step semantics **n/v** this session. | n/v | n/v | **Gap — primary source not reachable this session.** |
| **Make (Integromat)** | Confirmed **only the directive names**, not their semantics, from a partially-rendered `help.make.com/error-handling` page: **Ignore/Skip, Retry, Resume, Commit, Rollback, Break** all appear in the navigation. | n/v | Directive-dependent (Resume vs Break vs whole-scenario) — semantics **n/v**, page truncated before detail. | n/v | n/v | n/v | **Partial — directive list confirmed, behavioural detail is a gap.** Source: [help.make.com/error-handling](https://help.make.com/error-handling) |

### The decisive cross-cutting finding on silent-stop alerting

**Of every engine where I could get a real answer (Temporal, Inngest, n8n, Step Functions, GitHub
Actions), none alerts by default when a workflow silently dies.** n8n is the clearest and most
citable case: error workflows are opt-in, per-workflow, and must be wired manually to an Error
Trigger node. Step Functions and Inngest both surface failure in their own UI/console but require the
operator to subscribe to an event (EventBridge, `inngest/function.failed`) to get pushed anywhere.
GitHub Actions has no workflow-specific alerting beyond generic repo notification prefs. **This
supports rather than undercuts the stage-1 gate's framing**: the "dead-man's-switch" defect the
`operate` pack already owns is not a gap unique to one vendor — it is the default posture of the
entire tier-2/tier-3 landscape. The pack should cite `operate`'s existing treatment rather than
re-derive it, per the stage-1 gate's own instruction (§5, item 8).

### The decisive finding on resume-vs-restart (the duplicate-side-effect question)

Engines split cleanly into two camps, and this is worth being the pack's spine diagram:

- **Resume-capable (skip completed steps, only re-run what failed):** Temporal (event-sourced
  replay), Azure Durable Functions (*for continuation, not for a terminal-failed orchestration* —
  see the negative finding below), Cloudflare Workflows (memoized steps), Activepieces (run-log
  replay-and-skip, explicitly candid about the at-least-once boundary), Kestra (`RETRY_FAILED_TASK`
  as a named alternative to `CREATE_NEW_EXECUTION`), AWS Step Functions (Redrive), Restate (journal
  replay), Inngest (step memoization within a function).
- **Restart-only or partially so once truly failed:** **Azure Durable Functions is the standout
  negative** — once an orchestrator itself throws unhandled, "you can't retry an orchestration
  instance after it fails," full stop, per Microsoft's own docs. n8n's default manual-retry behaviour
  is **unconfirmed but suspected restart-only** (flagged, not asserted) — worth a follow-up doc check
  before the pack states it as fact.

The practical rule this supports, aimed at the reader: **before you wire a workflow that has an
irreversible early step (a charge, an email, a CRM write), check whether your engine's retry/resume
model reuses completed-step output or restarts from the trigger — and if it restarts, that early step
needs its own idempotency key or it becomes a duplicate-side-effect generator on every retry.**
Activepieces' own docs name this exact failure mode as the *reason durable execution exists* in the
first place — good citation to lean on since it's about as unmarketing as a vendor doc gets: *"a
worker that dies mid-flow would restart the whole run from the trigger and re-send emails, re-charge
cards, and re-call APIs"* is literally their own description of what would happen without their
mechanism.

---

## Part C — testability

**What exists, sourced:**

- **Vendor-provided test/sandbox mode is real but not universal.** Stripe is the reference-quality
  example: isolated test API keys (`sk_test_*`/`pk_test_*`), dozens of synthetic test card numbers
  that deterministically trigger specific decline/dispute/fraud/3DS/settlement-timing scenarios, and
  a CLI (`stripe listen`/`trigger`) for forwarding and firing webhook events without any real
  transaction — "test transactions settle instantly," "don't move funds." (Source:
  [docs.stripe.com/testing](https://docs.stripe.com/testing), verified 2026-07-27.) This is the
  positive-existence-proof case: a vendor **can** make third-party integration genuinely testable.
  The honest corollary, which the pack should state plainly, is that **most SaaS webhook providers a
  small business actually wires together (CRMs, email tools, spreadsheets, niche verticals) have no
  equivalent** — no test mode, no synthetic failure triggers, no isolated webhook sandbox. Stripe's
  testing surface is a payments-industry-specific investment, not an iPaaS-wide norm.
- **Dry-run / preview execution inside the engines themselves** exists in several tools as a
  first-class feature (n8n's manual execution + "pin data," Windmill's flow preview with mocked step
  inputs) — this lets you validate *your own logic* deterministically, but it does not validate what
  the *vendor's* live endpoint will actually do, which is the harder half of the problem the brief
  names.
- **Generic contract/fixture-replay tooling** (Pact-style consumer-driven contract testing, WireMock,
  VCR/cassette-style HTTP fixture replay, Prism/OpenAPI mock servers) exists in the broader
  engineering ecosystem and is directly applicable to testing a workflow's own logic against a
  recorded/mocked vendor response — but none of it is workflow-engine-specific, and none of it
  solves the problem of **verifying the vendor's actual current behavior**, since a fixture is a
  snapshot of a contract that can silently drift (this is exactly the "upstream API field going null
  on a weekend" failure mode the stage-1 X-channel corroborated).
- **I did not find, in the time available, any dedicated "workflow-automation testing" discipline** —
  no canonical body of practice equivalent to Stripe's testing docs but generalized across vendors.
  This is consistent with the stage-1 gate's framing that this is thin, fragmented ground, not a
  wedge with existing literature to cite against.

**What is genuinely untestable, and the actual mitigations (synthesized from the above, not from a
single named source — flag as reasoning, not citation):**

- **Irreversible mutations against a vendor with no sandbox** (a live Slack post, a live CRM record
  write, a live email send) cannot be dry-run at all if the vendor provides no test mode. The
  practical substitutes that exist across the industry, none of them clean:
  - **Canary on a narrow, low-stakes segment** — run the real workflow against one real record/user
    you control before trusting it on the full population. This is the direct real-world echo of the
    stage-1 X-channel's "35 records instead of 1" and "near-$7,000 mis-triggered charge" incidents —
    both are exactly what a canary-first gate would have caught.
  - **The "first task then bulk" gate** the brief names explicitly: run a batch trigger against
    exactly one item, inspect the actual side effect by hand, and only then release it against the
    full batch. This is cheap, requires no tooling, and is the single most repeatable mitigation for
    the untestable case.
  - **Manual first-run review** — a human watches the first live execution end-to-end rather than
    trusting the dry-run/preview mode, precisely because the preview mode (per the point above)
    cannot see what the vendor's endpoint will actually do.
  - **Idempotency keys as a safety net even in "production testing"** — if you must test against a
    live, irreversible endpoint, at least make the operation itself replay-safe so a second
    accidental trigger doesn't double the effect.
- **Confirmed via the stage-1 gate framing (not independently re-derived here, since I don't have
  access to the `quality` pack's repository from this worktree):** the brief states `quality` does
  not cover this ground. I take that as given rather than re-verifying it, since it was supplied by
  the task and re-deriving it would require reading a sibling repo I cannot reach from
  `research/automation/_raw`.

---

## Part D — build vs buy, and the exit-cost question nobody asks up front

**When a no-code tool (Tier 1/2) is the right call:** low volume, a small non-technical team, shallow
branching logic, and coverage by the vendor's pre-built connector catalog. The vendor's per-task/
per-op pricing model (Zapier, Make) is genuinely cheaper than an engineer's time below some volume
threshold — this is not a controversial claim, it's the entire reason the tier exists and is a
multi-billion-dollar market.

**When you outgrow it — concretely, not vaguely:**
- Retry/idempotency semantics you need are more specific than what the tool's default gives you (see
  Part B — most no-code tools document *far* less about their retry model than the code-first tier
  does; Make's directive names are public, their exact rollback semantics were not confirmed this
  session, which is itself informative about how much visibility a no-code user actually has into
  the reliability contract they're depending on).
- Per-task pricing hits a volume cliff — cost scales with execution count in a way that a
  self-hosted or code-first engine's cost (compute + your own time) does not.
- You need version control, code review, and CI for the workflow logic itself — a no-code canvas
  is not diffable in the way a Temporal/Restate/Kestra-as-code definition is.
- You need reconciliation logic (per the stage-1 gate's residue list) that exceeds simple
  conditional branching — this is precisely the ground the no-code tools' error-handler directives
  (Resume/Ignore/Rollback/Break) don't reach.

**The exit-cost question, stated honestly (the brief is right that nobody asks this up front):**
Migrating off a no-code iPaaS is not a matter of "rewrite the logic in code" — it is:
1. **No portable workflow format exists across vendors.** A Zap definition doesn't export to n8n,
   Make's blueprint format doesn't import into Temporal, and none of the code-first engines share a
   workflow-definition schema either (Step Functions' Amazon States Language, Kestra's YAML DSL, and
   Temporal's plain-code-with-SDK model are three different paradigms). Every migration is a
   from-scratch re-implementation of trigger conditions, field mappings, and error-handling logic —
   read, by hand, out of a UI that may not even let you export the full configuration.
2. **The reliability assumptions you were implicitly relying on don't transfer.** If you built on a
   tool whose retry model you never had to think about, migrating exposes every place you relied on
   its (undocumented, to you) default behaviour — this is a direct consequence of the very unevenness
   documented in the Part B matrix above.
3. **Credentials have to be re-established, not just copied** — OAuth grants, API keys, and webhook
   URLs registered with a third party are usually bound to the vendor account, not portable to a new
   host without re-authorizing every single connected app.
4. **Even the self-hostable/BSL/SSPL tier is not exit-cost-free.** Choosing n8n, Restate, or Inngest
   because "it's self-hostable" still leaves you inside a Sustainable-Use/BSL/SSPL licence boundary —
   you can inspect and run the code, but the commercial terms on forking, redistributing, or offering
   it as a competing service are real constraints, not merely academic ones (see the licence table).
   "Self-hostable" answers *where does it run*, not *what are you allowed to do with it*.

**The recursion the brief names, and it deserves to be stated plainly rather than softened:** if you
build your automation logic and store your vendor credentials **inside a Tier-1 iPaaS you do not
control the infrastructure of**, then the thing running your business's glue logic is itself a
dependency you cannot deploy, redeploy, patch, or recover on your own timeline. An `operate`-style
incident response (rollback, redeploy, restore-from-backup) is unavailable to you for the automation
layer itself if that layer's outage, policy change, or account suspension is the incident. This is a
qualitatively different risk than ordinary SaaS dependency, because the automation layer is usually
the thing coordinating *other* vendor dependencies too — it's a single point of control failure
sitting on top of every other vendor relationship the business has. No vendor's marketing surfaces
this, for the obvious reason named in the brief's own rules.

---

## Recommended surface taxonomy for the pack (my read, stated as a recommendation not a decree)

Given the wedge is synthesis (per the stage-1 gate, §4) rather than discovery, I'd organize this
channel's material as a **decision-first taxonomy**, not a vendor-first one — vendors churn faster
than the underlying failure modes do:

1. **Pick your tier** (no-code / self-hostable / code-first-durable / platform-native) — framed by
   the build-vs-buy criteria in Part D, not by feature checklists.
2. **Know your engine's resume model before you wire an irreversible step** — the
   resume-vs-restart split from Part B is the single highest-leverage piece of knowledge in this
   whole channel; it directly prevents the stage-1 X-channel's corroborated failure modes (35
   duplicate records, the near-$7,000 mis-trigger).
3. **Wire your own failure alerting; assume the default is silent** — cite `operate`'s dead-man's-
   switch rather than re-teach it, per the gate's own instruction.
4. **Test what you can, canary what you can't** — dry-run/preview modes for your own logic, "first
   task then bulk" and narrow-segment canaries for the vendor-side unknown, since no general
   testing discipline exists for this seam.
5. **Price the exit before you enter** — the licence table and Part D's migration-cost breakdown as
   a pre-commitment checklist, not a post-hoc lament.

This groups by *decision the reader has to make*, with vendor specifics as supporting evidence inside
each — consistent with how `quality` and `operate` are described in this project's own memory as
having shipped on synthesis/defect wedges rather than vendor-survey structure.

---

## Provenance index (every URL actually fetched this session, 2026-07-27)

License/liveness: raw GitHub LICENSE files for n8n, Activepieces, Windmill, Kestra, Temporal,
Restate, Pipedream, Node-RED, Hatchet, Trigger.dev, DBOS (dbos-transact-py), Inngest; `gh api
repos/<org>/<repo>` for archived/pushed_at/stars/license across all thirteen.

Reliability docs: `docs.temporal.io/encyclopedia/retry-policies`, `docs.temporal.io/workflows`,
`inngest.com/docs/guides/error-handling`, `inngest.com/docs/guides/multi-step-functions`,
`inngest.com/docs/platform/replay`, `windmill.dev/docs/flows/retries`,
`windmill.dev/docs/flows/flow_approval`, `kestra.io/docs/workflow-components/retries`,
`github.com/kestra-io/docs` (`pause-resume/index.md`, `use-cases/05.approval-processes/index.md`),
`github.com/n8n-io/n8n-docs` (`build/flow-logic/handle-errors-gracefully.md`,
`build/flow-logic/wait.md`), `docs.aws.amazon.com/step-functions` (`concepts-error-handling.html`,
`redrive-executions.html`, `callback-task-sample-sqs.html`), `learn.microsoft.com/.../durable-task-
orchestrations`, `developers.cloudflare.com/workflows/build/rules-of-workflows`,
`docs.restate.dev/concepts/durable_execution`, `trigger.dev/docs/errors-retrying`,
`docs.hatchet.run/home/features/retries/simple`, `github.com/activepieces/activepieces`
(`docs/install/architecture/durable-execution.mdx`, `docs/install/architecture/waitpoints.mdx`,
`docs/install/guarantees/crash-recovery.mdx`), `help.make.com/error-handling` (partial), `gh api
repos/nick-fields/retry` and `repos/step-security/retry`.

Testability: `docs.stripe.com/testing`.

**Gaps flagged, not filled:** Zapier's exact retry/replay/notification semantics (help center 404'd
repeatedly via WebFetch); DBOS's checkpoint/replay mechanics beyond its licence; GCP Workflows;
Workato/Tray/IFTTT reliability specifics (licence/liveness not even attempted for these three given
time — Tier 1 closed-source vendors, lower marginal value than the self-hostable/code-first tiers for
a reliability matrix); Node-RED's retry model (it predates the durable-execution paradigm entirely and
likely has none — worth a follow-up check before asserting).
