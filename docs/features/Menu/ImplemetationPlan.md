# Tour Menu System — Full Revamp Implementation Plan

Last updated: 19/07/2026

## Goal

Completely revamp TourBots’ tour menu system so venue owners can build **professional, navigation-first overlays** on Matterport tours — not just a single centred welcome card with a few buttons.

Keep what already works well:

- Split builder layout: **controls on the left**, **live preview on the right**
- Block-based content (logo, text, actions, spacing)
- Existing embed/tour-viewer overlay plumbing

Replace what does not:

- The expanded editor UX (dense, amateur, hard to scan)
- The single “big middle rectangle” layout as the only real style
- Shallow desktop/mobile support (preview width only)
- Limited actions and no structured location / multi-tour / AI-prompt flows
- Duplicated preview vs live renderers and unfinished schema fields

This document is the source of truth for the redesign. Filename note: this file lives at `docs/features/Menu/ImplemetationPlan.md` (existing path spelling retained).

---

## Competitive landscape (research summary)

### MPskin ([mpskin.com](https://www.mpskin.com/en/features/multimedia-menue/))

Treats the **multimedia menu as the heart of the tour**:

- Persistent / docked menu (typically left or right), not only a one-shot modal
- Deeplink navigation to scan points / areas (up to **three submenu levels**)
- Links across **multiple skins / spaces**
- Media, logos, contact, social, tag categories / search
- Per-block icons, colours, opacity, position
- Advanced HTML/CSS/JS for power users (we will **not** ship a freeform HTML editor in v1)

### CAPTUR3D Creator Studio overlays

- **Hamburger / navigation menu** as a first-class overlay pattern
- Section headers to group items
- Link types explicitly include **tour locations (points)** and **other tours**
- Drag-and-drop reorder in the builder
- Branding (fonts, colours) and multilingual options
- Maps / lead forms exist as adjacent overlay modules (optional later for TourBots)

### Industry pattern consensus

1. **Navigation first** — jump to rooms, floors, sister properties, CTAs.
2. **Compact trigger** — hamburger / icon that does not own the whole viewport.
3. **Brandable** — colours, typography, logo, consistent with the venue.
4. **Mobile-first collapse** — drawer or sheet on small screens.
5. **Do not fight the tour** — overlays must not permanently block exploration.

TourBots already owns the Matterport embed + chatbot stack. The menu should become the **navigation and content layer** that sits beside that stack, with deep links into tour points, sibling tours, URLs, and the AI assistant.

---

## Current state (honest audit)

### What exists today

| Layer | Location |
|-------|----------|
| Builder shell | `components/app/tours/menu/tour-menu-builder.tsx` |
| Settings / blocks editors | `global-settings-panel.tsx`, `blocks-list.tsx`, `block-editor.tsx`, type editors |
| Live overlay | `components/embed/tour-menu-overlay.tsx` + `tour-menu-widget.tsx` |
| Builder preview | `tour-menu-preview.tsx` (**duplicated** render logic) |
| Data | `tour_menu_settings` + `tour_menu_blocks` (`sql/4_tour_menu_initial.sql`, `64_…`) |
| Types | `TourMenuSettings`, `TourMenuBlock`, `MenuButton` in `lib/types.ts` |
| APIs | Authenticated `/api/app/tours/[tourId]/menu`; public `/api/public/menu/[tourId]` |
| Surfaces | Embed SSR, tour viewer, agency portal builder, marketing demos |

### Capabilities that work

- Enable/disable; centre / top / bottom modal-ish layout
- Blocks: text, buttons, logo, spacer (table typed/rendered but **Add** is hidden)
- Button actions: `tour_point`, `tour_model`, `url`, `open_chat`, `close_menu`
- Reopen floating widget after dismiss
- Partial responsive: logo size + buttons-per-row

### Critical gaps

| Gap | Impact |
|-----|--------|
| Only one real **presentation style** (centred card) | Cannot match MPskin/CAPTUR3D sidebar / hamburger UX |
| Desktop/mobile = preview frame only | Unlike chatbot customisation (`mobile_*` fields + resolver) |
| Expanded editors look crude | Collapsed headers look fine; open panels feel “built by a kid” |
| No structured **spaces / locations list** block | Manual button lists only |
| `open_chat` cannot **pre-send a prompt** | Weak AI integration vs product potential |
| URL has no first-class **new tab / same tab** control in polished UX | Incomplete link behaviour |
| Schema orphans: `show_close_button`, `backdrop_blur`, `entrance_animation` | In DB/render defaults, missing or incomplete in settings UI |
| Ghost button style / icon fields half-supported | Preview and live drift |
| No menu action playground | Hard to verify navigate / switch / chat without leaving builder |
| Unauthenticated legacy `/menu/blocks` CRUD | Security debt (builder uses replace-all POST instead) |
| Widget vs chat launcher collision | Both can claim the same corner |

