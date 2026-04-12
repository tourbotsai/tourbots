create table if not exists public.chatbot_triggers (
  id uuid primary key default gen_random_uuid(),
  chatbot_config_id uuid not null,
  venue_id uuid not null,
  tour_id uuid not null,
  name text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  condition_type text not null check (condition_type in ('keywords', 'message_count')),
  condition_keywords text[] not null default '{}',
  condition_message_count integer,
  action_type text not null check (action_type in ('ai_message', 'open_url', 'navigate_tour_point')),
  action_message text not null,
  action_url text,
  action_tour_point_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_chatbot_triggers_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id) on delete cascade,
  constraint fk_chatbot_triggers_tour
    foreign key (tour_id) references public.tours(id) on delete cascade,
  constraint fk_chatbot_triggers_tour_point
    foreign key (action_tour_point_id) references public.tour_points(id) on delete set null
);

create index if not exists idx_chatbot_triggers_config_active
  on public.chatbot_triggers(chatbot_config_id, is_active, display_order);

create index if not exists idx_chatbot_triggers_tour
  on public.chatbot_triggers(tour_id);

