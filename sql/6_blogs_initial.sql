-- 6_blogs_initial.sql
-- Bootstrap blogs table for website resources and admin blog management.
-- Run this after the initial core tables.

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

create table if not exists public.blogs (
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
  is_published boolean not null default false,
  -- Compatibility field used by legacy sitemap queries.
  published boolean generated always as (is_published) stored,
  published_at timestamptz,
  scheduled_publish_at timestamptz,
  is_scheduled boolean not null default false,
  schedule_timezone text,
  view_count integer not null default 0,
  reading_time_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_blogs_title_not_blank
    check (length(trim(title)) > 0),
  constraint chk_blogs_slug_not_blank
    check (length(trim(slug)) > 0),
  constraint chk_blogs_content_not_blank
    check (length(trim(content)) > 0),
  constraint chk_blogs_view_count_non_negative
    check (view_count >= 0),
  constraint chk_blogs_reading_time_non_negative
    check (reading_time_minutes is null or reading_time_minutes >= 0)
);

create unique index if not exists idx_blogs_slug_unique on public.blogs(slug);
create index if not exists idx_blogs_is_published_published_at on public.blogs(is_published, published_at desc nulls last);
create index if not exists idx_blogs_scheduled_publish on public.blogs(is_scheduled, is_published, scheduled_publish_at);
create index if not exists idx_blogs_tags_gin on public.blogs using gin(tags);

drop trigger if exists trg_blogs_set_updated_at on public.blogs;
create trigger trg_blogs_set_updated_at
before update on public.blogs
for each row
execute function public.set_updated_at_timestamp();