---

## Product vision (locked direction)

### One sentence

Venues configure a **branded tour menu** with a chosen **chrome style** (modal, drawer, or icon-triggered panel), rich **navigation items** (points, tours/locations, links, AI prompts, text), and **true desktop vs mobile** styling — previewed live on the right, rendered identically everywhere the tour runs.

### Experience principles

1. **Chrome first, content second** — choose how the menu lives on the tour before filling blocks.
2. **Left = structured craft UI** — section cards like chatbot Settings, not raw form dumps when expanded.
3. **Right = truthful preview** — same renderer as production; desktop/mobile toggle switches both editor scope and frame.
4. **Navigation is a first-class block** — not only freeform buttons.
5. **AI is a destination** — items can open the chatbot and optionally inject a predefined visitor message.
6. **Agency parity** — portal clients with menu permission get the same builder and runtime.

### Keep vs change

| Keep | Change |
|------|--------|
| Split left/right builder | Redesign every expanded settings/block panel |
| Block model conceptually | Extend types + add menu **chrome / style** |
| Save → settings + blocks | Shared renderer; device-scoped fields |
| Embed + viewer overlay path | Wire playground; harden APIs |

---

## Target information architecture

### A. Menu chrome (new)

`menu_style` (name TBD in schema):

| Style | Behaviour |
|-------|-----------|
| **`modal`** | Current centred (or top/bottom) card over a dimmed tour — welcome / intro use case |
| **`drawer`** | Full-height (or capped) panel docked **left or right**; tour remains visible beside it |
| **`icon`** | Compact trigger (hamburger / custom icon) at **top-left / top-right / bottom-***; opens drawer or sheet |

Shared chrome settings (device-scoped where noted):

- Anchor / side, width (desktop) vs full-bleed sheet (mobile)
- Overlay scrim opacity / blur
- Close control, outside-click dismiss, start open vs start closed
- Entrance motion
- Trigger icon, size, colours, offsets, collision preference vs chatbot launcher

The reopen widget becomes either:

- The same as the **icon** trigger when style is `icon`, or
- A dedicated “reopen after close” control for `modal` / `drawer` that started open

### B. Content model (evolved blocks)

Retain stackable blocks, but upgrade editors and add navigation-oriented types:

| Block | Purpose |
|-------|---------|
| **Logo** | Brand mark (already device-sized) |
| **Text** | Header / body / caption — proper typography controls |
| **Nav list** *(new)* | Ordered items: section headers + actionable rows (icon, label, optional description) |
| **Buttons** | Keep for CTA grids; share action model with nav items |
| **Divider / spacer** | Visual rhythm |
| **Media** *(phase 2)* | Image / video strip |
| **Table** | Either ship properly or remove from runtime until ready |

Optional nested groups inside **Nav list** (phase 1.5): one level of submenu (MPskin has up to three — we start with one).

### C. Action model (unified)

Every actionable item (nav row or button) uses one action schema:

```ts
type MenuItemAction =
  | { type: 'tour_point'; tourId?: string; pointId: string }
  | { type: 'tour_model'; tourId: string }           // sibling / secondary location
  | { type: 'external_url'; url: string; openIn: 'same_tab' | 'new_tab' }
  | { type: 'open_chat'; prompt?: string; autoSend?: boolean }
  | { type: 'close_menu' }
  | { type: 'none' };                                 // label + description only
```

**AI prompt behaviour**

- `open_chat` without prompt → open chatbot UI only (today’s behaviour).
- `open_chat` + `prompt` + `autoSend: true` → open chat and inject as a **visitor** message (then normal AI reply flow).
- Must work in embed + tour viewer when a tour chatbot is present; no-op gracefully if chatbot disabled.

**Picker UX**

- Tour points: load from venue tours (primary + secondaries), same cross-model pattern as today.
- Other locations / tours: list venue primary tours (and secondaries if product allows).
- URL: validation + open-in control.
- AI: textarea for prompt + “Send automatically” toggle.

