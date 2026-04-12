-- 13_conversations_initial.sql
-- Bootstrap chatbot conversation log table used across analytics and chat history.
-- Run this after 2_venues_initial.sql.

create extension if not exists "pgcrypto";

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  session_id text not null,
  conversation_id uuid not null,
  message_position integer not null default 1,
  visitor_id text,
  message text,
  response text,
  message_type text not null,
  chatbot_type text not null default 'tour',
  ip_address text,
  user_agent text,
  page_url text,
  domain text,
  embed_id text,
  response_time_ms integer,
  created_at timestamptz not null default now(),

  constraint fk_conversations_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_conversations_message_type
    check (message_type in ('visitor', 'bot')),
  constraint chk_conversations_chatbot_type_tour_only
    check (chatbot_type = 'tour'),
  constraint chk_conversations_message_position_positive
    check (message_position > 0)
);

create index if not exists idx_conversations_venue_id
  on public.conversations(venue_id);

create index if not exists idx_conversations_session_id
  on public.conversations(session_id);

create index if not exists idx_conversations_conversation_id
  on public.conversations(conversation_id);

create index if not exists idx_conversations_created_at
  on public.conversations(created_at desc);

create index if not exists idx_conversations_venue_type_created
  on public.conversations(venue_id, chatbot_type, created_at desc);

create unique index if not exists idx_conversations_position_unique
  on public.conversations(conversation_id, message_position);

