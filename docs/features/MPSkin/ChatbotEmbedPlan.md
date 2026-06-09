# Chatbot Share & Embed — Full Plan of Action

> Status: PLANNING. Author: TourBots engineering. Last updated: 09/06/2026.
> This is the build plan for shipping a **Share & Embed** tab on the Chatbot page: a standalone chatbot embed (simple iframe + advanced script) with a navigation on/off toggle. This same advanced script is what gets pasted into MPskin to overlay the AI chatbot on a Level 2 tour.

---

## 1. Why we're doing this

TourBots overlays an AI chatbot on a Matterport tour; the bot answers questions and can physically drive the tour (move to a saved area, switch models) via the Matterport SDK. Today this only works inside tours **TourBots renders itself** (we own the iframe + SDK + chat overlay).

Some agencies (trigger: **Apollo 3D**) deliver "Level 2" tours wrapped in **MPskin** — a third-party Matterport overlay/CMS hosted by MPskin. Pasting our existing **full-tour** embed into MPskin produced a **tour-inside-a-tour** (our whole tour rendered inside theirs), because the only embed we ship is the full-tour iframe.

We proved on a live MPskin PRO account (09/06/2026 — see `MPSkinIntegration.md` §16) that:
- MPskin's **extend-HTML** editor loads external scripts from `tourbots.ai` and runs in the **top window**.
- MPskin renders the Matterport **Bundle SDK in a same-origin iframe** (`my.mpskin.com/bundle/…`), so injected code can connect to it (`contentWindow.MP_SDK.connect(...)`) and call `Sweep.moveTo(...)` — we drove the live tour to a saved sweep **and rotation**, and read live sweep IDs.

So the integration is just: **ship a standalone chatbot embed** (chat only, no Matterport iframe of ours) that can drive whatever tour is already on the page. MPskin is simply the headline use of that embed.

## 2. What we're building (the product, plain English)

A **Share & Embed** tab on the **Chatbot** page, styled identically to the existing **Tours → Share & Embed** tab, containing:

- **Simple Embed** — a one-line chatbot-only `<iframe>` an operator can drop on any website as an assistant.
- **Advanced Embed** — a `<script>` loader that injects a floating chat widget **and** (when a Matterport/MPskin tour is on the page) a navigation bridge. **This advanced script is the snippet pasted into MPskin's extend-HTML.**
- An **"Enable tour navigation" toggle** (default ON). Flipping it rewrites the generated code live (and tells the backend whether the AI gets navigation tools), exactly like the tour embed's `showTitle`/`showChat` toggles flip query params.

There is **no separate "MPskin" snippet** — the advanced script is the MPskin code.

## 3. Key principles / decisions locked

- **No tour-side changes.** An MPskin tour is registered like any normal tour: paste the Matterport model ID/URL, capture navigation points in our dashboard exactly as today. No new "tour type", no `render_mode`, no external-URL field. (Earlier `MPSkinIntegration.md` proposed those — **dropped**; not needed.)
- **No database changes.** The navigation toggle is purely per-embed (baked into the generated snippet + read as a request param), mirroring how `generateTourEmbed` serialises `showTitle`/`showChat`. No migration.
- **Toggle defaults ON.**
- **Reuse, don't rebuild.** Match the existing `tour-share.tsx` styling; reuse the existing (currently dead) `chatbot-share.tsx` + `generateChatbotEmbed` scaffolding; reuse the existing `TourChatWidget`, chatbot route, and analytics. The only genuinely new runtime asset is `public/embed/chat.js` + a chatbot-only embed page.
- **Same chatbot, two delivery shells.** Behaviour with navigation ON is identical to today; the only difference is the widget posts navigation to the parent window (for the script/MPskin case) instead of dispatching a same-page event.

## 4. How it works end-to-end

