-- 14_help_articles_initial.sql
-- Bootstrap help_articles table for in-app Help Centre content.
-- Run this after 13_conversations_initial.sql.

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

create table if not exists public.help_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  excerpt text,
  content text not null default '',
  cover_image text,
  header_image text,
  additional_images text[] not null default '{}',
  meta_title text,
  meta_description text,
  tags text[] not null default '{}',
  category text not null,
  priority integer not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  view_count integer not null default 0,
  reading_time_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_help_articles_title_not_blank
    check (length(trim(title)) > 0),
  constraint chk_help_articles_slug_not_blank
    check (length(trim(slug)) > 0),
  constraint chk_help_articles_content_not_blank
    check (length(trim(content)) > 0),
  constraint chk_help_articles_category_valid
    check (category in ('getting-started', 'tours', 'chatbots', 'analytics', 'billing', 'troubleshooting')),
  constraint chk_help_articles_priority_range
    check (priority >= 0 and priority <= 100),
  constraint chk_help_articles_view_count_non_negative
    check (view_count >= 0),
  constraint chk_help_articles_reading_time_non_negative
    check (reading_time_minutes is null or reading_time_minutes >= 0)
);

create unique index if not exists idx_help_articles_slug_unique on public.help_articles(slug);
create index if not exists idx_help_articles_category_priority_created on public.help_articles(category, priority desc, created_at desc);
create index if not exists idx_help_articles_published_priority_created on public.help_articles(is_published, priority desc, created_at desc);
create index if not exists idx_help_articles_view_count on public.help_articles(view_count desc);
create index if not exists idx_help_articles_tags_gin on public.help_articles using gin(tags);

drop trigger if exists trg_help_articles_set_updated_at on public.help_articles;
create trigger trg_help_articles_set_updated_at
before update on public.help_articles
for each row
execute function public.set_updated_at_timestamp();
