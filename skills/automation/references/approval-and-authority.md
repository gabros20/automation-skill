# Approval and Authority

Purpose: Decide who may approve an automated step, whether the requester may ever be the approver,
what the system does when nobody responds, and what evidence survives a dispute — by translating
enterprise GRC/audit-control canon, which already owns most of this, into a policy an unattended
workflow can execute at 3am, which that canon never had to answer.

Read when:
- A workflow needs a human decision node — "someone must approve before this runs" — for a payment,
  a send, a delete, or any other hard-to-reverse step.
- You are deciding who may approve, whether a pending request can time out, or what happens if it does.
- You are the only person in the business and need to know what this control looks like when the
  second reviewer does not exist.

Skip when:
- The gate is on a model's own tool call, inside the agent loop — that guardrail, and its
  deny/allow/ask taxonomy, belongs to `ai`; this reference owns the deterministic process node a
  person sits on, not the model's cognition (§7).
- You need the business threshold itself (what dollar amount, what risk tier triggers the gate) —
  that is a business rule to capture, not invent; see [process-capture](process-capture.md).
- The question is how to detect that a workflow silently stopped waiting for approval →
  [workflow-observability](workflow-observability.md) (I8).
- You need the compensating action for an approved step that later has to be undone →
  [compensation-and-recovery](compensation-and-recovery.md) (I3).

Inputs:
- The irreversible action the gate protects, and the rough cost of it being wrong.
- Who exists to review it — one person, a small team — and whether any of them originated the request.
- Your engine's human-in-the-loop primitive: whether it can pause a run at all, and for how long.

Produces:
- A filled [`assets/approval-policy-card.md`](../assets/approval-policy-card.md): who may approve,
  the timeout duration and its default decision, the escalation path, and what evidence is logged.

## Contents
- 1. This reference does not discover approval policy — GRC already owns it
- 2. Who may approve, and the rule that is not a config option
- 3. Escalation, audit evidence, and bulk-approval as an anti-pattern
- 4. The n=1 collapse — and where the resolution actually lives
- 5. Timeout policy is a decision, not a config default (I13)
- 6. The living proof: zero self-approval enforcement, shipped this week
- 7. Boundary: what belongs to `ai` instead

## Procedure

### 1. This reference does not discover approval policy — GRC already owns it
Enterprise governance-risk-compliance (GRC) and audit-control practice has answered most of "who may
approve, and under what constraint" for decades — and it is a more disinterested canon than most of
what this domain runs on: audit standards bodies wrote it, not automation vendors. Nothing in §§2–4 is
a discovery. The one place this pack adds anything is §5.

### 2. Who may approve, and the rule that is not a config option
Delegation of authority is a matrix, not a single flag: role × action type × threshold decides who may
approve what, up to what value or consequence — a $50 refund and a $50,000 wire are not the same
decision even if a workflow engine models them with the same node.

**The requester may never also be the approver. This is not configurable — it is the definition of the
control.** A system that lets the party that proposed an action also sign off on it has not implemented
approval; it has implemented a rubber stamp with an extra click. Audit practice names this
maker-checker: the maker proposes, the checker decides, and the two must be different parties. At n=1
this looks paradoxical — §4 has the actual resolution, and it is not "let the owner approve their own
step."

### 3. Escalation, audit evidence, and bulk-approval as an anti-pattern
- **Escalation** — delegation-of-authority practice names an escalation path (who is next up the chain
  when the assigned approver is unavailable), but it is paced to business cadence: a quarterly
  certification, a change-advisory-board meeting. Nothing in that literature answers "what happens if
  nobody responds in four hours," because it assumes a human-paced process, not one running unattended
  at 3am. That gap is real, and §5 is where this pack closes it.
- **Audit evidence** — a decision log entry is only evidence if it can be checked against something
  outside the approver's own action: who decided, what they were shown, and when — logged as a fact
  independent of the decision itself, the same discipline I2 asks of a completion check.
- **Bulk-approval is a named anti-pattern, not a shortcut.** Approving a stack of pending requests
  without individually reviewing each one is documented in audit practice as a control failure —
  sometimes named certification fatigue or rubber-stamping — not a productivity feature. A UI that
  makes "approve all" one click has made the anti-pattern one click too.

### 4. The n=1 collapse — and where the resolution actually lives
At one person, §2's rule looks unsolvable: if the owner is the only party in the business, they are
always both maker and checker. **This is written, not unwritten — it just was not written in
workflow-engine language.** COSO, quoted via Bonadio (Doyle, 2024-10-10):

