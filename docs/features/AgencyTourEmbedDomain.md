# Agency Tour Embed Domain & Client Portal Share Tab — Full Implementation Plan

Last updated: 31/05/2026

---

## 0. ⚠️ IMPORTANT NOTIFICATION — BREAKING CHANGE AT COMMERCIAL LAUNCH

**Read this before deploying or going live. This is the single thing that will
break the white-label domain feature if missed.**

### Current state (build/test)

- The `tourbots` Vercel project lives in the **personal Hobby scope**
  ("Jack Melluish's projects").
- Env vars set (DONE):
  - `VERCEL_TOKEN` — token `tourbots-domain`, no expiry, scope "Jack Melluish's projects".
  - `VERCEL_PROJECT_ID` = `prj_NQLx4JNBUwII7hI9T9QzNZvbA8Mf`.
- `VERCEL_TEAM_ID` is **deliberately UNSET.** Because the token is bound to the
  personal scope, Vercel resolves the project by ID **without** a `teamId`. Setting
  one now would cause **"project not found" (404)** errors.
- The `vercel-domain-service` MUST treat `VERCEL_TEAM_ID` as **optional**: append
  `&teamId=...` to API calls only when the env var exists; otherwise omit it.

### BREAKING CHANGE — what must happen before commercial launch

Vercel's **Hobby plan is non-commercial only**, and a white-label feature serving
paying agencies is commercial. Before going live:

1. **Upgrade to Pro** and **move the `tourbots` project under a Pro Team scope**
   (Settings → Transfer project). Hobby limits bind at the **scope level**, so a
   personal-scoped project stays Hobby even if a Pro team exists elsewhere.
2. **Once the project lives under a Team, Vercel API calls REQUIRE that team's
   `teamId`.** If it is missing, every domain connect/verify/check call returns
   **404 and the white-label feature silently stops working.**
3. **The only action required:** grab the new Team ID (Team → Settings → General,
   `team_...`) and add it as the `VERCEL_TEAM_ID` env var, then redeploy.
   **No code changes** — the service already reads it optionally.

### Also at scale

Hobby caps **50 custom domains per project**; Pro is effectively unlimited (soft cap
100,000). Resolved by the same Pro upgrade above.

### TL;DR checklist for launch day

- [ ] Upgrade Vercel to Pro.
- [ ] Move `tourbots` project under the Pro Team scope.
- [ ] Add `VERCEL_TEAM_ID` env var (the new `team_...` ID).
- [ ] Redeploy and re-test one domain connect/verify end-to-end.

---

## 1. Objective

Give agencies a full white-label tour embed experience:

1. Agency clients can self-serve the tour embed code from inside their branded
   client portal (new **Share** tab) — today this only exists for the agency
   owner in the main app (`/app/tours` → "Share and Embed").
2. The agency can connect their **own domain** for the tour embed so the copied
   iframe/script `src` uses e.g. `https://tours.theiragency.com/...` instead of
   `tourbots.ai`. If no domain is connected (or not yet verified), the embed code
   falls back to `tourbots.ai`.
3. The agency controls, per client, whether the Share tab is visible (same toggle
   pattern as the existing Tour/Settings/Customisation/Analytics tabs).

This is delivered in two phases:

- **Phase A** — pure app work, no Vercel dependency. Ships the Share tab, the
  per-client toggle, and the "Tour embed domain" field (stored + status UI), with
  embed code still emitting `tourbots.ai`.
- **Phase B** — Vercel Domains API integration. Connect/verify/poll a real custom
  domain, then flip embed host to the verified domain.

---

## 2. Key facts established during investigation (do not re-litigate)

- **Tour embed page is public + SSR**: `app/embed/tour/[venueId]/page.tsx` renders
  standalone with no auth. It works on any host attached to the Vercel project.
- **Chat works on a custom domain with NO allowlist change.** The public chatbot
  route `app/api/public/tour-chatbot/[venueId]/route.ts` authorises third-party
  origins via a **signed HMAC embed token** (`PUBLIC_CHATBOT_EMBED_TOKEN_SECRET`),
  generated server-side in the embed page (`createPublicEmbedToken`) and validated
  in `verifyEmbedToken`. The token encodes `{ venueId, embedId, exp }` only — it is
  NOT origin-bound. So a custom-domain embed from the same app gets a valid token
  and chat works. `isAllowedPublicChatOriginHost` is only a fast-path bypass for
  `tourbots.ai`/localhost; everything else uses the token path.
- **Embed host is derived from `window.location.host`** with a `https://tourbots.ai`
  server-side fallback (`lib/embed-generator.ts`, `generateTourEmbed`). There is
  currently **no custom-domain concept anywhere** in the codebase.
- **Portal modules** are stored as JSONB `enabled_modules` on `agency_portal_shares`.
  The shell type is `ModuleName = 'tour' | 'settings' | 'customisation' | 'analytics'`
  (`app/embed/agency/[shareSlug]/agency-portal-shell.tsx`). The two server pages that
  feed the shell are:
  - `app/embed/agency/[shareSlug]/page.tsx` (per-share preview entry)
  - `app/embed/agency-portal/page.tsx` (universal login entry)
- **Domain trust helper**: `lib/agency-portal-auth.ts` → `isAllowedDomain()` already
  special-cases `tourbots.ai`/`www.tourbots.ai`/`localhost`. Cookies are already
  `SameSite=None; Secure; Partitioned` (CHIPS), which is what cross-domain embedding
  needs.
- **Hosting = Vercel** (confirmed via cron routes + Sentry config).

### Vercel Domains API (confirmed current, v2026)