### D. Desktop / mobile (chatbot customisation pattern)

Mirror `components/app/chatbots/shared/customisation-form/`:

1. `activeDevice: 'desktop' | 'mobile'` at builder root.
2. Parallel fields: base = desktop; `mobile_*` overrides.
3. Resolver (`getEffectiveMenuSettings` / `getEffectiveMenuBlocks`) at render time.
4. Preview frame and editor fields switch together.
5. Explicit non-inheritance where needed (e.g. logo already uses scoped sizes).

Minimum device-scoped set for v1:

- Chrome: style-specific width, padding, typography scale, trigger position/size
- Nav / buttons: density, columns, font sizes
- Colours can stay shared initially if product prefers less complexity; allow overrides later

### E. Builder UX redesign (left column)

Inspired by chatbot Settings cards, but tighter:

1. **Top bar**: Enable menu · Device toggle · Save · optional “Open on tour” deep link.
2. **Section cards** (one job each), collapsed by default with a polished summary line when closed:
   - Style & placement
   - Appearance (colours, type, surface)
   - Trigger / reopen
   - Content (block list)
3. **Expanded panels**:
   - Clear hierarchy, generous spacing, segmented controls for style
   - Inline previews of colour/type choices
   - Drag-and-drop reorder (replace ↑↓-only)
   - Per-block sheet/drawer editor instead of endless nested sliders where possible
4. **Content blocks** always reachable — not buried only inside a collapsed “Content” that starts closed with no summary of how many blocks exist.

Do **not** copy chatbot customisation’s every control; improve on its clarity and isolation.

### F. Right column — live preview

- Single shared component: `TourMenuRenderer` used by builder preview **and** production overlay.
- Desktop/mobile frames as today, but driven by effective resolved settings.
- Optional “Interactive preview” mode that fires actions into a mock or live Matterport context (phase 1.5 / playground).

---

## Runtime wiring (must ship with the feature)

