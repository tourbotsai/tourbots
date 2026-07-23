-- 105_atomic_chatbot_lead_form_replace.sql
-- Save a lead form and its fields as one transaction so a failed field insert
-- never leaves an enabled form without fields.

create or replace function public.replace_chatbot_lead_form(
  p_chatbot_config_id uuid,
  p_venue_id uuid,
  p_form jsonb,
  p_fields jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_form_id uuid;
begin
  if jsonb_typeof(p_form) <> 'object' or jsonb_typeof(p_fields) <> 'array' then
    raise exception 'Form must be an object and fields must be an array';
  end if;

  perform 1
  from public.chatbot_configs
  where id = p_chatbot_config_id and venue_id = p_venue_id
  for update;
  if not found then
    raise exception 'Chatbot configuration not found in venue scope';
  end if;

  insert into public.chatbot_lead_forms (
    chatbot_config_id, venue_id, tour_id, is_enabled, intro_message, submit_label,
    success_message, privacy_policy_url, consent_checkbox_label, condition_type,
    condition_keywords, condition_intent, email_notifications_enabled,
    notification_email, once_per_conversation, updated_at
  )
  values (
    p_chatbot_config_id, p_venue_id, nullif(p_form->>'tour_id', '')::uuid,
    coalesce((p_form->>'is_enabled')::boolean, false),
    nullif(p_form->>'intro_message', ''), coalesce(nullif(p_form->>'submit_label', ''), 'Send'),
    coalesce(nullif(p_form->>'success_message', ''), 'Thanks - we''ll be in touch shortly.'),
    nullif(p_form->>'privacy_policy_url', ''), coalesce(nullif(p_form->>'consent_checkbox_label', ''), 'By submitting, you agree to our privacy policy.'),
    coalesce(nullif(p_form->>'condition_type', ''), 'intent'),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_form->'condition_keywords', '[]'::jsonb))), array[]::text[]),
    nullif(p_form->>'condition_intent', ''),
    coalesce((p_form->>'email_notifications_enabled')::boolean, false),
    nullif(p_form->>'notification_email', ''),
    coalesce((p_form->>'once_per_conversation')::boolean, true),
    now()
  )
  on conflict (chatbot_config_id) do update set
    venue_id = excluded.venue_id, tour_id = excluded.tour_id, is_enabled = excluded.is_enabled,
    intro_message = excluded.intro_message, submit_label = excluded.submit_label,
    success_message = excluded.success_message, privacy_policy_url = excluded.privacy_policy_url,
    consent_checkbox_label = excluded.consent_checkbox_label, condition_type = excluded.condition_type,
    condition_keywords = excluded.condition_keywords, condition_intent = excluded.condition_intent,
    email_notifications_enabled = excluded.email_notifications_enabled,
    notification_email = excluded.notification_email, once_per_conversation = excluded.once_per_conversation,
    updated_at = now()
  returning id into v_form_id;

  delete from public.chatbot_lead_form_fields where lead_form_id = v_form_id;

  insert into public.chatbot_lead_form_fields (
    lead_form_id, field_key, label, field_type, placeholder, options, is_required, display_order
  )
  select
    v_form_id, field_key, label, field_type, placeholder, options, is_required, display_order
  from jsonb_to_recordset(p_fields) as field(
    field_key text, label text, field_type text, placeholder text, options jsonb,
    is_required boolean, display_order integer
  );

  return v_form_id;
end;
$$;

revoke all on function public.replace_chatbot_lead_form(uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_chatbot_lead_form(uuid, uuid, jsonb, jsonb)
  to service_role;
