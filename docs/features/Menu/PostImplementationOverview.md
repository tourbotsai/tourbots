# Tour Menu System — Post-Implementation Overview

Last updated: 19/07/2026 (revised same day after a review pass — see §12)

This document describes the tour menu system **exactly as it exists in the codebase today**. Nothing here is aspirational — every field, function and file path below was read directly from source. For the history of *why* it was built this way, see `ImplemetationPlan.md` in this same folder.

---

## 1. What it is

The tour menu is a configurable overlay that sits on top of a Matterport virtual tour (in the embed, the in-app tour viewer, the agency portal, and the marketing homepage demo). Venue owners build it per-tour in the **Tour Menu Builder** (`/app/tours` → *Menu* tab, also available inside the admin accounts page and the agency portal). Visitors see it as either a centred pop-up (**modal**) or a side panel (**drawer**), containing content blocks — logo, text, buttons, a table, a nav list, spacers — whose items can navigate the tour, switch to another tour, open a URL, or open the AI tour chatbot with a pre-filled prompt.

---

## 2. Data model

Three Postgres tables, defined across `sql/89_tour_menu_revamp.sql`, `sql/90_embed_menu_events.sql`, `sql/91_tour_menu_style_simplify.sql`, and `sql/92_tour_menu_widget_defaults_and_rate_limit.sql` (plus earlier migrations not covered by those, e.g. the base `tour_menu_settings`/`tour_menu_blocks` tables and `sql/64_tour_menu_padding_vertical.sql`, which predate this doc's scope).

### `tour_menu_settings` — one row per tour

One row per `tour_id` (upserted on `tour_id` conflict), scoped by `venue_id`. Columns actually read/written by the app (`lib/types.ts` → `TourMenuSettings`, and the settings upsert in `app/api/app/tours/[tourId]/menu/route.ts`):

| Column | Type | Notes |
|---|---|---|
| `id`, `venue_id`, `tour_id` | uuid | |
| `enabled` | boolean | master on/off switch |
| `show_close_button` | boolean | |
| `menu_style` | text | `'modal'` \| `'drawer'` (constraint `chk_tour_menu_style`; was `'modal'\|'drawer'\|'icon'` until migration 91, which backfilled all `'icon'` rows to `'drawer'`) |
| `anchor_side` | text | `'left'` \| `'right'` — drawer only |
| `start_open` | boolean | whether the menu shows automatically on tour load, or starts hidden behind the reopen/trigger button |
| `avoid_chat_launcher` | boolean | column still exists (default `true`) but is **no longer read** by the renderer — see §4.5 |
| `position` | text | `'center'` \| `'top'` \| `'bottom'` — modal only |
| `max_width` | integer | modal width in px (300–1000) |
| `drawer_width` | integer | drawer width in px (240–560) |
| `padding`, `padding_vertical` | integer | horizontal/vertical inner padding |
| `border_radius` | integer | 0–32px |
| `mobile_max_width`, `mobile_drawer_width`, `mobile_padding`, `mobile_padding_vertical` | integer, nullable | mobile-only overrides; fall back to the desktop column when null |
| `menu_background_color` | text | hex |
| `backdrop_blur` | boolean | |
| `entrance_animation` | text | `'fade-scale'` \| `'slide-up'` \| `'slide-down'` \| `'none'` |
| `show_reopen_widget` | boolean | column still exists (default `true`) but is **no longer read** — see §4.5 |
| `widget_position` | text | `'bottom-left'` \| `'bottom-right'` \| `'top-left'` \| `'top-right'` — column default `'top-left'` (was `'bottom-left'` until migration 92) |
| `widget_icon` | text | `'HelpCircle'` \| `'Info'` \| `'Menu'` — column default `'Menu'` (was `'HelpCircle'` until migration 92) |
| `widget_size` | text | `'small'` \| `'medium'` \| `'large'` |
| `widget_color`, `widget_hover_color`, `widget_icon_color` | text | hex — `widget_icon_color` column default `'#0F172A'` (was `'#EF4444'` until migration 92) |
| `widget_x_offset`, `widget_y_offset` | integer | 0–200px — column default `16` (was `24` until migration 92) |
| `widget_tooltip_text` | text | up to 100 chars — column default `'Open menu'` (was `'Reopen Tour Menu'` until migration 92) |
| `widget_border_radius` | integer | 0–100 — column default `12` (was `50` until migration 92) |
| `widget_shadow_intensity` | text | `'none'` \| `'light'` \| `'medium'` \| `'heavy'` |
| `mobile_widget_position`, `mobile_widget_size` | text, nullable | mobile overrides |
| `created_at`, `updated_at` | timestamptz | |

### `tour_menu_blocks` — many rows per menu

| Column | Notes |
|---|---|
| `id`, `menu_id` (FK to `tour_menu_settings.id`) | |
| `block_type` | `'text'` \| `'buttons'` \| `'logo'` \| `'table'` \| `'spacer'` \| `'nav_list'` (constraint `chk_tour_menu_block_type`) |
| `display_order` | integer, drives render order |
| `alignment` | `'left'` \| `'center'` \| `'right'` |
| `margin_top`, `margin_bottom` | integer px |
| `content` | jsonb — shape depends on `block_type`, see §5 |
| `styling` | jsonb — present in the schema, always saved as `{}` today; nothing in the codebase currently reads or writes real values into it |
| `created_at`, `updated_at` | |

### `embed_menu_events` — analytics, append-only

Created by `sql/90_embed_menu_events.sql`:

```
id uuid, embed_id text, venue_id uuid, tour_id uuid (nullable),
event_type text check in ('menu_opened','menu_closed','menu_item_clicked','menu_ai_prompt_sent'),
menu_style text check in ('modal','drawer','icon') — 'icon' kept here only for backwards
  compatibility with rows recorded before the modal/drawer consolidation; current code never writes it,
trigger_source text,
item_id text, item_label text, item_type text, action_type text, target_ref text,
domain text, page_url text, user_agent text,
ip_address text (nullable — added by migration 92, populated from x-forwarded-for/x-real-ip; used only for rate limiting, see §11),
metadata jsonb default '{}',
created_at timestamptz
```

Row-level security: `service_role` only (inserts/reads happen server-side via `lib/embed-analytics.ts`, never directly from the client). Indexed on `(venue_id, created_at)`, `(venue_id, tour_id, created_at)`, `(venue_id, event_type, created_at)`, `embed_id`, and (since migration 92) `(venue_id, ip_address, created_at)` for the rate-limit count queries.

---

## 3. Settings resolution — `lib/tour-menu/index.ts`

This is the single source of truth for turning a raw `tour_menu_settings` row (or a partially-filled builder draft) into concrete render values. Every consumer (renderer, widget, both settings panels, the analytics event senders) goes through it — there is no other place that reads `menu_style`, `widget_*`, etc. directly for rendering decisions.

### `MenuStyle` / `MenuAnchorSide` / `MenuDevice`
```ts
type MenuStyle = 'modal' | 'drawer';
type MenuAnchorSide = 'left' | 'right';
type MenuDevice = 'desktop' | 'mobile';
```

### `WIDGET_DEFAULTS` (added 19/07/2026)
The single source of truth for reopen-widget fallback values — `position: 'top-left'`, `icon: 'Menu'`, `size: 'small'`, `color: '#FFFFFF'`, `hoverColor: '#F0F0F0'`, `iconColor: '#0F172A'`, `xOffset/yOffset: 16`, `tooltipText: 'Open menu'`, `borderRadius: 12`, `shadowIntensity: 'medium'`. Previously `DEFAULT_NEW_MENU_SETTINGS`, the settings POST route, and `getEffectiveMenuChrome` each hardcoded their own copy of these and disagreed (e.g. `getEffectiveMenuChrome` fell back to `bottom-left`/red/50px-radius while the client default was `top-left`/slate/12px). All three now import and reference `WIDGET_DEFAULTS` instead, so there is exactly one place these values are defined. SQL `92_tour_menu_widget_defaults_and_rate_limit.sql` also brings the `tour_menu_settings` column-level `default` values in the database itself into line, so a direct SQL insert that skips these columns is equally safe.

### `getEffectiveMenuChrome(settings, device): EffectiveTourMenuChrome`
Resolves every chrome-related field, applying device fallback (`mobile_x ?? x`) and hard defaults (from `WIDGET_DEFAULTS`, above) when a field is missing.
- `avoidChatLauncher` is **hardcoded to `true`** in this function — the `avoid_chat_launcher` column is no longer consulted; it always applies.

### `DEFAULT_NEW_MENU_SETTINGS`
The defaults applied client-side in `TourMenuBuilder` for a brand-new (unsaved) menu — the widget-related fields all reference `WIDGET_DEFAULTS`:
```ts
menu_style: 'drawer', anchor_side: 'left', start_open: false, // closed by default — hamburger pattern
position: 'center', max_width: 600, drawer_width: 360, padding: 24, padding_vertical: 0,
border_radius: 16, menu_background_color: '#FFFFFF', backdrop_blur: true,
entrance_animation: 'fade-scale', show_reopen_widget: true,
widget_position: WIDGET_DEFAULTS.position, widget_icon: WIDGET_DEFAULTS.icon, widget_size: WIDGET_DEFAULTS.size,
widget_color: WIDGET_DEFAULTS.color, widget_hover_color: WIDGET_DEFAULTS.hoverColor, widget_icon_color: WIDGET_DEFAULTS.iconColor,
widget_x_offset: WIDGET_DEFAULTS.xOffset, widget_y_offset: WIDGET_DEFAULTS.yOffset, widget_tooltip_text: WIDGET_DEFAULTS.tooltipText,
widget_border_radius: WIDGET_DEFAULTS.borderRadius, widget_shadow_intensity: WIDGET_DEFAULTS.shadowIntensity, avoid_chat_launcher: true,
```

### Action normalisation
`normaliseMenuItemAction(item)` converts either the new unified `item.action` object or the legacy flat fields (`action_type`, `target_id`, `target_tour_id`, `target_model_id`, `target_model_name`, `open_in`, `chat_prompt`, `chat_auto_send`) into one `MenuItemAction`:
```ts
type MenuItemAction =
  | { type: 'tour_point'; tourId?; pointId; modelId?; modelName? }
  | { type: 'tour_model'; tourId; modelId?; modelName? }
  | { type: 'external_url'; url; openIn: 'same_tab' | 'new_tab' }
  | { type: 'open_chat'; prompt?; autoSend? }
  | { type: 'close_menu' }
  | { type: 'none' };
```
`actionToLegacyButtonFields(action)` does the reverse conversion (used nowhere in the current builder UI, kept for compatibility with any code still writing the legacy shape).

### Mobile typography/density helpers
- `getEffectiveTextStyles(content, device)` → `{ fontSize, color, lineHeight, fontWeight }` for **text** blocks, preferring `mobile_font_size`/`mobile_color`/`mobile_line_height` on mobile, falling back to the desktop field, then to `16px` / `#000000` / `1.5`.
- `getEffectiveNavDensity(content, device)` → `{ itemPaddingY, labelFontSize, descriptionFontSize }` for **nav_list** blocks, derived from a `density` (`compact`|`comfortable`|`spacious`) preset map (padding 8/12/16px, label 13/14/15px, description 11/12/13px), each individually overridable and each with a `mobile_*` counterpart.

### `MenuTriggerSource`
```ts
type MenuTriggerSource = 'auto_open' | 'reopen_widget' | 'icon_button' | 'close_control' | 'backdrop' | 'item_action';
```
Used purely for analytics labelling (see §8) — it has no effect on rendering.

---

## 4. Chrome / style model

### 4.1 Two styles only
`menu_style` is either:
- **`modal`** — a centred (or top/bottom-anchored) pop-up card over a scrim.
- **`drawer`** — a full-height side panel anchored left or right, over a lighter scrim.

There used to be a third style, `'icon'`, which rendered identically to `drawer` (both were "panel chrome", both gated purely by `start_open`) — it was removed on 19/07/2026 because it was a redundant, confusing distinction. Migration 91 backfilled any existing `'icon'` rows to `'drawer'`. `TourMenuRenderer` still derives panel-vs-modal with `chrome.menuStyle !== "modal"`, which is now equivalent to `=== "drawer"`.

### 4.2 Layout fields per style
- **Modal**: `position` (`top`/`center`/`bottom`) and `max_width` (300–1000px, device-scoped).
- **Drawer**: `anchor_side` (`left`/`right`) and `drawer_width` (240–560px, device-scoped).
- Both styles also read `border_radius`, `padding`/`padding_vertical` (device-scoped), `menu_background_color`, `backdrop_blur`, `entrance_animation`, `show_close_button`.

### 4.3 "On load" state — `start_open`
A single boolean, presented in the builder as a two-way choice ("Opens automatically" / "Starts closed") that applies to **either** chrome style — it is not a separate style. This is what used to be the "icon" style's defining behaviour.
- `start_open = true`: the menu is visible as soon as the tour loads.
- `start_open = false`: the menu is hidden; only the trigger/reopen button (`TourMenuWidget`) is shown.

### 4.4 Reopen / trigger button (`TourMenuWidget`)
`components/embed/tour-menu-widget.tsx` renders a single floating round/rounded button (icon: `HelpCircle` | `Info` | `Menu`, from `lucide-react`), sized via `WIDGET_SIZE_MAP` (`small`=40px, `medium`=56px, `large`=72px button / 20/28/36px icon from `WIDGET_ICON_SIZE_MAP`), positioned at one of 4 corners with configurable x/y offset, fill colour, hover colour, icon colour, corner radius, and shadow (`WIDGET_SHADOW_MAP`: none/light `0 2px 8px rgba(0,0,0,.1)`/medium `0 4px 12px rgba(0,0,0,.15)`/heavy `0 8px 24px rgba(0,0,0,.25)`).

As of 19/07/2026 the widget component has **no internal visibility gate of its own** — it no longer checks `show_reopen_widget` or a special "icon style" case. Whether it's on screen is decided entirely by the parent (`TourMenuOverlay`/`TourMenuPreview`), which only mounts it while the panel/modal itself is hidden. In practice this means: whenever the menu is closed (whether because it started closed, or because a visitor dismissed it), the reopen button is shown — for both `modal` and `drawer`.

### 4.5 Settings that exist in the schema but are no longer surfaced in the UI
- **`avoid_chat_launcher`**: the "keep clear of chat button" toggle was removed from the settings panel. `getEffectiveMenuChrome` now always returns `avoidChatLauncher: true`, so `TourMenuWidget` always nudges the trigger button by `CHAT_LAUNCHER_CLEARANCE_PX = 64px` when its position is `bottom-right` (the AI chat launcher's usual corner). The DB column is untouched (still written with its default of `true` on every save) purely for backward compatibility — nothing reads its actual value any more.
- **`show_reopen_widget`**: as above, no longer read for the visibility decision. The column is still saved (defaulting to `true`) by the settings API but has no effect.

---

## 5. Content blocks

Blocks are rendered in `display_order` by the single shared `TourMenuRenderer` (`components/embed/tour-menu-renderer.tsx`) — the exact same function used in the builder's live preview, the live embed overlay, the in-app tour viewer, and the marketing homepage demo. There is no separate "preview renderer" vs "live renderer".

Each block has `id`, `menu_id`, `block_type`, `display_order`, `alignment` (`left`/`center`/`right`), `margin_top`/`margin_bottom` (px), `content` (typed per block, below), `styling` (always `{}` today).

### `text`
```ts
{ text_type: 'header'|'subheader'|'paragraph', text, font_size, font_weight: 'light'|'normal'|'semibold'|'bold',
  color, line_height, mobile_font_size?, mobile_color?, mobile_line_height? }
```
Renders a `<p>` with the effective (device-resolved) font size/colour/line-height and a Tailwind font-weight class. Returns `null` (renders nothing) if `text` is empty.

### `buttons`
```ts
{ buttons: MenuButton[], buttons_per_row: 1|2|3|4, mobile_buttons_per_row?, button_size: 'small'|'medium'|'large',
  mobile_button_size?, button_style: 'solid'|'outline'|'ghost', gap }
```
Each `MenuButton` has `id`, `label`, an action (either the new `action` object or legacy `action_type`/`target_*`/`open_in`/`chat_prompt`/`chat_auto_send`), `button_color`, `text_color`, optional `icon`. Rendered as a CSS grid (`buttons_per_row` columns) of buttons whose fill/border/text colour depend on `button_style` (`solid` = coloured background, `outline` = 2px border, `ghost` = text-only hover). A button whose action needs the tour SDK (anything except `close_menu`/`none`) is disabled with a spinner while `isTourReady` is false. Renders nothing if the buttons array is empty.

### `nav_list`
```ts
{ items: NavListItem[], density?: 'compact'|'comfortable'|'spacious', mobile_density?,
  item_padding_y?, mobile_item_padding_y?, label_font_size?, mobile_label_font_size?,
  description_font_size?, mobile_description_font_size? }
```
`NavListItem` is either a **header** (`kind: 'header'`, just a `label`, rendered as small uppercase muted text) or an **item** (`kind: 'item'`, `label`, optional `description`, optional `icon` — one of `MapPin`, `Compass`, `Link2`, `MessageCircle`, `Home`, `Info`, `Star` — plus an action). Non-header rows with a real action render as a clickable row with a trailing chevron (or spinner while the tour isn't ready); rows whose action resolves to `none` render as static (non-clickable) text. Renders nothing if `items` is empty.

### `logo`
```ts
{ image_url, width, height, desktop_size?, mobile_size?, alt_text }
```
`desktop_size`/`mobile_size` are the values the current UI actually edits (a single square dimension, 12–196px desktop / 12–128px mobile); `width`/`height` are the legacy pair, still written alongside for backward compatibility and used as a fallback if `desktop_size` is absent. Renders nothing if `image_url` is empty.

### `table`
```ts
{ headers: string[], rows: string[][], header_background, border_color, text_size }
```
A plain HTML `<table>`. Renders nothing if `headers` is empty.

### `spacer`
```ts
{ height }
```
An empty `<div>` of that height, clamped to 0–200px at render time.

---

## 6. Rendering pipeline

### `TourMenuRenderer` (shared, `components/embed/tour-menu-renderer.tsx`)
Props: `settings`, `blocks`, `isVisible`, `isMobile`, `isTourReady`, `isChatAvailable`, `mode: "live"|"preview"`, `onClose(triggerSource)`, `onItemActivate(item)`, `onOpenChat(opts?)`.
- Resolves chrome via `getEffectiveMenuChrome`.
- `activate(rawItem, itemType)`: normalises the item's action; if it's `close_menu` or `open_chat`, handles it directly (calling `onClose`/`onOpenChat`); if it's `none`, does nothing; everything else (`tour_point`, `tour_model`, `external_url`) is handed up to the host via `onItemActivate`.
- In `preview` mode with zero blocks, shows a builder-only empty state ("No content blocks… Add blocks on the left to see them here"); in `live` mode it just renders nothing for an empty block list.
- Draws either the modal (centred/top/bottom, backdrop scrim opacity 0.5, optional blur) or the drawer (full-height side panel, backdrop scrim opacity 0.15, optional blur), each with the configured entrance animation and an optional close (×) button in the top-right.

### `TourMenuWidget` (`components/embed/tour-menu-widget.tsx`)
The floating reopen/trigger button described in §4.4. Props: `settings`, `onClick`, `isVisible` (opacity/scale toggle for its own mount/unmount transition — distinct from whether it's rendered at all), `isMobile`.

### `TourMenuOverlay` (`components/embed/tour-menu-overlay.tsx`)
The stateful controller used on the **live** embed, the tour viewer preview, and the marketing demo. Owns:
- `menuData` (fetched settings+blocks), `isVisible`, `isLoading`, `showWidget`, `isMobile`.
- On mount (or tour change): fetches `GET /api/public/menu/{tourId}` (unless `initialMenuData` was passed in for SSR-instant paint), applies session-storage dismissal state (`tour-menu-dismissed-{tourId}`, skipped in preview mode) and `chrome.startOpen` to decide whether to show the menu or the widget first.
- `handleClose(triggerSource)`: hides the menu, marks it dismissed in `sessionStorage`, shows the widget after a 300ms fade, fires a `menu_closed` analytics event.
- `handleWidgetClick()`: hides the widget, clears the dismissed flag, shows the menu after a 200ms delay, fires a `menu_opened` event with `triggerSource` = `'icon_button'` if `chrome.startOpen` is false (this is the menu's primary/only way to open) or `'reopen_widget'` if it's true (the visitor is reopening after dismissing an auto-shown menu).
- `handleItemActivate(item)`: routes `tour_point` (fetches the point via `GET /api/public/tours/points/{pointId}`, dispatches a `matterport_navigate` window event, switching model first via a `switch_matterport_model` event if needed), `tour_model` (dispatches `switch_matterport_model` directly, temporarily hides menu+widget for 1.5s during the transition), and `external_url` (opens the URL, validating it's `http(s)`, respecting `same_tab`/`new_tab`) — each also fires a `menu_item_clicked` event.
- `handleOpenChatFromRenderer(opts)`: fires `menu_item_clicked` (and `menu_ai_prompt_sent` if `opts.autoSend`), calls the host's `onOpenChat`, then closes the menu.
- Renders either `<TourMenuWidget>` (if `!isVisible`) or `<TourMenuRenderer mode="live">`.

### `TourMenuPreview` (`components/app/tours/menu/tour-menu-preview.tsx`)
The builder's live-preview pane (and, since the standalone "action playground" was removed, the **only** interactive preview in the builder). Wraps `TourMenuRenderer mode="preview"` + `TourMenuWidget` inside a device frame (a plain 4:3 box for desktop, a phone-shaped frame with rounded bezel for mobile). It fully simulates interaction without a real tour:
- `external_url` actions actually navigate (`window.location.assign` same-tab, or `window.open` new-tab) — this is real, not simulated.
- Everything else (`tour_point`, `tour_model`, `open_chat`) shows a toast describing what would happen (via `describeAction`), since there's no live Matterport SDK in the builder.

---

## 7. Builder UI

### `TourMenuBuilder` (`components/app/tours/menu/tour-menu-builder.tsx`)
Top-level component, rendered wherever the menu is edited (see §9). Layout: a header card (title, Desktop/Mobile device toggle, Show/Hide preview toggle, Save & Publish button) above a responsive grid — settings on the left, live preview on the right (or stacked, via `layoutMode="stacked"`, used by the agency portal).
- Loads/saves via `useTourMenu(tourId)`.
- Local editable state (`settings`, `blocks`) is separate from the saved state; `handleSave()` calls `saveMenu(settings, blocks)`, which `POST`s the full settings+blocks payload and re-fetches afterwards.
- The Content-blocks section is auto-expanded the first time a tour is found to already have blocks (tracked via a ref so it only fires once per mount).

### `GlobalSettingsPanel` (`components/app/tours/menu/global-settings-panel.tsx`)
Two collapsible sections (both default **closed**):
1. **Style & placement** — chrome type picker (2 cards: Modal/Drawer, each with a small diagram), the style-specific layout fields (§4.2), the "On load" segmented choice (§4.3), and — only when "Starts closed" is selected — an inline **Reopen button** sub-panel: corner (2×2 grid), icon + size (Select + segmented S/M/L), fill + icon colour (compact swatches), and a "More options" disclosure for hover colour, offsets, corner radius, shadow intensity, and tooltip text.
2. **Appearance** — background colour + corner radius (2-up grid), horizontal/vertical padding (2-up grid), close-button/backdrop-blur toggles (2-up grid), entrance animation select.

Between these two sections sits the `contentBlocksSlot` (rendered by the parent — see below), so the on-screen order is Style → Content → Appearance.

Shared local primitives defined in the same file: `SettingsSection` (collapsible card with icon/title/one-line summary), `FieldGroup` (uppercase mini-label + stacked children), `SettingsRow` (label+description left, control right), `SliderField` (label+value+`Slider`), `SegmentedChoice` (pill-style multi-option toggle), `MoreOptions` (chevron-toggle disclosure).

### `menu-editor-primitives.tsx`
Reusable dense-editor building blocks used by the block editors: `AlignmentToggle` (3-icon left/center/right toggle), `CompactRow` (label left, control right), `CompactSlider` (label+value+`Slider` in minimal vertical space), and the class constants `denseFieldClass` (`"h-8 text-xs"`) / `denseLabelClass`.

### `ColorPicker` (`components/app/chatbots/shared/color-picker.tsx`)
Shared HSV colour picker (also used throughout the chatbot customisation screens) backed by a `Popover`. As of 19/07/2026 it accepts a `compact` prop:
- `compact={false}` (default, unchanged behaviour): a full-width row — a large swatch button (opens the picker) plus a separate always-visible hex `<Input>`.
- `compact={true}`: a single-line button — small label on the left, a small round swatch + hex text on the right — that opens the exact same picker popover. Used throughout the menu builder (Style & placement's reopen-button colours, Appearance's background colour, and the text/buttons/table block editors' colour fields) to avoid the "one whole row per colour" bulkiness the non-compact variant has.

### `BlocksList` (`components/app/tours/menu/blocks-list.tsx`)
- An "add block" strip of 6 buttons (Text, Buttons, Nav, Logo, Table, Spacer — `ADD_ACTIONS`), each appending a block with sensible default `content` (see `getDefaultContent`).
- Renders one `BlockEditor` per block, in `display_order`.
- Implements HTML5 drag-and-drop reordering (`draggable`, `onDragStart`/`onDragOver`/`onDragEnd`/`onDrop`) alongside explicit ↑/↓ move buttons (`moveBlock`) for accessibility/no-JS-drag fallback. Both paths re-number `display_order` on every change.

### `BlockEditor` (`components/app/tours/menu/block-editor.tsx`)
Per-block collapsible card (collapsed by default). Header: drag handle, block-type label, index badge (`#1`, `#2`, …), move up/down, expand/collapse, delete. Body (when expanded): the block-type-specific editor, followed (for every type except `spacer`) by shared Top/Bottom margin sliders (0–80px).

### Block-type editors
- **`TextBlockEditor`**: type select (header/subheader/paragraph) + alignment toggle; content textarea/input; weight select + compact colour row; font-size and line-height compact sliders (line-height stored ×10 internally for slider step granularity, displayed as e.g. `1.5`). All of font size/colour/line-height are device-scoped (`mobile_*` fallback pattern).
- **`ButtonsBlockEditor`**: per-row count (desktop+mobile), style (solid/outline/ghost); size (desktop+mobile) + alignment; gap slider; then one card per button with label, action-type select, action-specific fields (tour picker → point picker for `tour_point`; tour picker for `tour_model`; URL + open-in for `url`; prompt + auto-send switch for `open_chat`), and compact fill/text colour rows. Fetches the venue's active tours (and, lazily per tour, its saved tour points) via `/api/app/tours/venue/{venueId}/all` and `/api/app/tours/{tourId}/points`.
- **`LogoBlockEditor`**: `LogoUpload` (drag/drop or click, PNG/JPEG/SVG/WebP, 2MB limit, opens `LogoCropModal` for non-SVG raster uploads before actually uploading the cropped PNG), a device-scoped size slider (12–196px desktop, 12–128px mobile), alt-text input, alignment toggle.
- **`LogoUpload`**: uploads to `/api/app/tours/menu/upload-logo` (or, inside the agency portal embed, the cookie/CSRF-authenticated `/api/public/agency-portal/tour-menu/upload-logo`); shows a 64px-tall preview strip with inline Crop/Remove actions once an image exists.
- **`LogoCropModal`**: `react-image-crop`-based square/free crop dialog; crops client-side to a canvas, produces a PNG blob, then calls the same upload path.
- **`TableBlockEditor`**: header/row text inputs with add/remove column/row buttons; header-fill and border compact colour rows; text-size number input; alignment toggle.
- **`SpacerBlockEditor`**: a single compact height slider (8–128px) plus a live visual preview strip.
- **`NavListBlockEditor`**: row-density select (compact/comfortable/spacious, device-scoped); add-header / add-item buttons; per-item bordered card with label, (for items, not headers) description, icon name (free-text, matched against the renderer's icon map), action-type select and the same action-specific fields as the buttons editor, plus up/down/delete controls. Brought into the compact pattern (`denseFieldClass`/`denseLabelClass`, `h-8` controls, plain `div` cards) later on 19/07/2026, matching `ButtonsBlockEditor`.

---

## 8. Actions & the AI-chat integration

Both `MenuButton` and `NavListItem` support the same action surface, normalised by `normaliseMenuItemAction` (§3):
- **`tour_point`** — navigate the camera to a saved sweep position. Needs `pointId` (+ optionally `tourId`/`modelId`/`modelName` when the point lives on a different Matterport model than the one currently loaded).
- **`tour_model`** — switch to a different tour (a different Matterport model) inside the same viewer.
- **`external_url`** — open an arbitrary `http(s)` URL, same-tab or new-tab.
- **`open_chat`** — open the AI **tour chatbot** (never the website chatbot — this was an explicit locked decision, see `ImplemetationPlan.md`), optionally with a pre-filled `prompt`, optionally auto-sent (`autoSend`) as soon as chat opens.
- **`close_menu`** — just closes the menu, handled entirely inside `TourMenuRenderer` (never bubbles up).
- **`none`** — static label, no interaction (renders disabled/non-clickable).

The `open_chat` → prompt hand-off is plumbed through three call sites that all follow the same pattern: `TourMenuOverlay`'s `onOpenChat` callback is passed down from the host, which stores `{ prompt, autoSend }` in local state and forwards it to `TourChatWidget` as `externalPrompt`/`externalAutoSend`, clearing them via `onExternalPromptConsumed` once the chat widget has used them. The three hosts wired this way are `tour-viewer.tsx` (in-app preview, both windowed and fullscreen), `app/embed/tour/[venueId]/tour-embed-client.tsx` (the live production embed), and `components/website/home/hero/TourDemo.tsx`/`FullscreenOverlay.tsx` (marketing homepage demo).

---

## 9. Where the builder and the live menu are mounted

**`<TourMenuBuilder>`** (editing UI):
- `app/(app)/app/tours/page.tsx` — the venue's own "Menu" tab.
- `app/(admin)/admin/accounts/[id]/page.tsx` — platform-admin per-account view, "Menu" tab.
- `app/embed/agency/[shareSlug]/agency-portal-shell.tsx` — the agency portal share view, "Menu" tab (`layoutMode="stacked"`).

**`<TourMenuOverlay>`** (live rendering):
- `app/embed/tour/[venueId]/tour-embed-client.tsx` — the actual production `<iframe>` embed venues put on their websites. Passes `venueId`/`embedId` so analytics fire.
- `components/app/tours/tour-viewer.tsx` — the in-app tour viewer, used both as a preview (`isPreviewMode`, no analytics, no session-storage dismissal) and — via the same component — the account's own "Viewer" tab.
- `components/website/home/hero/TourDemo.tsx` — the interactive tour demo on the public marketing homepage.

**Data fetching**: the live overlay always calls the public, unauthenticated `GET /api/public/menu/{tourId}` (single query joining `tour_menu_settings` to `tour_menu_blocks` via Supabase's embedded-resource syntax, returns `{ settings: null, blocks: [] }` if there's no enabled menu for that tour). The builder's `useTourMenu` hook instead calls the authenticated `GET /api/app/tours/{tourId}/menu`, with an automatic fallback to the public route when running inside the agency portal without a bearer token (401/403).

---

## 10. API surface

All authenticated menu routes share one access gate, `resolveMenuRouteAccess` (`lib/tour-menu/route-access.ts`): it accepts either a Bearer-token app session (scoped to the tour's own venue, with a platform-admin bypass to any venue) **or** an agency-portal share session with the `tour` module enabled and CSRF-checked.

- **`GET /api/app/tours/[tourId]/menu`** — returns `{ settings, blocks }` for the authenticated/portal caller.
- **`POST /api/app/tours/[tourId]/menu`** — full replace: validates every enum/range field server-side (menu_style ∈ {modal, drawer}, anchor_side, widget_position, widget_icon, widget_size, widget_shadow_intensity, hex colours, numeric ranges, block_type/alignment/content-present for each block), upserts the settings row (`onConflict: 'tour_id'`), then **deletes all existing blocks for that menu and re-inserts the full array** it was sent (not a diff/patch).
- **`PUT /api/app/tours/[tourId]/menu`** — partial settings-only update; only fields in an explicit allow-list are applied.
- **`GET /api/public/menu/[tourId]`** — public, unauthenticated, only returns a menu if `enabled = true`.
- **`POST /api/app/tours/menu/upload-logo`** / **`DELETE`** — authenticated logo upload/delete into the `chatbots` storage bucket, under `tour-menus/{venueId}/{tourId}/logos/`, 2MB limit, PNG/JPEG/SVG/WebP only.
- **`POST /api/public/agency-portal/tour-menu/upload-logo`** — the cookie/CSRF-authenticated equivalent for the agency portal embed.
- **`POST /api/public/embed/track-menu-event`** — Zod-validated analytics ingestion (`eventType` ∈ the 4 event types, `menuStyle` ∈ {modal, drawer, icon} for legacy-row compatibility, everything else optional/nullable strings), rate-limited per IP/venue (see §11), calls `trackEmbedMenuEvent`.
- A standalone `/api/app/tours/[tourId]/menu/blocks` per-block CRUD route (POST/PUT/DELETE + a reorder `PATCH`) previously existed alongside the replace-everything `POST` above but was never called by the builder — removed on 19/07/2026 as dead code (see §12).

---

## 11. Analytics

### Event capture
`trackEmbedMenuEvent` (`lib/embed-analytics.ts`) writes one row to `embed_menu_events`, but first drops the event entirely if the page URL is an internal dashboard page (`/app/tours`, `/app/chatbots`, `/app/settings`, `/app/dashboard`) or the `embedId` has an internal-only prefix (`demo-widget-`, `tour-widget-`, `playground-widget-`, `preview-widget-`, `config-`). `TourMenuOverlay` calls this indirectly via a `fetch` to the public track route (fire-and-forget, errors swallowed) at four points: menu opened (both auto-open and reopen), menu closed, item clicked, and AI prompt auto-sent.

### Rate limiting (added 19/07/2026)
The public `POST /api/public/embed/track-menu-event` route is unauthenticated by design (it fires from the visitor's browser before any auth context exists), which makes it a spam/cost target — the same class of risk previously identified and fixed on the lead-capture form. `checkMenuEventRateLimit` (`lib/embed-menu-event-rate-limiter.ts`) counts rows in `embed_menu_events` in a rolling 15-minute window and rejects with `429` once either limit is hit: 300 events from one IP, or 5,000 events for one venue. These are deliberately generous — the goal is capping a scripted flood, not bounding normal visitor interaction (a visitor clicking through a nav-heavy menu can legitimately fire many `menu_item_clicked` events). The client IP is read the same way as the lead-capture route (`x-forwarded-for`, falling back to `x-real-ip`) and is now also stored on the row (`embed_menu_events.ip_address`, added in SQL `92_tour_menu_widget_defaults_and_rate_limit.sql`) so the count queries can actually filter by it.

### Where it surfaces
1. **Dashboard "Menu Analytics"** — `getMenuAnalytics()` in `app/api/app/dashboard/route.ts`, last 7 days: total opens, an open-rate (`opens / max(weeklyTourViews, 1) × 100`), top-5 clicked item labels, and a style-breakdown by `menu_style` on `menu_opened` rows. Wrapped in its own try/catch so a missing `embed_menu_events` table (pre-migration-90 environments) doesn't break the rest of the dashboard.
2. **Tour Analytics tab** (`components/app/tours/tour-analytics.tsx`, fed by `app/api/app/tours/analytics/route.ts`) — a "Menu opens" KPI card showing the total open count and the single top-clicked item label, scoped to that specific tour (last 2000 events, no time window).

---

## 12. Behavioural notes / known inconsistencies

The four items below were flagged in a 19/07/2026 review pass and fixed the same day; kept here as a record of what changed and why, since the previous version of this document described them as open issues.

- **`styling` jsonb column on blocks is still unused** — always saved as `{}`, never read by the renderer or any editor. Left as-is (schema-compatible, zero behavioural risk to remove later if a per-block style override is ever built).
- **Two block save paths → resolved by removing the unused one.** The dedicated `/api/app/tours/[tourId]/menu/blocks` CRUD route (per-block POST/PUT/DELETE + a reorder `PATCH`, with ownership verification on every mutation) was fully implemented and had a basic API test, but the builder's `useTourMenu` hook only ever mutated blocks in local state and relied on the settings route's delete-all-then-reinsert `POST` for persistence — nothing in the app called the CRUD route. Rewiring the builder to the granular path would have meant tracking per-block create/update/delete diffs against the last-saved state, a real (and riskier) frontend change for no functional gain over the existing replace-all save, which already works correctly. Deleted the route instead (`app/api/app/tours/[tourId]/menu/blocks/route.ts`); the one save path (replace-all `POST /api/app/tours/[tourId]/menu`) is now the only one that exists.
- **Three disagreeing sets of widget defaults → resolved with a single source of truth.** `WIDGET_DEFAULTS` (`lib/tour-menu/index.ts`) is now the only place these values are defined — `position: 'top-left'`, `icon: 'Menu'`, `size: 'small'`, `color: '#FFFFFF'`, `hoverColor: '#F0F0F0'`, `iconColor: '#0F172A'`, `xOffset/yOffset: 16`, `tooltipText: 'Open menu'`, `borderRadius: 12`, `shadowIntensity: 'medium'`. `DEFAULT_NEW_MENU_SETTINGS`, the `POST /api/app/tours/[tourId]/menu` upsert fallbacks, and `getEffectiveMenuChrome`'s render-time fallbacks all now reference this constant instead of re-typing (and silently disagreeing on) their own literals. SQL `92_tour_menu_widget_defaults_and_rate_limit.sql` also realigns the `tour_menu_settings` column-level defaults (set in `4_tour_menu_initial.sql`, previously `bottom-left`/`HelpCircle`/red/`50`px-radius) to match `WIDGET_DEFAULTS`, so even a direct SQL insert that omits these columns now gets the same values as every other path. Existing rows are untouched — this only changes what a *new*, sparsely-populated row would get.
- **`NavListBlockEditor` compacted.** Rewritten to match the dense pattern used everywhere else (`denseFieldClass`/`denseLabelClass` from `menu-editor-primitives.tsx`, `h-8` inputs/selects, 2-column grids for description/icon, plain bordered `div` per-item cards instead of `Card`/`CardContent`/`Badge`, `h-6` icon-only reorder/delete buttons) — no functional change, just brought in line with `buttons-block-editor.tsx` and the other block editors.
- **Rate limiting added to the public menu-event tracking endpoint.** See §11 "Rate limiting" — previously this was flagged as a spam/cost risk with no mitigation (the endpoint is unauthenticated and had no per-IP/per-venue cap, unlike the lead-capture form). Now enforced via `checkMenuEventRateLimit`.

## 13. Explicitly out of scope (Phase 4, not built)

Nested/multi-level submenus, maps, multilingual content, and a freeform HTML/CSS block — see `ImplemetationPlan.md` §"Phase 4 — Explicitly later".
