# Credentials and Connections

Purpose: Manage the fleet of externally-issued secrets your automations depend on — OAuth grants,
API keys, service-account credentials, across every vendor you don't control — and catch a
credential dying before a workflow goes silently quiet because of it.

Read when:
- An automation authenticates to more than one external vendor and you need a single view of what
  can expire, be revoked, or be evicted, and when.
- A workflow "just stopped" and nobody changed anything on your side — the likely cause is a
  credential, not the workflow logic.
- You are deciding where credentials should live: your own secret store, the engine's built-in vault,
  or a third-party auth broker.
- You are onboarding a new vendor connection, offboarding a person who held one, or building a
  rotation cadence.

Skip when:
- You are designing your own app's identity system — one auth provider, one token family, users
  logging into something you built → `backend`'s `auth.md`. This reference is about *holding* N
  vendors' credentials, not *issuing* your own.
- The concern is a model's own permissions or tool-call guardrails → `ai`.
- You need the missing-heartbeat mechanism itself, not the credential that feeds it →
  [workflow-observability](workflow-observability.md).

Inputs:
- The list of vendor connections in use, and for each: credential type (user-delegated OAuth,
  service/app credential, API key), the account or identity it's bound to, and its scope.
- Whether a credential inventory already exists (most solo/small-team setups: it does not).

Produces:
- A populated [credential register](../assets/credential-register.md).
- A per-credential monitoring and refresh cadence.
- A written offboarding/revocation path for each credential, not "hope it lapses."

## Contents

