# S2-W5 — Webhook delivery, the consumer's side

Scope: what a *receiver* of someone else's webhooks must handle, given the vendor's delivery
guarantees are fixed and un-negotiable. Explicitly **not** re-teaching: at-least-once inbound +
dedupe-by-provider-event-id (already `service-integration.md:69-72`) or saga/compensation mechanics
for services you own (`async-and-messaging.md:105-125`). All facts below fetched directly from
primary vendor docs on 2026-07-27 unless marked otherwise; every volatile number is date-stamped —
**re-verify before shipping**, these change without notice.

## 1. Per-vendor comparison table

| Vendor | Semantics | Ordering | Retry budget | Response timeout | Dedup key | Manual replay | Recovery after budget exhausted |
|---|---|---|---|---|---|---|---|
| **Stripe** | At-least-once (explicit) | **None guaranteed** — docs give the exact example of `customer.subscription.created`/`invoice.created`/`invoice.paid`/`charge.created` arriving out of order | Sandbox: 3 attempts over a few hours. Live: up to **3 days**, exponential backoff, exact interval schedule not published | Not a fixed number in docs — "quickly return 2xx prior to any complex logic"; failures logged as `(Timed out) ERR` | `event.id`, optionally + `data.object.id` + `event.type` for the two-events-per-action edge case | Dashboard (≤15 days after event creation) or CLI `stripe events resend` (≤30 days) — **does not cancel the automatic retry track**, so a manual resend can race an automatic one | Workbench "Event deliveries" tab (Delivered/Pending/Failed); dedicated "process undelivered webhook events" guide exists but wasn't fetchable in full this session |
| **Shopify** | At-least-once ("delivery isn't always guaranteed... app can miss or mishandle events") | **None guaranteed**, explicit: `products/update` can arrive before `products/create` | **8 retries over 4 hours** | **1s connection timeout, 5s total request timeout** — both hard | `X-Shopify-Webhook-Id` (per-delivery); `X-Shopify-Event-Id` correlates multiple deliveries from one merchant action — two different keys, don't conflate them | Not documented as a self-serve UI action in the pages fetched | **Explicitly punts to reconciliation**: Shopify's own docs recommend a periodic job using `updated_at` filters against the GraphQL/REST API — this is the vendor prescribing the reconciliation job itself, not us inventing it |
| **GitHub** | **Effectively at-most-once per automatic attempt** — GitHub does **not automatically retry at all**: "GitHub does not automatically redeliver failed deliveries" | Not addressed (single-attempt delivery model makes ordering moot for automatic delivery) | **Zero automatic retries.** A single POST; timeout = terminal failure | **10 seconds hard** — "GitHub terminates the connection and considers the delivery a failure" | `X-GitHub-Delivery` — GUID per delivery attempt | **Manual only**: UI "Redeliver" button or REST API, for deliveries **within the past 3 days** (repo/org/App/Marketplace/Sponsors webhooks all share this 3-day window) | Only the 3-day redelivery window + the GitHub REST/GraphQL API as ad-hoc reconciliation; no vendor-side automatic recovery at all |
| **Slack (Events API)** | At-least-once, implied by retry existence (not stated as a named guarantee in the fetched page) | Not addressed | **3 retries**: immediate, then +1 min, then +5 min | **3 seconds hard** — "we'll consider the event delivery attempt failed" | `event_id` — "globally unique across all workspaces" | Not documented as self-serve in fetched pages | None documented; apps under 5% success rate over 60 min risk auto-disable (exempt if <1,000 events/hour) — failure has an *account-level* consequence, not just a data-loss one |
| **Twilio** | Signature verification (HMAC-SHA1 over params + exact URL) is well documented | Not addressed in accessible docs | **Not verifiable this session** — the specific retry-schedule KB article (`support.twilio.com`) returned 403; the general docs pages fetched explicitly do not contain retry counts/backoff/timeout numbers | Not found in accessible docs | Not found in accessible docs (message/call SIDs likely serve this role but not confirmed as documented dedup guidance) | Unknown | Unknown |
| **HubSpot** | Not independently verifiable this session | Not verifiable | Not verifiable | Not verifiable | Not verifiable | Not verifiable | Not verifiable |