- Add domain: `POST https://api.vercel.com/v10/projects/{idOrName}/domains?teamId={teamId}`
  body `{ "name": "tours.theiragency.com" }`. Returns `verified` (ownership) and a
  `verification[]` array (TXT challenge) when ownership proof is required (i.e. the
  domain is already attached to another Vercel account).
- Config/DNS status: `GET https://api.vercel.com/v6/domains/{domain}/config?teamId={teamId}`
  → read `misconfigured` (true until DNS points at Vercel). This is what tells us the
  domain is actually serving + cert issued.
- Verify ownership: `POST https://api.vercel.com/v9/projects/{idOrName}/domains/{domain}/verify?teamId={teamId}`.
- Remove: `DELETE https://api.vercel.com/v9/projects/{idOrName}/domains/{domain}?teamId={teamId}`.
- DNS records the agency must set (effectively static):
  - **Subdomain (recommended):** `CNAME` → `cname.vercel-dns.com`
  - Apex: `A` → `76.76.21.21`
- Official SDK exists (`@vercel/sdk`) but raw `fetch` is fine and avoids a dependency.

### Operational prerequisites (one-time, by the platform owner)

Add environment variables (then redeploy):

- `VERCEL_TOKEN` — create in Vercel → Account Settings → Tokens, scoped to the
  account/team that owns the `tourbots` project. **Status: DONE** (token
  `tourbots-domain`, no expiry, scope "Jack Melluish's projects").
- `VERCEL_PROJECT_ID` — from the `tourbots` project → Settings → General.
  Value: `prj_NQLx4JNBUwII7hI9T9QzNZvbA8Mf`. **Status: DONE.**
- `VERCEL_TEAM_ID` — **optional; intentionally NOT set right now.** Required only
  after the Pro/Team migration. **See Section 0 (breaking change) for full detail.**

No per-agency manual Vercel work is ever required. The only future manual item is the
one-time Pro/Team migration described in **Section 0**, which also resolves the
domain-cap headroom.

---

## 3. Data model changes

### 3.1 New migration: `sql/67_agency_tour_embed_domain.sql`

```sql
-- 67_agency_tour_embed_domain.sql
-- White-label tour embed domain for agencies.

alter table if exists public.agency_portal_settings
  add column if not exists tour_embed_domain text;

alter table if exists public.agency_portal_settings
  add column if not exists tour_embed_domain_status text not null default 'unconfigured';

alter table if exists public.agency_portal_settings
  add column if not exists tour_embed_domain_verified_at timestamptz;

-- Cache of DNS records / verification challenge returned by Vercel so the UI can
-- display them without re-calling the API on every page load.
alter table if exists public.agency_portal_settings
  add column if not exists tour_embed_dns_records jsonb;

alter table if exists public.agency_portal_settings
  add constraint chk_agency_portal_settings_tour_embed_domain_status
    check (tour_embed_domain_status in
      ('unconfigured','pending','verifying','verified','failed'));

-- Hostname sanity (lowercase host, no scheme/path/port). Allow null.
alter table if exists public.agency_portal_settings
  add constraint chk_agency_portal_settings_tour_embed_domain_format
    check (
      tour_embed_domain is null
      or tour_embed_domain ~ '^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$'
    );
```

Status meanings:
- `unconfigured` — no domain set (default). Embed falls back to `tourbots.ai`.
- `pending` — domain saved, awaiting DNS records being added by agency.
- `verifying` — connect succeeded on Vercel, DNS not yet propagated (`misconfigured = true`).
- `verified` — Vercel reports `misconfigured = false` and ownership verified; embed uses this host.
- `failed` — connect/verify error (surface message to agency).

### 3.2 Share module key (no schema change)

The `share` tab lives in the existing `enabled_modules` JSONB on
`agency_portal_shares`. Default it to `true` when absent (read as
`enabled_modules?.share !== false`).

---

## 4. PHASE A — App-only (no Vercel)

### 4.1 Embed generation — `lib/embed-generator.ts`

- Add optional `baseUrlOverride?: string` to `TourEmbedOptions`.
- In `generateTourEmbed`, compute base URL as:
  `options.baseUrlOverride?.trim() || (window-host) || 'https://tourbots.ai'`.
- Normalise override to `https://{host}` (strip scheme/path if a bare host is passed).
- No behaviour change when override is absent — existing callers unaffected.

### 4.2 Agency settings API — `app/api/app/agency-portal/settings/route.ts`

- GET: add `tour_embed_domain`, `tour_embed_domain_status`,
  `tour_embed_domain_verified_at`, `tour_embed_dns_records` to the select + response.
- PUT (`updateSettingsSchema`): accept `tour_embed_domain` as optional
  `string | null`. Normalise via `normaliseDomain()` (already in
  `lib/agency-portal-auth.ts`). Validation rules:
  - Reject `tourbots.ai` / `*.tourbots.ai` / `localhost`.
  - Reject anything that isn't a valid hostname.
  - **Recommend subdomain**: warn (not block) if the value is an apex domain
    (no subdomain label). Phase A just stores it.
- When `tour_embed_domain` changes in Phase A, set status to `pending` and clear
  `verified_at`. (Phase B replaces this with the Vercel connect flow.)

### 4.3 Portal server pages — inject `share` module + domain

Both pages currently build a `modules` object and select agency settings.

`app/embed/agency/[shareSlug]/page.tsx`:
- Add `tour_embed_domain, tour_embed_domain_status` to the `agency_portal_settings`
  select.
