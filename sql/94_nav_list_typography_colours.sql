-- 94_nav_list_typography_colours.sql
-- Nav list block typography + colour defaults (stored in tour_menu_blocks.content jsonb).
--
-- Adds optional keys to existing nav_list blocks so the builder/renderer can rely on
-- consistent defaults. Per-item colour overrides live on each items[] entry and are
-- not backfilled (absence = inherit block global colours).
--
-- Content keys (block-level / Global panel):
--   font_family, font_weight, font_size, line_height, letter_spacing
--   header_color, label_color, description_color, icon_color
--
-- Content keys (per items[] entry, optional overrides):
--   label_color, description_color, icon_color
--
-- Run after 93_tour_menu_premium_chrome.sql.
-- Safe to re-run: only fills missing keys.

-- ---------------------------------------------------------------------------
-- Backfill block-level defaults on existing nav_list content
-- ---------------------------------------------------------------------------
update public.tour_menu_blocks
set content = content
  || jsonb_build_object(
    'font_family', coalesce(content->>'font_family', 'inherit'),
    'font_weight', coalesce(content->>'font_weight', 'normal'),
    'font_size', coalesce(
      (content->>'font_size')::numeric,
      (content->>'label_font_size')::numeric,
      14
    ),
    'line_height', coalesce((content->>'line_height')::numeric, 1.35),
    'letter_spacing', coalesce((content->>'letter_spacing')::numeric, 0),
    'header_color', coalesce(content->>'header_color', '#64748B'),
    'label_color', coalesce(content->>'label_color', '#1E293B'),
    'description_color', coalesce(content->>'description_color', '#64748B'),
    'icon_color', coalesce(content->>'icon_color', '#64748B')
  )
where block_type = 'nav_list';
