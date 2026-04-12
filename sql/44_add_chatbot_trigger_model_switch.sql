alter table public.chatbot_triggers
  add column if not exists action_tour_model_id uuid;

alter table public.chatbot_triggers
  drop constraint if exists chatbot_triggers_action_type_check;

alter table public.chatbot_triggers
  add constraint chatbot_triggers_action_type_check
  check (action_type in ('ai_message', 'open_url', 'navigate_tour_point', 'switch_tour_model'));

alter table public.chatbot_triggers
  drop constraint if exists fk_chatbot_triggers_tour_model;

alter table public.chatbot_triggers
  add constraint fk_chatbot_triggers_tour_model
    foreign key (action_tour_model_id) references public.tours(id) on delete set null;

create index if not exists idx_chatbot_triggers_action_tour_model_id
  on public.chatbot_triggers(action_tour_model_id);
