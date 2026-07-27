# Controller notes — `automation`

Independent verification performed by the controller, **before** stage-1 worker results landed.
Method: direct grep over the shipped packs on disk. Recorded so W3's answer can be held against a
number I produced myself — the practice that caught a false absence claim on the `operate` build.

## 0. A grep bug I made and caught, recorded because it is the exact failure mode we warn about

First pass used `grep -ciE "retry\|retries"`. Under **extended** regex `\|` is a *literal pipe*, not
alternation, so every multi-term row returned a false **0**. It briefly looked like `backend`'s
async reference never mentions retries — which would have been a spectacular false absence claim.

Corrected: `grep -ciE "retry|retries"` → **15 hits** in that same file.

**Rule for every worker and every future build: an absence claim needs the command *and* a
plausibility check. A zero that surprises you is a bug in the grep until proven otherwise.**

## 1. The collision surface, measured (2026-07-27)

`backend-skill/skills/backend/references/` — the two files that threaten this skill.

| Term | `async-and-messaging.md` (198 ln) | `service-integration.md` (115 ln) |
|---|---|---|
| idempot* | **15** | **9** |
| saga | **11** | 2 |
| compensat* | **6** | 0 |
| retry/retries | **15** | **17** |
| dead letter / DLQ | **7** | 4 |
| exactly-once / at-least-once | **7** | 1 |
| backoff | 4 | 1 |
| webhook | 3 | **15** |
| rate limit | 0 | **5** |
| circuit breaker | 1 | **7** |
| signature / HMAC | 0 | 3 |
| third-party / vendor | 2 | **9** |
| **reconcil\*** | **0** | **0** |
| **approval / human-in-the-loop** | **0** | **0** |

**Read honestly: three of my five hypothesis claims are already held by `backend`.** Idempotency,
compensation/saga, and the third-party integration primitives (webhooks, signatures, rate limits,
circuit breakers) are all present, some densely. The substrate hypothesis in its original form is
**partially falsified before a single worker reported.**

## 2. Family-wide term matrix, all nine shipped packs

Hits across each pack's full `references/` directory.

| pack | reconcil | approval | HITL | compensat | idempot | sync-loop |
|---|---|---|---|---|---|---|
| product | 0 | 1 | 4 | 1 | 0 | 0 |
| design | 1 | 2 | 0 | 1 | 0 | 0 |
| architecture | 1 | 0 | 1 | 3 | 4 | 0 |
| frontend | 4 | 0 | 0 | 10 | 13 | 1 |
| backend | 0 | 0 | 0 | 9 | **31** | 0 |
| data | 1 | 0 | 0 | 1 | 7 | 0 |
| ai | 0 | **19** | 6 | 2 | 7 | 0 |
| quality | 7 | 3 | 1 | 0 | 0 | 1 |
| operate | **16** | 9 | 0 | 7 | 11 | 0 |

## 3. Word-sense check — the two apparent collisions both dissolve, but only one cleanly

Applying the `quality`/`operate` lesson: **grep the mechanism, not the topic word.**

**`operate`'s 16 `reconcil*` hits are all GitOps.** Every one is in
`infrastructure-provisioning.md`, in the sense of *declarative infrastructure converging to a
declared state* — "Continuously Reconciled", "a reconciler exists to keep declared and actual
identical", "a GitOps controller will quietly undo your fix on its next reconciliation."

That is a **different mechanism with the same name.** Reconciling *your records against a third
party's system of record* — periodic comparison, drift report, a defined path per discrepancy class
— is **absent from all nine packs.** The word is taken; the mechanism is free. ✅ Clean.

**`ai`'s 19 `approval` hits are real and adjacent, and I must not overstate this one.**
`guardrails-and-safety.md` ships "Approval-gate / HITL" as one of five control types: *"Human
approve/reject on a risky tool call, embedded in the loop itself"*, for *"Irreversible or high-stakes
actions (payments, deletes, external sends)"*, with a completion check that *"Any approval-gate/HITL
path is reachable for every irreversible action identified."*