> "Where segregation of duties is not practical, management selects and develops alternative control
> activities."

Cashed out for an owner-operator, that is: owner review of everything, an **independent
reconciliation**, and dual authorisation reserved for high-value or high-risk items only. It is
**not** "approve your own step," and it is not silence on the question — COSO answered it decades ago,
in accounting language, not workflow-engine language.

There is a further recursion worth knowing about rather than tripping over: COSO's own escape hatch is
independent reconciliation, and reconciliation practice separately demands a reconciler distinct from
the recorder — exactly as unavailable at n=1 as the original approval problem. That is
[reconciliation](reconciliation.md)'s intellectual core (its §9); this reference does not re-derive it.
The shared resolution both land on: **independence comes from the source, the clock, or a rule
committed to in advance, never from a second person who does not exist (I6).** For an approval gate
specifically, that means a pre-committed decision table (§2's delegation matrix, decided before the
case arose) or a mandatory delay standing in for the missing second signature — not a rubber stamp
wearing an approval's name.

### 5. Timeout policy is a decision, not a config default (I13)
Every workflow engine that supports a human-in-the-loop step gives you the same three primitives:
pause the run, start a timer, and resume on a signal or a timeout. **Not one of them ships a default
policy for what happens on timeout.** Inngest states this outright, verbatim: *"There is no
default-deny or default-allow… you decide."* The mechanism is mature and universal; the policy is
homework the platform deliberately leaves undone.

Name the decision before the gate goes live, per action class:
- **Fail closed (deny/hold) for irreversible or high-value actions** — a payment, a delete, an
  external send. If nobody answered in time, the safer failure is that nothing happened, not that the
  system guessed on your behalf.
- **Fail open (allow) only for reversible, low-consequence actions**, where the cost of a false block
  exceeds the cost of an unreviewed action going through — and write down why, because this is the one
  branch where the default is being chosen for convenience, not safety.
- **Escalate** — route to the next authority on the delegation matrix (§2) rather than resolving the
  decision by silence. This is the right default where a real second approver exists above the first;
  it is not a substitute for a decision at n=1, where there is nowhere to escalate to.

### 6. The living proof: zero self-approval enforcement, shipped this week
`agentkitai/agentgate` (MIT license) is a real, production human-approval gate for agent actions —
a policy engine plus chat routing plus an audit trail. Reading its authorization check directly
(`rbac.ts`): `hasAgentGatePermission()` checks only whether a user holds the `approvals:decide`
permission. **There is no comparison against the requesting identity anywhere in the file.** Zero
self-approval enforcement.

The maker-checker principle GRC has treated as non-negotiable for decades is absent from the one
production implementation of this exact pattern. That is not a criticism of one repository — it is
the fragmentation this pack exists to close, made concrete in one file: the discipline is real,
rigorous, and decades old, and it has simply not crossed into the tool people are actually shipping.
Check whether your own gate makes the same omission before you ship it.

### 7. Boundary: what belongs to `ai` instead
A model deciding to call a risky tool, and a guardrail that intercepts that call, is `ai`'s territory
— it owns the model's cognition and the approve/deny/ask taxonomy on a tool call. This reference owns
the case where the decision node is a deterministic step in a graph and the actor waiting on it is a
person, regardless of whether the thing that proposed the action was a rule, a person, or a model.

## Validation
- Every irreversible action gated here names who may approve, and that party is never the same
  identity or process that proposed the action.
- The timeout duration and its default decision (deny / allow / escalate) are both written down before
  the gate ships — not discovered the first time a request times out.
- The n=1 case names its actual independent check (source, clock, or pre-committed rule) rather than
  routing around the maker-checker rule.
- The approval log records the decision as a fact independent of the request, not merely inferred from
  the workflow having proceeded.

## Failure modes and handoff
- **A request sat pending indefinitely** — the engine shipped the pause/timer/resume mechanism but no
  fallback rule was configured for it, the common default-by-omission across every engine surveyed.
  Fix the policy, not the engine.
- **The approver is also the requester** — this is not a smaller version of the control, it is the
  control's absence. Route to §4 for the n=1-correct substitute rather than waiving the rule.
- Downstream: hand the filled `approval-policy-card.md` to `operate` if the gate needs alerting when it
  silently sits unanswered, and to `quality` if the claim "every irreversible action is gated" needs
  independent verification before ship.