| Surface | Requirement |
|---------|-------------|
| **Tour embed** (`embed/tour/...`) | Primary production path; SSR or hydrate menu payload; dismiss + reopen |
| **Tour viewer** (app) | Same renderer; decide draft vs published (recommend: **saved** in viewer, **local draft** only in builder preview — or add “Preview draft on tour” later) |
| **Playground** | New or extended: exercise actions (point jump, model switch, URL, open chat + prompt) without leaving menu workstream |
| **Agency portal** | Same builder via existing portal auth; same overlay in portal tour shell |
| **Analytics** | Phase 0/1 — see [Menu analytics](#menu-analytics-phase-01) |
| **Chatbot launcher collision** | Shared corner policy: menu trigger and chat launcher negotiate positions (auto-offset or explicit “avoid chat” toggle) |
| **Marketing demos** | Update if they hardcode old overlay assumptions |

Public read API remains `/api/public/menu/[tourId]` with an expanded payload shape (versioned if needed).

---

## Menu analytics (Phase 0/1)

Analytics are **not** a later nice-to-have. Instrument and surface them in the same slice as chrome foundations so every new style/action ships with measurable usage from day one.

### Pattern to follow

Tour/embed analytics today use **specialised append-only tables**, not a generic events store:

| Table | Grain |
|-------|--------|
| `embed_stats` | Coarse views |
| `embed_tour_moves` | High-volume navigation |
| `conversations` | Chat messages |

Helpers live in `lib/embed-analytics.ts`; public track routes under `/api/public/embed/track*`. Dashboard aggregates in `app/api/app/dashboard/route.ts` → cards in `components/app/dashboard/dashboard-content.tsx`.

**Do not** stuff menu opens into `embed_stats` (wrong grain; `embed_type` is only `tour`/`chatbot`; view cooldown would hide opens).

### New table: `embed_menu_events`

Additive SQL (e.g. alongside menu revamp or `sql/90_embed_menu_events.sql`), same RLS/service_role pattern as `sql/48_embed_tour_moves.sql`.

| Column | Notes |
|--------|--------|
| `id`, `created_at` | Standard |
| `embed_id`, `venue_id`, `tour_id` | Scope (tour required for menu) |
| `event_type` | CHECK: `menu_opened` \| `menu_closed` \| `menu_item_clicked` \| `menu_ai_prompt_sent` |
| `menu_style` | `modal` \| `drawer` \| `icon` (and legacy mapped to `modal`) |
| `trigger_source` | e.g. `auto_open`, `reopen_widget`, `icon_button`, `close_control`, `backdrop`, `item_action` |
| `item_id`, `item_label`, `item_type` | Nullable; for clicks / AI (nav row, button, etc.) |
| `action_type` | Nullable; `tour_point`, `tour_model`, `external_url`, `open_chat`, `close_menu`, … |
| `target_ref` | Nullable text/json — tour point id, tour id, URL host, or prompt hash/snippet |
| `domain`, `page_url`, `user_agent` | Same context as moves/views |
| Optional `metadata` jsonb | Escape hatch for style extras without schema churn |

Indexes: `(venue_id, created_at desc)`, `(tour_id, created_at desc)`, `(venue_id, event_type, created_at desc)`.

### Events to log

| Event | When | Payload emphasis |
|-------|------|------------------|
| `menu_opened` | Menu becomes visible | `menu_style`, `trigger_source` |
| `menu_closed` | Menu dismissed | `menu_style`, `trigger_source` |
| `menu_item_clicked` | Nav row / button activated | `item_type`, `item_label`, `action_type`, `target_ref` (point/tour/url) |
| `menu_ai_prompt_sent` | Item opens chat **and** auto-sends a predefined prompt | Which item triggered it; still also creates a normal `conversations` visitor row via the chat API |

Skip tracking in internal dashboard URLs / demo embed IDs (reuse filters in `lib/embed-analytics.ts`). Builder preview should **not** write production analytics (or gate on `isPreviewMode`).

### Insert / API

1. `trackEmbedMenuEvent()` in `lib/embed-analytics.ts`
2. `POST /api/public/embed/track-menu-event` → `app/api/public/embed/track-menu-event/route.ts`
3. Fire from shared renderer / overlay / widget:
   - `TourMenuRenderer` / `tour-menu-overlay.tsx`
   - `tour-menu-widget.tsx` (reopen → `menu_opened` with `trigger_source=reopen_widget`)

### Product UI — “Menu Analytics” card

Same dashboard pattern as tour views / chatbot messages:

| Surface | Work |
|---------|------|
| **App dashboard** | New card in `dashboard-content.tsx` fed by `dashboard/route.ts`: opens (period), open rate (opens ÷ tour views, same window), top clicked items (label + count), optional **style breakdown** when the venue has multiple tours / styles |
| **Tour analytics tab** *(recommended companion)* | `tour-analytics.tsx` + `app/api/app/tours/analytics/route.ts` — per-tour opens, top items, style |
| Agency portal | Follow existing portal analytics modules if menu is enabled for the share |

Card content (minimum):

- Menu opens (7-day / month — match sibling cards)
- Open rate vs tour views
- Most-clicked items (top 3–5 labels)
- Style breakdown (modal / drawer / icon) when ≥2 styles or ≥2 tours with menus in the venue

### Phase placement

| Phase | Analytics deliverable |
|-------|------------------------|
| **0** | Table + `trackEmbedMenuEvent` + public route; wire `menu_opened` / `menu_closed` on current overlay (even before chrome revamp — style = `modal` / mapped) |
| **1** | Pass `menu_style` + richer `trigger_source`; dashboard **Menu Analytics** card (venue-level) |
| **2** | `menu_item_clicked` + `menu_ai_prompt_sent` as nav/actions ship; top-items and target breakdown on the card |

Do not defer the table or open/close tracking past Phase 0.

---

## Data & API plan

### Schema direction

Prefer **additive** migration (e.g. `sql/89_tour_menu_revamp.sql`):

- `tour_menu_settings`: `menu_style`, side/anchor, start_open, device-scoped JSON or parallel columns, action defaults
- `tour_menu_blocks`: allow new `block_type` values (`nav_list`, …); evolve `content` jsonb
- Migrate existing menus: `menu_style = 'modal'`, map current position → chrome; keep blocks intact

Avoid rewriting historical `4_…` / `64_…` files.

### API

- Keep authenticated **replace-all save** for reliability, or move to transactional upsert with optimistic concurrency.
- **Remove or lock down** unauthenticated `/menu/blocks` routes.
- Extend public GET to return chrome + blocks + version flag.
- Logo upload paths unchanged (app + agency).

### Types

Centralise in `lib/types.ts` + a small `lib/tour-menu/` module:

- action union
- effective settings resolver
- block content schemas (zod for API validation)

---

## Phased delivery

### Phase 0 — Foundations (1 slice)

- Extract **shared** `TourMenuRenderer` from overlay + preview (stop drift).
- Expose orphaned settings that already render (`close`, blur, animation) or delete dead code paths.
- Auth-fix or delete unused blocks CRUD routes.
- Document current action contract.
- **Analytics foundation:** `embed_menu_events` SQL + `trackEmbedMenuEvent` + `POST /api/public/embed/track-menu-event`; log `menu_opened` / `menu_closed` from the live overlay (preview excluded).

### Phase 1 — Chrome + UX shell (high impact)

- Add `menu_style`: `modal` | `drawer` | `icon`.
- Redesign left-column section cards and expanded editors (appearance + chrome first).
- Device toggle wired to at least chrome width / padding / trigger.
- Live preview shows drawer and hamburger behaviours.
- Wire unchanged content blocks into new chrome.
- **Analytics UI:** include `menu_style` + `trigger_source` on open/close; ship **Menu Analytics** dashboard card (opens, open rate, style breakdown).

### Phase 2 — Actions + Nav list

- Unified action model (URL open-in, AI prompt + auto-send, tour point, other tour).
- New **Nav list** block with section headers, optional description under each row, icons.
- Pickers for points / venue tours.
- Embed + viewer + agency runtime for new actions.
- Chat launcher collision rules.
- **Analytics:** `menu_item_clicked` and `menu_ai_prompt_sent`; most-clicked items on the dashboard card (and tour analytics tab).

### Phase 3 — Desktop/mobile depth + playground

- Full `mobile_*` styling parity for typography, colours (as needed), nav density.
- Menu playground / interactive preview for actions.
- Drag-and-drop reorder; polish empty states and summaries.
- Soft-launch table/media if still required.

### Phase 4 — Nice-to-haves (explicitly later)

- Nested submenus (2nd level)
- Multilingual menu copy
- Maps / floor jump UI
- Freeform HTML/CSS (MPskin Pro-style) — **out of scope unless demanded**
- Cross-venue deep links outside the account

---

## UX design notes (builder)

### Expanded section anti-patterns to kill

- Duplicate margin controls (text block)
- Endless unlabeled sliders without live value chips
- Emoji-heavy select labels without structure
- Cosmetic grip icons that do not drag
- Walls of inputs with no grouping or progressive disclosure

### Patterns to use

- Summary line when collapsed: e.g. “Drawer · Left · 360px · 6 items”
- Segmented control for menu style with miniature diagrams
- Action builder as a small wizard (choose type → configure target)
- Destructive delete with confirm (match chatbot delete pattern)
- British English copy throughout

### Chatbot customisation lessons

- Clear desktop vs mobile isolation is worth the schema cost.
- Preview must reflect the active device.
- Do not overwhelm one scroll with every token; use tabs or accordion **with** good defaults and summaries.

---

## Testing plan

- Unit: action resolver, device effective values, migration of old menus → `modal`.
- Component: renderer snapshots for modal / drawer / icon × desktop / mobile.
- Live: `tests/app/tour-menu.live.test.ts` extended — save chrome, public GET shape, embed dismiss/reopen.
- Analytics: track-menu-event accepts open/close/click/AI; dashboard aggregates return opens / open rate / top items; preview mode does not pollute stats.
- Manual matrix: embed, tour viewer, agency portal, with/without chatbot, AI auto-send prompt.
- Regression: existing customer menus still open and look acceptable after migration.

---

## Success criteria

1. A venue can ship a **hamburger drawer** menu with a list of spaces/tour points in under 15 minutes.
2. Expanded builder panels look intentional and consistent with (or better than) chatbot Settings.
3. Desktop and mobile can differ in layout density and trigger placement without “preview-only” lies.
4. Menu items can open chat with a **predefined prompt** that actually sends.
5. One renderer powers builder preview and all production surfaces.
6. Agency portal can configure and visitors can use the same menu.
7. Venues see a **Menu Analytics** dashboard card (opens, open rate, top items, style breakdown where relevant) backed by `embed_menu_events`.

---

## Out of scope (v1–v3 unless reopened)

- Full MPskin HTML/JS/CSS editor
- Tag search / Mattertag category browser inside the menu
- Virtual staging / AR
- Replacing Matterport’s own UI chrome entirely
- Separate billed SKU for “advanced menu” (keep as part of tour/bot product)

---

## Suggested implementation order when executing

1. Phase 0: shared renderer + API hygiene **and** `embed_menu_events` track path (open/close on live overlay).
2. Spec final TypeScript shapes + SQL migration draft in this folder (`schema.md` optional).
3. Phase 1: chrome + builder shell redesign + Menu Analytics dashboard card.
4. Phase 2: nav/actions + click/AI events + embed/agency wiring.
5. Phase 3: device depth + playground.
6. Update this plan’s “Done” checklist as phases land.

---

## Key file map (starting points)

| Concern | Path |
|---------|------|
| Builder | `components/app/tours/menu/tour-menu-builder.tsx` |
| Editors | `components/app/tours/menu/*-editor.tsx`, `global-settings-panel.tsx` |
| Live overlay | `components/embed/tour-menu-overlay.tsx` |
| Widget | `components/embed/tour-menu-widget.tsx` |
| Types | `lib/types.ts` (`TourMenuSettings`, `MenuButton`, …) |
| Hook | `hooks/app/useTourMenu.ts` |
| App API | `app/api/app/tours/[tourId]/menu/` |
| Public API | `app/api/public/menu/[tourId]/` |
| Embed analytics pattern | `lib/embed-analytics.ts`, `app/api/public/embed/track-tour-move/route.ts` |
| New menu track (planned) | `trackEmbedMenuEvent` + `app/api/public/embed/track-menu-event/route.ts` |
| Dashboard cards | `components/app/dashboard/dashboard-content.tsx`, `app/api/app/dashboard/route.ts` |
| Tour analytics | `components/app/tours/tour-analytics.tsx`, `app/api/app/tours/analytics/route.ts` |
| Chatbot device pattern | `components/app/chatbots/shared/customisation-form/` |
| Chatbot effective values | `lib/utils/playground-customisation.ts` |

---

## Locked product decisions (build)

Confirmed 19/07/2026:

| Decision | Locked choice |
|----------|----------------|
| Build scope | **Phases 0–3** in full (shared renderer, analytics, chrome, redesigned builder, nav/actions, deep mobile, playground). Phase 4 stays out. |
| Default style for **new** menus | `drawer`, left-anchored, starts closed (see Phase 5 — this replaces the old separate `icon` style) |
| Drawer behaviour | Overlay with light scrim (not push) |
| AI auto-send prompt | Visitor-visible in the chat transcript |
| Chat target from menu | **Tour chatbot only** (never website chatbot) |
| Chrome model (19/07/2026 revision) | Two styles only — `modal` \| `drawer`. "Icon" was functionally identical to "drawer" (same panel chrome, same start_open-gated visibility) so it was folded in; whether the trigger button shows is now just the "starts closed" state of either style, not a third style. |

## Open product decisions (resolve at Phase 1 kickoff)

~~Superseded — see Locked product decisions above.~~

---

## Done checklist (Phases 0–6)

Last updated: 19/07/2026

### Phase 0 — Foundations
- [x] Shared `TourMenuRenderer` (`components/embed/tour-menu-renderer.tsx`) used by overlay, preview, playground
- [x] Orphan settings exposed in builder (`show_close_button`, `backdrop_blur`, `entrance_animation`)
- [x] Blocks CRUD routes auth-locked (superseded — route removed entirely in Phase 6, it was never called by the builder)
- [x] SQL `89_tour_menu_revamp.sql` + `90_embed_menu_events.sql` authored (operator runs on DB)
- [x] `trackEmbedMenuEvent` + `POST /api/public/embed/track-menu-event`
- [x] Live overlay logs `menu_opened` / `menu_closed` (preview excluded)

### Phase 1 — Chrome + UX
- [x] `menu_style`: modal | drawer | icon; new menus default to `icon` + left
- [x] Redesigned builder section cards (Style, Appearance, Trigger, Content)
- [x] Device toggle drives chrome width / padding / trigger fields
- [x] Chat launcher collision preference (`avoid_chat_launcher`)
- [x] Dashboard **Menu Analytics** card (opens, open rate, style breakdown, top items)

### Phase 5 — Chrome/UX simplification (19/07/2026)

The three-way `modal` / `drawer` / `icon` split and standalone "Trigger" section felt
retrofitted and confused venue owners ("what's a trigger?"). "Icon" and "drawer" already
rendered identically (both are the side-panel chrome, gated only by `start_open`), so this
phase collapsed the model instead of continuing to compact its UI:

- [x] `menu_style` reduced to `modal` \| `drawer` (SQL `91_tour_menu_style_simplify.sql` backfills
      existing `icon` rows to `drawer` — behaviour-preserving, not just a rename)
- [x] Standalone **Trigger** section removed; the trigger button (icon, corner, colour) now lives
      inline inside **Style & placement**, only shown when "Starts closed" is selected — it is a
      state of the chosen chrome, not a separate concept
- [x] `avoid_chat_launcher` toggle removed from the UI — always applied automatically by the
      renderer (column kept for compatibility, no longer read from settings)
- [x] `show_reopen_widget` no longer read to decide visibility — the trigger button is simply
      shown whenever the panel is hidden, for either style
- [x] Rarely-tweaked trigger knobs (hover colour, offsets, corner radius, shadow, tooltip) moved
      behind an inline "More options" disclosure instead of always-visible rows
- [x] `ColorPicker` gained a `compact` mode (single-line label + swatch + hex, opens the same
      popover) — used throughout Style & placement, Appearance, and the text/buttons/table block
      editors, replacing the full-width swatch-and-input rows
- [x] Appearance section fields paired into 2-column grids (background + radius, h/v padding,
      close button + backdrop blur) instead of one control per row

### Phase 2 — Nav + actions
- [x] Unified action model + legacy normalisation (`lib/tour-menu`)
- [x] Nav list block + editor (headers, icons, descriptions, actions)
- [x] URL open-in; AI prompt + auto-send to **tour** chat only
- [x] Wired: embed, tour viewer, agency builder, marketing demos
- [x] `menu_item_clicked` / `menu_ai_prompt_sent` tracking
- [x] Tour analytics tab shows menu opens + top item

### Phase 3 — Mobile depth + playground
- [x] Mobile typography / colour / density overrides (text, nav, buttons, logo)
- [x] HTML5 drag-and-drop block reorder
- [x] Action playground in builder
- [x] Table block Add re-enabled with polished editor

### Phase 4 — Explicitly later
- [ ] Nested submenus, maps, multilingual, freeform HTML/CSS

### Phase 6 — Review fixes (19/07/2026)

A second AI reviewed `PostImplementationOverview.md` against the actual code and flagged four
issues; all four were fixed the same day rather than left as documented debt:

- [x] **`NavListBlockEditor` compacted** — was the one editor still using the pre-compact
      `Card`/`Badge`/full-width-`Label` layout despite being the flagship new block type.
      Rewritten to the same `denseFieldClass`/`denseLabelClass`/bordered-`div`-per-item pattern
      as `ButtonsBlockEditor` — no functional change, purely visual density.
- [x] **Single source of truth for widget defaults** — `WIDGET_DEFAULTS` added to
      `lib/tour-menu/index.ts`; `DEFAULT_NEW_MENU_SETTINGS`, the settings `POST` route's upsert
      fallbacks, and `getEffectiveMenuChrome`'s render-time fallbacks all now reference it instead
      of each hardcoding their own (previously disagreeing) literals. SQL
      `92_tour_menu_widget_defaults_and_rate_limit.sql` also realigns the `tour_menu_settings`
      column-level defaults in the database to match, closing the gap for a hypothetical direct
      SQL insert too.
- [x] **Unused blocks CRUD route removed** — `/api/app/tours/[tourId]/menu/blocks` (per-block
      POST/PUT/DELETE + reorder PATCH) was fully built and ownership-checked but never called by
      the builder, which has always used the settings route's replace-all save. Deleted rather
      than wired up: rewiring the builder to granular per-block CRUD would mean diffing local vs.
      last-saved block state for create/update/delete, a real frontend risk for no gain over the
      already-correct replace-all path.
- [x] **Rate limiting added to `POST /api/public/embed/track-menu-event`** — this public,
      unauthenticated write endpoint had no cap, unlike the lead-capture form which already
      learned this lesson. `checkMenuEventRateLimit` (`lib/embed-menu-event-rate-limiter.ts`)
      enforces 300 events/IP and 5,000 events/venue per 15-minute window, returning `429` past
      that. Required adding `embed_menu_events.ip_address` (SQL 92) since the table previously had
      nowhere to record the IP to count against.

See `PostImplementationOverview.md` §11–12 for the full detail on each of these.