- Add `share: share.enabled_modules?.share !== false` to `modules`.
- Pass two new props to `<AgencyPortalShell>`:
  - `tourEmbedDomain={settings?.tour_embed_domain || null}`
  - `tourEmbedDomainStatus={settings?.tour_embed_domain_status || 'unconfigured'}`

`app/embed/agency-portal/page.tsx` (universal entry): make the **same** edits so the
real login flow also gets the Share tab + domain. (Confirm this file's settings
select + modules block and mirror exactly.)

### 4.4 Portal shell — `app/embed/agency/[shareSlug]/agency-portal-shell.tsx`

- Extend `type ModuleName = 'tour' | 'settings' | 'customisation' | 'analytics' | 'share'`.
- Add props `tourEmbedDomain?: string | null` and
  `tourEmbedDomainStatus?: string | null` to `AgencyPortalShellProps`.
- Add `share` to the `visibleModules` meta array (label "Share", icon e.g. `Code`
  or `Share2` from lucide). Place it last.
- Add a `TabsContent value="share"` that renders a new **PortalTourShare** component
  (see 4.5), passing `venueId`, `tourId` (resolvedTourId), and the effective embed
  base URL:
  - Phase A: always `undefined` (→ `tourbots.ai`).
  - Phase B: `tourEmbedDomainStatus === 'verified' ? https://{tourEmbedDomain} : undefined`.
- Gate visibility on `modules.share` like the other tabs.

### 4.5 New component — `components/app/agency-portal/portal-tour-share.tsx`

A portal-flavoured, self-contained version of the existing `tour-share.tsx`
(`components/app/tours/tour-share.tsx`). Differences:

- Does NOT use `useUser()`/`useAuthHeaders()` (client portal users are not app users).
- Receives `venueId`, `tourId`, and optional `baseUrlOverride` as props.
- Fetches embed codes from a new public portal endpoint (4.6) OR generates them
  client-side with `generateTourEmbed(venueId, { tourId, baseUrlOverride, ...opts })`
  — generation is pure/string-based and safe to do client-side, so prefer that and
  avoid a round trip. (The embed page itself mints the HMAC token at load; the share
  UI does not need the secret.)
- Reuses the same UI: width/height inputs, "Show chat widget" toggle, Simple IFrame
  Embed + Advanced Script Embed text areas, Copy buttons, Preview button.
- Preview URL points at the effective base host so the agency/client can verify the
  branded domain once Phase B is live.
- Style to match existing portal cards (slate, rounded-xl) — reuse `tour-share.tsx`
  markup as the baseline.

### 4.6 (Optional) Public portal embed endpoint — `app/api/public/agency-portal/embed/route.ts`