- [1. The frame: fleet management, not identity design](#1-the-frame-fleet-management-not-identity-design)
- [2. The silent-expiry failure, and why "it ran fine" is not evidence](#2-the-silent-expiry-failure-and-why-it-ran-fine-is-not-evidence)
- [3. Credential health as its own monitored resource (I7)](#3-credential-health-as-its-own-monitored-resource-i7)
- [4. The scheduled pre-expiry refresh — the one mitigation that actually works](#4-the-scheduled-pre-expiry-refresh--the-one-mitigation-that-actually-works)
- [5. The shared-account / bus-factor hazard](#5-the-shared-account--bus-factor-hazard)
- [6. Unified-auth layers: what they solve and what they cost](#6-unified-auth-layers-what-they-solve-and-what-they-cost)
- [7. Where credentials actually live — and the recursion](#7-where-credentials-actually-live--and-the-recursion)
- [8. What this pack originates](#8-what-this-pack-originates)
- [Validation](#validation)
- [Failure modes and handoff](#failure-modes-and-handoff)

## 1. The frame: fleet management, not identity design

Every vendor documents its own credential's rules exhaustively — Google documents Google's token
lifecycle, AWS documents Secrets Manager's rotation mechanics, Stripe documents its own key model.
Nobody documents the union. The moment you hold ten or twenty of these at once, across vendors that
don't coordinate with each other, you have a fleet-management problem that no single vendor's docs
can answer, because each one is only ever describing its own fleet of one.

Hohpe's Conversation Patterns already name several of the single-vendor mechanics this job touches —
**Lease** (time-bounded resource holding), and **Acquire Token First / Rotate Tokens / User Grants
Access** as the vocabulary for a single credential's lifecycle (enterpriseintegrationpatterns.com,
*Conversation Patterns*; CC BY 4.0 applies to the pattern name and bolded problem/solution statement
on each pattern's own page, not the catalogue index — cite the individual pattern page, not the
index, if you quote one directly). Use that vocabulary for the single-vendor mechanism. **The fleet
framing — N of these, independently expiring, independently scoped, independently revocable, with no
shared clock — is what nobody has written down, and it is this reference's job.**

## 2. The silent-expiry failure, and why "it ran fine" is not evidence

Google's own OAuth documentation (`developers.google.com/identity/protocols/oauth2`, verified
2026-07-27, re-verify — OAuth behaviours change) names concrete ways a refresh token dies, several
with zero notification to the integration that holds it:

- **Six consecutive months of inactivity invalidates the token** — verbatim, *"The refresh token has
  not been used for six months."* The counterintuitive part, and the one worth stating plainly
  because it inverts the obvious assumption: **ordinary API calls do not reset this clock. Only an
  explicit `grant_type=refresh_token` POST does.** A monthly automation that only ever calls the API
  — and never explicitly refreshes — is drifting toward silent death on a clock nothing in its own
  logs shows moving. "It ran fine every month" is not evidence the credential is healthy.
- **A hard cap of 100 refresh tokens per Google Account per OAuth client ID** — verbatim, *"If the
  limit is reached, creating a new refresh token automatically invalidates the oldest refresh token
  without warning."* Two vendor blogs (Nango, Unipile) state the cap as 50; both are wrong. Use
  Google's own number — 100 — and date-stamp it (I15). This is exactly the volatile-fact trap the
  family warns about: a vendor-restated number that drifted from the primary source.
- **A password change on the vendor side revokes tokens carrying sensitive scopes** — the credential
  dies because a human changed their own password for reasons that have nothing to do with the
  automation.
- **Testing-mode consent screens carry a short-lived grant** if the OAuth app was never moved to
  production — a common trap for an internal-only automation nobody thought needed "publishing."
- **Explicit revocation** (someone clicks "remove this app" in their account) and **admin policy
  changes restricting a scope after the fact** both kill a token with no action on your side at all.

None of these leave a trace in *your* system until the next call fails — and by then the workflow has
already gone quiet for however long nobody was watching.

## 3. Credential health as its own monitored resource (I7)

**I7 — Credential health is its own monitored resource, checked on its own schedule, independent of
whether any workflow happened to run.** The failure mode in §2 is not "the workflow broke" — it's
"nothing fired, so nothing broke loudly." A credential's health cannot be inferred from a workflow's
absence of errors, because an idle credential never gets the chance to error.

The concrete mechanism: a synthetic, harmless read-only call per credential, on its own schedule (for
example, daily), run whether or not any real workflow triggered that day. Alert on the canary's
*failure to complete* — the same missing-heartbeat shape [workflow-observability](workflow-observability.md)
teaches for workflows generally (cite `operate`'s dead-man's-switch treatment there, do not re-teach
it here). For low-frequency integrations specifically, schedule the *refresh call itself* on a
cadence shorter than Google's six-month window — since, per §2, only an explicit refresh resets that
clock, "the automation ran" is not sufficient on its own.

## 4. The scheduled pre-expiry refresh — the one mitigation that actually works

The strongest concrete answer this research surfaced, from a source with no commercial interest and
no product to sell: force a token refresh on a cadence shorter than its TTL, before the token would
otherwise expire — rather than waiting to notice it's dead. One operator's engineered version of this
(a personal multi-agent setup, not a vendor pitch): a scheduled job runs every few hours, forces the
stored expiry timestamp into the past so the refresh flow triggers even though the token isn't
naturally due yet, extracts the new token, and **fans it out to every dependent process** that shares
the credential. If any step of that fails, it alerts explicitly rather than retrying silently.

Generalize the shape, not the specific tool: **(a)** refresh on a schedule shorter than the vendor's
stated TTL or inactivity window, not on-demand-only; **(b)** if more than one automation or process
shares the credential, fan the refreshed value out to all of them — a stale copy anywhere in the
fleet reintroduces the failure; **(c)** alert on the refresh call's own failure path, since that
failure *is* the signal, not noise to retry through. This is the practical form of I7: it moves
credential health from "notice when it's already dead" to "verify it's alive on a schedule you
control."

## 5. The shared-account / bus-factor hazard

**User-delegated OAuth tokens run *as a person*.** When an automation authenticates as someone's real
account — common on small-business SaaS with no service-account concept, many CRMs, most
social/marketing platforms, many "prosumer" tools — the token inherits that person's fate: it dies on
their password change, their 2FA reset, their offboarding, or their account being suspended for
reasons that have nothing to do with the automation. There is no independent identity to audit, scope,
or revoke on its own — you can only revoke the person's access, which also breaks their own use of the
tool. §2's Google findings confirm the mechanism precisely: a sensitive-scope refresh token is
revoked by *the user's own* password change, not by anything the automation did.

**Service or app-level credentials — client-credentials grants, API keys, app-level OAuth — are the
correct pattern wherever a vendor offers one**, precisely because their lifecycle is independent of
any one human's account. Where a vendor genuinely doesn't offer that option (a real constraint at
small-business SaaS, not a mistake to fix), the defensible pattern is: use a role-based or shared seat
("integrations@company") rather than a named employee's personal account, so the credential's
lifecycle isn't tied to one person's employment or password habits — write down which vendors force
this, and treat it as a named, accepted risk rather than an invisible one.

## 6. Unified-auth layers: what they solve and what they cost

A managed OAuth broker (Nango being the clearest self-hostable example) centralizes the credential
proxy, the refresh mechanics, and a typed sync/action layer across hundreds of APIs — genuinely useful
leverage against the fragmentation in §1. What it costs is real and worth stating plainly rather than
glossing: **your vendor credentials now live in the broker's store instead of your own**, so you've
traded "N vendor auth flows to learn" for "one more system holding all N credentials that must itself
be secured, patched, and trusted" — see §7's recursion.

**Nango is Elastic License 2.0** (verified directly from the repo's root `LICENSE` file, and via
`gh api` against the repo's metadata, 2026-07-27, re-verify) — **source-available, not open source in
the OSI sense.** GitHub's own SPDX detector reports `NOASSERTION`. The repo is not archived and is
actively pushed. The licence's one substantive restriction — you may not resell it as a competing
hosted service — is irrelevant to self-hosting it for your own internal automations, so "free to
self-host, code you own" is an accurate practical claim, but calling it flatly "open source" would be
imprecise; state it as source-available under ELv2, self-hostable without restriction for internal
use. Do not cite a specific count of Nango's supported APIs — the vendor's own posts disagree with
each other. Closed-source unified-auth vendors (Merge, Apideck, Paragon) offer the same custody trade
without the self-host escape hatch and without published source to audit — **name the interest**:
every vendor in this category is selling the category it describes.

## 7. Where credentials actually live — and the recursion

| Where | Trade |
|---|---|
| **Hosted iPaaS vault** (Zapier, Make, n8n Cloud) | The vendor stores and refreshes tokens for you — convenience, at the cost of custody: your blast radius now lives inside a platform you don't control and often can't self-host out of. |
| **Self-hosted engine or broker vault** (n8n self-hosted, Nango self-hosted) | You own the vault, and now you own operating it — backup, encryption at rest, access control, patch cadence of one more piece of infrastructure. |
| **Cloud secret managers** (AWS Secrets Manager, GCP Secret Manager, Vault) | The most mature rotation *tooling* available — but they manage storage and rotation mechanics, not vendor-side semantics. A rotation Lambda doesn't know Google's 100-token cap or six-month rule; that logic has to sit on top. |
| **`.env` files / plaintext config** | The honest n=1 default — no rotation tooling, no audit trail, no per-credential scoping, and a live secret sitting somewhere that a careless `git add -A` will happily commit. |

**The recursion worth stating plainly, because no vendor's marketing surfaces it:** if you route your
credentials and your business logic through a Tier-1 iPaaS you do not control the infrastructure of,
that platform is itself a vendor dependency you cannot deploy to, patch, or fail over from. If *it*
has an outage, a breach, or silently changes its credential-handling posture, "wait for the vendor" is
your only lever — for the very layer coordinating every other vendor relationship your business has.

## 8. What this pack originates

Rotation calendars and a credential inventory are **originated here**, not lifted from a citation —
say so plainly rather than dressing it up. Per-vendor rotation *mechanics* are well documented (AWS,
Vault, and similar all document how to rotate a secret they hold); a rotation-calendar-per-vendor
practice, a credential-inventory template mapping which automation holds which credential at what
scope, and a small-team offboarding-revocation runbook are not published anywhere at this quality bar
for a solo operator with no IAM function. Build them here: the [credential
register](../assets/credential-register.md) is the starting artifact, and a short written offboarding
checklist — revoke by credential, not by hope it lapses — is the highest-value thing a small team can
add on top of it.

## Validation

- Every vendor connection in use has a row in the [credential register](../assets/credential-register.md):
  credential type, scope, the account or identity it's bound to, and its known expiry/invalidation
  triggers.
- Every credential has a health check on its own schedule (§3), independent of whether any workflow
  using it ran recently.
- Every credential bound to a named human, rather than a role or service identity, is written down as
  a deliberate exception, with an owner — not left invisible.
- Every volatile vendor number cited (token caps, inactivity windows, licence terms) carries a
  verification date and a re-verify pointer (I15).

## Failure modes and handoff

- **A workflow goes quiet with no error.** Do not assume the workflow logic — check the credential
  register and the canary for that credential first (§3). If no canary exists, that absence is itself
  the finding.
- **A credential is shared across more than one automation or process.** Confirm the fan-out step in
  §4 actually reaches every dependent, not just the one that happened to be tested.
- **A named person holding a credential is leaving, or has changed roles.** Route to the offboarding
  checklist (§5, §8) before their access is revoked elsewhere — a credential revoked as a side effect
  of an HR action, with no warning to the automations depending on it, is exactly the silent failure
  this reference exists to prevent.
- **The missing-heartbeat mechanism itself, once a credential's canary is defined** →
  [workflow-observability](workflow-observability.md).
- **Where credentials are stored raises a broader deploy/secrets-at-rest question for your own
  infrastructure**, not the vendor-side fleet → `operate`.
