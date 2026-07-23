-- 101_restrict_public_chatbot_and_embed_events.sql
-- Retain server-route-only public access and validate menu event ownership.

begin;

drop policy if exists anon_read_active_chatbot_configs on public.chatbot_configs;
drop policy if exists anon_read_active_chatbot_customisations on public.chatbot_customisations;
drop policy if exists anon_read_active_chatbot_triggers on public.chatbot_triggers;
drop policy if exists anon_read_active_chatbot_info_sections on public.chatbot_info_sections;
drop policy if exists anon_read_active_chatbot_info_fields on public.chatbot_info_fields;

revoke select on table
  public.chatbot_configs,
  public.chatbot_customisations,
  public.chatbot_triggers,
  public.chatbot_info_sections,
  public.chatbot_info_fields
from anon, authenticated;

create or replace function public.record_embed_menu_event(
  p_venue_id uuid,
  p_ip_address text,
  p_event jsonb
)
returns table (
  accepted boolean,
  message text
)
language plpgsql
as $$
declare
  v_venue_count integer;
  v_ip_count integer;
  v_ip_address text := coalesce(nullif(btrim(p_ip_address), ''), 'unknown');
  v_tour_id uuid := nullif(p_event->>'tour_id', '')::uuid;
begin
  if jsonb_typeof(p_event) <> 'object' then
    raise exception 'p_event must be a JSON object';
  end if;
  if nullif(btrim(p_event->>'embed_id'), '') is null then
    raise exception 'embed_id is required';
  end if;
  if not exists (select 1 from public.venues where id = p_venue_id) then
    raise exception 'Venue not found';
  end if;
  if v_tour_id is not null and not exists (
    select 1
    from public.tours
    where id = v_tour_id
      and venue_id = p_venue_id
      and is_active = true
  ) then
    raise exception 'Tour not found for venue';
  end if;

  perform pg_advisory_xact_lock(hashtext('embed-menu-event:venue:' || p_venue_id::text));
  perform pg_advisory_xact_lock(
    hashtext('embed-menu-event:ip:' || p_venue_id::text || ':' || v_ip_address)
  );

  select count(*) into v_venue_count
  from public.embed_menu_events
  where venue_id = p_venue_id
    and created_at >= now() - interval '15 minutes';
  if v_venue_count >= 5000 then
    return query select false, 'Too many menu events for this venue. Please try again later.';
    return;
  end if;

  select count(*) into v_ip_count
  from public.embed_menu_events
  where venue_id = p_venue_id
    and ip_address = v_ip_address
    and created_at >= now() - interval '15 minutes';
  if v_ip_count >= 300 then
    return query select false, 'Too many menu events from this network. Please try again later.';
    return;
  end if;

  insert into public.embed_menu_events (
    embed_id, venue_id, tour_id, event_type, menu_style, trigger_source,
    item_id, item_label, item_type, action_type, target_ref, domain, page_url,
    user_agent, ip_address, metadata
  )
  values (
    p_event->>'embed_id', p_venue_id, v_tour_id, p_event->>'event_type',
    nullif(p_event->>'menu_style', ''), nullif(p_event->>'trigger_source', ''),
    nullif(p_event->>'item_id', ''), nullif(p_event->>'item_label', ''),
    nullif(p_event->>'item_type', ''), nullif(p_event->>'action_type', ''),
    nullif(p_event->>'target_ref', ''), nullif(p_event->>'domain', ''),
    nullif(p_event->>'page_url', ''), nullif(p_event->>'user_agent', ''),
    v_ip_address,
    case when jsonb_typeof(p_event->'metadata') = 'object' then p_event->'metadata' else '{}'::jsonb end
  );

  return query select true, null::text;
end;
$$;

revoke all on function public.record_embed_menu_event(uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_embed_menu_event(uuid, text, jsonb)
  to service_role;

commit;
