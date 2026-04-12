-- 7_chatbot_info_sections_initial.sql
-- Bootstrap flexible chatbot information sections.
-- Run this after 6_chatbot_configs_initial.sql.

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

create table if not exists public.chatbot_info_sections (
  id uuid primary key default gen_random_uuid(),
  chatbot_config_id uuid not null,

  section_key text not null,
  section_title text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_chatbot_info_sections_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id)
    on delete cascade,
  constraint chk_chatbot_info_sections_key_not_blank
    check (length(trim(section_key)) > 0),
  constraint chk_chatbot_info_sections_title_not_blank
    check (length(trim(section_title)) > 0)
);

create unique index if not exists idx_chatbot_info_sections_key_unique
  on public.chatbot_info_sections(chatbot_config_id, section_key);

create index if not exists idx_chatbot_info_sections_order
  on public.chatbot_info_sections(chatbot_config_id, display_order);

drop trigger if exists trg_chatbot_info_sections_set_updated_at on public.chatbot_info_sections;
create trigger trg_chatbot_info_sections_set_updated_at
before update on public.chatbot_info_sections
for each row
execute function public.set_updated_at_timestamp();
