-- ---------------------------------------------------------------------------
-- Conversations: track chatbot_config_id so multiple website chatbots on the
-- same venue (each tour_id null) can be distinguished for usage/allocation
-- accounting. Tour conversations continue to be scoped by tour_id and leave
-- this column null.
-- ---------------------------------------------------------------------------
alter table public.conversations
  add column if not exists chatbot_config_id uuid;

alter table public.conversations
  drop constraint if exists fk_conversations_chatbot_config;

alter table public.conversations
  add constraint fk_conversations_chatbot_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id)
    on delete cascade;

create index if not exists idx_conversations_chatbot_config_id
  on public.conversations(chatbot_config_id)
  where chatbot_config_id is not null;
