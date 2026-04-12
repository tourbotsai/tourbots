-- 9_chatbot_documents_initial.sql
-- Bootstrap chatbot document table linked to tour-level chatbot config.
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

create table if not exists public.chatbot_documents (
  id uuid primary key default gen_random_uuid(),
  chatbot_config_id uuid not null,
  venue_id uuid not null,
  tour_id uuid not null,

  original_filename text not null,
  file_type text,
  file_size bigint,
  file_path text not null,
  file_url text not null,

  uploaded_by uuid,
  openai_file_id text,
  openai_vector_store_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_chatbot_documents_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id)
    on delete cascade,
  constraint fk_chatbot_documents_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint fk_chatbot_documents_tour
    foreign key (tour_id) references public.tours(id)
    on delete cascade,
  constraint chk_chatbot_documents_filename_not_blank
    check (length(trim(original_filename)) > 0),
  constraint chk_chatbot_documents_path_not_blank
    check (length(trim(file_path)) > 0),
  constraint chk_chatbot_documents_url_not_blank
    check (length(trim(file_url)) > 0),
  constraint chk_chatbot_documents_file_size_non_negative
    check (file_size is null or file_size >= 0)
);

create index if not exists idx_chatbot_documents_config_id
  on public.chatbot_documents(chatbot_config_id);

create index if not exists idx_chatbot_documents_tour_id
  on public.chatbot_documents(tour_id);

create index if not exists idx_chatbot_documents_created_at
  on public.chatbot_documents(created_at);

drop trigger if exists trg_chatbot_documents_set_updated_at on public.chatbot_documents;
create trigger trg_chatbot_documents_set_updated_at
before update on public.chatbot_documents
for each row
execute function public.set_updated_at_timestamp();
