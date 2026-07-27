# Independent adversarial review — `automation` pack

Reviewer: independent (did not author any of it). Date: 2026-07-27.
Scope read in full: `SKILL.md`, all 18 `references/*.md`, all 7 `assets/*`, `SOURCES.md`,
`research/synthesis.md` (incl. AMENDMENTs 1–5), `research/stage1-gate.md`, and the stage-2 raw
worker files used to verify quotations.

---

## BLOCKERS

### B1 — `references/compensation-and-recovery.md:73–76` — a sentence presented as Hohpe's verbatim problem statement is not his problem statement

The file writes:

> …states the problem for exactly this case, **verbatim**:
> > "A participant is interacting with multiple, independent services, which change their state based on the interaction."

The stage-2 Hohpe worker (`research/_raw/s2-w1-hohpe.md:178`), which fetched all 25 pattern pages
directly and states *"Every quote below is verbatim from the cited URL, fetched today; no quote is
from trained knowledge"*, records the Compensating Action problem statement as:

> "How can a requestor ensure a consistent outcome across multiple, independent providers?"

These are different sentences. The one shipped traces only to `research/stage1-gate.md:43` — a
stage-1 artifact whose C1 note was superseded by the stage-2 direct read. Synthesis AMENDMENT 2
re-verified **only Quick Acknowledgment's** verbatim pair and pointedly did not re-verify this one.

Why it is a BLOCKER and not a nit: the quote is wrapped in a CC BY 4.0 claim (line 71) that covers
*only* the bold problem/solution statements. If this sentence is context prose rather than the bold
problem statement, the pack is (a) misattributing a paraphrase as verbatim — the exact defect a
prior review on this family caught — and (b) lifting all-rights-reserved prose under a grant that
does not cover it.

**Fix:** replace with the stage-2-verified statement — *"How can a requestor ensure a consistent
outcome across multiple, independent providers?"* — or drop the quotation marks and paraphrase.
Do not ship either version until the controller re-verifies `CompensatingAction.html` directly.

### B2 — Verbatim lift of a Hohpe **worked example**, under a grant that excludes worked examples — and the same file forbids it two paragraphs later

`references/compensation-and-recovery.md:89–92`:

> Hohpe's own example: *"A mailed letter to a customer can be compensated by a phone call asking the
> customer to ignore the letter."*

`references/compensation-and-recovery.md:94–97`, immediately after:

> Everything past the problem/solution statements above — the pattern's **worked examples**, its
> discussion… is © 2003, 2023, all rights reserved; **paraphrase it, don't lift it**.

The file lifts a worked example verbatim and then, in the next paragraph, states the rule that
forbids exactly that. `assets/irreversibility-inventory.md` repeats the same lift and cites it as
"CC BY 4.0, problem/solution statements only" — a citation that contradicts what it is attached to.

