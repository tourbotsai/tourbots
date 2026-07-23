-- 100_atomic_public_lead_submission.sql
-- Atomically validate, rate-limit, and insert public chatbot lead submissions.

create index if not exists idx_leads_config_conversation
  on public.leads(chatbot_config_id, conversation_id)
  where conversation_id is not null;

create or replace function public.submit_chatbot_lead(
  p_venue_id uuid,
  p_ip_address text,
  p_lead jsonb
)
returns table (
  accepted boolean,
  duplicate boolean,
  message text,
  lead_id uuid
)
language plpgsql
as $$
declare
  v_form public.chatbot_lead_forms%rowtype;
  v_config_tour_id uuid;
  v_ip_address text := coalesce(nullif(btrim(p_ip_address), ''), 'unknown');
  v_session_id text := nullif(btrim(p_lead->>'session_id'), '');
  v_conversation_id uuid := nullif(p_lead->>'conversation_id', '')::uuid;
  v_lead_id uuid;
begin
  if jsonb_typeof(p_lead) <> 'object' then
    raise exception 'p_lead must be a JSON object';
  end if;

  perform pg_advisory_xact_lock(hashtext('chatbot-lead:venue:' || p_venue_id::text));
  perform pg_advisory_xact_lock(hashtext('chatbot-lead:ip:' || p_venue_id::text || ':' || v_ip_address));
  if v_session_id is not null then
    perform pg_advisory_xact_lock(hashtext('chatbot-lead:session:' || p_venue_id::text || ':' || v_session_id));
  end if;
  if v_conversation_id is not null then
    perform pg_advisory_xact_lock(hashtext('chatbot-lead:conversation:' || p_venue_id::text || ':' || v_conversation_id::text));
  end if;

  select lf.*
  into v_form
  from public.chatbot_lead_forms lf
  join public.chatbot_configs cc on cc.id = lf.chatbot_config_id
  where lf.id = nullif(p_lead->>'lead_form_id', '')::uuid
    and lf.chatbot_config_id = nullif(p_lead->>'chatbot_config_id', '')::uuid
    and lf.venue_id = p_venue_id
    and cc.venue_id = p_venue_id
    and lf.is_enabled = true
  for update of lf, cc;

  if not found then
    raise exception 'Lead form not found or disabled';
  end if;

  select tour_id
  into v_config_tour_id
  from public.chatbot_configs
  where id = v_form.chatbot_config_id;

  if v_form.once_per_conversation and v_conversation_id is not null and exists (
    select 1
    from public.leads
    where venue_id = p_venue_id
      and chatbot_config_id = v_form.chatbot_config_id
      and conversation_id = v_conversation_id
  ) then
    return query select false, true, 'You have already submitted this form.', null::uuid;
    return;
  end if;

  if (
    select count(*)
    from public.leads
    where venue_id = p_venue_id
      and created_at >= now() - interval '15 minutes'
  ) >= 60 then
    return query select false, false, 'Too many lead submissions for this venue. Please try again later.', null::uuid;
    return;
  end if;

  if (
    select count(*)
    from public.leads
    where venue_id = p_venue_id
      and ip_address = v_ip_address
      and created_at >= now() - interval '15 minutes'
  ) >= 10 then
    return query select false, false, 'Too many lead submissions from this network. Please try again later.', null::uuid;
    return;
  end if;

  if v_session_id is not null and (
    select count(*)
    from public.leads
    where venue_id = p_venue_id
      and session_id = v_session_id
      and created_at >= now() - interval '1 hour'
  ) >= 3 then
    return query select false, false, 'Too many lead submissions in this conversation. Please try again later.', null::uuid;
    return;
  end if;

  insert into public.leads (
    venue_id, tour_id, chatbot_config_id, lead_form_id, conversation_id, session_id,
    visitor_name, visitor_email, visitor_phone, field_values, source, status,
    consent_given, consent_text, consent_privacy_url, consented_at, page_url,
    domain, user_agent, ip_address
  )
  values (
    p_venue_id,
    coalesce(v_form.tour_id, v_config_tour_id),
    v_form.chatbot_config_id,
    v_form.id,
    v_conversation_id,
    v_session_id,
    nullif(p_lead->>'visitor_name', ''),
    nullif(p_lead->>'visitor_email', ''),
    nullif(p_lead->>'visitor_phone', ''),
    coalesce(p_lead->'field_values', '{}'::jsonb),
    'chatbot',
    'new',
    true,
    nullif(p_lead->>'consent_text', ''),
    nullif(p_lead->>'consent_privacy_url', ''),
    coalesce(nullif(p_lead->>'consented_at', '')::timestamptz, now()),
    nullif(p_lead->>'page_url', ''),
    nullif(p_lead->>'domain', ''),
    nullif(p_lead->>'user_agent', ''),
    v_ip_address
  )
  returning id into v_lead_id;

  return query select true, false, null::text, v_lead_id;
end;
$$;

revoke all on function public.submit_chatbot_lead(uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_chatbot_lead(uuid, text, jsonb)
  to service_role;