Only needed if we decide embed codes must be generated server-side (e.g. to inject a
server-known base URL the client shouldn't compute). Given generation is pure
strings, Phase A can skip this and generate client-side. If added later:
- `requireAgencyPortalSession(request, { requiredModule: 'share', requireCsrf: false })`.
- Return `{ venueId, tourId, baseUrl }` so the client builds codes, OR return the
  fully-built `{ iframe, script }`.

### 4.7 Auth: add `share` to module gating — `lib/agency-portal-auth.ts`

- Extend `requiredModule` union to include `'share'`.
- Extend `AgencyPortalSessionContext.enabledModules` type with `share?: boolean`.
- No enforcement change beyond the union (the Share tab is read-only embed code).

### 4.8 Client-settings modal — `components/app/settings/agency-settings.tsx`

In the per-client "Portal tabs" toggle group (around lines 733–746, 1753):
- Add a **Share** toggle alongside Tour / Settings / Customisation / Analytics.
- Wire into the `enabled_modules` payload: `share: shareEnabled` (default true).
- Read existing value: `existingShare?.enabled_modules?.share ?? true`.
- Persist via the existing share save action (`app/api/app/agency-portal/shares/route.ts`).
  Confirm that route passes `enabled_modules` through verbatim; add `share` to any
  explicit allowlist/whitelist of module keys if present.

### 4.9 Agency "Domain settings" card — `components/app/settings/agency-settings.tsx`

- **Rename** the "General settings" card → **"Domain settings"**. Keep the
  `SlidersHorizontal` icon (or switch to `Globe`).
- Keep **Allowed domains** at the top of the card (unchanged behaviour).
- Add a new sub-section **"Tour embed domain"** below Allowed domains:
  - Title row with an **info icon** (`Info` / `?` with a tooltip):
    > "Set a custom domain so the embed code your clients copy uses your domain
    > instead of tourbots.ai. Leave blank to use the default tourbots.ai embed.
    > Use a subdomain like tours.youragency.com."
  - Text input for the hostname (placeholder `tours.youragency.com`).
  - **Status badge**: `Unconfigured` / `Pending` / `Verifying` / `Verified` / `Failed`
    (colour-coded; verified = green, failed = red, pending/verifying = amber).
  - **Save** persists the domain (Phase A) via the existing settings PUT
    (`persistSettings` helper already exists in this file).
  - Phase B adds **Connect**, **Check status**, **Disconnect** buttons + a DNS records
    table (see 5.4).
- Helper text under the field clarifying the blank → tourbots.ai fallback.

### 4.10 Phase A acceptance

- Client portal shows a **Share** tab when enabled; it displays working
  `tourbots.ai` embed code scoped to the client's tour.
- Per-client Share toggle hides/shows the tab.
- Agency can save a "Tour embed domain"; it persists and shows status `Pending`.
- Embed code still uses `tourbots.ai` (domain not yet wired to Vercel).
- No regressions to existing tabs, allowed domains, or the main-app tour share page.

---

## 5. PHASE B — Vercel custom domain integration

### 5.1 Env vars (one-time)

`VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` (see §2). Add to Vercel project
env + local `.env` for testing. Redeploy.

### 5.2 New service — `lib/services/vercel-domain-service.ts`

Functions (raw `fetch`, all scoped with `?teamId=`):

- `addProjectDomain(host)` → `POST /v10/projects/{projectId}/domains` body `{ name: host }`.
  Returns `{ verified, verification }`.
- `getDomainConfig(host)` → `GET /v6/domains/{host}/config`. Returns `{ misconfigured }`.
- `verifyProjectDomain(host)` → `POST /v9/projects/{projectId}/domains/{host}/verify`.
- `removeProjectDomain(host)` → `DELETE /v9/projects/{projectId}/domains/{host}`.
- `getRequiredDnsRecords(host)` → static helper: subdomain ⇒ CNAME `cname.vercel-dns.com`,
  apex ⇒ A `76.76.21.21`. Plus any TXT challenge from `verification[]`.

Resolve overall status:
- ownership not verified (`verified=false`) ⇒ surface TXT challenge, status `verifying`.
- `verified=true` but `misconfigured=true` ⇒ DNS not propagated, status `verifying`.
- `verified=true` and `misconfigured=false` ⇒ status `verified`, set `verified_at`.
- API error ⇒ status `failed` + message.

Guard: if env vars are missing, service returns a clear "not configured" result so
Phase A behaviour (store-only) still works.

### 5.3 Domain API route — `app/api/app/agency-portal/domain/route.ts`

(Or extend the settings route with discriminated actions; a dedicated route is
cleaner.) All require the app session + agency entitlement (mirror `settings/route.ts`).

- `POST { action: 'connect', domain }`:
  - Validate hostname (reject tourbots.ai/apex-without-subdomain optionally).
  - `addProjectDomain(host)`; store `tour_embed_domain`, cache
    `tour_embed_dns_records` (CNAME/TXT), set status `pending`/`verifying`.
- `POST { action: 'check' }`:
  - `getDomainConfig` + (if needed) `verifyProjectDomain`; update status + `verified_at`.
- `POST { action: 'disconnect' }`:
  - `removeProjectDomain(host)`; null the domain, status `unconfigured`.
- GET: return current domain, status, cached DNS records, `verified_at`.

### 5.4 Domain settings UI (Phase B additions) — `agency-settings.tsx`

- Add **Connect** (calls `connect`), **Check status** (calls `check`), **Disconnect**.
- When status is `pending`/`verifying`, render a **DNS records table** from
  `tour_embed_dns_records`:
  | Type | Name | Value |
  | CNAME | tours | cname.vercel-dns.com |
  | (TXT)| _vercel | {challenge} (only if ownership proof required) |
- Copy buttons per record value. Clear "What to do" helper text.
- Auto-poll `check` every ~10s while the card is open and status is `verifying`
  (stop after verified/failed or on unmount). Manual "Check status" always available.

### 5.5 Flip embed host to verified domain

- Portal shell passes `baseUrlOverride = https://{tour_embed_domain}` to
  `PortalTourShare` **only when** `tour_embed_domain_status === 'verified'`.
- `generateTourEmbed` already supports the override (Phase A 4.1).
- Result: client copies embed code with their domain; iframe loads from
  `https://tours.theiragency.com/embed/tour/...`; Vercel serves the app + cert; the
  embed page mints the HMAC token; chat works (no allowlist change — see §2).

### 5.6 Trusted-domain handling

- In `lib/agency-portal-auth.ts`, where appropriate, treat a venue's **verified**
  `tour_embed_domain` as a trusted host (the portal itself may also be embedded from
  that domain in future). For the tour embed + chat specifically, **no change is
  required** because chat uses the signed token, not the allowlist. Add the verified
  host to `allowed_domains`-style checks only for portal access paths if/when the
  portal is served from the custom domain.
- The public chatbot route (`isAllowedPublicChatOriginHost`) needs **no change**:
  custom-domain requests are third-party and pass via the embed token.

### 5.7 Phase B acceptance

- Agency connects a subdomain, sets one CNAME, clicks Check, sees `Verified`.
- Embed code in the portal Share tab switches to the agency domain automatically.
- Embedding that code on a third-party site loads the tour + chat over HTTPS on the
  agency domain.
- Disconnect reverts to `tourbots.ai` cleanly.
- Existing agencies without a domain are unaffected.

---

## 6. Security & edge cases

- **Never trust client headers** for domain checks — keep using browser-managed
  `Origin`/`Referer` only (existing `getRequestDomainCandidates` pattern).
- **Reject self-referential domains** (`tourbots.ai`, `*.tourbots.ai`, `localhost`).
- **Hostname normalisation** before storage and before any Vercel call.
- **Entitlement gate**: domain connect/verify must require an active Agency plan
  (`venueHasAgencyPortal`), same as other agency settings endpoints.
- **Vercel rate limits**: back off on `rate_limit_exceeded`; cap auto-poll frequency.
- **`domain_already_in_use`**: surface the TXT challenge + clear instructions.
- **Apex domains**: steer to subdomain in UI; if apex used, show A-record instructions.
- **DNS/cert latency**: handled by the status flow; never block the save.

## 7. Testing plan

Phase A:
- Migration applies cleanly; defaults correct.
- Share tab appears/hides per `enabled_modules.share`.
- Embed code in portal matches the main-app tour share output (host = tourbots.ai).
- Save "Tour embed domain" persists + shows Pending; invalid hosts rejected.
- No regression: existing tabs, allowed domains, main-app `/app/tours` share.

Phase B (needs env vars + a real test subdomain):
- Connect → DNS records shown → set CNAME → Check → Verified.
- Embed host flips to custom domain; iframe + chat work on a third-party test page.
- Negative: invalid URL, non-existent DNS, domain on another Vercel account (TXT),
  disconnect reverts.
- Confirm Vercel plan domain cap headroom for pilot.

## 8. Rollout

1. Ship Phase A (Share tab + toggle + domain field store/status). Live immediately.
2. Add Vercel env vars; deploy Phase B behind the same UI (Connect appears once env
   present). Pilot with one agency subdomain.
3. Expand after pilot sign-off.

## 9. File-by-file checklist

Phase A:
- [x] `sql/67_agency_tour_embed_domain.sql` (new) — POSIX-safe regex fix
- [x] `lib/embed-generator.ts` (baseUrlOverride on `generateTourEmbed`)
- [x] `app/api/app/agency-portal/settings/route.ts` (GET via `*` + PUT `tour_embed_domain`)
- [x] `app/embed/agency/[shareSlug]/page.tsx` (settings select + `share` module + props)
- [x] `app/embed/agency-portal/page.tsx` (+ `agency-portal-entry.tsx`) mirrored
- [x] `app/embed/agency/[shareSlug]/agency-portal-shell.tsx` (ModuleName, props, tab, visibleModules)
- [x] `components/app/agency-portal/portal-tour-share.tsx` (new)
- [x] `lib/agency-portal-auth.ts` (`share` in module union + context type)
- [x] `components/app/settings/agency-settings.tsx` (Share toggle + Domain settings card + field + status)
- [x] `app/api/app/agency-portal/shares/route.ts` (added `share` to schema + persisted object)
- [x] `app/embed/agency/preview/page.tsx` (`share` param)

Phase B:
- [x] env vars `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` set; `VERCEL_TEAM_ID` optional (Section 0)
- [x] `lib/services/vercel-domain-service.ts` (new)
- [x] `app/api/app/agency-portal/domain/route.ts` (new: connect/check/disconnect/GET)
- [x] `agency-settings.tsx` (Connect/Check/Disconnect + DNS records table + auto-poll)
- [x] Shell: passes verified `baseUrlOverride` to `PortalTourShare`
- [x] `lib/agency-portal-auth.ts` — reviewed; no change needed (chat uses signed token)

### ✅ Phase B review + final regression (done)

- All new + changed files lint clean (consolidated check): service, domain route,
  agency-settings, shell, portal-tour-share, embed-generator, settings route.
- Domain route discriminated union narrows `domain` correctly on `connect`; the
  `failed`-connect path persists + returns the Vercel message.
- `check` clears `verified_at` unless status resolves to `verified`.
- Auto-poll hook is unconditional (no rules-of-hooks violation; eslint clean).
- **Deploy checklist:** (1) run `sql/67` in Supabase; (2) confirm `VERCEL_TOKEN` +
  `VERCEL_PROJECT_ID` in the deployed env (already set per Section 0); (3) deploy;
  (4) at commercial launch follow Section 0 to add `VERCEL_TEAM_ID` after the Pro/
  Team migration. End-to-end domain verify needs a real subdomain + DNS, so final
  Phase B acceptance (§5.7) is validated post-deploy with one pilot domain.

### ✅ Follow-up — `tours.` prefix steering in the Domain settings UI (done)

- The Tour embed domain field now shows a locked **`tours.`** prefix chip; the input
  holds only the remainder (`youragency.com`). Effective host = `tours.` + input
  (with a guard against double-prefixing if a full `tours.*` host is pasted).
- The chip has an **X**; clicking it opens a confirmation dialog
  ("Remove the tours. prefix?") explaining that a `tours.` subdomain is the
  recommended single-CNAME setup, and that removing it allows a custom/apex host
  which may need extra DNS, can clash with the existing site, and is harder to verify.
- Confirming switches to a free-form input (prefilled with the full host so nothing
  is lost); a small "Use the recommended tours. prefix" link restores it.
- On load, a stored host is split: `tours.*` → prefixed mode; anything else →
  free-form mode (`hydrateTourEmbedDomain`).
- Lint clean.

## 10. Open decisions (confirm before Phase B)

- **One domain per agency** (recommended; a single Vercel domain serves all the
  agency's tours) vs per-client domains. Plan assumes per-agency.
- **Subdomain-only** enforcement in the UI (recommended) vs allow apex.
- Current **Vercel plan** + its custom-domain cap.

---

## 11. Implementation log (what has actually been built)

Worked through step-by-step. Each entry records the plan step, files touched, and
any deviation from the plan.

### ✅ Step 3.1 — SQL migration `sql/67_agency_tour_embed_domain.sql` (done)

- Created the migration adding to `agency_portal_settings`: `tour_embed_domain`,
  `tour_embed_domain_status` (default `unconfigured`), `tour_embed_domain_verified_at`,
  `tour_embed_dns_records` (jsonb).
- Added the status `CHECK` constraint
  (`unconfigured|pending|verifying|verified|failed`).
- **Deviation from plan (important):** the hostname regex in the plan used
  lookaround (`(?!-)`, `(?<!-)`), which **Postgres POSIX regex does not support** and
  would have failed at migration time. Replaced with a POSIX-safe equivalent:
  `^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$`
  (lowercase, ≥2 dot-separated labels, each label alphanumeric-bounded with optional
  internal hyphens, null allowed).
- **Convention match:** followed the existing `65`/`66` migration style — used
  `drop constraint if exists` before each `add constraint` so the migration is
  idempotent on re-run.
- Status: needs to be run in Supabase (manual, like prior migrations).

### ✅ Step 4.1 — `lib/embed-generator.ts` baseUrlOverride (done)

- Added `baseUrlOverride?: string` to `TourEmbedOptions` (doc-commented as a bare
  host or full URL, normalised to `https://{host}`).
- Added a local pure helper `normaliseEmbedBaseUrl()` that strips scheme + path,
  lowercases, and returns `https://{host}` (or null when empty/invalid).
- `generateTourEmbed` now resolves base URL as
  `override || window-host || https://tourbots.ai`. The white-label host is applied
  to **both** the iframe `src` and the advanced-script loader (`/embed/tour.js`), so
  the script embed is fully white-label too.
- **Deviation/decision:** destructured `baseUrlOverride` out of the snippet's
  serialised `options` (`JSON.stringify(embedOptions)`) so the internal override
  field is not leaked into the copied script; also returns `options: embedOptions`.
- **Why no shared helper:** did NOT reuse `normaliseDomain` from
  `lib/agency-portal-auth.ts` because that module is server-only (imports
  `next/server` + service-role Supabase) and `embed-generator.ts` is used in client
  components. Kept the helper local + pure.
- No behaviour change when override absent — existing callers (`tour-share.tsx`)
  unaffected. Lint clean.

### ✅ Step 4.2 — agency settings API (`app/api/app/agency-portal/settings/route.ts`) (done)

- **GET needed no change:** the handler already selects `*`, so the four new
  columns (`tour_embed_domain`, `tour_embed_domain_status`,
  `tour_embed_domain_verified_at`, `tour_embed_dns_records`) flow through the
  `settings` response automatically.
- **PUT:** added `tour_embed_domain: z.string().trim().max(255).nullable().optional()`
  to `updateSettingsSchema`.
- Added dedicated handling in PUT (only when the key is present, so saving other
  cards never clobbers a connected domain):
  - null/empty ⇒ clear domain, status `unconfigured`, clear `verified_at` +
    `dns_records`.
  - otherwise ⇒ `normaliseDomain()` (imported from `lib/agency-portal-auth.ts`),
    reject `tourbots.ai`/`*.tourbots.ai`/`www.tourbots.ai`/`localhost` (400),
    reject invalid hostname via `TOUR_EMBED_DOMAIN_REGEX` (mirrors the SQL POSIX
    regex) or length > 253 (400), then store host with status `pending` and clear
    `verified_at`.
- **Decision:** did not block apex domains (plan says warn-not-block in Phase A);
  the regex permits 2+ labels. Apex steering will be UI-side later.
- **Import note:** safe to import `normaliseDomain` here (server API route);
  `agency-portal-auth.ts` is server-only.
- Lint clean.

### ✅ Step 4.7 — `lib/agency-portal-auth.ts` share module gating (done)

- Added `share?: boolean` to `AgencyPortalSessionContext.enabledModules`.
- Extended the `requireAgencyPortalSession` `requiredModule` union with `'share'`.
- No enforcement logic change — the existing
  `enabledModules?.[requiredModule] === false` gate now covers `share` for free.
  Default-on behaviour (`!== false`) is honoured at the read sites (server pages).
- Lint clean.

### ✅ Step 4.5 — new component `components/app/agency-portal/portal-tour-share.tsx` (done)

- Built a self-contained portal version of `tour-share.tsx`.
- **Key decisions / deviations:**
  - No `useUser`/`useAuthHeaders` (portal users aren't app users); takes `venueId`,
    `tourId`, optional `baseUrlOverride` as props.
  - **No `useToast`** — confirmed the embed layout (`app/embed/layout.tsx`) mounts no
    `Toaster`, so a toast would silently no-op. Used a local `copied` state that
    flips the Copy button to a `Check` + "Copied" for 2s instead.
  - Embed codes generated **client-side** via `generateTourEmbed` inside a `useMemo`
    (pure string build; HMAC token is minted by the embed page at load — no secret
    needed here). Avoids a network round-trip, so the optional public endpoint
    (plan 4.6) is **skipped** as the plan allows.
  - Preview URL uses `baseUrlOverride` host when present, else a relative
    `/embed/tour/...` (works on whatever host serves the portal).
  - "Copy Script" label per the user's earlier preference; iframe button stays
    "Copy Code".
- Styling matches portal cards (`rounded-xl border-slate-200 bg-white shadow-sm`).
  Lint clean.

### ✅ Step 4.4 — portal shell wiring (`agency-portal-shell.tsx`) (done)

- Extended `type ModuleName` with `'share'`; imported `Share2` icon + `PortalTourShare`.
- Added props `tourEmbedDomain?: string | null`, `tourEmbedDomainStatus?: string | null`
  (defaulted null in destructuring).
- Added `{ value: 'share', label: 'Share', icon: Share2 }` **last** in the
  `visibleModules` meta; added `'share'` to the fallback module list so tab
  auto-selection still works if other modules are hidden.
- Added a `TabsContent value="share"` rendering `<PortalTourShare>` with
  `venueId` (prop or app user fallback, same pattern as Tour tab), `resolvedTourId`,
  and the computed `shareBaseUrlOverride`.
- **Phase B-ready now:** `shareBaseUrlOverride` is `https://{tourEmbedDomain}` only
  when `tourEmbedDomainStatus === 'verified'`, else `undefined`. In Phase A nothing
  is ever verified, so it stays `undefined` → tourbots.ai, exactly as the plan's
  Phase A requires; step 5.5 is therefore already satisfied by this wiring.
- Lint clean.

### ✅ Step 4.3 — portal server pages inject `share` module + domain (done)

Both shell entry points updated:

- **`app/embed/agency/[shareSlug]/page.tsx`** (per-share preview): added
  `tour_embed_domain, tour_embed_domain_status` to the settings select; added
  `share: share.enabled_modules?.share !== false` to `modules`; passed
  `tourEmbedDomain` + `tourEmbedDomainStatus` (default `'unconfigured'`) to the shell.
- **`app/embed/agency-portal/page.tsx`** (universal login entry): this page renders
  `AgencyPortalEntry` (client) rather than the shell directly, so:
  - Page: added the two columns to the settings select + passed them as props to
    `AgencyPortalEntry`.
  - **`agency-portal-entry.tsx`**: added `share?: boolean` to `EnabledModules`,
    added `tourEmbedDomain`/`tourEmbedDomainStatus` props, added
    `share: modules.share !== false` to the modules passed to the shell, and
    forwarded the two domain props.
- **Verified:** the login + session routes return `enabledModules`/`enabled_modules`
  **verbatim** (no key allowlist), so the new `share` key flows through to the
  universal entry automatically. Default-on (`!== false`) honoured everywhere.
- Lint clean across all three files.

### ✅ Step 4.8 — per-client Share toggle (`agency-settings.tsx` + shares API) (done)

- `components/app/settings/agency-settings.tsx`:
  - Added `share?: boolean` to `ShareRow.enabled_modules`.
  - Added `share: true` to `defaultModules` (placed last → renders last in grid).
  - `openShareModal` now seeds `share: existingShare?.enabled_modules?.share ?? true`.
  - The "Portal tabs" toggle group auto-renders from `Object.entries(enabledModules)`,
    so the **Share** toggle appears automatically (capitalised label). No JSX change
    needed there.
  - Added `share` to the live preview URL builder params + its `useMemo` deps.
- `app/embed/agency/preview/page.tsx`: added `share?` to `searchParams` type and
  `share: toBool(searchParams.share, true)` to the preview `modules`.
- **Critical fix (plan called this out):** the shares API
  (`app/api/app/agency-portal/shares/route.ts`) does **not** pass `enabled_modules`
  verbatim — it rebuilds the object from an explicit key allowlist. Added
  `share: z.boolean().optional()` to `enabledModulesSchema` **and**
  `share: payload.enabledModules?.share ?? true` to the rebuilt object, otherwise the
  toggle would have been silently dropped on save.
- Lint clean across all files.

### ✅ Step 4.9 — agency "Domain settings" card (`agency-settings.tsx`) (done)

- Card already existed as "General settings" (collapsible, with Allowed domains).
  Renamed title → **"Domain settings"**; updated description to mention both
  allowed domains and the custom tour embed domain. Kept the `SlidersHorizontal`
  icon (existing convention in this file).
- Extended the `AgencyPortalSettings` interface with `tour_embed_domain`,
  `tour_embed_domain_status`, `tour_embed_domain_verified_at`,
  `tour_embed_dns_records`.
- Added `tourEmbedDomainInput` state; seeded it from the settings GET in
  `fetchData`.
- Added a status-badge meta map (`unconfigured`/`pending`/`verifying`/`verified`/
  `failed`) with colour-coding (verified=emerald, failed=red, pending/verifying=amber,
  unconfigured=slate) incl. dark variants.
- Added the **Tour embed domain** sub-section below Allowed domains (separated by a
  top border): label + `Info` tooltip (exact wording from the plan), status badge,
  text input (placeholder `tours.youragency.com`), helper text on the
  blank→tourbots.ai fallback.
- **Save wiring (key decision):** `persistSettings` is shared by the Domain card,
  Usage card, and (separately) `saveSettings` for branding. To avoid the branding/
  usage saves resetting the domain status, gave `persistSettings` an optional
  `extra` param; **only `saveDomains` passes `{ tour_embed_domain }`**. The settings
  API only touches the domain when the key is present, so branding/usage saves leave
  it untouched. Updated the Domain card toast to "Domain settings updated".
- The card's existing **Save** button (`saveDomains`) now persists allowed domains
  **and** the tour embed domain together (Phase A store + status `pending`). Connect/
  Check/Disconnect buttons + DNS table come in Phase B (5.4).
- Lint clean.

### ✅ Phase A review + regression check (done)

- All 11 touched files lint clean (consolidated check).
- **Default-on verified end to end:** existing shares have no `share` key, so
  `!== false` resolves to `true` at every read site (per-share page, universal entry,
  shell `visibleModules`), and the shares API now persists the key. Existing clients
  get the Share tab by default, as intended.
- **Preview parity:** the agency-settings live preview link and the
  `/embed/agency/preview` page both pass/read the `share` module param.
- **No domain clobbering:** branding (`saveSettings`) and usage (`saveUsageLimits`)
  saves do not send `tour_embed_domain`; only the Domain card does. Confirmed the
  settings API only mutates the domain when the key is present.
- ⚠️ **DEPLOY ORDER (must do):** run `sql/67_agency_tour_embed_domain.sql` in
  Supabase **before** deploying the Phase A code. `saveDomains` always includes
  `tour_embed_domain`, so saving the Domain card before the columns exist would
  error. Reads are safe pre-migration (GET `select('*')` → missing cols undefined →
  status defaults to `unconfigured`). Same manual-migration workflow as `66`.
- Full typecheck (`tsc --noEmit`) was offered but skipped by the user; relied on the
  editor TS/lint diagnostics per-file instead.

---

## Phase B implementation log

### ✅ Step 5.2 — `lib/services/vercel-domain-service.ts` (done)

- New service wrapping the Vercel Domains API with raw `fetch` (no SDK dep), styled
  after `agency-allocation-service.ts` (typed results, try/catch, console.error).
- Env: reads `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, and **optional** `VERCEL_TEAM_ID`.
  `teamQuery()` appends `?teamId=...` **only when set** — directly honouring
  Section 0's warning (setting it while personal-scoped causes 404s).
- `isVercelConfigured()` guard; every function returns a `not_configured` soft
  result when env is missing so Phase A store-only still works.
- Functions: `addProjectDomain` (`POST /v10/projects/{id}/domains`),
  `getDomainConfig` (`GET /v6/domains/{host}/config` → `misconfigured`),
  `verifyProjectDomain` (`POST /v9/.../verify`),
  `removeProjectDomain` (`DELETE /v9/...`, treats 404 as success for idempotent
  disconnect).
- Helpers: `getRequiredDnsRecords(host)` (subdomain ⇒ CNAME `cname.vercel-dns.com`
  with the correct record `name` = labels minus registrable domain; apex ⇒ A
  `76.76.21.21`) and `buildDnsRecords(host, verification)` merging the static record
  with any TXT ownership challenge from `verification[]` for storage/display.
- All control-plane calls use `cache: 'no-store'`. Status resolution is left to the
  API route (5.3), per plan. Lint clean.

### ✅ Step 5.3 — `app/api/app/agency-portal/domain/route.ts` (done)

- New dedicated route (cleaner than overloading settings, per plan).
- Auth: `requireEntitledVenue()` wraps `authenticateAndGetVenue` + a
  `venueHasAgencyPortal` entitlement gate (403 if not on the Agency plan) — stronger
  than the settings PUT, as the plan's security section requires.
- `POST` uses a Zod **discriminated union** on `action`:
  - `connect { domain }`: validates host (same rules as settings route), calls
    `addProjectDomain`; on failure persists `failed` + returns the Vercel message; on
    success builds DNS records (static + TXT challenge), resolves status
    (`verified` only when `add.verified && !misconfigured`, else `verifying`),
    persists, returns state.
  - `check`: re-runs `verifyProjectDomain` + `getDomainConfig`, resolves status per
    the plan's matrix (ownership-unverified ⇒ verifying + refreshed TXT; verified but
    misconfigured ⇒ verifying; both ok ⇒ verified + `verified_at`; API error ⇒
    failed). Always clears `verified_at` unless status is `verified`.
  - `disconnect`: `removeProjectDomain` (idempotent) then nulls the domain → status
    `unconfigured`.
- `GET`: returns `{ configured, domain, status, verifiedAt, dnsRecords }`.
- If `isVercelConfigured()` is false, `POST` returns 503 (custom domains unavailable)
  rather than half-storing — Phase A's settings PUT remains the store-only path.
- Lint clean.

### ✅ Step 5.4 — Domain settings UI Phase B (`agency-settings.tsx`) (done)

- **Reverted the Phase A save coupling:** `saveDomains` (the card's top "Save")
  no longer sends `tour_embed_domain` — it now only persists Allowed domains. The
  tour embed domain is managed entirely by the domain route, so the settings PUT can
  never clobber the Vercel-managed status.
- The UI reads domain status + DNS records straight from `settings` (the settings
  GET selects `*`, so `tour_embed_dns_records` is already present) — no extra GET.
- Added state (`isConnectingDomain`/`isCheckingDomain`/`isDisconnectingDomain`/
  `copiedDnsKey`) and handlers `connectDomain`/`checkDomain(silent)`/`disconnectDomain`
  + `applyDomainState` (merges the route response into `settings` + input) +
  `copyDnsValue`.
- UI: input + **Connect** (when unconfigured/failed) or **Disconnect** (when
  connected); a **DNS records table** (Type/Name/Value + per-row copy) shown while
  `pending`/`verifying` with a **Check status** button; a green "Verified" line when
  done. Input is locked while connected.
- **Auto-poll:** a `useEffect` polls `checkDomain(true)` every 10s while the card is
  open **and** status is `verifying`; clears on verified/failed/close/unmount.
- Added the `Check` lucide icon to imports. Lint clean.

### ✅ Step 5.5 — flip embed host to verified domain (done — already wired in 4.4)

- The portal shell's `shareBaseUrlOverride` is `https://{tour_embed_domain}` only
  when `tour_embed_domain_status === 'verified'`, passed to `PortalTourShare`. Both
  server pages already feed `tourEmbedDomain` + `tourEmbedDomainStatus` from settings.
- Net effect: once the agency verifies, the client's Share tab embed/script/preview
  switch to the agency domain automatically; disconnect reverts to tourbots.ai. No
  additional change needed here beyond confirming the wiring.

### ✅ Step 5.6 — trusted-domain handling (reviewed — no code change needed)

- **Chat:** unchanged. The public chatbot route authorises custom-domain embeds via
  the signed HMAC embed token, not the origin allowlist (see §2), so a verified
  custom domain works with no `isAllowedPublicChatOriginHost` change.
- **Tour embed page:** `/embed/tour/[venueId]` is public SSR with no portal auth, so
  serving it from the custom domain needs no allowlist entry.
- **Portal access paths:** the portal is still embedded on the agency's
  `allowed_domains` (their own site), not the tour embed subdomain, so
  `isAllowedDomain` needs no change. If a future feature serves the *portal* itself
  from the custom domain, add the verified host to the portal-access checks then —
  out of scope now. Matches the plan's §5.6 conclusion.
