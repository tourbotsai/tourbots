-- 95_nav_list_entries.sql
-- Nav list items can have multiple description + action pairs under one label.
-- Stored as items[].entries[] inside tour_menu_blocks.content (jsonb).
--
-- Legacy single description/action_* fields are migrated into a one-element
-- entries array. Runtime still accepts legacy items without entries.
--
-- Run after 94_nav_list_typography_colours.sql.
-- Safe to re-run: skips items that already have a non-empty entries array.

update public.tour_menu_blocks b
set content = jsonb_set(
  b.content,
  '{items}',
  coalesce(
    (
      select jsonb_agg(migrated.item order by migrated.ord)
      from (
        select
          t.ord,
          case
            when t.elem ? 'entries'
              and jsonb_typeof(t.elem->'entries') = 'array'
              and jsonb_array_length(t.elem->'entries') > 0
            then t.elem
            when coalesce(t.elem->>'kind', 'item') = 'header'
            then t.elem
            else t.elem || jsonb_build_object(
              'entries',
              jsonb_build_array(
                jsonb_strip_nulls(
                  jsonb_build_object(
                    'id', coalesce(t.elem->>'id', 'nav') || '-e0',
                    'description', coalesce(t.elem->>'description', ''),
                    'action_type', coalesce(t.elem->>'action_type', 'none'),
                    'target_id', coalesce(t.elem->>'target_id', ''),
                    'target_tour_id', t.elem->'target_tour_id',
                    'target_model_id', t.elem->'target_model_id',
                    'target_model_name', t.elem->'target_model_name',
                    'open_in', t.elem->'open_in',
                    'chat_prompt', t.elem->'chat_prompt',
                    'chat_auto_send', t.elem->'chat_auto_send'
                  )
                )
              )
            )
          end as item
        from jsonb_array_elements(coalesce(b.content->'items', '[]'::jsonb))
          with ordinality as t(elem, ord)
      ) as migrated
    ),
    '[]'::jsonb
  )
)
where b.block_type = 'nav_list'
  and b.content ? 'items';