**HubSpot and Twilio gap is a finding, not an omission.** HubSpot's developer docs sit behind an
account-login redirect (`app.hubspot.com/myaccounts?...`) for the pages that would carry this
content — every URL guessed redirected to the auth wall or 404'd. Twilio's canonical retry-schedule
answer lives in a Zendesk KB article (`support.twilio.com`) that returned 403 to automated fetch.
**This asymmetry between vendors — some publish exact retry/timeout numbers in crawlable docs
(Stripe, Shopify, GitHub, Slack), others gate or scatter them (Twilio, HubSpot) — is itself worth a
line in the pack**: the reader cannot assume vendor documentation quality is uniform, and "read the
docs" is not always executable by a coding agent doing research at build time. Do not fabricate
numbers for these two; mark them unresolved and instruct the reader to verify against their own
dashboard/account, which requires auth WebFetch/browser tools cannot use anonymously.

## 2. The ack-timeout duplicate trap — CONFIRMED, and it varies by vendor mechanism

The pattern is real but the *mechanism* differs by vendor, which matters for how you frame the fix:

- **Stripe, Shopify, Slack**: exceeding the timeout is treated as **the same class of failure as a
  5xx or network error** and feeds the same automatic retry track. If your handler was actually
  mid-processing and later succeeds, the vendor doesn't know that — it resends. Slow success →
  duplicate side effect, exactly as hypothesized.
- **GitHub**: there is no automatic retry to trigger — so a slow success after the 10s cutoff is
  simply **silently orphaned from GitHub's perspective** (GitHub logs it as failed, you never hear
  about it again automatically). The duplicate risk shifts from "automatic redelivery" to **"a human
  later clicks Redeliver"** — a support engineer or the developer, looking at a failed-delivery list
  up to 3 days old, replays it without knowing your out-of-band process already completed the side
  effect asynchronously. Same trap, human-triggered instead of vendor-triggered.
- **Slack** additionally exposes the *cause* of the retry via `x-slack-retry-reason: http_timeout`
  (vs. `connection_failed`, `ssl_error`, `http_error`) — letting a well-built handler distinguish "I
  was slow" from "I errored," which is a detail worth citing since no other vendor here exposes retry
  cause this explicitly.

**Verdict: ack-fast-then-process-async is the correct universal pattern, confirmed independently by
every vendor's own docs, not just folk wisdom.** Stripe states it explicitly and gives the reason
(subscription-renewal spikes overwhelming synchronous handlers). Shopify's 1s/5s combined timeout
makes synchronous processing of anything beyond a trivial handler structurally impossible. GitHub's
10s hard cutoff with zero retry makes a slow synchronous handler doubly dangerous — you get neither
the retry safety net nor a same-vendor way to know you have to catch up. Slack's 3s window is the
tightest of all four verified. The universal fix is the same: **acknowledge on receipt, enqueue,
process out of band, verify signature before or during the ack (cheap), never let downstream calls
(DB writes, third-party API calls) sit in the request/response path.**

## 3. Signature verification and replay

- **Raw-body requirement is universal and the framework footgun is real and well-documented.**
  Stripe's own docs name the specific failure mode: "Some frameworks might edit the request body by
  doing things like adding or removing whitespace, reordering the key-value pairs, converting the
  string to JSON, or changing the encoding. All of these cases lead to a failed signature
  verification." Stripe explicitly calls out Express (`express.json()` applied before the webhook
  route breaks it), Next.js (both routers), Body Parser, and Lambda-behind-API-Gateway as places this
  bites. GitHub's docs independently require comparing raw payload bytes and mandate a
  constant-time compare (`crypto.timingSafeEqual` / `secure_compare`) rather than `==`, to avoid a
  timing side-channel on the signature check itself — a distinct hardening step beyond "verify the
  HMAC," worth stating separately.
- **Stripe's timestamp tolerance: 5 minutes, default, in the official libraries** — "Our libraries
  have a default tolerance of 5 minutes between the timestamp and the current time." Verified
  2026-07-27 against `docs.stripe.com/webhooks/signatures`; **re-verify before shipping**, Stripe has
  changed defaults before and this is exactly the kind of number that goes stale silently.
