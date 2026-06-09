# MPskin Integration — Full Plan of Action

> Status: **POC VALIDATED on a live MPskin PRO account (09/06/2026)** — navigation proven end-to-end (see Section 16). Ready to build, starting Phase 1. Author: TourBots engineering. Last updated: 09/06/2026.
> This document is the single source of truth for adding TourBots AI chatbot support to MPskin-hosted ("Level 2") Matterport tours.


---

## 1. Purpose & background

TourBots overlays an AI chatbot on a Matterport tour. The chatbot answers questions (from venue info + uploaded documents) and can physically drive the tour — moving the camera to a saved area or switching models — by calling the Matterport SDK.

Today this only works on tours **TourBots renders itself**: we own the `<iframe>`, connect the Matterport SDK, and overlay the chat (see Section 3).

Some agencies (the trigger here is **Apollo 3D**, contact Mark) deliver two product tiers:
- **Level 1** — plain Matterport tours. TourBots already works on these perfectly.
- **Level 2** — the same Matterport models wrapped in **MPskin**, a third-party overlay/CMS that adds branded menus, multilingual content, tags, sweep actions, etc. These are hosted by MPskin (on `my.mpskin.com` or a white-label domain such as `infinity.apollo3d.co.uk/tour/…`).

Mark wants the TourBots chatbot on his Level 2 (MPskin) tours. He pasted our existing embed code into MPskin and got a **tour-inside-a-tour** (our full tour iframe rendered inside his MPskin tour) — because the only embed we ship is the full-tour iframe (Section 3).

**Goal / definition of done:** an operator can register an MPskin/externally-hosted tour in TourBots, capture its navigation points, and paste a single snippet into MPskin's HTML editor that overlays only our chatbot. The chatbot must move/switch the MPskin tour and record analytics, **without breaking any of MPskin's own menus or buttons**.

## 2. Glossary

- **Level 1 tour** — plain Matterport tour, rendered by TourBots.
- **Level 2 tour** — Matterport model wrapped by MPskin, hosted by MPskin.
- **MPskin** — third-party Matterport "skin"/overlay CMS (Matterport Platform Partner). Adds menus, branding, tags, sweep actions; built on the Matterport SDK Bundle.
- **extend-HTML** — MPskin's PRO-plan HTML/JS/CSS editor for injecting custom code into a skin. Can load external scripts and access the Matterport SDK.
- **Model SID / model ID** — the Matterport model identifier (the `m=` value in `my.matterport.com/show/?m=…`). Stored as `tours.matterport_tour_id`.
- **Sweep** — a single 360° scan position in a Matterport model.
- **sweep_id** — stable identifier for a sweep. **Intrinsic to the model**, identical no matter who renders it (Matterport, TourBots, or MPskin). This is the key fact that makes the integration possible.
- **mpSdk** — a connected Matterport SDK instance (`Sweep.moveTo`, `Camera.pose`, etc.).
- **Tour point** — an operator-saved named position (`name`, `sweep_id`, `position`, `rotation`) the AI navigates to. Table `tour_points`.

## 3. How TourBots works today (relevant parts)

- **SDK wrapper** — `components/matterport/matterport-sdk-wrapper.tsx` renders the Matterport `<iframe>` (`my.matterport.com/show/?m={modelId}&…&sdk=1`), loads `static.matterport.com/showcase-sdk/2.0.1-…/sdk.js`, connects via `window.MP_SDK.connect(iframe, sdkKey, '2.0')`, subscribes to `Camera.pose` + `Sweep.current`, and **listens for the `matterport_navigate` window event** to call `mpSdk.Sweep.moveTo(sweep_id, { rotation, transition: INSTANT })`.
- **Chat widget** — `components/app/tours/tour-chat-widget.tsx`. Streams from the chatbot route (SSE). On navigation events it dispatches **window CustomEvents**: `matterport_navigate` and `switch_matterport_model`. It is coupled to the app via `useUser` (reactfire/Firebase) and `useTourChatbotConfig` — important for bundling (Section 11).
- **Chatbot brain** — `app/api/public/tour-chatbot/[venueId]/route.ts`. Resolves config + `tour_points`, builds the prompt, exposes OpenAI tools `navigate_to_area` / `switch_tour_model` / `open_url`, and streams typed SSE events (`content`, `navigate_to_area`, `switch_tour_model`, `trigger_action`, `done`, `error`).
- **Tour embed (only deployed embed)** — page `app/embed/tour/[venueId]/page.tsx` + client `tour-embed-client.tsx`, loader `public/embed/tour.js`. Always renders the **whole tour + chat**. White-label custom domains are handled by `NestedTourShell` (nests the canonical tourbots embed) because the Matterport SDK key and chat origin checks are bound to the tourbots host.
- **Half-built chatbot-only embed** — `lib/embed-generator.ts` (`generateChatbotEmbed`/`generateTourChatbotEmbed`) and the share UI `components/app/chatbots/tour/chatbot-share.tsx` already emit "simple/advanced" snippets that load **`/embed/chat.js`** — but `public/embed/chat.js` and `scripts/build-widget-bundle.js` (referenced by `npm run build:widget`) **do not exist**. So that path is dead today. Option B = finishing it.
- **Embed token** — `app/embed/tour/[venueId]/page.tsx` mints an HMAC token (`createPublicEmbedToken`, secret `PUBLIC_CHATBOT_EMBED_TOKEN_SECRET`, 12h). Public routes accept first-party origins (`tourbots.ai`/localhost) OR a valid token (`verifyEmbedToken`).
- **Analytics** — `lib/embed-analytics.ts`: `trackEmbedView` → `embed_stats`; `trackEmbedTourMove` → `embed_tour_moves`. Public routes `app/api/public/embed/track` and `…/track-tour-move`.

