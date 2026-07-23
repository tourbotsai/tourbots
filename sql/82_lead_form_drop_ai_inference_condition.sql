-- 82_lead_form_drop_ai_inference_condition.sql
-- Intent already uses AI judgement; remove redundant ai_inference show mode.

update public.chatbot_lead_forms
set
  condition_type = 'intent',
  condition_intent = coalesce(
    nullif(trim(condition_intent), ''),
    'the visitor wants to leave contact details, enquire, book, or get a callback'
  ),
  updated_at = now()
where condition_type = 'ai_inference';

alter table public.chatbot_lead_forms
  drop constraint if exists chk_chatbot_lead_forms_condition_type;

alter table public.chatbot_lead_forms
  alter column condition_type set default 'intent';

alter table public.chatbot_lead_forms
  add constraint chk_chatbot_lead_forms_condition_type
  check (condition_type in ('keywords', 'intent'));