- **Verifying signature without timestamp = replay window stays open.** Stripe states this bluntly:
  "Don't use a tolerance value of 0. Using a tolerance value of 0 disables the recency check
  entirely." The signature alone only proves *authenticity* (it came from the vendor, unmodified);
  it says nothing about *freshness*. An attacker who captures one valid signed payload (e.g. off an
  improperly secured log, or a leaked test fixture) can replay it indefinitely if the receiver checks
  the HMAC but not `t=` against wall-clock time. This is a distinct, separable failure from "the
  raw-body footgun" and deserves its own checklist line.
- **GitHub and Twilio do not document a timestamp/tolerance mechanism at all** in the pages fetched —
  GitHub's `X-Hub-Signature-256` is a pure content-authenticity signature with no timestamp
  component, meaning GitHub payload replay protection is **structurally different** from Stripe's:
  there is no vendor-side freshness field to check. (Whether GitHub's HTTPS transport + short
  practical exposure window is considered sufficient mitigation isn't stated; flag as an open
  question rather than asserting a gap the reader can't independently close.)

## 4. Delivery IDs as dedup keys

Confirmed presence/absence, verified 2026-07-27:

| Vendor | Has a delivery/event ID? | Header/field | Scope |
|---|---|---|---|
| Stripe | Yes | `event.id` (body field) | Global to the account; note Stripe's own caveat that two *separate* Event objects can represent one logical action — combine with `data.object.id` + `event.type` for full robustness |
| Shopify | Yes, **two** distinct ones | `X-Shopify-Webhook-Id` (per delivery attempt) vs. `X-Shopify-Event-Id` (correlates multiple deliveries from one merchant action) | Conflating these two is a real bug class — dedupe on `Webhook-Id` for delivery-level idempotency, use `Event-Id` if you need to correlate related notifications |
| GitHub | Yes | `X-GitHub-Delivery` (header, GUID) | Per delivery — since GitHub doesn't auto-retry, this ID's main use is dedup against a human-triggered manual redelivery, not automatic-retry dedup |
| Slack | Yes | `event_id` (body field) | "Globally unique across all workspaces" |
| Twilio | Not confirmed from accessible docs | — | Likely relies on resource SIDs (MessageSid/CallSid) but no documented dedup guidance found this session |
| HubSpot | Not verifiable this session (auth-gated docs) | — | — |

**Every vendor that publishes clear retry semantics also publishes a clear dedup ID; the two vendors
with unclear retry docs (Twilio, HubSpot) are also the two with unclear dedup guidance.** That
correlation is itself a useful teaching point: retry-schedule transparency and dedup-key transparency
travel together in vendor doc quality.

## 5. Manual replay — confirmed as a real, designed-for feature

**GitHub, Stripe, and (implicitly) Hookdeck/Svix-fronted setups all treat manual replay as a named,
supported action, not a workaround** — this validates the framing that a support engineer or
developer *will* eventually press it:

- GitHub: "Redeliver" button in the UI, plus REST API endpoints per webhook type, scoped to the past
  **3 days**.
- Stripe: Dashboard resend (≤15 days) and CLI `stripe events resend <event_id> --webhook-endpoint=<id>`
  (≤30 days) — and Stripe explicitly warns manual resend **does not suppress** the automatic retry
  track, so both can independently deliver the same event.
- Hookdeck's own guide (`hookdeck.com/webhooks/guides/taking-control-of-your-webhook-reliability`,
  fetched 2026-07-27) names "Event Replay" as one of its "five pillars," explicitly distinct from
  automatic retries — corroborating this is a recognized category, not a Hookdeck invention, though
  Hookdeck obviously has a commercial interest in making replay sound like it needs their product.

**Design implication for handler code, confirmed across vendors**: idempotency-key storage must
outlive not just the automatic retry window but the *manual* replay window too — which is often
longer (GitHub 3 days, Stripe 15–30 days) than the automatic retry budget (GitHub: 0, Stripe: 3
days). Hookdeck's idempotency guide states this exact rule generically: "Set your idempotency TTL to
exceed the retry window. If your provider retries for 48 hours, your deduplication cache must persist
at least that long" — but per the vendor table above, the number to size against is the **longer of**
the automatic retry budget and the manual replay window, which the Hookdeck framing understates.

