-- 98_atomic_chatbot_custom_action_replace.sql
-- Replaces a chatbot's custom actions atomically while preserving action IDs
-- and signing secrets for unchanged action keys.

create or replace function public.replace_chatbot_custom_actions(
  p_chatbot_config_id uuid,
  p_venue_id uuid,
  p_tour_id uuid,
  p_actions jsonb
)
returns setof public.chatbot_custom_actions
language plpgsql
as $$
declare
  v_action jsonb;
  v_action_key text;
  v_action_keys text[] := array[]::text[];
  v_rotate_secret boolean;
begin
  if jsonb_typeof(p_actions) <> 'array' then
    raise exception 'p_actions must be a JSON array';
  end if;

  -- Serialise replacement requests for one chatbot configuration.
  perform pg_advisory_xact_lock(hashtext(p_chatbot_config_id::text));

  -- Confirm the caller's already-authorised scope while locking existing rows.
  perform 1
  from public.chatbot_configs
  where id = p_chatbot_config_id
    and venue_id = p_venue_id
    and tour_id is not distinct from p_tour_id
  for update;

  if not found then
    raise exception 'Chatbot configuration not found in the requested scope';
  end if;

  for v_action in
    select value
    from jsonb_array_elements(p_actions)
  loop
    v_action_key := btrim(v_action->>'action_key');
    if v_action_key is null or v_action_key = '' then
      raise exception 'action_key is required';
    end if;
    if v_action_key = any(v_action_keys) then
      raise exception 'action_key values must be unique';
    end if;
    v_action_keys := array_append(v_action_keys, v_action_key);

    v_rotate_secret := coalesce((v_action->>'rotate_secret')::boolean, false);

    insert into public.chatbot_custom_actions (
      chatbot_config_id,
      venue_id,
      tour_id,
      name,
      action_key,
      mode,
      is_active,
      description,
      webhook_url,
      signing_secret,
      condition_type,
      condition_keywords,
      condition_intent,
      condition_message_count,
      display_order
    )
    values (
      p_chatbot_config_id,
      p_venue_id,
      p_tour_id,
      btrim(v_action->>'name'),
      v_action_key,
      v_action->>'mode',
      coalesce((v_action->>'is_active')::boolean, true),
      nullif(btrim(v_action->>'description'), ''),
      btrim(v_action->>'webhook_url'),
      encode(gen_random_bytes(32), 'hex'),
      v_action->>'condition_type',
      coalesce(
        array(
          select jsonb_array_elements_text(coalesce(v_action->'condition_keywords', '[]'::jsonb))
        ),
        array[]::text[]
      ),
      nullif(btrim(v_action->>'condition_intent'), ''),
      nullif(v_action->>'condition_message_count', '')::integer,
      coalesce((v_action->>'display_order')::integer, 0)
    )
    on conflict (chatbot_config_id, action_key)
    do update set
      venue_id = excluded.venue_id,
      tour_id = excluded.tour_id,
      name = excluded.name,
      mode = excluded.mode,
      is_active = excluded.is_active,
      description = excluded.description,
      webhook_url = excluded.webhook_url,
      signing_secret = case
        when v_rotate_secret then encode(gen_random_bytes(32), 'hex')
        else public.chatbot_custom_actions.signing_secret
      end,
      condition_type = excluded.condition_type,
      condition_keywords = excluded.condition_keywords,
      condition_intent = excluded.condition_intent,
      condition_message_count = excluded.condition_message_count,
      display_order = excluded.display_order;
  end loop;

  delete from public.chatbot_custom_actions
  where chatbot_config_id = p_chatbot_config_id
    and not (action_key = any(v_action_keys));

  return query
  select *
  from public.chatbot_custom_actions
  where chatbot_config_id = p_chatbot_config_id
  order by display_order asc, created_at asc;
end;
$$;

revoke all on function public.replace_chatbot_custom_actions(uuid, uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_chatbot_custom_actions(uuid, uuid, uuid, jsonb)
  to service_role;

-- Non-production verification:
-- 1. Save an unchanged action through the API and confirm its id and
--    signing_secret remain unchanged in chatbot_custom_actions.
-- 2. Save the same action with rotate_secret=true and confirm only its
--    signing_secret changes.
-- 3. Save a smaller list and confirm only omitted action keys are removed;
--    submit [] and confirm the configuration has no actions.
-- 4. In a transaction, call this function with an invalid mode or duplicated
--    action_key. After rolling back to a savepoint, confirm the original rows
--    remain intact. The function's transaction prevents partial replacements.
