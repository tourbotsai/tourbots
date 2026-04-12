-- 19_guides_initial.sql
-- Bootstrap guides table for platform documentation content.
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

create table if not exists public.guides (
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
  difficulty_level text not null default 'beginner',
  is_published boolean not null default false,
  -- Compatibility field used by legacy sitemap fallback.
  published boolean generated always as (is_published) stored,
  published_at timestamptz,
  view_count integer not null default 0,
  reading_time_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_guides_title_not_blank
    check (length(trim(title)) > 0),
  constraint chk_guides_slug_not_blank
    check (length(trim(slug)) > 0),
  constraint chk_guides_content_not_blank
    check (length(trim(content)) > 0),
  constraint chk_guides_difficulty_valid
    check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  constraint chk_guides_view_count_non_negative
    check (view_count >= 0),
  constraint chk_guides_reading_time_non_negative
    check (reading_time_minutes is null or reading_time_minutes >= 0)
);

create unique index if not exists idx_guides_slug_unique on public.guides(slug);
create index if not exists idx_guides_published_created on public.guides(is_published, published_at desc nulls last, created_at desc);
create index if not exists idx_guides_difficulty on public.guides(difficulty_level, published_at desc nulls last);
create index if not exists idx_guides_view_count on public.guides(view_count desc);
create index if not exists idx_guides_tags_gin on public.guides using gin(tags);

drop trigger if exists trg_guides_set_updated_at on public.guides;
create trigger trg_guides_set_updated_at
before update on public.guides
for each row
execute function public.set_updated_at_timestamp();