## 6. Webhook gateways/infrastructure — Svix, Hookdeck, Convoy

**Named interest: all three sell managed webhook infrastructure (sending and/or receiving), so their
"hard parts" framing is also their sales pitch.** That said, the specific engineering claims are
concrete and independently checkable, not vague FUD — assessed as genuine teaching wrapped in a
sales frame, not the reverse.

- **Svix** (`svix.com/blog`, fetched 2026-07-27), sender-side infrastructure vendor:
  - "Webhooks Are Harder Than They Seem" names five pillars: reliability/retries, security
    (signing, SSRF, flooding), scalability (their own numeric example: 100 req/s × 4 events each →
    11,000–22,000 events/s during a retry cascade against slow consumers), quality-of-service
    (noisy-neighbor isolation), observability. Concrete reliability claim: "1 missed webhook in
    10,000 may sound like good odds for a human, but in practice it means the receiving service
    can't rely on the webhooks" — a framing for *senders*, useful context for why consumer-side
    dedup/reconciliation exists even when the sender is diligent.
  - "Why You Can't Guarantee Webhook Ordering" gives the actual mechanism, independent of any single
    vendor: even if a sender transmits strictly in order, (a) a single failed delivery blocking the
    whole per-consumer queue is operationally unacceptable, so senders don't do it, and (b) receiver-
    side handlers complete at different speeds regardless of send order, so **"processed in order" is
    not achievable even with perfect network delivery** unless the *receiver* serializes processing
    per resource — which the guide notes costs throughput ("one webhook per second" if you fully
    serialize). Their prescribed fix: carry a sequence number or `updated_at` timestamp in the
    payload and let the consumer's own state resolve ordering, not the transport.
