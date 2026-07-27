# S2-W1 — Gregor Hohpe's Conversation Patterns: full enumeration, licence ruling, gap list

Source: enterpriseintegrationpatterns.com, `/patterns/conversation/` collection ("Enterprise
Integration Patterns, Vol 2: Conversation Patterns", Gregor Hohpe), plus core EIP messaging
patterns (`/patterns/messaging/`) and Hohpe's 2005 IEEE Software article. All fetched directly
2026-07-27. Every quote below is verbatim from the cited URL, fetched today; no quote is from
trained knowledge.

---

## 0. LICENCE RULING (load-bearing — read this first)

Verbatim footer, confirmed on `CompensatingAction.html` and repeated site-wide (copyright banner
also independently confirmed on `toc.html` and the collection index):

> "You can reuse the following elements under the Creative Commons Attribution license: pattern
> icon, pattern name, problem and solution statements (in bold), and the sketch. Other portions
> are protected by copyright."
>
> "© 2003, 2023 • All rights reserved."

The CC badge on the page links to `http://creativecommons.org/licenses/by/4.0/` — this is **CC BY
4.0**, not BY-NC-ND. CC BY 4.0 permits commercial reuse and derivative works, with attribution.

**Precise scope — what we may lift, and what we may not:**

| Element | Licence | May we quote it in our pack? |
|---|---|---|
| Pattern icon (the small sketch/glyph) | CC BY 4.0 | Yes, with attribution |
| Pattern name (e.g. "Compensating Action") | CC BY 4.0 | Yes — use as the canonical term, credit Hohpe |
| **Problem statement** (the bold question) | CC BY 4.0 | **Yes, verbatim, with attribution** |
| **Solution statement** (the bold answer) | CC BY 4.0 | **Yes, verbatim, with attribution** |
| The sketch/diagram | CC BY 4.0 | Yes, with attribution (we'd redraw, not hotlink) |
| Everything else — explanatory prose, worked examples (Starbucks, hotel/flight booking, escrow), discussion, related-pattern commentary | © 2003, 2023, all rights reserved | **No** — paraphrase only, cite the source |

This is a materially different situation from the SRE books (CC BY-NC-ND, no derivatives, no
commercial use). Here we can **verbatim-quote every problem/solution pair in this file with
attribution** — that is a real, usable asset for `SOURCES.md` and any reference file that names
these patterns. The example narratives and "why it works" prose must still be paraphrased in our
own words.

Attribution form used throughout this file: *Gregor Hohpe, Enterprise Integration Patterns,
enterpriseintegrationpatterns.com, © 2003, 2023, CC BY 4.0 (problem/solution statements only).*

---

## 1. Is the collection alive? (clause 4 — liveness)

Conflicting signals, both verified directly today — **flagging the discrepancy rather than
resolving it in the collection's favor**:

- **Primary source (the author's own site), directly fetched:** the collection index and TOC both
  carry: *"Work in progress. Last update: Jan 2017."* The `Preface.html` page adds the candid
  admission *"Once it's written, we will know"* about the book's final structure — as of Jan 2017
  the author had not settled the organization.
- **Third-party retail metadata (fetched today, 2026-07-27):** InformIT lists the eBook
  "Enterprise Integration Patterns, Vol 2: Conversation Patterns," ISBN 978-0-13-475566-3,
  copyright year "2022," publication date "Apr 1, 2025," 500 pages — but flags **"This product
  currently is not for sale."** Goodreads shows "Published April 7, 2025," 4.67★, but only **3
  ratings and 0 reviews** — consistent with a placeholder/pre-order listing, not a book actually in
  circulation.
- **Net read:** the primary source is more trustworthy than retailer placeholder metadata. The
  online pattern collection has not been substantively updated since **January 2017** (9+ years
  stale as of this writing) despite retailers carrying a nominal 2025 pub date. Treat the book as
  **effectively stalled/vaporware** for citation purposes — cite the live web pages, not "the
  book," and date-stamp any future re-check of this claim.

---

## 2. "Your Coffee Shop Doesn't Use Two-Phase Commit" — verified precisely

Fetched the actual PDF (`enterpriseintegrationpatterns.com/docs/IEEE_Software_Design_2PC.pdf`) and
read it directly (not a WebFetch summary of it).

- **Exact title:** "Your Coffee Shop Doesn't Use Two-Phase Commit"
- **Author:** Gregor Hohpe (sole author; bio line: "integration architect at ThoughtWorks")
- **Venue:** *IEEE Software*, the "design" column (column editor: Martin Fowler)
- **Issue/date:** **March/April 2005**, pp. 64–66
- **Copyright:** "Copyright 2005 IEEE. Personal use of this material is permitted..."

**The actual argument** (this is the ancestor of our whole framing — confirmed): using a Starbucks
order queue as the running example, Hohpe lays out **four error-handling strategies for loosely
coupled systems**, illustrated in one figure (Figure 1, a–d):

1. **Write-off** — do nothing, discard the failed unit of work. Quote: *"I've worked for several
   ISPs who used this approach for errors in the billing and provisioning cycle... Periodically,
   they'd run reconciliation reports to detect and close such accounts."* — **this is the single
   mention of "reconciliation" in the entire article.** It is a one-sentence aside, not a developed
   pattern: no cadence, no drift-tolerance, no system-of-record framing.
2. **Retry** — including "retry all," which the article explicitly says *"requires all receivers
   to be idempotent receivers"* — footnoting Hohpe & Woolf's 2003 EIP book, i.e. this article is
   where "idempotent receiver" gets its first informal cross-reference to conversational retry.
3. **Compensating action** — *"undo already completed operations... we might call and ask a
   customer to ignore a letter that has been sent."* Same example later formalized as the
   Compensating Action pattern page.
4. **Transaction coordinator** — the pessimistic 2PC alternative, illustrated with a home-purchase
   escrow company as coordinator. Explicitly states the escrow case **still uses a compensating
   trick** ("prepare" = debit money, "rollback" = credit money, "commit" = do nothing) because a
   bank account doesn't expose a real prepare/commit protocol — i.e. even the "real 2PC" example is
   actually compensation wearing a disguise.

The article closes on Correlation Identifier (naming your coffee cup) and a nod to Half-Sync/Half-
Async (Schmidt et al.) for why the customer experiences a synchronous wait over an asynchronous
kitchen. **This article is a compressed preview of exactly the pattern set the Conversation
Patterns collection formalizes 10–12 years later** — Ignore Error = Write-off, Compensating
Action = Compensating action, Coordinated Agreement = Transaction coordinator.

---

## 3. Full pattern enumeration with transfer verdicts

Reader frame for verdicts: a solo founder or small team wiring their business across SaaS vendors
they do **not** control and cannot deploy code to (Stripe, HubSpot, Airtable, Slack, via
Zapier/n8n/Make or custom glue code).

### Discovery (5 patterns) — all ENTERPRISE-RESIDUE
Built for large distributed/SOA environments where a caller doesn't know its partner in advance
(UDDI-style registries, service meshes). Our reader always already knows their vendor by name and
signs up for a fixed API — there is no discovery problem to solve.

| Pattern | Problem (verbatim) | Verdict |
|---|---|---|
| Dynamic Discovery | "How can a conversation initiator find a partner when it has no knowledge whatsoever about available partners?" | ENTERPRISE-RESIDUE |
| Advertise Availability | "How can a participant let others know that it is available?" | ENTERPRISE-RESIDUE |
| Consult Directory | "How can a conversation initiator find a partner across a large network without flooding the network with requests?" | ENTERPRISE-RESIDUE |
| Referral | "How can an initiator discover the right conversation partner?" | ENTERPRISE-RESIDUE |
| Leader Election | "How can a set of participants agree on a single participant assuming a special role?" | PARTIAL — niche relevance if reader runs redundant automation-runner instances and must avoid duplicate triggers; rare for solo/small-team scale |

### Starting a Conversation (5 patterns)

| Pattern | Problem (verbatim) | Verdict |
|---|---|---|
| Three-Way Hand Shake | "How can two services sync up so they can start a conversation from the same point?" | ENTERPRISE-RESIDUE — protocol-level, not something a SaaS API consumer configures |
| Acquire Token First | "How can a provider ascertain the identity of a requestor?" | **TRANSFERS** — this is literally acquiring an API key/OAuth token before the first call, which every vendor integration does |
| Rotate Tokens | (no separate problem statement captured; companion to Acquire Token First) | **PARTIAL** — the single-token-pair *mechanism* transfers; it does not address fleet-scale rotation across N vendors (see gap #2) |
| Verify Identity | "How can a provider verify the claimed identity of a consumer in the absence of a certificate authority?" | PARTIAL — most relevant framing is verifying inbound webhook signatures (Stripe/GitHub-style HMAC signing) |
| User Grants Access | "How can a participant engage in a conversation on behalf of a user?" | **TRANSFERS strongly** — this is exactly OAuth delegated authorization, the "Connect your Stripe/Google account" flow underlying almost every automation platform |

### Basic Conversations (6 patterns) — the strongest transfer cluster in the whole collection

| Pattern | Problem (verbatim) | Verdict |
|---|---|---|
| Fire-and-Forget | "How can one participant notify another efficiently?" | TRANSFERS — webhook/notification design |
| Asynchronous Request-Response | "How can a consumer request information from a provider?" | TRANSFERS |
| Request-Response with Retry | "How can a consumer deal with a missing response message in a Request-Response conversation?" | **TRANSFERS directly** — retrying flaky vendor API calls is daily-driver work for our reader |
| Polling | "How can a service request information from a provider if an immediate response is not available and it cannot accept unsolicited incoming messages?" | TRANSFERS — the fallback for vendors with no webhook support |
| Subscribe-Notify | "How can one participant receive information from another participant if that information cannot easily be packaged into a single message?" | PARTIAL — closest existing vocabulary for "the webhook subscription model" |
| Quick Acknowledgment | "How can a client be sure the service accepted a request, even if processing the request takes a long time?" | TRANSFERS — matches the "202 Accepted, webhook later" shape common in vendor async job APIs |

### Intermediaries (4 patterns)

| Pattern | Problem (verbatim) | Verdict |
|---|---|---|
| Proxy | "How can a participant communicate with a partner that is not visible or not reachable?" | PARTIAL — mostly network topology, some relevance to reverse-proxying webhook receivers |
| Relay | "How can participants engage in a two-way communication when each participant is limited to outbound requests?" | PARTIAL — explains *why* polling/webhooks exist when a dev machine can't be reached inbound; niche |
| Load Balancer | "How can incoming messages be shared among the providers?" | ENTERPRISE-RESIDUE — infra concern, not a vendor-integration concern |
| Scatter-Gather | "How can a participant solicit responses from a number of participants without connecting to all of them?" | **TRANSFERS** — parallel fan-out to multiple vendor APIs with aggregation (e.g. multi-CRM sync, price-comparison calls) |

### Managing Distributed Systems (1 pattern)

| Pattern | Problem (verbatim) | Verdict |
|---|---|---|
| Heartbeat | "How one know that another participant is working properly and is ready to receive messages?" | TRANSFERS as a mechanism, but **cede to `operate`'s dead-man's-switch material** per stage-1 residue item #8 — do not re-teach, cite only |

### Resource Management (3 patterns)

| Pattern | Problem (verbatim) | Verdict |
|---|---|---|
| Incremental State Build-up | "How can a participant invoke an operation when it does not have all required information available at the same time?" | PARTIAL — niche (multi-step vendor forms/checkout sessions built up across calls) |
| Lease | "How can a service provider avoid holding resources for clients who are no longer interested?" | **TRANSFERS, underrated** — many vendor push-notification subscriptions are literally Leases with an explicit expiry the *consumer* must renew (Microsoft Graph and Google Workspace push subscriptions expire in days and silently stop; this is a real, cite-worthy mechanism behind "silent-stop" failures) |
| Renewal Reminder | "How can a service provider avoid holding resources for clients who are no longer interested?" | PARTIAL — this is the *provider*-initiated "still there?" check-in, less applicable since our reader is usually the lease-holder, not the provider |

### Ensuring Consistency (4 patterns) — the canonical core

| Pattern | Problem (verbatim) | Verdict |
|---|---|---|
| Ignore Error | "How can a requestor cope with a failing request to a provider?" | **TRANSFERS** — this is the formalized "write-off" strategy from the 2005 article; a legitimate baseline decision (when *not* to build reconciliation machinery) |
| Compensating Action | "How can a requestor ensure a consistent outcome across multiple, independent providers?" | **TRANSFERS, already the confirmed C1 finding** — framed exactly for our reader's situation; twenty years old, largely unread |
| Tentative Operation | "How can a requestor ensure a consistent outcome across multiple, independent providers?" (same problem framing as Compensating Action — a paired alternative) | **TRANSFERS** — the hold/reserve-then-confirm mechanism (Stripe PaymentIntent authorize-then-capture, inventory holds, the hotel/flight-booking worked example on the page itself) |
| Coordinated Agreement | "How can agreement across multiple participants be achieved so that all participants see the same outcome?" | **ENTERPRISE-RESIDUE, and usefully so** — this is 2PC/consensus-with-a-coordinator. Our reader categorically cannot do this: no SaaS vendor exposes a prepare/commit protocol to third-party integrators. This pattern is the formal reason the whole field pushes toward compensation instead — worth citing as "the ceiling we're explicitly below," not as a transferable technique |

### Describing Conversations (bonus section, found via TOC, not in the original brief)

| Pattern | Problem (verbatim) | Verdict |
|---|---|---|
| Choreography | "How can a conversation policy be described?" | PARTIAL — documentation vocabulary, low actionability |
| Orchestration | "How can a participant describe what conversations it is willing to engage in?" | PARTIAL/TRANSFERS-as-naming — this is literally the theoretical description of what n8n/Zapier/Make *are* (a process template engine); useful vocabulary contribution, no new operational guidance |
| Hypermedia State | "How can a participant describe what it expects from a consumer without defining all rules of the conversation up-front?" | ENTERPRISE-RESIDUE — HATEOAS-style REST; rarely exposed by real SaaS vendor APIs in practice |
| Conversation Vocabulary | (glossary page, no problem/solution pair) | Not a pattern — skip |

### Core EIP messaging patterns (from the original 2003 book, checked for third-party-integration relevance)

| Pattern | Problem (verbatim) | Verdict |
|---|---|---|
| Idempotent Receiver | "Even when a sender application only sends a message once, the receiver application may receive the message more than once." | TRANSFERS — **already covered** in the family per stage-1 gate (`service-integration.md:69-72`); cede, cite only |
| Guaranteed Delivery (Guaranteed Messaging) | "How can the sender make sure that a message will be delivered, even if the messaging system fails?" | PARTIAL — the broker-level mechanism is the vendor's problem, not ours; the reader-side analog (durable outbox) is likely already in `backend`'s async-and-messaging ref — check/cede, don't re-teach |
| Dead Letter Channel | "What will the messaging system do with a message it cannot deliver?" | TRANSFERS — maps directly to "what happens when an automation run keeps permanently failing"; likely partial overlap with backend, verify before writing |
| Correlation Identifier | "How does a requestor that has received a reply know which request this is the reply for?" | TRANSFERS — matching a delayed webhook back to the API call that triggered it is a real, distinct need in vendor integration; check for existing family coverage before re-teaching |
| Process Manager | "How do we route a message through multiple processing steps when the required steps may not be known at design-time and may not be sequential?" | **TRANSFERS, high framing value** — this is the formal name for what a workflow-automation tool (Zapier/n8n/Make) *is*: a Process Manager. Strong vocabulary contribution connecting our whole pack's subject to the canon; verify architecture/backend don't already claim this term for saga-orchestration before treating as ours |
| Message Filter | "How can a component avoid receiving uninteresting messages?" | **TRANSFERS, directly maps to a named residue** — this is the formal vocabulary for the "over-broad trigger condition" failure mode (stage-1 residue #6, and the X-corroborated near-$7,000 mis-triggered charge). Canon has the *name*; we add the SaaS-specific failure catalogue (webhook subscribes to more fields than you filter on, cron/vendor-retry schedule collisions) |
| Claim Check | "How can we reduce the data volume of message sent across the system without sacrificing information content?" | PARTIAL, minor — relevant only to passing large payloads (e.g. an S3 URL instead of a raw file) through an automation chain |

---

## 4. What we should decline outright

Not just "low value" — actively **should not be re-taught**, because Hohpe already owns the frame
and re-teaching would be redundant with a 20-year-old, freely (CC BY) citable source:

- **Compensating Action** itself — cite Hohpe verbatim (problem/solution, CC BY), do not rewrite it as our own "compensation pattern." Point at it.
- **Ignore Error / write-off** — same: cite, don't reinvent, this is the canonical name for "decide not to build reconciliation."
- **Tentative Operation (hold-and-confirm)** — cite; our reader's authorize/capture and inventory-hold instincts already match this exactly.
- **Idempotent Receiver** — already ceded per stage-1 gate; this file reconfirms it transfers and is Hohpe/Woolf-attributable.
- **Coordinated Agreement / 2PC** — cite as the explicit ceiling ("this is what you can't do and why"), not as technique.

---

## 5. THE GAP LIST — what our pack adds on top of Hohpe (most important section)

Given the above, Hohpe's collection is not a discovery wedge for us — it is a **canon we should
mostly point at**. What it does not give our reader, verified structurally (by reading the full
25-pattern catalog, not by absence-of-search):

1. **Reconciliation as a designed, recurring practice.** The word appears exactly once in the whole
   corpus (the 2005 article's "Periodically, they'd run reconciliation reports..."), as an
   unexplored aside, not a pattern. Nothing on cadence, drift-tolerance, three-way reconciliation
   (your DB vs. vendor vs. bank/downstream), or what "system of record" means when the vendor's
   ledger is authoritative and yours is a cache. **This is the sharpest, most defensible gap in
   the whole channel** — Hohpe *named* it and walked away.

2. **Multi-vendor credential fleet lifecycle.** Acquire Token First / Rotate Tokens teach the
   single-requestor-single-provider mechanism. Nothing addresses N vendors × N environments,
   staggered/silent expiry (the X-corroborated "OAuth silently expired, stuff just stopped firing
   for days"), a registry of who owns which credential, or blast radius when one shared credential
   backs multiple unrelated flows. The collection's two-party framing structurally can't produce
   this — it's a fleet-management problem, not a conversation-starting problem.

3. **Approval as a deterministic process node.** Confirmed by reading the full catalog: **zero**
   patterns named Approval, Human Task, Human-in-the-Loop, or anything adjacent. The nearest
   relative is Coordinated Agreement, which is machine consensus, not a human decision gate with
   timeout policy, default-allow/deny trade-off, escalation path, and audit trail. This gap is
   structural, not a search failure — strengthens (doesn't resolve) the open question the stage-1
   gate flagged: does GRC/SOX/delegation-of-authority literature already own this instead?

4. **Trigger design as a SaaS-specific discipline.** Message Filter supplies the *vocabulary*
   ("eliminate undesired messages based on criteria") but none of the vendor-API-quirk failure
   modes our reader actually hits: over-broad webhook subscriptions firing on fields nobody filters
   on, cron schedules colliding with a vendor's own retry timing, idempotency-key collisions across
   re-fired triggers. Hohpe's Filter is infrastructure-altitude; ours needs to be vendor-quirk-
   altitude.

5. **Per-task/per-operation cost ceiling with vendor-owned blast radius.** Zero cost-awareness
   anywhere in 25 patterns (unsurprising — the collection predates metered per-call vendor billing
   and agentic-loop cost risk by a decade or two). Confirmed absent, not just unfound.

6. **Bidirectional sync semantics.** Every conversation pattern here is single-directional
   (requestor/provider). Nothing addresses two systems each treating themselves as source of truth
   and looping changes back at each other (A→B→A), deletes invisible to incremental sync, or
   conflict-resolution policy. This is the classic "infinite sync loop" / "35 records instead of 1"
   failure mode from the X corroboration, and it has no home in this collection at all.

7. **The collection predates the mass-market webhook/iPaaS era as its worked context.** It's framed
   for enterprise SOA/message-bus integration (2003) and web services (last substantive update Jan
   2017). The *vocabulary* transfers remarkably well (see §3); the worked examples and operational
   playbook for "a solo founder wiring Stripe→Airtable→Slack via Zapier" simply do not exist here —
   every example in the collection and the 2005 article is enterprise-scale (ISPs, escrow
   companies, Starbucks-as-a-business), never a single person gluing together five SaaS tools with
   no ops team behind them.

**Framing recommendation for `SOURCES.md`:** state plainly that Hohpe's Conversation Patterns is
the strongest single canonical source for this pack's mechanisms (compensation, idempotency,
write-off, tentative-operation, lease-based subscriptions, process-manager vocabulary), is CC BY
4.0 for its problem/solution statements, is effectively stalled since Jan 2017, and that our pack's
job is **not** to re-teach it but to (a) point at it with verbatim-quotable citations, and (b)
supply the seven items above that it structurally does not and — given its enterprise-SOA
worked-example base — likely never will cover for this reader.
