-- 20_support_conversations_initial.sql
-- Support conversation inbox for app Help Centre contact flow.
-- Run this after 14_help_articles_initial.sql.

create extension if not exists "pgcrypto";

-- Shared updated_at trigger function (safe to reuse).
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  created_by_user_id uuid not null,
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  requester_company text,
  help_topic text not null,
  subject text,
  status text not null default 'open',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_support_conversations_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint fk_support_conversations_created_by_user
    foreign key (created_by_user_id) references public.users(id)
    on delete cascade,
  constraint chk_support_conversations_requester_name_not_blank
    check (length(trim(requester_name)) > 0),
  constraint chk_support_conversations_requester_email_not_blank
    check (length(trim(requester_email)) > 0),
  constraint chk_support_conversations_help_topic_not_blank
    check (length(trim(help_topic)) > 0),
  constraint chk_support_conversations_status_valid
    check (status in ('open', 'closed'))
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  sender_type text not null,
  sender_user_id uuid,
  message text not null,
  created_at timestamptz not null default now(),

  constraint fk_support_messages_conversation
    foreign key (conversation_id) references public.support_conversations(id)
    on delete cascade,
  constraint fk_support_messages_sender_user
    foreign key (sender_user_id) references public.users(id)
    on delete set null,
  constraint chk_support_messages_sender_type_valid
    check (sender_type in ('user', 'admin')),
  constraint chk_support_messages_message_not_blank
    check (length(trim(message)) > 0)
);

create index if not exists idx_support_conversations_created_by_user
  on public.support_conversations(created_by_user_id, created_at desc);

create index if not exists idx_support_conversations_venue
  on public.support_conversations(venue_id, created_at desc);

create index if not exists idx_support_conversations_status_last_message
  on public.support_conversations(status, last_message_at desc);

create index if not exists idx_support_messages_conversation_created
  on public.support_messages(conversation_id, created_at asc);

drop trigger if exists trg_support_conversations_set_updated_at on public.support_conversations;
create trigger trg_support_conversations_set_updated_at
before update on public.support_conversations
for each row
execute function public.set_updated_at_timestamp();