- **Hookdeck** (`hookdeck.com/webhooks/guides`, fetched 2026-07-27), receiver-side infra vendor:
  five-pillar reliability guide (retries-with-backoff, event replay, dead-letter queues, idempotent
  processing, observability) and a dedicated idempotency guide with concrete storage guidance
  (Redis/Memcached as "the most common choice," Postgres/MySQL for "transactional workloads,
  financial operations" needing durability, in-memory only where "occasional duplicate processing is
  acceptable") plus a genuinely load-bearing race-condition rule: **"Mark events as processed before
  executing side effects. If you send an email first and mark as processed second, a crash between
  those two steps means the retry will send the email again."** That ordering-of-operations detail
  (mark-then-act vs. act-then-mark) is a real, non-obvious bug source worth teaching regardless of
  Hookdeck's product interest.
- **Convoy** (`getconvoy.io`): confirmed to have a "Webhook Engineering & Best Practices" blog
  section but individual post titles/URLs weren't extractable from the fetched page structure this
  session — **not independently verified**, cite only the two above with confidence.

## 7. Local development and testing — and the honest untestable residue

- **Tunneling** (ngrok-class) and **vendor CLI forwarding** (`stripe listen`, and GitHub/Slack
  equivalents via smee.io-style relays) are the standard local-dev pattern; Hookdeck's own comparison
  guide (`best-webhook-testing-tools-local-development`) exists specifically to compare ngrok,
  localtunnel, and their own CLI — confirming this is a recognized, actively-compared tool category,
  not a single-vendor claim. (Full comparison content wasn't extractable this session — cite the
  category, not Hookdeck's specific ranking, which is naturally self-favoring.)
- **Fixture/payload replay** (saved real payloads replayed against a local handler) is the fallback
  when a tunnel isn't available or for CI, per the general pattern across vendor docs (Stripe CLI's
  `stripe trigger`, GitHub's manual redelivery-as-fixture-source).
- **What genuinely cannot be tested locally — the honest limit, confirmed by absence in every source
  checked, not by an explicit vendor statement (no vendor doc directly enumerates its own
  untestable-locally list):**
  1. **Real retry timing and backoff.** A tunnel delivers once per triggered event; you cannot
     locally reproduce Shopify's real 8-attempts-over-4-hours or Slack's 1-min/5-min backoff schedule
     without the vendor's live infrastructure actually deciding your endpoint failed — you can only
     simulate it by scripting fake replays yourself, which tests your *handler's* idempotency, not
     the vendor's actual retry behavior.
  2. **The ack-timeout trap itself**, end-to-end. Locally your handler is fast because there's no
     production load; you cannot observe Shopify's 5s hard cutoff or GitHub's 10s cutoff actually
     firing under the concurrency/latency conditions that trigger it in production.
  3. **Manual-replay-race scenarios** (§5) — reproducing a support engineer clicking "Redeliver" 3
     days after a slow async success requires the vendor's real delivery-history UI; there's no local
     equivalent.
  4. **Account-level throttling/disable consequences** — Slack's 5%-success-rate-over-60-minutes
     auto-disable threshold cannot be exercised locally at all without deliberately failing
     production traffic.
  5. **Vendor-side ordering non-determinism at scale** — the ordering hazard Svix describes only
     shows up under real concurrent load with real network variance; a single local tunnel delivers
     one event at a time in the order you triggered them.
  This is the honest bridge to the pack's workflow-testing job: **local testing validates handler
  logic (signature check, parsing, idempotent write) but cannot validate the vendor's operational
  guarantees** — those can only be verified against the vendor's real delivery infrastructure (staging
  account, sandbox mode) or taken on faith from their docs.

## 8. Polling as the alternative and the fallback

Shopify's own docs make the polling case for you, unprompted: their webhook best-practices content
recommends building "a reconciliation job that periodically retrieves data you might have missed
using Shopify APIs" as the standard mitigation for "delivery isn't always guaranteed." This is the
vendor prescribing polling-as-reconciliation directly, which is a stronger citation than an
independent teaching claim would be.

- **When polling is correct rather than webhooks**: (a) when the vendor's webhook delivery guarantee
  is weak or undocumented (Twilio/HubSpot per §1's gap); (b) when the operation must never be missed
  even for a bounded window (financial reconciliation — the bridge to `service-integration.md`'s
  ceded reconciliation-job row); (c) as the *safety net underneath* webhooks even when webhooks are
  the primary path, per Shopify's own recommendation — not an either/or.
- **Cursor/watermark design**: incremental polling needs a durable "last seen" position — typically
  an `updated_at` watermark (per Shopify's own suggested pattern: filter subsequent queries by
  `updated_at >= last_run_watermark`) or an opaque cursor token where the API provides one. The
  watermark must be persisted *after* successful processing of a batch, not before, mirroring the
  same mark-after-not-before-side-effect rule Hookdeck's idempotency guide states for webhook
  handlers (§6) — the two are the same bug pattern in two different transports.
- **The hazard, confirmed and important: incremental polling cannot see deletes.** A query filtered
  by `updated_at` (or any cursor scoped to *changed* records) structurally cannot surface a record
  that was *removed* — a delete doesn't bump `updated_at` on a still-existing row, it removes the row
  from the result set entirely, which is indistinguishable from "unchanged, not returned because
  outside the current page." Detecting deletes requires either a vendor-provided deletion feed/event
  type (webhooks are actually *better* at this — a `something.deleted` webhook fires as an event
  regardless of query filters) or a periodic **full** reconciliation pass (diff the complete current
  ID set against your local copy) rather than an incremental one. This is the strongest argument for
  the hybrid pattern: **webhooks for deletes and low-latency change notification, incremental polling
  for catching up on missed updates, and periodic full-set reconciliation as the ground-truth backstop
  for both** — which is exactly the three-tier structure the reconciliation job (owned by W2/backend's
  cession) should teach.

## Summary of what belongs elsewhere

- Idempotency-key mechanics for *inbound* dedupe and the general at-least-once framing: already
  `service-integration.md:69-72` — not re-taught here, only the vendor-specific numbers that make it
  concrete (which vendor gives which ID, which window).
- Saga/compensation for services *you* own: `async-and-messaging.md:105-125` — not touched.
- Silent-stop / dead-man's-switch detection for a stalled sync job: `operate`'s existing coverage —
  cited, not re-taught (per stage1-gate §5.8).
- The reconciliation-job mechanism itself (the periodic full-diff job, its cursor design, its cost):
  this is squarely `w2-reconciliation`'s territory — this file supplies the *trigger conditions*
  (retry budget exhausted, incremental-poll blind to deletes) that justify why reconciliation must
  exist, not the job's internal design.