Compounding: the corpus's actual version of this sentence is from the **2005 IEEE Software article**
(`s2-w1-hohpe.md:93`: *"undo already completed operations… we might call and ask a customer to
ignore a letter that has been sent"*), and `SOURCES.md:34` states the IEEE article is
**"Cite and paraphrase. No verbatim quotation."** The shipped wording matches neither source exactly.

Same defect class applies to `compensation-and-recovery.md:86–87`, *"apply PERFORM HARDEST TO REVERT
ACTION LAST to minimize the chances that this action has to be reverted."* — also traceable only to
`stage1-gate.md:47`, also not re-verified by stage 2, also discussion/solution prose rather than a
cleared problem statement.

**Fix:** paraphrase all three in the pack's own words. Keep the *pattern name* "Perform Hardest to
Revert Action Last" — the name is CC BY and safe. Remove the CC BY citation from the
`irreversibility-inventory.md` letter example.

### B3 — `references/surface-agentic.md` breaches synthesis §5's "ONLY these two" practitioner-quote rule, and cites an incident and engagement metrics the gate never cleared

Synthesis §5: **"Practitioner quotes — ONLY these two, both with markers"** (the idempotency
false-positive; the pre-expiry credential refresh). `surface-agentic.md` ships two more, both from an
Ask HN thread:

- line 100–102: *"you can hand one to an agent and it physically can't exceed the budget you set."*
- line 108–109: *"llm does not act on production… clone your customer data and run everything blank."*

Neither carries an interest marker (I15). Both are third and fourth practitioner quotes in a pack
whose gate caps the count at two.

Same section, lines 109–112, ships the **Replit incident** with *"reported by Business Insider;
discussed on HN, **179 pts/160 comments**"*. That incident is nowhere in synthesis §5, and the
engagement figures directly contradict the pack's own `SOURCES.md:65`: *"engagement correlates
inversely with evidentiary value."* Citing HN karma as a credibility signal in a pack that publishes
that sentence is self-undermining.

**Fix:** delete both Ask HN quotes (the *mechanisms* — pre-funded spend keys, blast-radius scoping —
survive without them and are already stated in the pack's own voice). Either drop the Replit incident
or get it cleared by the controller as a §5 amendment; delete "179 pts/160 comments" regardless.

---

## S-major

### S1 — `references/cost-and-quota.md:20, 29, 38` — bare "I7" means `operate`'s I7, but resolves to `automation`'s I7

`automation`'s I7 is *"Credential health is its own monitored resource."* `operate`'s I7 is *"Cost is
an availability control, not a finance report"* (verified in `operate-skill/skills/operate/SKILL.md:111`).

The file uses "I7" for the latter. Line 40 says *"`operate`'s I7"* and is fine. Lines 20, 29 and 38
do not:

- `:20` — "`operate`'s `capacity-and-cost.md` (I7)" — reads as this pack's I7
- `:29` — Contents entry "Extending I7: cost scales with complexity here, not just activity"
- `:38` — section heading, same text

A reader who has just loaded SKILL.md and sees "Extending I7" in a cost file will resolve it to
credential health and be confused. This is precisely the invariant-numbering-drift class that broke
six references on a prior build, in a subtler form: cross-pack numeral collision.

**Fix:** write `operate`'s I7 in all four places, or better, drop the numeral and name the invariant
("`operate`'s cost-is-an-availability-control invariant"). Never cite a sibling pack's invariant by
bare number.

### S2 — `references/trigger-design.md:104` drops "public repos" from the GitHub Actions auto-disable fact, contradicting two other files in the same pack

Synthesis §5: *"GitHub Actions: scheduled workflows **on public repos** auto-disable after 60 days
of repo inactivity."*

- `workflow-observability.md:106` — "on **public repositories**" ✓
- `surface-platform-native.md:49` — "on **public repos**" ✓
- `trigger-design.md:104` — "**on a repository**" ✗

The narrowest and only cleared version is the public-repo one. As shipped, `trigger-design.md`
tells a reader with private repos to expect a failure mode they will not have, and the pack
contradicts itself across three files. The line also carries **no verification date**, unlike the
DST table 20 lines above it — an I15 violation in the file that cites I15 twice.

**Fix:** `**GitHub Actions auto-disables scheduled workflows on public repositories after 60 days of
repository inactivity** (verified 2026-07-27, re-verify)`.

### S3 — `references/process-capture.md:143–145` attributes a Wikipedia sentence to DeBrusk / MIT Sloan

The file writes that MIT Sloan / DeBrusk *"names the same shape independently: this class of
automation "lacks the ability to autonomously adapt to new conditions" and creates "a more complex
maintenance environment"."*

The corpus (`s2-w10-process.md:190–204`) splits these:

- *"creating a more complex maintenance environment of existing software…"* → DeBrusk / MIT Sloan ✓
- *"Current RPA solutions demand continual technical support to handle system changes, therefore it
  lacks the ability to autonomously adapt to new conditions"* → labelled **"Wikipedia's own technical
  framing (fetched)"** ✗

Two separate sources merged into one attribution. Additionally, *both* quotes reached the corpus
**via Wikipedia** citing MIT Sloan, not from the MIT Sloan article itself — the shipped text presents
them as read from the primary. In a pack whose four-clause discipline is built on provenance, that is
a laundering step, however small.

**Fix:** attribute the maintenance-environment quote to DeBrusk (noting it is quoted via Wikipedia
unless someone reads the MIT Sloan piece directly); paraphrase the adapt-to-new-conditions claim in
the pack's own voice, or attribute it correctly.

### S4 — `references/workflow-observability.md` links **no asset**

Every other reference links at least one (`handoff.md` 5, `surface-agentic.md` 5, down to 1). This
one links zero. It is a job file that *produces* three named artifacts ("A missing-heartbeat monitor
per workflow… an audit-trail definition") and hands none of them to a sheet.

**Fix:** the natural landing spot is `assets/trigger-audit-sheet.md` (per-trigger heartbeat status)
or a row on `assets/credential-register.md`'s Detection column, which §4 of this file already
describes. Add the link, or add the missing column and link it.

### S5 — `assets/trigger-audit-sheet.md:25` cites `trigger-design.md` **§7**, which does not exist

`trigger-design.md` has six numbered sections (§1 Trigger taxonomy … §6 Polling vs rate limits vs
freshness). The business-event-identity requirement the sheet is pointing at is **§5**, not §7. The
sheet's other two section pointers (§2, §3) are correct.

**Fix:** change §7 → §5. Also worth a mechanical check on every `§n` pointer before release; this one
survived to ship.

### S6 — Unverified magnitudes shipped outside synthesis §5, which declares itself exhaustive

Synthesis §5, emphasised twice: *"THIS LIST IS EXHAUSTIVE, NOT ILLUSTRATIVE… Nothing outside this
list may be shipped as a specific number, quote, or named vendor behaviour."* §6: *"No unverified
magnitudes. If a figure is not in §5, drop the magnitude and keep the mechanism."*

Shipped anyway (all traceable to stage-2 raw workers, **none** to §5):

| File:line | Figure / quote | Notes |
|---|---|---|
| `cost-and-quota.md:113` | n8n overage "isn't invoiced until **45 days** out" | §5 clears "the overage invoice lag" — not the number. Corpus scopes it to **Business tier**; the reference drops the tier and states it generally |
| `surface-code-first-durable.md:86` | Step Functions Redrive: "**14 days**… under **1 year**… under **24,999** history events" | AMENDMENT 5 clears mechanism names only and says explicitly *"their numbers are not"* |
| `surface-code-first-durable.md:83–86` | Four verbatim vendor quotes (Inngest `step.run()`, Restate, Cloudflare, Step Functions Redrive) | AMENDMENT 5 clears the **HITL** table, not the resume table |
| `integration-reliability.md:179–180` | Shopify "**8 retries over ~4h**"; GitHub "Hard, **~10s**" | Corpus has these exactly (4 hours, 10 seconds); the pack adds a tilde, softening a precise documented figure into an approximation |
| `surface-agentic.md:55, 63, 83, 86` | "~180s+", `max_iter` "default remains **25**", "Recursion limit of **20**", langgraph #6731 / #6414 / #7855 / PR #8167 | §5 clears exactly three GitHub issues: langgraph #7417, autogen #7071, n8n #34916. Four more artifacts and their quotes ship uncleared |

The Slack row of `integration-reliability.md`'s §8 table shows the writer *could* do this correctly —
it drops every number ("Small fixed count, short named backoff") while the corpus has exact figures.
The Salesforce paragraph in `cost-and-quota.md:152–155` does it correctly too. The inconsistency is
within single files, not across the pack.

**Fix:** per item, either get a §5 amendment from the controller or drop the magnitude and keep the
mechanism — the pattern the same files already demonstrate.

### S7 — `cost-and-quota.md:191–193` recites four vendor numbers in one bolded sentence, contradicting `SOURCES.md` §5

`SOURCES.md:98–100` states the pack refuses *"Full vendor quota and pricing tables. We teach the
**shape** … and cite **at most one dated anchor**."* AMENDMENT 3 establishes the same rule as binding
on *"every writer"*.

`cost-and-quota.md` then ships: *"**60/hr unauthenticated, 5,000/hr for an authenticated
personal-access-token request, 5,000/hr for a non-Enterprise GitHub App installation, and 1,000/hr
per repository for the `GITHUB_TOKEN`**."* Four numbers, bolded. All four are individually cleared in
AMENDMENT 3, so this is not a fabrication — it is a violation of the pack's own stated refusal, in
the file most likely to be read by someone checking whether the pack keeps its promises. The
Salesforce paragraph 40 lines earlier does it right and even says why.

**Fix:** keep one anchor (the `GITHUB_TOKEN` 1,000/hr is the most useful to this reader), teach the
shape, point at `docs.github.com`. The load-bearing part — the *"secondary rate limit for undisclosed
reasons"* quote — is unaffected.

### S8 — `SOURCES.md:91` claims novelty for content the pack does not ship, unhedged

> **Bus-factor and succession for a solo operator's automations** — genuinely unwritten, as it was
> for `operate`.

Two problems. First, "genuinely unwritten" is an unhedged absence claim not traceable to the gate —
synthesis §4a's absent list is *reconciliation as a practice, the credential fleet, approval as a
human decision node, per-task cost ceilings, bidirectional sync*. Bus-factor/succession is not on it.
Second, the pack does not teach succession anywhere. `credentials-and-connections.md:126` §5 is
titled "The shared-account / bus-factor **hazard**" and teaches credential-to-person binding and an
offboarding checklist — real content, but not succession. `SOURCES.md` §4's job is calibrating
claims; this row overclaims in the file that exists to prevent overclaiming.

**Fix:** either retitle to what the pack actually ships ("credential binding to a named human, and
offboarding revocation for a solo operator") and hedge the absence, or cut the row.

### S9 — `SOURCES.md` §2 omits three licences the pack asserts elsewhere

`surface-code-first-durable.md:131–135` states **Restate** = Business Source License 1.1 (converts to
Apache-2.0 after four years), **Inngest** = Server Side Public License 1.0, **Trigger.dev** =
Apache-2.0. All three are corroborated by `s2-w7-engines.md:54–57` — the *claims are correct*. But
none appears in `SOURCES.md` §2, whose stated discipline is *"reconcile every root licence file."*
A reader auditing the pack's licence position from `SOURCES.md` gets an incomplete picture, and the
family's licensing rule was already upgraded once to "list every licence file."

**Fix:** add three rows to `SOURCES.md` §2.

### S10 — `references/approval-and-authority.md:119` — "shipped this week"

Section heading: *"The living proof: zero self-approval enforcement, **shipped this week**."* A
relative time reference in shipped documentation is false within a month, and this is a liveness
claim about a third-party repo — exactly what I15 and the pack's fourth licensing clause exist for.

**Fix:** *"…in a repo live as of 2026-07-27 (re-verify)"*.

---

## N-minor

- **N1 — `cost-and-quota.md:231` cites "§5"**, which resolves to nothing. The file has no numbered
  sections; the only §5 in play is `research/synthesis.md`'s, an unshipped build artifact. Replace
  with the actual section name ("the workflow-circuit-breaker section above").
- **N2 — `integration-reliability.md:64` says "everything else **on the site** is paraphrase-only."**
  Correct in substance, but the site-scoped phrasing brushes against AMENDMENT 2's *"Do not describe
  the grant as site-wide."* The neighbouring files (`credentials-and-connections.md:59–61`,
  `compensation-and-recovery.md:96–97`) both state the per-page rule explicitly and read better.
- **N3 — `integration-reliability.md:153` ships the cleared practitioner quote without its interest
  marker.** §5 attaches one (*"Founder describing his own business; closest to neutral in the
  survey"*). The file says only "from the practitioner who caught it". I15 asks for the interest.
- **N4 — the same anecdote is retold unattributed** at `workflow-observability.md:124–130`
  ("This is not a hypothetical: a retry against an event-logging store produced…"), with added detail
  ("a timestamp mismatch", the operator's chosen fix) not present in §5. Attribute it or cross-link
  to `integration-reliability.md` §7 rather than restating it as ambient fact.
- **N5 — `process-capture.md:84–85`**: *"the site no longer serves a working page"* is a liveness
  claim with no date. The corpus verified it 2026-07-27 (SSL/SNI failure). Date-stamp it.
- **N6 — solo-default leaks.** `surface-code-first-durable.md:64–66` — workflow code *"wants **code
  review**, its own test suite"*; `platform-selection.md:24, 49` — *"whether the **team** can and
  will operate infrastructure"*, *"This tier assumes a **team** that would rather write and test a
  workflow."* The pack's stated reader has no second pair of eyes. These are mild, but SKILL.md makes
  n=1 a headline commitment. Rephrase as capability ("becomes reviewable if there is a reviewer")
  rather than assumption.
- **N7 — `surface-agentic.md:130`**: *"Nobody teaches this as a discipline yet"* — an absence claim
  not traceable to the gate. It is hedged in the same sentence ("one practitioner's issue-tracker
  post, not a canon"), which is why this is minor rather than major, but the unhedged clause leads.
- **N8 — `workflow-testing.md:150`**: `"35 records got touched instead of 1"` in quotation marks
  reads as a cited incident; it is an illustration. Drop the quotes or say "for example".
- **N9 — cross-repo line-number citation.** `workflow-observability.md:98` cites
  `operate-skill/skills/operate/references/recoverability.md:136-139`. **I verified this: the
  dead-man's-switch paragraph is at lines 136–139, so the citation is correct today.** It will rot on
  the next edit to `operate`. Prefer a section reference.
- **N10 — 10 of 18 references exceed the pack's own 2,500-token lint threshold** (`cost-and-quota`
  3,795; `sync-semantics` 3,609; `credentials-and-connections` 3,695; `reconciliation` 3,454). The
  lint exits 0, so this is a soft ceiling, consistent with prior rulings in this family — noted, not
  pressed.
- **N11 — `cost-and-quota.md` carries per-engine mechanism** (Zapier task-hold/replay, n8n overage,
  Workato/Zapier loop docs) that reads as surface-file material in a job file. Defensible, because
  the point is cross-vendor and no single surface owns it — but it is the only job file where the
  split is arguable.

---

## Verified clean

Checked deliberately and found correct:

1. **Invariant citations — 186 of them**, across all 18 references and all 7 assets (I1 11 · I2 11 ·
   I3 9 · I4 23 · I5 4 · I6 8 · I7 19 · I8 25 · I9 28 · I10 12 · I11 6 · I12 6 · I13 9 · I14 2 ·
   I15 13). I read every citation in context. **All 186 resolve to the semantically correct
   invariant**, with the single exception of the four `operate`-I7 collisions in `cost-and-quota.md`
   (S1). No I-numeral points at the wrong `automation` invariant anywhere.
2. **SKILL.md's I1–I15 match `synthesis.md` §3 one-for-one**, in order, with no renumbering and no
   dropped or invented invariant.
3. **`handoff.md` vs `assets/handoff.yaml` — field by field, they match.** All 13 family-shape fields
   present; all six automation-specific blocks present (`irreversible_steps`, `idempotency`,
   `reconciliation_loop`, `credentials`, `human_gates`, `evidence`); every field named in
   `handoff.md`'s Validation section exists in the YAML with the stated semantics. **`handoff.md`
   contains no second inline YAML copy** — and says explicitly, at line 72–77, that the asset is the
   single source of truth. This is the cleanest handoff pair I checked.
4. **`evidence_state: observed | inferred | not_tested | blocked`** matches
   `quality-skill/skills/quality/assets/handoff.yaml:40` and
   `operate-skill/skills/operate/assets/handoff.yaml:46` exactly — same four values, same field name.
   Verified on disk, not assumed.
5. **Every licence claim is right, and none is inverted.** n8n = Sustainable Use License, not OSI, in
   all three places it appears. Nango = Elastic License 2.0, source-available, explicitly *not* "open
   source". Pipedream = not open source. Google SRE books cited for the retry-budget *idea* with no
   lifted prose (`cost-and-quota.md:185–187`). Hohpe's grant described as **per-pattern-page** in
   `credentials-and-connections.md:59–61` and `compensation-and-recovery.md:96–97`. Zero instances of
   any of these projects being called "open source". The prior build's inverted ruling has not
   recurred.
6. **The Hohpe Quick Acknowledgment attribution trap is handled correctly, and well.**
   `integration-reliability.md` §2 (lines 56–82) quotes the *correct* verified problem and solution
   statements verbatim, states the provider/client role inversion explicitly rather than assuming it,
   and says in the pack's own words: *"the pattern's own text never mentions duplicates or retries…
   That causal link… is this pack's addition, not Hohpe's."* This is exactly what AMENDMENT 2
   demanded. It is the strongest passage in the pack.
7. **Cross-file coherence on the reconciliation-creates-a-second-path point (I4): both files teach
   it.** `reconciliation.md` §10 (lines 224–238) and `trigger-design.md` §5 (lines 110–122), each
   pointing at the other, plus a third statement on
   `assets/reconciliation-worksheet.md` and a dedicated column on `assets/trigger-audit-sheet.md`.
   Not a defect.
8. **All four §6 forbidden claims are absent, and two are actively refuted.**
   `compensation-and-recovery.md:68` — *"Do not present this as an undertaught corner. It is not."*
   `approval-and-authority.md:80` — *"This is written, not unwritten."* Zero hits for the three
   advertisement "incidents" (notification-47, CRM-14-minutes, field-was-null); zero citations of
   arXiv 2607.15529 (it appears only in `SOURCES.md` §3 as an exclusion, correctly reasoned);
   Formance's five stages cited for mechanics with the interest named and canonicity explicitly
   declined (`reconciliation.md:74–79`); no count of Nango's supported APIs anywhere.
9. **The wedge is stated as synthesis throughout.** `SOURCES.md` §1's five-literature table matches
   synthesis §1; `reconciliation.md` §1 opens *"This reference is synthesis, not discovery"*;
   `approval-and-authority.md` §1 is titled *"This reference does not discover approval policy — GRC
   already owns it"*; the COSO resolution is credited to COSO as a **translation**, in both
   `reconciliation.md` §9 and `SOURCES.md` §4. I looked hard for a discovery claim and did not find one.
10. **The A→B→A loop evidence follows AMENDMENT 1 per-source.** Workato and Zapier quoted verbatim
    and matching the amendment word for word; Make cited as a downgraded community report with the
    1/3/100 numbers correctly dropped; **n8n's loop behaviour asserted in neither direction**, with
    `sync-semantics.md:87–93` explaining *why* that silence differs from n8n's DST silence. The loop
    counter and quiet window are labelled *(ours)* in both `sync-semantics.md` and `cost-and-quota.md`.
11. **The DST table** (`trigger-design.md` §3) matches §5's five cleared behaviours exactly — AWS
    skip/once, GitHub shift, GCP *"might observe execution anomalies"*, Vercel UTC-only, n8n silent.
12. **Job/surface split on approval** is correct and matches AMENDMENT 5's second condition: policy
    (deny/allow/escalate, I13) lives in `approval-and-authority.md` §5; mechanism (signals,
    `waitForEvent`, `.waitForTaskToken`) lives in `surface-code-first-durable.md`. Neither grows the
    other's half. The load-bearing claim — every engine ships the mechanism, none ships a policy — is
    stated in both without contradiction.
13. **Fintech source attributions** in `reconciliation.md` §1 (Modern Treasury, Adyen, Stripe,
    Merge.dev) all trace to `s2-w2-reconciliation.md`, with Merge.dev's commercial interest named.
14. **The IEEE citation** — *"Your Coffee Shop Doesn't Use Two-Phase Commit," IEEE Software,
    March/April 2005, pp. 64–66* — matches the corpus exactly, and is **paraphrased, not quoted**,
    per the © IEEE restriction.
15. **`scripts/lint-skill` exits 0.** 176 SKILL.md lines, ~2,767 tokens, 18 direct references.

---

## Could not check — the honest limits of this pass

- **No live network verification.** Every "verified 2026-07-27" claim was checked against the
  research corpus, not against the vendor's page. If the corpus itself is wrong, this review inherits
  that error. The Hohpe defects (B1, B2) were found precisely because stage 1 and stage 2 disagreed
  in the corpus — a fact I could only see because both were on disk. Where stage 1 and stage 2 agree
  and are both wrong, I would not have caught it.
- **I did not re-fetch `CompensatingAction.html`.** B1's fix depends on someone doing so. I am
  confident the shipped sentence is not the stage-2-verified problem statement; I am not able to
  state from here what the page's bold problem statement says today.
- **No behavioural evaluation.** I did not run the router against `evals/`, so I cannot say whether a
  reader's query lands on the right job/surface pair. Activation, traversal, output, and
  compression-ablation cases exist under `evals/` and are unexercised by this review.
- **No prose-quality or redundancy audit.** I checked correctness, attribution, gate compliance, and
  cross-file coherence. I did not ablate any reference to test whether its content is load-bearing,
  and I did not check for duplication between references beyond the one instance noted (N11).
- **Sibling-pack claims spot-checked, not audited.** I verified `operate`'s I7 text, `operate`'s
  `recoverability.md:136-139`, and `quality`/`operate`'s `evidence_state` values on disk. I did not
  verify the `backend`, `ai`, `data`, or `orchestrate` decline rows, nor synthesis §7's claim that
  `backend` currently cedes nothing.
- **Site, README, CHANGELOG, install script, Remotion hero, and `agents/openai.yaml` were out of
  scope** and were not read.

## Flags I raised and then withdrew

- **"Naming Nango and Unipile as the two vendor blogs that publish the wrong 50-token cap is a
  reputational claim beyond the gate."** Withdrawn. `s2-w4-credentials.md:63` names both explicitly
  and states that both published the 50 figure. The pack is accurate.
- **"Shipping the number 50 in the sentence forbidding it repeats the prior build's defect."**
  Withdrawn as a finding. Synthesis §5 clears the comparison explicitly, and the purpose here is
  different in kind: it warns a reader who may have already read those blogs, rather than naming a
  figure only to disown it. Noted as a tension with `SOURCES.md:101–103` for the controller's
  awareness, not asserted as a defect.
- **"`cost-and-quota.md` names a forbidden number."** Withdrawn — I checked specifically because the
  brief flagged this file, and found none. The Salesforce paragraph is a model of how to do it right.
- **"`reconciliation.md` presents Formance's five stages as canonical."** Withdrawn. It lists the
  mechanics, names the interest, and states outright *"do not repeat the five stages as if they were
  an industry standard."* Compliant.
