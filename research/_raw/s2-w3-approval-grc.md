# S2-W3 — Approval-as-process-node vs enterprise GRC (Stage 2, flagship-deciding brief)

Read-only. WebSearch budget was exhausted mid-task (session-wide 200/200 cap hit); all
findings after that point are WebFetch of specific known URLs/source files, not fresh
search. No outward side effects (no signups, no issues, no posts).

## VERDICT: NARROWED — trending toward NO. Approval does not survive as flagship.

**Enterprise GRC literature already owns approval policy, and it owns more of the
brief's "policy layer" than stage 1 assumed.** Of the six things W5/controller listed as
"what we would teach," GRC — a *more* authoritative, more disinterested canon (audit
standards bodies, not vendors) than anything found for any other candidate flagship in
this build — already answers five in writing, decades deep:

| Policy question | GRC answer | Source |
|---|---|---|
| Who may approve | Delegation-of-Authority (DoA) matrix: role × threshold × decision type | [Umbrex DoA framework](https://umbrex.com/resources/frameworks/organization-frameworks/delegation-of-authority-doa-framework/) |
| May requester self-approve | **No, categorically** — maker ≠ checker is the definition, not a config option | [Maker-checker, Wikipedia](https://en.wikipedia.org/wiki/Maker-checker) (citing Citigroup, "Why Dual Approval Matters"); [ISO 27001 Annex A 5.3](https://hightable.io/iso-27001-annex-a-5-3-segregation-of-duties/) |
| Escalation when nobody responds | DoA frameworks name escalation paths explicitly; ITIL's ECAB is the emergency-approval escalation lane | ITIL Change Advisory Board literature (no single canonical primary text found; convergent secondary sources) |
| Audit / evidence | COSO control-activities component; ISO 27001 requires immutable logs + dual-sign-off as compensating controls | [Pathlock, COSO Framework](https://pathlock.com/blog/internal-controls/coso-framework/); [WatchDog Security, ISO 27001 A.5.3](https://watchdogsecurity.io/iso-27001/segregation-of-duties) |
| Bulk-approve as anti-pattern | **Already named and regulator-linked**: "certification fatigue" / rubber-stamping, explicitly tied to SOX/GDPR/HIPAA compliance failure | [startwithidentity.com, access review best practices](https://startwithidentity.com/articles/access-review-certification-best-practices/); [Core Security, rubber stamping](https://www.coresecurity.com/blog/what-rubber-stamping-and-why-it-serious-cybersecurity-concern) |
| **n=1 collapse** | **Already solved, by name: "compensating controls."** COSO's own principle: *"Where segregation of duties is not practical, management selects and develops alternative control activities."* For an owner-operator this cashes out as owner/manager review of everything + independent reconciliation + dual-authorization reserved for high-value/high-risk items only — **not** "approve your own step." | Bonadio Group, Timothy Doyle, "Addressing Internal Control Gaps: Compensating Controls for a Lack of Segregation of Duties," Oct 10 2024, https://www.bonadio.com/article/addressing-internal-control-gaps-compensating-controls-for-lack-of-segregation-of-duties/ ; corroborated independently by SafePaaS and Security Boulevard treatments of the same doctrine |

This directly falsifies the controller's own §7 framing that the n=1 answer was
possibly un-written. **It is written — just in accounting/audit language, for a human
running a business, not in DevOps/agent language.** The controller's instinct about
*what* the honest answer is ("which class of action must wait for a human, given the
human is asleep" not "who approves") was right in shape but wrong in novelty — COSO
reached the same shape by a different route, decades ago, and named it first.

**Why NARROWED and not a flat NO — what GRC genuinely does not have, confirmed by
absence across every source touched:** programmatic timeout-in-machine-time. GRC
approval is paced by business cadence (quarterly certifications, CAB meeting
schedules; ITIL's ECAB names *faster* timelines for emergencies but no source found
names a duration or a default outcome). Nobody in the GRC literature answers "what
decision does the system make if nobody responds in 4 hours" — because GRC assumes a
human-paced process, not an unattended one running at 3am. That is the one real
residue.

## Engine map — mechanism only, verified today against primary docs/source

| Engine | Primitive | What it gives you | What you must build |
|---|---|---|---|
| BPMN / Camunda (Zeebe) | **User Task** — `zeebe:AssignmentDefinition` (assignee / candidate users / candidate groups), `zeebe:taskSchedule` (due date, follow-up date, ISO 8601). **Boundary timer event** attached to the task: *interrupting* = "the activity is terminated" and rerouted; *non-interrupting* = task keeps running, timer fires a parallel notification path (e.g., "contacting support if processing takes longer than an hour") | Assignment, due dates, and a first-class timeout→reroute-or-notify mechanism, natively in the modeling language | The actual policy: which path the timer takes, who gets notified, what the terminal decision is | 
| Temporal | Signals + await-with-timeout (per stage-1 W5, `docs.temporal.io/ai-cookbook/human-in-the-loop-python`) | Durable wait on an external signal, race against a timer | The signal payload contract, the default on timer-win, escalation |
| AWS Step Functions | `.waitForTaskToken` — one of three service-integration patterns (Request-Response default, `.sync`, `.waitForTaskToken`); AWS's own docs name **"Human in the loop"** as a first-class use case (e.g., a funds-transfer confirmation) | Pause execution until `SendTaskSuccess`/`SendTaskFailure`; Standard workflows only (not Express) | `HeartbeatSeconds`/`TimeoutSeconds` + a `Catch` on `States.Timeout` — AWS ships no default outcome |
| Inngest | `step.waitForEvent(event, {timeout})` | Verified directly today: on timeout it resolves to `null` (TS) — **"There is no default-deny or default-allow… you decide"** | 100% of the policy; the framework deliberately returns the hot potato |
| n8n / Zapier / Make | wait/approve nodes | Basic pause-and-resume UI | Everything — least rigorous of the group (per stage-1 W5) |

**The pattern across every engine: the mechanism (pause, timer, resume) is universal
and mature. Not one of them ships a default policy answer.** That gap is real — but it
is a much smaller, more mechanical gap than "approval policy is unowned."

## AgentGate (`agentkitai/agentgate`) — read directly, source-level, not just docs

MIT license, 30★, pushed 2026-07-26 (today) — the one real product in this space
combining a policy engine + Slack/Discord/email routing + MCP + an OWASP-tagged audit
trail, exactly as the brief flagged.

Direct source findings (fetched `packages/core/src/policy-engine.ts`,
`packages/server/src/lib/escalation.ts`, `cleanup.ts`, `rbac.ts`, `owasp.ts`):

- **Default for an unmatched action is `route_to_human`** — a real, coded default
  (default-escalate), distinct from default-allow or default-deny.
- **No built-in safe default on timeout.** `escalation.ts` implements a priority-ordered
  escalation-rule chain; a rule may target a terminal `decision:*` (approve/deny), and
  the code comment is explicit about *why*: *"auto-resolve a still-pending request
  instead of notifying — so a request that no human ever answers doesn't sit pending
  forever."* But this is opt-in configuration. **Absent an explicit fallback rule, a
  request sits pending indefinitely** — confirmed by reading `cleanup.ts`, whose only
  job is deleting expired *tokens*, not resolving expired *requests*. The product ships
  the mechanism for "timeout = deny" but does not ship it as the factory default.
- **Zero self-approval enforcement**, confirmed by reading `rbac.ts` directly:
  `hasAgentGatePermission()` checks only whether a user holds the `approvals:decide`
  permission — there is no comparison against the requesting identity anywhere in the
  file. **The maker-checker principle that GRC has treated as non-negotiable for
  decades is absent from the one production implementation of this exact pattern,
  today, in a 30-star MIT repo actively pushed this week.** This is the sharpest single
  piece of evidence for the stage-1 "fragmentation by frame" thesis: the discipline
  exists, is rigorous, and simply has not crossed into the tool people are actually
  shipping.
- **OWASP tagging is real and narrow**: `owasp.ts` maps only `LLM06:2025 Excessive
  Agency` to deny/escalate/`ask` decisions (auto-approved actions carry no tag);
  `LLM10:2025 Unbounded Consumption` is defined but unused. Good teaching example of
  "compliance evidence" as a real, small, honestly-scoped feature — not the full OWASP
  LLM Top-10 despite the marketing framing in the README.
- **"Evidence the approver actually saw"** — not addressed anywhere in AgentGate's docs
  or the files read, and not found in the GRC search results either (budget ran out
  before a dedicated search). Flag as genuinely unconfirmed either way, not asserted as
  a gap.

## Recommendation

Approval survives only as a **reference chapter**, grounded primarily in COSO/ISO
27001/maker-checker citations (real canon, unusually disinterested for this domain) with
one narrow original contribution: translating meeting-paced GRC policy into
machine-timeout policy, illustrated by the AgentGate gap as living proof the translation
hasn't happened yet. It should **not** be positioned as the pack's flagship — the
residue is thinner than what `quality` or `operate` shipped on. Reconciliation remains
the stronger flagship candidate on the evidence gathered here (GRC's own reconciliation
literature — bank/ledger reconciliation — is *narrower and more product-specific* than
its approval literature, per stage-1 W5 §6, which is the opposite problem: real content,
but every source sells a ledger).
