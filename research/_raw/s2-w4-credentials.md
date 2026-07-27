# S2-W4 — Multi-vendor credential fleet (raw research)

Date of research: 2026-07-27. WebSearch budget for the session was exhausted partway through (shared
across the team); remaining claims are WebFetch-verified against primary sources where marked, or
flagged as trained-knowledge/inference where not. No signups, OAuth flows, or forms were touched;
read-only.

## 1. Verdict on "is this genuinely unwritten"

**Confirmed absent from our family** (consistent with Stage-1's grep result: `auth.md` is entirely
about your app's own identity). **Also thin in the wild as a unified discipline** — but for a
different reason than reconciliation or approval: the individual *mechanisms* (OAuth refresh
lifecycle, secret-manager rotation) are extremely well documented by vendors, each for their own
product. What's missing is the **fleet-management frame**: nobody treats "I hold 15 independently
expiring, independently scoped, independently revocable credentials across vendors I don't control"
as one discipline. Google documents its own token's rules exhaustively; AWS documents Secrets
Manager rotation exhaustively; nobody documents the union. This matches the family's synthesis-wedge
diagnosis in `stage1-gate.md` §4 — same shape, different literatures (vendor docs instead of
academic/canon).

## 2. The unified-auth / unified-API layer — verdict with licences

**Nango** — verified directly, not from a summary:
- Root `LICENSE` file (fetched raw from `github.com/NangoHQ/nango/blob/master/LICENSE`, 2026-07-27):
  **Elastic License 2.0 (ELv2)**. Key clause, quoted: *"You may not provide the software to third
  parties as a hosted or managed service, where the service provides users with access to any
  substantial set of the features or functionality of the software."* Also bars circumventing
  license-key gating and requires keeping notices intact.
- GitHub API check (`gh api repos/NangoHQ/nango`, 2026-07-27): **not archived**, `pushed_at`
  2026-07-27 (pushed the same day as this research — actively maintained), 11,269 stars, GitHub's
  own SPDX detector reports `license: NOASSERTION` — expected, since ELv2 is not an OSI-approved
  license and GitHub's classifier doesn't map it to a standard SPDX id. No dual-licensing or
  additional grant found in what was fetched.
- **Verdict for our reader:** ELv2 is source-available, not open source in the OSI sense. The one
  restriction (can't resell it as a competing hosted service) is irrelevant to someone self-hosting
  Nango to run their own automations — so "free to self-host, code you own in your repo" is an
  accurate practical claim, but calling it flatly "open source" in a pack would be imprecise. State
  it as: source-available under Elastic License 2.0, self-hostable without restriction for internal
  use, restricted only if you'd resell it as a hosted service.
- **What it actually solves:** a managed OAuth broker + credential proxy + typed sync/action runtime
  across 700–900+ APIs (category and API counts vary by blog post fetched — 700+ in one Nango blog,
  900+ in another dated the same year; treat the exact count as marketing-inflatable and don't cite
  a specific number as stable).
- **What using it costs you:** your vendor credentials now live in Nango's credential store (self-
  hosted or Nango Cloud) instead of your own secret manager — i.e., you've traded "N vendor auth
  flows to learn" for "one more system that holds all N credentials and must itself be secured,
  patched, and trusted." Self-hosting avoids the third-party-custody problem but reintroduces the
  self-hosted-secrets-store problem this whole channel is about (§6).

**Merge.dev, Apideck, Paragon** — all closed-source, commercial, unverified beyond public marketing
pages (WebFetch of Merge's pricing page returned no disclosure of *how* credentials are stored, only
feature names like "Authenticated Passthrough" and "Remote Data"; Paragon's pricing page 404'd within
budget). Treat the following as **trained-knowledge, not freshly verified**, and flag it as such in
any pack: these vendors' general model is that they broker and store your end-customers' OAuth
credentials in their own infrastructure and expose a normalized API — the same "your keys live in a
vendor" trade as Nango Cloud, but without the self-host escape hatch, and without published source
to audit. **Name the interest:** Nango, Merge, Apideck, and Paragon are all vendors selling the
category they're describing — none of this section should be cited as neutral.

## 3. THE SILENT-EXPIRY FAILURE — concrete detection mechanism

Verified against **Google's own OAuth docs** (`developers.google.com/identity/protocols/oauth2`,
fetched 2026-07-27) plus two vendor blogs (Nango, Unipile) cross-checked against it. Notable
discrepancy caught: both vendor blogs stated a "50 refresh tokens per client/user" cap; **Google's
own documentation states the cap is 100** — quoted verbatim: *"There is currently a limit of 100
refresh tokens per Google Account per OAuth 2.0 client ID. If the limit is reached, creating a new
refresh token automatically invalidates the oldest refresh token without warning."* Use Google's
number, not the vendor blogs'. This is exactly the kind of volatile, vendor-restated fact the rules
warn about — date-stamp it and prefer the primary source.

