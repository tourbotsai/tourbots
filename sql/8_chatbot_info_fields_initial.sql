-- 8_chatbot_info_fields_initial.sql
-- Bootstrap flexible fields within chatbot information sections.
-- Run this after 7_chatbot_info_sections_initial.sql.

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

create table if not exists public.chatbot_info_fields (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null,

  field_key text not null,
  field_label text not null,
  field_type text not null default 'text',
  field_value text,
  display_order integer not null default 0,
  is_required boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_chatbot_info_fields_section
    foreign key (section_id) references public.chatbot_info_sections(id)
    on delete cascade,
  constraint chk_chatbot_info_fields_key_not_blank
    check (length(trim(field_key)) > 0),
  constraint chk_chatbot_info_fields_label_not_blank
    check (length(trim(field_label)) > 0),
  constraint chk_chatbot_info_fields_type
    check (field_type in ('text', 'textarea', 'url', 'phone', 'email'))
);

create unique index if not exists idx_chatbot_info_fields_key_unique
  on public.chatbot_info_fields(section_id, field_key);

create index if not exists idx_chatbot_info_fields_order
  on public.chatbot_info_fields(section_id, display_order);

drop trigger if exists trg_chatbot_info_fields_set_updated_at on public.chatbot_info_fields;
create trigger trg_chatbot_info_fields_set_updated_at
before update on public.chatbot_info_fields
for each row
execute function public.set_updated_at_timestamp();
