-- 84_custom_action_signing_secret.sql
-- Each custom action owns its webhook URL + signing secret (no shared endpoint required).

alter table public.chatbot_custom_actions
  add column if not exists signing_secret text;

update public.chatbot_custom_actions
set signing_secret = encode(gen_random_bytes(32), 'hex')
where signing_secret is null or btrim(signing_secret) = '';

alter table public.chatbot_custom_actions
  alter column signing_secret set not null;

alter table public.chatbot_custom_actions
  alter column signing_secret set default encode(gen_random_bytes(32), 'hex');