### Operator (TourBots dashboard)
1. Add tour as normal → paste Matterport URL/ID (the same model that's inside their MPskin tour).
2. Capture navigation points (sweep + rotation) in our dashboard viewer — unchanged flow.
3. Configure chatbot (docs, prompt, branding) — unchanged.
4. **Chatbot → Share & Embed** tab → set the navigation toggle → copy **Simple** (assistant) or **Advanced** (floating + navigation / MPskin).
5. For MPskin: paste the **Advanced** snippet into the skin's **extend-HTML** box, Save.

### Runtime — Simple iframe (generic website assistant)
- `<iframe src="…/embed/chatbot/{venueId}?tourId=…&id=…&nav=0">` renders the chat UI inline. Pure Q&A. All network calls are same-origin to `tourbots.ai` (no CORS).

### Runtime — Advanced script (floating widget + navigation; MPskin)
1. `chat.js` reads its `data-*` attributes and injects a **fixed-position chat iframe** (`…/embed/chatbot/{venueId}?…&mode=embed&nav=1`) as a floating bubble/window. Host page CSS can't bleed into it (separate document).
2. If `nav=1`, `chat.js` also installs the **navigation bridge** (Section 5).
3. Visitor chats inside the iframe (same-origin to our APIs). When the AI calls a navigation tool, the widget **postMessages** the request to the parent window; the bridge calls the host tour's `mpSdk`. MPskin's own menus keep working — both share the one SDK.
4. Analytics (views, conversations, moves) are emitted from inside the iframe → same-origin, no CORS.

## 5. The navigation bridge (MPskin) — confirmed mechanism

Installed by `chat.js` on the host (MPskin) top window. Confirmed live (`MPSkinIntegration.md` §16):

1. **Find the tour SDK.** Poll for the Matterport **Bundle** iframe — `iframe.src` contains `/bundle/` (and the model SID). MPskin injects it a few seconds after load, so poll up to ~30s. It is **same-origin** (`my.mpskin.com`), so `contentWindow` is reachable.
2. **Connect.** `iframe.contentWindow.MP_SDK.connect(iframe.contentWindow)` → our own `mpSdk` handle (does not disturb MPskin's). Fallback: wrap `contentWindow.MP_SDK.connect` to capture MPskin's instance.
3. **Drive.** On a navigation message from the chat iframe:
   `mpSdk.Sweep.moveTo(sweep_id, { rotation: {x,y}, transition: 'transition.fly', transitionTime })`.
   `sweep_id` + `rotation` come straight from the saved `tour_points` — proven to land the exact position + view.
4. **Relay (optional).** Subscribe to `Sweep.current` / `Camera.pose` and postMessage into the iframe for move analytics.
5. **Fail safe.** If no bundle iframe/SDK appears, the chat still answers; only movement is disabled.

Cross-window messages are validated (`event.data.source === 'tourbots'`, `event.origin === https://tourbots.ai`).

> Generic (non-MPskin) websites: if the page has no reachable Matterport bundle, the bridge no-ops and the widget is a pure assistant. (Driving an arbitrary site's own Matterport embed is a later enhancement — out of scope here.)

## 6. The navigation toggle — exact behaviour

**Where:** on the Share & Embed tab only (a switch like the tour tab's "Show chat widget"). **Default ON.** No persistence/DB — flipping it just regenerates the snippet.

**What it flips:** a `nav` flag carried in the snippet — `?nav=1|0` on the iframe src and `data-nav="on|off"` on the script. The chatbot-only embed page forwards it to the widget and to the chatbot API.

**Backend (chatbot route `app/api/public/tour-chatbot/[venueId]/route.ts`):** the route already assembles tools in a plain `const tools = []` (navigation pushed when `tourPointsContext` exists; model switch when `tours.length > 1`). Gate both behind a `navigationEnabled` flag read from the request:
- `nav` truthy → unchanged behaviour (tools included).
- `nav` falsy → **do not push** `navigate_to_area` / `switch_tour_model`, and append a system-prompt line: *"Tour navigation is disabled for this embed. Do not offer to move or navigate the tour."* (Removing the tools is the real guard; the prompt line is belt-and-braces.)

**Widget (`tour-chat-widget.tsx`):** a new `navTarget?: 'event' | 'parent' | 'none'` (or reuse a `mode`) controls the dispatch at lines ~601–638:
- `event` (default, today's app/full-tour embed) → `window.dispatchEvent(CustomEvent(...))`.
- `parent` (script/MPskin) → `window.parent.postMessage({ source:'tourbots', type, sweep_id, position, rotation, ... }, '*')`.
- `none` (nav off) → no navigation wiring at all.

## 7. Files to CREATE

1. **`public/embed/chat.js`** — the standalone loader (hand-authored plain JS, like `public/embed/tour.js`; no build step / no `npm run build:widget`). Responsibilities:
   - read `data-venue-id`, `data-tour-id`, `data-embed-id`, `data-nav`, `data-mode` from its own `<script>` tag;
   - inject a fixed-position **chat iframe** → `https://{host}/embed/chatbot/{venueId}?tourId=…&id=…&nav=…&mode=embed&domain=…&pageUrl=…` (forward host `location`/`referrer` for analytics, like `NestedTourShell`);
   - relay iframe size via `postMessage` (reuse the resize pattern from `generateUniversalAgencyPortalEmbed` in `lib/embed-generator.ts`);
   - if `nav` on, install the **navigation bridge** (Section 5);
   - validate message origin; fail safe.

2. **`app/embed/chatbot/[venueId]/page.tsx`** — server component, mirrors `app/embed/tour/[venueId]/page.tsx` but renders **only the chat** (no `MatterportSDKWrapper`). Reads `tourId`, `id` (embedId), `nav`, `mode`, `domain`, `pageUrl`; resolves chatbot config; mints/reads the public embed token like the tour page; reuses `app/embed/layout.tsx`.

3. **`app/embed/chatbot/[venueId]/chatbot-embed-client.tsx`** — client wrapper mounting `TourChatWidget` with `forcePublic`, `navTarget` derived from `mode`+`nav` (`parent` when `mode=embed`+nav on, else `none`), and the move-tracking relay listener.

## 8. Files to MODIFY

1. **`lib/embed-generator.ts`** — rework `generateChatbotEmbed` so:
   - **simple** = a chatbot **iframe** (`<iframe src="…/embed/chatbot/{venueId}?…&nav=…">`), not a script (matches "simple iframe = website assistant");
   - **advanced** = the `chat.js` script loader with `data-nav` + `data-mode="embed"`;
   - both accept a `navigationEnabled: boolean` option and serialise it (`?nav=1|0` / `data-nav`).
   Keep the existing customisation mapping. (`generateTourChatbotEmbed` wrapper stays.)

2. **`components/app/chatbots/tour/chatbot-share.tsx`** — already renders Simple + Advanced boxes, copy buttons, Pro-gating. Changes: add the **"Enable tour navigation"** toggle (default true) into `options`/state so `generateCode()` re-runs on change; fix the **Preview** links to point at `/embed/chatbot/{venueId}` (currently `/embed/tour/…`); add a short note under Advanced: *"For MPskin: paste this into your skin's extend-HTML."*

3. **Chatbot page tabs** — wire `TourChatbotShare` in as a **Share & Embed** tab next to Settings / Customisation / Playground / Analytics. (It exists but is not currently mounted anywhere — confirm the chatbots page tab component and add the tab + trigger, matching the tour page's tab styling.)

4. **`components/app/tours/tour-chat-widget.tsx`** — add `navTarget?: 'event' | 'parent' | 'none'` (default `'event'`); branch the navigation dispatch at lines ~601–638 (`event` → CustomEvent as today; `parent` → `window.parent.postMessage`; `none` → skip). No other behavioural change; keep `forcePublic`.

5. **`app/api/public/tour-chatbot/[venueId]/route.ts`** — read a `nav`/`navigationEnabled` flag from the request (body or query) and gate the two tool pushes (`navigate_to_area`, `switch_tour_model`) + add the "navigation disabled" system-prompt line when off. Everything else unchanged.

6. **Analytics labelling** — reuse `lib/embed-analytics.ts`. Ensure the generated `embed_id` for chatbot embeds is **not** matched by `isInternalEmbedId` (avoid the `demo-/tour-/preview-/config-` prefixes). Record as `embed_type='chatbot'`. No schema change.

> Out of scope / explicitly NOT changing: `tours` table, tour add/edit flow, `tour-service.ts`, `useTourManagement.ts`, `MatterportSDKWrapper`, `openai-service` tool definitions.

## 9. Database / SQL

**None.** The toggle is per-embed (snippet param), tours are registered normally, and all analytics tables (`embed_stats`, `embed_tour_moves`, `conversations`) already accommodate chatbot embeds. No migration file is created or run.

## 10. Embed code shapes (what gets generated)

**Simple (iframe)** — website assistant:
```html
<iframe src="https://tourbots.ai/embed/chatbot/{venueId}?id={embedId}&tourId={tourId}&nav=0"
        width="100%" height="600px" frameborder="0"></iframe>
```

**Advanced (script)** — floating widget + navigation; the MPskin snippet:
```html
<script src="https://tourbots.ai/embed/chat.js"
        data-venue-id="{venueId}" data-tour-id="{tourId}" data-embed-id="{embedId}"
        data-mode="embed" data-nav="on"></script>
```

The toggle flips `nav=0|1` / `data-nav="off|on"`. Width/height/branding come from existing options + customisation mapping. (Host base URL respects the white-label override logic already in `embed-generator.ts`.)

## 11. Security / CORS / CSP / auth

- **CORS** — avoided: the chat UI runs inside a `tourbots.ai` iframe, so config/chat/analytics calls are same-origin. Only cross-window traffic is `postMessage` (iframe ↔ bridge).
- **Origin/token** — requests from inside the iframe carry `Origin: https://tourbots.ai` → treated as first-party by the existing public-chat origin check; no embed token strictly required (we still mint/read one like the tour page for parity).
- **CSP / framing** — `next.config.js` already sets `frame-ancestors *` for `/embed/*`, so `/embed/chatbot/{venueId}` can be framed on any MPskin/agency domain. No CSP change.
- **Bridge messages** — validate `source`/`origin`; never `eval`.
- **Pro gating** — `chatbot-share.tsx` already gates embed generation behind non-free plans; keep it.

## 12. Build phases / order

1. **Embed page** — `app/embed/chatbot/[venueId]/{page,chatbot-embed-client}.tsx` + widget `navTarget` prop. Verify the chatbot-only iframe renders and answers (nav off).
2. **Backend toggle** — gate nav tools by the `nav` flag in the chatbot route; verify off = no movement offered.
3. **Loader + bridge** — `public/embed/chat.js` (inject iframe + resize relay; nav bridge polling the same-origin bundle iframe). Verify on the live MPskin tour.
4. **Generator + UI** — rework `generateChatbotEmbed` (simple=iframe, advanced=script, nav flag); add the toggle + fix previews in `chatbot-share.tsx`; wire the **Share & Embed** tab onto the Chatbot page.
5. **Analytics check** — views/conversations/moves recorded with correct domain + non-internal embed_id.
6. **End-to-end on MPskin** — paste advanced snippet into extend-HTML; confirm chat answers, drives the tour, and MPskin's menu still works.

Phases 1–2 are independent; 3 depends on nothing new (mechanism proven); 4 depends on 1–3.

## 13. Test plan

- **Website assistant:** simple iframe on a blank HTML page → chat answers; nav off → bot never offers to move.
- **MPskin overlay:** advanced snippet in extend-HTML → floating bubble appears; ask "take me to the cardio area" → tour moves to the saved sweep + rotation.
- **Coexistence:** MPskin's own MENU/deeplinks still navigate while our chatbot is active (shared SDK).
- **Toggle:** nav on vs off regenerates the snippet; off removes navigation tools server-side (confirm via no `navigate_to_area` in responses).
- **Analytics:** a view + a conversation + a move row recorded against the right venue/tour with the MPskin domain.
- **Cold load:** bridge still connects when the bundle iframe appears late (slow connection); fails safe if never.

## 14. Open / residual items

- **Model switch on MPskin (U6):** likely each MPskin tour = one model, so `switch_tour_model` maps to opening a different MPskin tour URL rather than an in-place swap. Wire fully when a multi-model case exists.
- **Placement/z-index (U7):** choose a floating position that clears MPskin's top-right MENU and bottom-left controls.
- **Generic-site tour driving:** connecting to a non-MPskin site's own Matterport embed (cross-origin / Embed SDK) is a future enhancement, not in this build.

---

### Reference — confirmed facts & validation
See `docs/features/MPSkin/MPSkinIntegration.md` §16 (live POC log) and `docs/features/MPSkin/InspectionCodeSnippet.txt` (the diagnostic that captured the SDK). Key existing code: `lib/embed-generator.ts` (`generateChatbotEmbed`), `components/app/chatbots/tour/chatbot-share.tsx`, `components/app/tours/tour-chat-widget.tsx` (dispatch ~L601–638), `app/api/public/tour-chatbot/[venueId]/route.ts` (`const tools = []` ~L827), `components/app/tours/tour-share.tsx` (style reference), `public/embed/tour.js` (loader reference), `next.config.js` (`frame-ancestors *` for `/embed/*`).