**Concrete, Google-confirmed invalidation triggers** (a token can die for any of these, several with
zero notification to the integration):
1. Six consecutive months without a token-refresh call — quoted: *"The refresh token has not been
   used for six months."* **Critically: making API calls with the existing access token does NOT
   reset this clock — only a `grant_type=refresh_token` POST does.** A monthly automation that only
   ever calls the API, never explicitly refreshes, drifts toward silent death even though it "ran
   fine" every month.
2. Password change on the vendor side, for sensitive scopes (Gmail, etc.) — the automation's
   credential dies because a human changed their own password for unrelated reasons.
3. Explicit user revocation (someone clicks "remove this app" in their Google Account).
4. The 100-token cap silently evicting the oldest token when a new one is issued — no warning.
5. Admin policy changes restricting a scope after the fact.
6. Testing-mode 7-day expiry if the OAuth consent screen was never moved to production — a common
   trap for internal-only automations nobody bothered to "publish."

**The detection mechanism (this is the concrete answer the brief asked for):** the same shape as
`operate`'s existing dead-man's-switch pattern (`operate-skill/skills/operate/references/
recoverability.md:136-139`, cite don't re-teach) — a scheduled check-in, not a passive wait for
failure. Concretely for credentials:
- **Don't rely on the automation's own error path.** The X evidence in `stage1-gate.md` §6
  (*"had an oauth token silently expire... didnt notice till stuff just stopped firing for days"*)
  is exactly the failure mode where the workflow goes quiet instead of erroring loudly — there is no
  missing-heartbeat signal if nothing is watching for the *absence* of activity.
  - A vendor blog (`nango.dev`, "Google OAuth invalid_grant," fetched 2026-07-27) states the same
    principle from the credential-refresh side: *"Retry once; if it fails again, mark the account
    're-auth required' and alert the user"* — i.e., treat refresh failure as a state transition to
    surface, not a silent retry-forever.
- **Concrete mechanism to teach:** (a) a synthetic/canary call — a cheap, harmless read-only API
  call per credential on its own schedule (e.g. daily), independent of whether any real workflow
  happened to run that day; (b) alert on that canary's *failure to complete*, using the same missing-
  heartbeat tooling `operate` already recommends (Healthchecks.io, BSD-3-Clause) or an in-house cron
  that pings a dead-man's-switch endpoint; (c) explicitly schedule the token-refresh call itself for
  low-frequency integrations, since Google's own semantics mean "the automation ran" isn't sufficient
  — only an explicit refresh call resets the inactivity clock.
- This reframes credential health as its own monitored resource, decoupled from whether any business
  workflow happened to fire recently — which is precisely the gap the practitioner report describes.

## 4. Rotation/revocation across a fleet — published practice?

**Genuinely thin to unwritten**, consistent with the family's absent-mechanism finding. What exists
is: (a) per-vendor rotation *mechanics* (AWS Secrets Manager, HashiCorp Vault, etc. all document how
to rotate a secret they hold); (b) generic "rotate your secrets regularly" security-hygiene advice.
What does **not** appear to exist, at the quality bar this project needs (not found within the
budget spent; flag as an origination opportunity rather than assert its non-existence with full
confidence): a published rotation-calendar-per-vendor practice, a credential-inventory template
mapping "which automation holds which credential at what scope," or a vendor-offboarding revocation
runbook aimed at a small team rather than an enterprise IAM function. This is a strong candidate for
the pack to **originate** rather than cite — same posture `operate`'s research took on the "hit by a
bus" solo-ops succession gap (`operate-skill/research/github-corpus.md:296`).

## 5. The shared-account / bus-factor hazard

**Trained-knowledge synthesis** (not freshly WebFetch-verified this session; the two targeted
searches for it were blocked by the exhausted WebSearch budget). The shape is well-established and
low-risk to state without a fresh citation:
- **User-delegated OAuth tokens run *as a person*.** When an automation authenticates as someone's
  real account (common on small-business SaaS with no service-account concept — many CRMs, most
  social/marketing platforms, many "prosumer" tools), the token inherits that person's fate: it dies
  on their password change, their 2FA reset, their offboarding, or simply their account being
  suspended for unrelated reasons. The automation has no independent identity to audit, scope, or
  revoke — you can only revoke the person's access, which also breaks their own use of the tool.
  Google's own docs (§3 above) confirm the mechanism precisely: a Gmail-scoped refresh token is
  revoked by *the user's own* password change, not by anything the automation did.
- **Service/app credentials (client-credentials grant, API keys, app-level OAuth) are the correct
  pattern where offered**, because they have their own lifecycle independent of any one human's
  account — this is the standard "OAuth for delegated user consent vs. client-credentials for
  machine-to-machine" distinction (Google's own service-account docs, `developers.google.com/
  identity/protocols/oauth2/service-account`, describe exactly this split for server-to-server use).
- **The hard case, and the one worth naming plainly for a small-business audience:** many small-
  business SaaS vendors (common CRMs, e-commerce platforms, niche marketing tools) simply don't offer
  a service-account or app-level credential option — a real person's OAuth grant is the *only*
  integration path available. The defensible pattern here is: (a) use a role-based/shared mailbox or
  dedicated non-human seat ("integrations@company") rather than an actual employee's personal
  account, so the credential's lifecycle isn't tied to one person's employment or password habits;
  (b) document which vendors force this pattern, since it's a real constraint, not a mistake to fix;
  (c) treat it as a known, accepted risk with an explicit named owner, rather than an invisible one.

## 6. Where credentials actually live — the comparison

- **iPaaS vendor vault (Zapier, Make, n8n Cloud):** the vendor stores and refreshes your OAuth
  tokens/API keys on your behalf. Zapier's own help-center page could not be fetched within budget
  (redirect chain, not chased further) — do not cite specific Zapier storage/encryption claims
  without a fresh fetch. The structural trade-off is not vendor-specific and doesn't need a citation
  to state honestly: convenience (they handle refresh, rotation-on-revocation, and UI for reviewing
  connected apps) traded for custody (your credentials, and thus your blast radius, live inside a
  platform you don't control and often can't self-host to). **The recursion the brief named is
  real and worth stating plainly:** if that vendor itself has an outage, a breach, or silently changes
  its credential-handling posture, you have no deploy target of your own to fail over to — you are
  down to "wait for the vendor" as your only lever.
- **Self-hosted engine secret stores (n8n self-hosted, Nango self-hosted):** you own the vault, but
  now you own operating it — backup, encryption-at-rest, access control, and the patch cadence of one
  more piece of infrastructure. This is the same shape as `operate`'s general "self-hosting moves the
  ceiling, not the floor" framing, applied to secrets specifically.
- **Cloud secret managers (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault):** the most
  mature rotation *tooling*, but they manage the secret's storage and rotation mechanics — they don't
  know or enforce anything about the vendor-side semantics in §3 (a Secrets Manager rotation Lambda
  doesn't know Google's 100-token cap or 6-month inactivity rule; that logic has to be built on top).
- **`.env` files / plaintext config:** the common n=1 default, and the correct baseline concern:
  no rotation tooling, no audit trail, no per-credential scoping, and a live secret sitting in a
  location that gets `git add -A`'d if the operator isn't careful (directly relevant to this user's
  own stated git habits — one more reason a `.gitignore`/secret-scan habit matters here specifically).

## 7. The n=1 minimum defensible practice

Synthesizing §3–§6 into what a solo operator with 10–20 vendor credentials and no IAM team can
actually sustain, in descending order of leverage-per-effort:
1. **One inventory, not a vault first.** A single document/spreadsheet: vendor, credential type
   (OAuth user-delegated vs. service/app credential vs. API key), scope granted, which automation
   uses it, and the account it's tied to (a named human vs. a role mailbox). This is the artifact
   that makes offboarding and rotation possible at all — most of the fleet risk is not having this,
   not lacking fancy tooling.
2. **A canary per credential, not per workflow** (§3) — cheapest mechanism that catches the exact
   failure mode this channel has first-person evidence of.
3. **Prefer role mailboxes / app-level credentials over a named human's OAuth grant wherever the
   vendor allows it** (§5); where it doesn't, write down the exception rather than let it be
   invisible.
4. **Treat `.env`/plaintext as the honest default, not a failure** — but pair it with a secret-scan
   habit and the inventory in (1), rather than pretending a small operator will run Vault.
5. **A short, written offboarding checklist** — revoke by credential, not by "hope it lapses" — is
   the single highest-value artifact this channel could originate, because §4 found nothing
   comparable published at this scale.

## Sources (fetched/verified 2026-07-27 unless noted)

- `github.com/NangoHQ/nango/blob/master/LICENSE` — Elastic License 2.0 text, fetched directly.
- `gh api repos/NangoHQ/nango` — archived/pushed_at/stars/license metadata, fetched directly.
- `developers.google.com/identity/protocols/oauth2` — Google's own refresh-token expiration/limit
  policy, fetched directly, quoted verbatim above.
- `developers.google.com/identity/protocols/oauth2/service-account` — service-account vs. delegated
  OAuth distinction (referenced from search result metadata; general shape, not a direct quote pull).
- Nango Blog, "Google OAuth invalid_grant: Token has been expired or revoked," nango.dev, fetched
  2026-07-27 — vendor source, name-the-interest applies; used only for the retry/re-auth-required
  pattern, cross-checked against Google's own docs for the factual claims.
- Unipile, "Google OAuth Refresh Token: Expiration, 7-Day Limit & Lifetime Explained (2026)," fetched
  2026-07-27 — vendor source (Unipile sells a unified messaging API); its "50-token cap" claim was
  checked against Google's own docs and found **incorrect** (Google states 100); flagged above.
- `merge.dev/pricing` — fetched, thin disclosure; feature names only ("Authenticated Passthrough,"
  "Remote Data"), no credential-storage specifics obtained.
- `paragonhq.com/pricing` — fetch returned 404 within budget; not verified, not cited beyond general
  market knowledge, flagged as such in §2.
- `operate-skill/skills/operate/references/recoverability.md:136-139` — internal family reference,
  the dead-man's-switch mechanism cited (not re-taught) in §3.
- `research/automation/stage1-gate.md` — this project's own Stage-1 gate, for the practitioner
  silent-expiry quote (§6 of that file) and the family-absence finding this channel builds on.
- Zapier help-center credential-storage page — attempted, redirect not chased within budget; **not
  cited**, no Zapier-specific storage claim made above.
