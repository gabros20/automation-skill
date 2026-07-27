# Stage-1 gate — `automation`

Date: 2026-07-27. Channels: 5 Sonnet workers (skills · github · squeeze · X · web-canon) + the
controller's trained-knowledge channel written before results landed + controller verification.

## Verdict: **BUILD IT, NARROW** — and narrower than the clarification claimed.

**There is no discovery wedge here. Every one of the five claimed differentiators is either already
in our packs or already taught somewhere in the world.** What is genuinely true, and what the pack
must be built on, is a *synthesis* wedge — see §4.

## 1. Channel verdicts

| Channel | Verdict | The load-bearing evidence |
|---|---|---|
| W1 skills | **WIDE OPEN** | Every automation-adjacent skill on skills.sh is single-vendor (n8n cluster ~9K installs, Zapier's own) or single-task. None combines the five mechanisms. RPA: zero discoverable skills. |
| W2 github | **NARROW umbrella / OPEN differentiators** | Best peer `alirezarezvani/claude-skills` (23,275★, MIT, live) has **no automation category in its 35-dir tree**. Its 15 `compensat` hits are **all false positives** — sales/HR compensation. GitHub-wide `"compensating transaction"` → 13 hits / 9 repos, **100% microservices demos**. |
| W3 squeeze | **1 covered · 1 partial · 3 absent** | See §2. |
| W4 X | **Thin, vendor-tilted, mechanics corroborate** | **75–85% marketing.** 8 of 10 surviving authors sell automation/agent tooling. A neutral first-person incident is ~1 in 30–40 relevant-looking results. |
| W5 canon | **THIN, unevenly distributed** | Real theory exists (Sagas 1987, Stripe idempotency 2017, Workflow Patterns) but at the wrong altitude or the wrong frame. |

## 2. The squeeze result (W3, verified against my own independent greps)

| Claim | Verdict | Evidence |
|---|---|---|
| 1. Idempotency across an uncontrolled boundary | **ALREADY COVERED** | `service-integration.md:69-72` explicitly: at-least-once, dedupe by the provider's event ID, using `async-and-messaging` §2 mechanics |
| 2. Compensation instead of rollback | **PARTIAL** | backend teaches saga fully (`async-and-messaging.md:105-125`) but framed for **your own services**; `service-integration.md` — the ref that owns outbound vendor calls — has **0** saga/compensation hits |
| 3. Reconciliation vs a vendor | **ABSENT from the family** | 0/0 in backend and ai. `operate`'s 16 hits are **all GitOps**; `quality`'s are vocabulary/licence reconciliation |
| 4. Multi-vendor credential fleet | **ABSENT** | `auth.md` is entirely *your app's own* identity — one auth-provider pick, one token family. 0 hits for credential/API-key rotation across N vendors |
| 5. Approval as a process node | **ABSENT in backend; PARTIAL in ai** | 0 approval hits in backend. `ai` owns approval **as a guardrail on a model's tool call**; the deterministic case with no model in the graph is unowned by both |

**Cession contract confirmed:** `ai` (router row + ~6 reference cites), `data` (1 row), `operate`
(1 row) cede in writing. **`backend` cedes nothing** — its single "automation" string is the generic
English word at `surface-agentic.md:123`. A backend decline row is required and is a back-port item.

## 3. Controller corrections — I overturned two of my own workers

Both material. Recorded because the corpus must not ship the overstatement.

**C1 — W2's cleanest evidence is overstated, and my own §13 falsification target #1 is DEAD.**
Hohpe's **Compensating Action** (Enterprise Integration Patterns, *Conversation Patterns*,
`enterpriseintegrationpatterns.com/patterns/conversation/CompensatingAction.html`, © 2003, 2023) is
framed **exactly** for the case I claimed was untaught — verbatim: *"A participant is interacting
with multiple, independent services, which change their state based on the interaction."*

Worse for the wedge as framed, it **already covers both residues W3 called genuinely absent**:
- No compensating action available → *"apply PERFORM HARDEST TO REVERT ACTION LAST to minimize the
  chances that this action has to be reverted."*
- Compensation as a human act → *"A mailed letter to a customer can be compensated by a phone call
  asking the customer to ignore the letter."*

**"Integration-framed compensation is undertaught" is FALSE.** It is taught, by the field's most
credible integration author, and has been for twenty years. It is merely *unread*.
**Asset, though:** the page carries a **Creative Commons Attribution licence on the pattern icon,
name, and problem/solution statements** — unlike the CC BY-NC-ND SRE books, a bounded lift is
actually permitted here. Verify scope precisely before using it.

**C2 — W5 overstated the approval gap.** W5 called it *"folk wisdom scattered across low-authority
blogs with no canonical source."* My own probe found Temporal's own documentation *and* engineering
blog on human-in-the-loop approvals, Cloudflare's `agents` HITL doc, and several treatments covering
precisely the four things I claimed were unowned: timeout policy (auto-approve / auto-reject /
escalate / hard-fail), **default-deny vs default-allow with the trade-off named**, explicit
escalation paths, and audit of the decision.

What survives of W5's point, and it is the important half: **all of it is framed for AI agents** —
which is the frame `ai` already owns. The distinction left to us is *approval in a deterministic
process with no model anywhere in the graph*, which is **thin ground for a flagship.**

## 4. What the wedge actually is

Not "we teach mechanisms nobody teaches." Honestly:

> **The knowledge exists and is fragmented by frame across four literatures that do not cite each
> other.** Distributed systems teaches idempotency and saga **for services you own**. Hohpe's
> conversation patterns teach compensation **for parties you don't own** — and are twenty years old
> and largely unread. Fintech teaches reconciliation **as a ledger control** and never generalises
> it. The 2026 agentic wave teaches approval **for models**. And the iPaaS vendors, whose users need
> all four at once, teach none of it, because their business is making it look easy.
>
> The reader wiring their business across vendors they cannot deploy to has to assemble one
> discipline out of four literatures that were never introduced to each other.

