-- 96_nav_list_item_spacing.sql
-- Per-item vertical spacing for nav_list rows (jsonb on tour_menu_blocks.content).
--
-- Block-level (Global panel):
--   item_padding_y — px padding above/below each nav row (overrides density preset)
--
-- Per items[] entry (Item panel, after Label):
--   item_padding_y — optional override; omit to inherit block Global value
--
-- No new columns — content is jsonb. This migration only seeds a sensible
-- block-level item_padding_y from density when missing, so the Global slider
-- has an explicit starting value.
--
-- Run after 95_nav_list_entries.sql. Safe to re-run.

update public.tour_menu_blocks
set content = content || jsonb_build_object(
  'item_padding_y',
  coalesce(
    (content->>'item_padding_y')::numeric,
    case coalesce(content->>'density', 'comfortable')
      when 'compact' then 8
      when 'spacious' then 16
      else 12
    end
  )
)
where block_type = 'nav_list'
  and (content->>'item_padding_y') is null;