So `ai` owns **approval as a guardrail on a model's tool call.** What is still absent everywhere:
approval as a **process node** with a stated **timeout default (deny or allow)**, an **escalation
path**, **who may approve and whether the requester may self-approve**, and **what evidence the
approver actually saw**. ⚠️ Real seam, but narrower than my §7 draft claimed, and it must be drawn
against `ai` explicitly rather than asserted as open ground.

## 4. Pre-worker verdict from controller evidence alone

**Leaning NARROW.** Two of five claims survive on my own numbers:

| Claim | Status on controller evidence |
|---|---|
| Idempotency across an uncontrolled boundary | ❌ largely held by `backend` (31 hits) |
| Compensation instead of rollback | ❌ largely held by `backend` (saga 11, compensat 9) |
| Third-party integration primitives | ❌ held by `backend` `service-integration.md` |
| **Reconciliation against a vendor system of record** | ✅ **genuinely absent family-wide** |
| **Approval as a process node (policy, not mechanism)** | ⚠️ **partially absent — `ai` holds the guardrail case** |

If the external channels return the same shape, this is the family's **third narrow wedge** and the
honest question becomes whether two-and-a-half unowned mechanisms justify a tenth repo, or whether
they are three reference files donated to `backend` plus a router patch. **I will put that question
to the user at the gate rather than resolving it in favour of building.**

---

## 5. EMERGING THROUGH-LINE — the counterparty assumption (controller, 2026-07-27, stage 2)