That is a **synthesis wedge**, the same kind `quality` shipped on — weaker than `operate`'s
canon-defect wedge, and defensible. It must be stated this way in `SOURCES.md` rather than dressed
up as discovery.

## 5. Genuinely unowned by the family — the residue that justifies a pack

Backend cannot absorb this without breaking its "own the running server" mission:

1. Reconciliation against a vendor system of record
2. Multi-vendor credential fleet lifecycle
3. Approval as a deterministic process node (policy, not mechanism)
4. Compensation against un-scriptable or human participants
5. Sync semantics — the A→B→A loop, deletes invisible to incremental sync, conflict policy
6. Trigger design — over-broad conditions, schedule ambiguity
7. Per-task/per-op cost with a **vendor-owned ceiling** (blast radius across unrelated flows)
8. Silent-stop detection (cite `operate`'s dead-man's-switch, do **not** re-teach)

## 6. Corroborated failure taxonomy (W4, X — thin but specific)

> **⚠️ SUPERSEDED IN PART BY STAGE-2 W11 — see §6a. Three items below must NOT be cited.**

Silent agentic retry loops (a notification sent 47×; a CRM sync retrying 14 min behind a green
dashboard) · stale state driving a wrong self-fix · **silent OAuth expiry — "didn't notice till
stuff just stopped firing for days"** · loop/line-item duplication (35 records instead of 1) ·
upstream API field going null on a weekend · over-broad trigger conditions · **a near-$7,000
mis-triggered charge workflow** · cost opacity as a failure mode.

## 6a. STAGE-2 CORRECTION — three of these are ad copy, not incidents (W11, 2026-07-27)

W11 thread-read the stage-1 finalists and **downgraded three of seven.** Stage 1's capture had
truncated the tweets; on full read, Tidianez, killix, and Niv_98 are *"ad copy with an anecdote as
the hook, not incident reports with usable mechanism detail."*

The "notification sent 47 times" item is the clearest case: stage 1 cut the quote **before the
product link**. The full post continues *"…that's exactly why we built loop breakers into SafeRun"*
with a direct link in the same tweet. The whole post is an advertisement. **Do not cite Tidianez,
killix, or Niv_98 as incident evidence.** The controller repeated the 47× figure to the user before
this correction landed; it is withdrawn as evidence.

**W11 also falsified its own brief's hypothesis.** I told it the replies are where the mechanics
live. They are not — *"none of the 7 named tweets had a single reply from another account containing
new mechanical detail."* The value was in the **full top-level text** that stage 1 had truncated.
Correct instruction for any future X channel: **re-read the full original text before mining replies.**

### The two items that survive, and they are the best this channel produced

**1. @sanketdattta — MAJOR UPGRADE, and a genuinely new failure class.** An **idempotency-check
false positive, inverted from the usual direction.** Verbatim:

> *"There was an issue with the event logging because of a retry and our n8n scenario thought the
> client already received the upgrade proposal, marked the sequence as 'completed,' and stopped all
> further steps. In reality, nothing was sent… The only reason we caught it – one of my team members
> manually reviewed the 'failed' queue while doing a dumb routine audit I usually skip."*

A retry corrupted the event log; the workflow's own *"have I already done this?"* check read the
ambiguity as **confirmation of completion** and self-terminated a $7,000 sequence having sent
nothing. **`backend`'s `service-integration.md:69-72` does not cover this** — it teaches dedupe by
provider event ID, which catches *duplicates*; it does not address a workflow trusting its own
possibly-corrupted completion state. Their own fix: *"log critical events twice: source &
interpretations both + auto-detect every mismatch."*

**This converges with W2's reconciliation mechanic** — *"separate delivery status from processing
status as two fields, not one"* — from a completely independent channel. **Candidate invariant:**

> **Never let the system's own record of what it did be the only evidence that it did it.** Log the
> raw event and your interpretation of it as two separate facts, so a completion check can be
> falsified against the raw log rather than confirmed by your own prior write.

**2. @rexliu — the only working mitigation in the entire channel.** No commercial interest, no
product link. Scheduled **pre-expiry** token refresh (forcing refresh on a cadence shorter than the
token TTL) + fan-out sync to every dependent agent + explicit failure-path alerting — replacing the
reactive "notice it's broken because things stopped firing" pattern every other credential item
describes. **Directly corroborates W4's credential-fleet residue with a real implementation.**

**Notable non-finding:** the `reconciliation job` query returned near-total noise — the word on X is
dominated by US politics. Practitioners do not discuss reconciliation. Consistent with it being
filed under fintech, not with it being unimportant.

## 7. Risks carried into stage 2

- **The flagship is unsettled.** Approval is thinner than claimed. Reconciliation is the alternative.
  W5's open question can kill approval outright: **does enterprise GRC / SOX / delegation-of-authority
  literature already own approval policy?** Must be answered early.
- **Worst source environment yet.** 75–85% marketing. One account with 13,340 followers, **zero
  following**, claiming "847 n8n workflows built, 90% failed" — classic farm signals, excluded.
- **Do not fund a large X crew.** Measured yield: ~10 citable items from ~325 rows. One worker on the
  single highest-yield query family only.
- **`orchestrate` boundary verified clean** — 0 hits for zapier/n8n/hubspot/stripe/crm/vendor/
  business-process/reconcil/compensat across all 2,356 lines of its references. The draft line holds.
- **`webdesign` confirmed dry** — 13 hits, all false positives. Matches the FULLY MINED verdict.