## 4. What MPskin is (confirmed facts + sources)

Confirmed from MPskin's own docs and Matterport's partner page:
- MPskin is a **Matterport Platform Partner**; its CMS is **built on the Matterport SDK Bundle** (a self-hosted Showcase). Source: [Matterport case study](https://matterport.com/industries/case-studies/mpskin-partners-matterport-help-hospitality-and-tourism-clients-customize).
- **extend-HTML (PRO plan only)** supports HTML/JS/CSS, **loading external JS/CSS files**, and **"directly access the Matterport SDK Bundle"** — explicitly listing **"an AI assistant"** and **"live chat features"** as intended use cases. Source: [MPskin Extend-HTML](https://www.mpskin.com/en/features/extend-html/).
- MPskin has **Sweep Actions / Deeplinks / named scanpoints / tag navigation** — alternative navigation levers if we ever want to use MPskin's own semantics. Source: [MPskin Sweep Actions](https://www.mpskin.com/en/features/sweep-actions/).
- **Embedding**: an MPskin tour is shared as a hosted URL or a standard `<iframe>`; white-label domains require PRO and a CNAME to `ip.mpskin.com`. Sources: [Whitelabeling](https://www.mpskin.com/en/features/whitelabeling/).
- Matterport SDK navigation primitives we rely on: `Sweep.moveTo(sweepId, { rotation, transition })`, `Camera.pose.subscribe`, `Sweep.current.subscribe`, `Mattertag.navigateToTag`. Source: [Matterport SDK reference](https://matterport.github.io/showcase-sdk/docs/reference/current/interfaces/mp_sdk.html).

## 5. The core technical problem

On a Level 2 tour, **MPskin owns the Matterport iframe and the live `mpSdk` connection**. We therefore **must not** bring our own Matterport iframe (doing so = the tour-inside-a-tour Mark saw). We need to inject **only the chatbot**, and the chatbot must drive navigation through **MPskin's existing SDK connection**, not our own.

Two consequences:
1. Our chatbot's `matterport_navigate` window events have no listener on MPskin's page (our `MatterportSDKWrapper` isn't there). We need a small **bridge** that hands navigation to MPskin's `mpSdk`.
2. A widget injected on MPskin's domain would make **cross-origin** calls to our public APIs. Those APIs currently have **no CORS support** (the existing `tour.js` only works cross-origin via a GET image-pixel fallback; the JSON POST routes have no `Access-Control-Allow-Origin` and no `OPTIONS` handler). This pushes us toward hosting the chat UI in a **tourbots-served iframe** (same-origin to our APIs) rather than mounting raw DOM that calls our APIs directly (Section 6).

## 6. Chosen architecture

**One pasteable loader script that injects a tourbots-hosted chat iframe + a navigation bridge, communicating via `postMessage`.** This is the "Option B" end-state, refined to dodge the CORS problem.

What the operator pastes into MPskin extend-HTML (conceptually one block):
```html
<script src="https://tourbots.ai/embed/chat.js"
        data-venue-id="…" data-tour-id="…" data-embed-id="…" data-mode="mpskin"></script>
```

What `chat.js` does on the host (MPskin) page:
1. Injects a **fixed-position, transparent `<iframe>`** pointing at `https://tourbots.ai/embed/chatbot/{venueId}?tourId=…&embedId=…` (the chat button + window UI). The iframe is small when collapsed (just the bubble) and is resized when the chat opens (the inner page posts its desired size; same `postMessage` pattern as the agency-portal embed's height relay in `lib/embed-generator.ts`).
2. Installs a **navigation bridge**: a `message` listener that receives navigation requests from the chat iframe and calls **MPskin's `mpSdk`** (`Sweep.moveTo`, model switch). It also (optionally) subscribes to MPskin's `Camera.pose` / `Sweep.current` and relays poses **into** the iframe for analytics.

Why this shape:
- **No CORS changes.** All network calls (config, SSE chat, analytics) happen **inside** the tourbots-served iframe → same-origin to our APIs, and the chat origin check sees a first-party `tourbots.ai` referer (no embed token needed). The only cross-window traffic is `postMessage` between iframe and bridge.
- **CSS isolation for free** — the chat UI lives in its own document; MPskin's CSS cannot bleed in and vice-versa.
- **Maximum reuse** — the chat iframe renders the existing `TourChatWidget`; the only behavioural change is "navigate via `postMessage` to parent" instead of "dispatch window CustomEvent" when in `mode=mpskin` (Section 11).
- **MPskin's own UI is untouched** — we add an overlay element + listeners; we never replace their iframe or menus.

Alternatives considered (documented, not chosen as the primary):
- **B-pure-DOM** — `chat.js` mounts the widget straight into MPskin's DOM (Shadow DOM for isolation) and calls `mpSdk` directly. Best-possible UX and no postMessage, **but** every API call is cross-origin → requires adding CORS (`Access-Control-Allow-Origin` + `OPTIONS` preflight) and a token-issuance path to the chat/config/move routes, plus bundling the full React widget standalone (heavier `chat.js`). Keep as a future enhancement if the iframe overlay proves limiting.
- **Plain static iframe (no loader script)** — operator pastes a bare `<iframe>`. Simpler, but can't install the navigation bridge, so the chatbot couldn't move the tour. Not sufficient for Level 2.

> Decision needed (Section 15): whether to also keep the simpler "chatbot-only iframe" snippet (no navigation) for non-MPskin sites, alongside the MPskin loader.

## 7. How navigation will work

Pipeline (Level 2 / MPskin):
1. AI calls `navigate_to_area` / `switch_tour_model` → chatbot route streams the SSE event (unchanged).
2. `TourChatWidget` (running inside the tourbots chat iframe) — in `mode=mpskin` — calls `window.parent.postMessage({ source: 'tourbots', type: 'matterport_navigate', sweep_id, position, rotation, area_name }, '*')` instead of dispatching a window CustomEvent. (Cross-window events can't be CustomEvents; `postMessage` is required.)
3. The **bridge** (installed by `chat.js` on MPskin's top window) receives the message and calls MPskin's SDK:
   ```js
   mpSdk.Sweep.moveTo(sweep_id, { rotation, transition: mpSdk.Sweep.Transition.INSTANT });
   ```
   For model switches it routes through MPskin's own model/deeplink mechanism (exact call depends on Section 13 findings).
4. **Why the sweep IDs are valid:** `sweep_id` is intrinsic to the Matterport model, so points captured against the model in TourBots resolve identically on MPskin's render.

The bridge obtains `mpSdk` as follows (**confirmed by live test, Section 13**): MPskin injects a **same-origin** Matterport **Bundle** iframe (`my.mpskin.com/bundle/…?m={modelSID}`) a few seconds after load. The bridge **polls/observes for that iframe** (identify via `src` containing `/bundle/`), then calls `iframe.contentWindow.MP_SDK.connect(iframe.contentWindow)` to get its own `mpSdk` handle (an intercept-wrap of `contentWindow.MP_SDK.connect` is the fallback). It polls up to ~30s and **fails safe** (chat still answers; only movement disabled) if the iframe/SDK never appears.

Origin safety: the bridge validates `event.data.source === 'tourbots'` and `event.origin === 'https://tourbots.ai'` before acting.

## 8. How analytics will work

All analytics are emitted from **inside** the tourbots chat iframe (same-origin to our APIs), so nothing new is needed for CORS:
- **Views** — the chat iframe page calls `trackEmbedView` via the existing chatbot route (record as `embed_type='chatbot'`, `chatbot_type='tour'`). Parent context (real MPskin page domain/URL) is passed in from `chat.js` (read from `document.referrer`/`location` on the host page and forwarded as iframe query params), mirroring how `NestedTourShell` forwards `domain`/`pageUrl`.
- **Conversations** — already logged server-side by the chatbot route (`conversations` table), unchanged.
- **Moves (heatmap)** — the bridge subscribes to MPskin's `Camera.pose` + `Sweep.current`, then `postMessage`s the pose to the chat iframe, which POSTs to `/api/public/embed/track-tour-move` **same-origin** (validated by the existing `zod` schema). This avoids cross-origin POSTs entirely.
- Internal-embed-id and dashboard-page guards in `lib/embed-analytics.ts` still apply; we must pick an `embed_id` prefix that is NOT in the `isInternalEmbedId` blocklist (`demo-widget-`, `tour-widget-`, `playground-widget-`, `preview-widget-`, `config-`).

## 9. Security, CORS, CSP & auth

- **CORS** — avoided by the iframe approach (all API calls same-origin within the iframe). If we later add B-pure-DOM, we must add `Access-Control-Allow-Origin` + `OPTIONS` handlers to the chat/config/move routes and a per-origin allowlist.
- **Origin / token** — fetches from inside the chat iframe carry `Origin: https://tourbots.ai` → treated as first-party by `isAllowedPublicChatOriginHost`, so **no embed token is required**. (We can still mint one for defence-in-depth, reusing `createPublicEmbedToken`.)
- **CSP** — `next.config.js` already sets `frame-ancestors *` for `/embed/*`, so `/embed/chatbot/{venueId}` can be framed on any MPskin/agency domain. No CSP change needed for the iframe. (For B-pure-DOM we'd need `connect-src`/CORS work instead.)
- **Bridge message validation** — verify `event.origin` + a shared `source` tag; ignore everything else. Never `eval` message content.
- **Plan gating** — extend-HTML is MPskin PRO-only (their side). On our side, embed generation is already Pro-gated in the share tabs (`isFreePlan` checks) — reuse that.
- **`X-Frame-Options`** — only set to `SAMEORIGIN` on non-embed routes; `/embed/*` is intentionally exempt (confirmed in `next.config.js`). Good.

## 10. Database changes (SQL)

Minimal and additive. Existing rows default to today's behaviour (`render_mode='tourbots'`), so nothing breaks.

New migration file: **`sql/68_tours_render_mode_external.sql`** (next number after `67_…`). Follows existing conventions: `alter table … add column if not exists`, `check` constraints added via `do $$ … pg_constraint` guards, no RLS change (the `tours` table has RLS disabled per `3_tours_initial.sql`).

Columns added to `public.tours`:
- `render_mode text not null default 'tourbots'` — `check (render_mode in ('tourbots','external'))`. `'external'` = hosted elsewhere (MPskin etc.); TourBots does not render the Matterport iframe for it.
- `external_provider text` — nullable, e.g. `'mpskin'` (free-text/enum-lite for future providers; informational + analytics).
- `external_tour_url text` — nullable; the operator's hosted tour URL (the MPskin/white-label page), for reference, preview links, and the share tab. Optional hostname-format check like `67_agency_tour_embed_domain.sql` if desired (keep relaxed — it's a full URL not a host).

Notes / no-change items:
- `matterport_tour_id` (model SID) **stays required** — still needed for point capture, navigation and analytics. For external tours the operator supplies it (auto-extracted from a Matterport URL if available, else entered directly).
- `matterport_url` is `not null`. For external tours we still populate it with a canonical `https://my.matterport.com/show/?m={matterport_tour_id}` (used only for the in-dashboard capture render), so the NOT NULL constraint is satisfied without schema change. `external_tour_url` holds the MPskin link separately.
- `tour_points`, `chatbot_configs`, `chatbot_customisations`, `embed_stats`, `embed_tour_moves` — **no changes**. They are keyed on venue/tour and work identically for external tours. `embed_stats.embed_type` already allows `'chatbot'`.
- Per-venue uniqueness of `matterport_tour_id` (`51_…`) is fine; the same model can exist across venues.

Run order: standalone `ALTER`, no dependencies beyond `tours` existing. Apply in Supabase SQL editor like the other numbered files.

## 11. Code changes — file by file

Grouped by concern. "NEW" = create; "EDIT" = modify existing.

### A. The chatbot-only embed (makes the chat iframe exist)
- **NEW `app/embed/chatbot/[venueId]/page.tsx`** — server component, mirrors `app/embed/tour/[venueId]/page.tsx` but renders **only the chat** (no `MatterportSDKWrapper`). Reads `tourId`, `embedId`, `domain`, `pageUrl`, `mode` from query; resolves config; mints/reads embed token like the tour page; passes `forcePublic` + `mode` to the widget. Reuse `app/embed/layout.tsx`.
- **NEW `app/embed/chatbot/[venueId]/chatbot-embed-client.tsx`** — client wrapper that mounts `TourChatWidget` in `mode` (`'mpskin'` | `'standalone'`). In `mpskin` mode it forwards navigation via `postMessage` to `window.parent` and listens for pose relays from the bridge to fire move-tracking.
- **NEW `public/embed/chat.js`** — the pasteable loader. Plain ES5-safe JS (no build step needed if we hand-write it, matching `public/embed/tour.js`). Responsibilities:
  - read `data-*` attributes from its own `<script>` tag;
  - inject the fixed-position chat `<iframe>` → `…/embed/chatbot/{venueId}?tourId&embedId&mode=mpskin&domain&pageUrl`;
  - height/size relay via `postMessage` (copy the resize pattern already used by the agency-portal embed in `lib/embed-generator.ts`);
  - install the **navigation bridge** (acquire `mpSdk`, handle `matterport_navigate`/`switch_matterport_model`, relay poses back). Fail safe if `mpSdk` not found.
  > This finally makes the `/embed/chat.js` reference in `lib/embed-generator.ts` real, and removes the dead `npm run build:widget` assumption (we hand-author instead of bundling, unless we later choose B-pure-DOM).

### B. Widget behaviour (navigate via postMessage when embedded in MPskin)
- **EDIT `components/app/tours/tour-chat-widget.tsx`** — add a `mode?: 'app' | 'standalone' | 'mpskin'` prop (default `'app'`). Where it currently does `window.dispatchEvent(new CustomEvent('matterport_navigate', …))` and `'switch_matterport_model'`, branch: if `mode==='mpskin'`, `window.parent.postMessage({ source:'tourbots', type, … }, '*')` instead. No other behavioural change. Keep the existing CustomEvent path for `app`/`standalone`.
- Confirm the widget can run with `forcePublic` and without authenticated `useUser` context (it already supports `forcePublic` for the marketing demo via `TourDemo.tsx`) — the embed page must supply config the same way the tour embed page does.

### C. Embed code generation + share UI
- **EDIT `lib/embed-generator.ts`** — add a `generateMpskinChatbotEmbed(...)` (or extend the existing chatbot generators) that emits the `<script src=".../embed/chat.js" data-… data-mode="mpskin">` snippet. Keep the existing simple/advanced chatbot snippets but point them at the now-real `chat.js`.
- **EDIT `components/app/chatbots/tour/chatbot-share.tsx`** — add an **"MPskin"** option/tab alongside simple/advanced, showing the loader snippet + a short "paste into MPskin → extend-HTML" instruction. Reuse existing copy-to-clipboard + Pro-gating UI already in this file.

### D. "Tour type" support (data + add-tour flow)
- **EDIT `lib/types.ts`** (`Tour` interface, ~line 128) — add `render_mode?: 'tourbots' | 'external'`, `external_provider?: string | null`, `external_tour_url?: string | null`.
- **EDIT `lib/tour-service.ts`** — `createTour` / `updateTour` / secondary-tour creation accept + persist the three new fields (default `render_mode='tourbots'`).
- **EDIT the three add-tour endpoints** so they pass the new fields through:
  - `app/api/app/tours/upsert/route.ts` (primary upsert)
  - `app/api/app/tours/route.ts` POST (new location / `createNewLocation`)
  - `app/api/app/tours/[tourId]/route.ts` PATCH (edit)
- **EDIT `hooks/app/useTourManagement.ts`** — extend the `tourData` shape with `render_mode`/`external_provider`/`external_tour_url` and include them in all three fetch bodies.
- **EDIT `components/app/tours/tour-management-modal.tsx`** — add a first step: **tour type selector** — "Standard Matterport tour" (current fields) vs "External / MPskin tour" (adds an `external_tour_url` field + provider; still captures `matterport_tour_id`, auto-extracted from a Matterport URL or entered directly). Validation + ID-extraction logic already exists here; extend it.

### E. Rendering guards (don't render our Matterport iframe for external tours)
- **EDIT `components/app/tours/tour-viewer.tsx`** and `app/embed/tour/[venueId]/*` — where appropriate, if `render_mode==='external'`, the **public** tour embed should not be the primary delivery (the operator embeds via MPskin). The **dashboard** viewer still renders the Matterport model (via `matterport_tour_id`) so the operator can capture points (Section 12). Add a small banner explaining "this tour is hosted externally; use the MPskin embed snippet".

### F. Analytics labelling
- Reuse `lib/embed-analytics.ts` as-is. Ensure the `embed_id` generated for MPskin embeds is non-internal (not matching `isInternalEmbedId`). Optionally store `external_provider='mpskin'` alongside `embed_stats` rows if we want provider breakdowns later (would need a column — defer).

> Nothing in the OpenAI/chatbot brain (`app/api/public/tour-chatbot/[venueId]/route.ts`, `lib/openai-service.ts`) needs to change — the tools and SSE events are identical; only the **client-side delivery of the navigation event** differs.

## 12. The "tour type" UX (add tour: Standard vs MPskin)

In `tour-management-modal.tsx`, add a tour-type choice at the top:

1. **Standard Matterport tour** (default) — unchanged: paste Matterport URL → we extract `matterport_tour_id` → render + overlay chatbot. `render_mode='tourbots'`.
2. **External / MPskin tour** — fields:
   - **MPskin tour URL** (`external_tour_url`) — where the live skinned tour is hosted.
   - **Matterport model URL or ID** (`matterport_tour_id`) — required, so we can render the bare model in the dashboard for point capture and resolve sweep IDs. Auto-extract from a pasted Matterport URL using the existing extractor; allow manual entry.
   - **Provider** — preset `mpskin` for now.
   - `render_mode='external'`, `external_provider='mpskin'`.

**Point capture for external tours:** unchanged mechanism — the operator opens the tour in the **TourBots dashboard viewer** (which renders the bare Matterport model from `matterport_tour_id`), navigates, and saves points via `save-position-modal.tsx`. Because `sweep_id` is intrinsic to the model, those points work on the MPskin render at runtime. We add a one-line helper note in the modal for external tours: "Capture points here; they will drive your MPskin tour live."

## 13. Unknowns to confirm (MPskin test account)

### CONFIRMED via live test — 09/06/2026 (PRO account, model `zjJgxBRQfz5`, tour `my.mpskin.com/en/tour/gyg3p4gmjg`)

Diagnostic injected via extend-HTML proved the integration is viable. Key facts now established:

- **extend-HTML is PRO-only** — the free/trial plan shows "Exclusive PRO Feature" with a padlock. Must be on PRO (~€94/mo) to use the editor. Injected code is "output at the end of the tour" and runs in the **top window** (`window===window.top` true). ✅ U2.
- **External scripts load fine** — `https://tourbots.ai/...` loaded with no CSP/sanitiser block. We can host `chat.js` on tourbots.ai. ✅ U3.
- **Architecture:** MPskin **dynamically injects** the Matterport **Bundle SDK iframe** ~a few seconds after page load (not present at t0; present by ~t4s). The iframe src is `https://my.mpskin.com/bundle/26.4.4_webgl-…/?applicationKey=…&m={modelSID}&…` — **served from `my.mpskin.com`, SAME ORIGIN as the tour page.**
- **SDK handle (U1) — SOLVED.** The connected SDK lives on **`bundleIframe.contentWindow.MP_SDK`**. Because the iframe is same-origin, our injected code can access it directly. Two working acquisition paths, both verified:
  1. **Self-connect (preferred for the bridge):** find the bundle iframe, then `iframe.contentWindow.MP_SDK.connect(iframe.contentWindow)` → returns our own `mpSdk` (doesn't disturb MPskin's instance).
  2. **Intercept:** wrap `contentWindow.MP_SDK.connect` to capture the very instance MPskin connects.
  > The bridge must **poll/observe for the bundle iframe** (it appears late) before connecting. Identify it by `iframe.src` containing `/bundle/` + `m={matterport_tour_id}`.
- **Navigation read access (U5) — confirmed.** `Sweep.current.subscribe` emitted real sweep IDs as the camera moved (e.g. `k2bb9mwttcyhc8esf84d807cb`, `ue1su27iw2wibzim50m5rcyta`, `791zrbpng2u20zfhrpe6mhq8a`); `Camera.pose.subscribe` emitted live rotation. Analytics relay is therefore feasible.
- **U8 — hosted URL pattern:** `https://my.mpskin.com/en/tour/{urlCode}` (this tour's `urlCode` = `gyg3p4gmjg`). The model SID is separate (`zjJgxBRQfz5`).
- **applicationKey is exposed** in the bundle iframe URL — informational; we use our own key only for the dashboard capture render, not here.

### Still to confirm
- **U4 — actual `Sweep.moveTo` drive.** Read access is proven; next click is to run a `moveTo` and watch the tour physically jump (see message — run `__tbMove("<a different sweepId>")` in the console). _Pending Jack's confirmation._
- **U6 — model switch / multi-model.** How MPskin handles multiple models (separate skins/URLs vs in-tour switch). Likely each MPskin tour = one model; `switch_tour_model` may map to loading a different MPskin tour URL rather than an in-place SDK swap. Confirm when a multi-model case exists.
- **U7 — visual fit / z-index.** Confirm our overlay iframe sits above MPskin's UI (top-right MENU button, bottom-left controls) without covering essential menus. Note MPskin's own control positions for placement.
- **Timing robustness** — confirm how long after load the bundle iframe reliably exists across cold loads/slow connections (bridge should poll up to ~30s and degrade gracefully).

How to obtain a `sweep_id` for U4: open the same model in TourBots dashboard, save a point, copy its `sweep_id`.

## 14. Build phases / milestones

1. **DB + types** — migration `68_…`, `Tour` type, `tour-service` + 3 endpoints + `useTourManagement` pass-through. (No UI yet.) Shippable, inert.
2. **Add-tour UX** — tour-type selector + external fields in `tour-management-modal.tsx`; dashboard viewer renders external model for point capture; external banner. Operators can now register MPskin tours and capture points.
3. **Chatbot-only embed** — `app/embed/chatbot/[venueId]` page + client; `TourChatWidget` `mode` prop with `postMessage` navigation; verify standalone chat works in a bare test iframe.
4. **Loader + bridge** — `public/embed/chat.js` (iframe inject + resize relay + navigation bridge), wired to confirmed U1/U2 findings.
5. **Share UI** — `embed-generator` MPskin snippet + `chatbot-share.tsx` MPskin tab.
6. **Analytics verification** — views/conversations/moves recorded with correct domain + non-internal embed_id.
7. **End-to-end on MPskin** — paste snippet on the real Apollo 3D Level 2 tour; confirm chat answers, moves the tour, switches model, tracks analytics, and leaves MPskin's UI intact.

Phases 1–3 can proceed **before** the test-account findings; phase 4 depends on U1/U2/U6.

## 15. Open decisions

- **Token model** — rely on first-party origin (chat iframe is `tourbots.ai`) and skip embed tokens, or still mint one for defence-in-depth? (Lean: skip token initially; revisit.)
- **Keep B-pure-DOM as an option?** Only if the overlay iframe proves too limiting; it carries CORS + standalone-bundle cost.
- **Provider storage** — add `external_provider` to `embed_stats` for per-provider analytics, or keep it on `tours` only? (Lean: `tours` only for v1.)
- **Naming** — `render_mode` values (`tourbots`/`external`) and provider string (`mpskin`); confirm before migration.
- **Whether to also expose the generic standalone chatbot iframe** (non-MPskin sites) in the share tab now, since the same `chat.js` supports both modes.
- **Plan gating** on our side for the MPskin embed (Pro-only?) — reuse existing `isFreePlan` checks.

## 16. Proof-of-concept validation log (09/06/2026) — PASSED

Live end-to-end validation on a real MPskin PRO account. **Outcome: every navigation unknown is closed. The integration is technically proven.**

### Test environment
- MPskin plan: **PRO** (required — extend-HTML is locked on trial/BASIC/BUSINESS).
- Tour: `https://my.mpskin.com/en/tour/gyg3p4gmjg` (urlCode `gyg3p4gmjg`).
- Matterport model SID: `zjJgxBRQfz5` (NG24 Fitness Gym). Bundle `26.4.4_webgl-611-g928b55af19`.
- Injection point: skin editor → **extend HTML** tab (HTML/JS/CSS box, "output at the end of the tour").

### What we did, step by step
1. Signed up MPskin → confirmed extend-HTML is **PRO-gated** → upgraded to PRO to unlock it.
2. Created a skin from a standard Matterport model (this skinned output = the agency's "Level 2" tour).
3. Pasted **diagnostic probe #1** into extend-HTML, Saved, opened **Preview**. Result: external `tourbots.ai` script loaded ✔, code runs in **top window** ✔, but **no SDK on the top window** and `iframes=0` at first paint.
4. Pasted the **full deep diagnostic** (saved verbatim in `docs/features/MPSkin/InspectionCodeSnippet.txt`), Saved, Previewed, clicked around the tour. Result: captured the live SDK and logged real sweep IDs + poses (full analysis below).
5. In DevTools console, drove the tour with `__tbMove(...)` → tour physically moved ✔.
6. Added save/return helpers → captured a position+rotation and flew back to it exactly ✔.

### What the diagnostic proved (the mechanism)
- MPskin **injects the Matterport Bundle showcase in an `<iframe>` a few seconds after load** (absent at t0, present by ~t4s).
- Iframe src: `https://my.mpskin.com/bundle/26.4.4_webgl-…/?applicationKey=…&m=zjJgxBRQfz5&play=1&…` — **served from `my.mpskin.com`, the SAME ORIGIN as the tour page → `sameOrigin=true`.**
- The connected SDK is on **`bundleIframe.contentWindow.MP_SDK`**. We acquired a live `mpSdk` two ways (both worked): self-connect `contentWindow.MP_SDK.connect(contentWindow)`, and intercepting MPskin's own `connect`. Captured handle exposed as `window.__TB_SDK`.
- `Sweep.current.subscribe` + `Camera.pose.subscribe` stream live sweep IDs and rotation → read access + analytics feasible.
- Example real sweep IDs harvested: `k2bb9mwttcyhc8esf84d807cb`, `7u37zu42uqgyn5w6xhq78e5kd`, `ue1su27iw2wibzim50m5rcyta`, `a5n13zefwt4m710ec5ity4akb`.

### The proven commands (kept for reference / reuse)

**Diagnostic / SDK-capture snippet** — paste into extend-HTML (full version saved at `docs/features/MPSkin/InspectionCodeSnippet.txt`). It locates the bundle iframe, connects, exposes `window.__TB_SDK`, and logs sweeps/poses as you move.

**Drive to a sweep (no rotation):**
```js
__TB_SDK.Sweep.moveTo("ue1su27iw2wibzim50m5rcyta",{transition:"transition.fly",transitionTime:1500})
```

**Drive to a sweep AND a specific facing (this is the tour-point use case):**
```js
__TB_SDK.Sweep.moveTo("a5n13zefwt4m710ec5ity4akb",{rotation:{x:5.514521242901888,y:16.188799526708873},transition:"transition.fly",transitionTime:1500})
```

**Capture "here" and return to it** — paste once, then `__tbSave()` at a spot, move away, `__tbReturn()`:
```js
(function(){
  var sdk=window.__TB_SDK; if(!sdk){console.log('no __TB_SDK – re-run the diagnostic');return;}
  window.__tbState={sweep:null,rot:{x:0,y:0}};
  sdk.Sweep.current.subscribe(function(s){if(s&&s.id)window.__tbState.sweep=s.id;});
  sdk.Camera.pose.subscribe(function(p){if(p&&p.rotation)window.__tbState.rot={x:p.rotation.x,y:p.rotation.y};});
  window.__tbSave=function(){window.__tbSaved=JSON.parse(JSON.stringify(window.__tbState));console.log('SAVED',JSON.stringify(window.__tbSaved));return window.__tbSaved;};
  window.__tbReturn=function(){var s=window.__tbSaved;if(!s){console.log('nothing saved');return;}return sdk.Sweep.moveTo(s.sweep,{rotation:s.rot,transition:'transition.fly',transitionTime:1500});};
  window.__tbGoto=function(id,x,y){return sdk.Sweep.moveTo(id,{rotation:{x:x||0,y:y||0},transition:'transition.fly',transitionTime:1500});};
})();
```

> Transition enum values: `transition.instant` / `transition.fly` / `transition.fade`. `rotation` is `{x,y}` in degrees and matches what `Camera.pose` returns — so capturing a `tour_point`'s rotation and replaying it lands the exact same view.

### What this means for the build (now de-risked)
- The **navigation bridge** in `public/embed/chat.js` is confirmed viable: poll for the same-origin `/bundle/` iframe → `contentWindow.MP_SDK.connect(contentWindow)` → handle `matterport_navigate` (`Sweep.moveTo(sweep_id, {rotation, transition})`) and pose relay. Fail safe if the iframe never appears.
- Our existing **`tour_points` model (`sweep_id` + `rotation`) maps 1:1 onto MPskin** — operators capture points in the dashboard exactly as today; the AI replays them on the live MPskin tour.
- No CORS/CSP blockers encountered for loading our external script.

### Residual checks (non-blocking)
- **U6 model switch** — confirm when a multi-model agency case exists (likely = load a different MPskin tour URL, not an in-place SDK swap).
- **U7 placement** — pick overlay z-index/position that clears MPskin's top-right MENU and bottom-left controls.
- **Cold-load timing** — bridge should poll up to ~30s for the bundle iframe on slow connections.

---

### Appendix — key source files
SDK wrapper `components/matterport/matterport-sdk-wrapper.tsx` · chat widget `components/app/tours/tour-chat-widget.tsx` · chatbot route `app/api/public/tour-chatbot/[venueId]/route.ts` · tour embed `app/embed/tour/[venueId]/{page,tour-embed-client}.tsx` · nested shell `nested-tour-shell.tsx` · embed loader `public/embed/tour.js` · embed gen `lib/embed-generator.ts` · share UI `components/app/chatbots/tour/chatbot-share.tsx` · analytics `lib/embed-analytics.ts` · tracking routes `app/api/public/embed/{track,track-tour-move}/route.ts` · tour service `lib/tour-service.ts` · add-tour `components/app/tours/tour-management-modal.tsx` + `hooks/app/useTourManagement.ts` + `app/api/app/tours/{upsert,[tourId]}/route.ts` · SQL `sql/{3,5,6,17,25,48,51,67}_*.sql` · CSP `next.config.js`.