Recorded the moment it appeared, before it can be lost. **Do not ship this until a second independent
channel confirms it** (W3's GRC brief is the test).

W2 returned a finding whose *shape* is the same as `operate`'s wedge, arrived at independently in a
different domain:

> **Stripe's own reconciliation best practice explicitly requires reconciler ≠ recorder — a
> segregation of duties a solo operator cannot satisfy.**

Compare `operate`: the SRE Workbook claims its guidance applies "regardless of size or maturity" and
publishes a five-to-eight-person floor in the same chapter. Same structure — **a control whose
justification silently assumes a second person.**

If W3 comes back finding that segregation of duties, maker-checker, four-eyes, and
delegation-of-authority are the *core* of the GRC approval literature, then two independent channels
have converged on one claim, and the pack has a through-line better than either candidate flagship
alone:

> **Every control this domain teaches — approval, segregation of duties, reconciler ≠ recorder,
> four-eyes, maker-checker, the change-advisory board — assumes a counterparty. Our reader is one
> person whose systems act while they are asleep. The functions still matter; the second body does
> not exist.**

This would also resolve the flagship question by dissolving it: **approval and reconciliation stop
competing and become two instances of the same defect.** It reuses `operate`'s I13 move ("roles do
not disappear at n=1; only the people do") in a new domain rather than restating it, which is the
right kind of family coherence — a shared shape, not a copied sentence.

**Falsification test for W3:** if GRC's approval literature turns out *not* to rest on segregation of
duties, or if it transfers cleanly to one person, this collapses and the flagship reverts to
reconciliation on W2's evidence alone.

### 5a. RESULT: the test FIRED, and the through-line is better for it (2026-07-27)

**W3 partially falsified §5, and I am recording the correction rather than defending the hypothesis.**

My §7 controller-canon framing claimed the n=1 approval answer might be unwritten. **It is written.**
COSO's own principle, via Bonadio (Doyle, 2024-10-10): *"Where segregation of duties is not
practical, management selects and develops alternative control activities."* Cashed out for an
owner-operator as: owner review of everything + **independent reconciliation** + dual-authorisation
reserved for high-value items. **Not** "approve your own step."

My instinct about the *shape* of the answer was right; my claim to novelty was wrong. **COSO got
there decades ago and named it first.** That kills the naive counterparty wedge.

### 5b. But the recursion is real, and BOTH halves are now primary-source verified

- **COSO's escape hatch from missing segregation of duties is independent reconciliation.**
- **Stripe's reconciliation best practice requires segregation of duties.** Verified verbatim by the
  controller (stripe.com/resources/more/payment-reconciliation-101, fetched 2026-07-27):
  > *"To minimise the risk of errors and fraud, the person who records transactions should not be the
  > same person who reconciles accounts."*

For one person: **SoD is impossible → the canon says use reconciliation → reconciliation practice
itself requires SoD.** The escape hatch leads back to the trap. Two primary sources, two literatures
that do not cite each other, and the loop closes on our reader.

### 5c. The resolution — and this is the pack's actual contribution

The honest resolution is subtler than "the canon is broken", and better. Re-reading both sources:
COSO's "independent reconciliation" does not require an independent *person* — it requires an
independent *source*. W2 caught the same thing from the other side, noting the solo operator lacks
*"a second independent source of truth to check against (a real bank statement, not just the
vendor's own report)."*

> **At n=1 the second pair of eyes does not exist, so independence has to come from somewhere else:
> from the source, from the clock, or from a rule committed to in advance.**
>
> Every control this domain teaches assumes a counterparty. Approval assumes an approver who is not
> the requester. Reconciliation assumes a reconciler who is not the recorder. The *functions*
> survive at n=1; the second *body* does not. Substitute an independent source of truth, a
> pre-committed rule, or a scheduled check for the missing person — and never reconcile a vendor
> against your own record of what you told it, only against the vendor's authoritative state pulled
> independently.

This reuses `operate`'s I13 move ("roles do not disappear at n=1; only the people do") in a new
domain by *shared shape* rather than copied sentence, which is the right kind of family coherence.
**Ship it as a translation of COSO, credited to COSO, not as a discovery.**

### 5d. Flagship: RECONCILIATION. Approval demoted to a reference chapter.

W3's recommendation, which I accept: approval survives grounded in COSO / ISO 27001 / maker-checker
citations — *"real canon, unusually disinterested for this domain"* — with **one** narrow original
contribution: **translating meeting-paced GRC policy into machine-timeout policy.** GRC is paced by
quarterly certifications and CAB meetings and never answers *"what decision does the system make if
nobody responds in four hours"*, because it assumes a human-paced process, not an unattended one at
3am. Every engine ships the mechanism (pause, timer, resume); **not one ships a default policy** —
Inngest verbatim: *"There is no default-deny or default-allow… you decide."*

**The living proof, and the sharpest single artifact in the build so far.** W3 read
`agentkitai/agentgate` (MIT, 30★, pushed 2026-07-26) at source level and found in `rbac.ts` that
`hasAgentGatePermission()` checks only whether a user holds `approvals:decide` — **there is no
comparison against the requesting identity anywhere in the file. Zero self-approval enforcement.**
The maker-checker principle GRC has held non-negotiable for decades is absent from the one
production implementation of this exact pattern, shipped this week. **That is the fragmentation
thesis made concrete in fifteen lines of TypeScript.**

## 6. New research hazard for the family (W2, verified by reading raw HTML)

**arXiv 2607.15529 — DO NOT CITE.** I flagged it as possible slop; W2 verified it properly and it is
worse than slop, it is undisclosed vendor content: solo author, **no institutional affiliation**, v1
only, 7 pages, and an explicit companion paper describing *"a production managed package deployed
across independent enterprise organizations"* — i.e. the author's own Salesforce AppExchange product.
Also cross-posted to SSRN, which is not peer-reviewed.

**Generalisable heuristic, new to the family's hazard list:** *before trusting a solo-author arXiv
"architecture paper", check for a companion paper describing a production managed package.* arXiv's
credibility is now a wrapper that vendor content can wear. The date check and the venue check are
both insufficient on their own — this is the third distinct instance of that lesson (satire not dated
1 April; astroturf with identical copy one day apart; now arXiv-as-credibility-wrapper).
