-- 25_tour_scoped_embed_stats.sql
-- Bootstrap embed_stats table with tour-scoped analytics support.
-- Run this after 2_venues_initial.sql and 3_tours_initial.sql.

create table if not exists public.embed_stats (
  id uuid primary key default gen_random_uuid(),
  embed_id text not null,
  venue_id uuid not null,
  tour_id uuid,
  embed_type text not null,
  domain text,
  page_url text,
  chatbot_type text,
  user_agent text,
  views_count integer not null default 1,
  last_viewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_embed_stats_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint fk_embed_stats_tour
    foreign key (tour_id) references public.tours(id)
    on delete set null,
  constraint chk_embed_stats_type
    check (embed_type in ('tour', 'chatbot')),
  constraint chk_embed_stats_chatbot_type
    check (chatbot_type is null or chatbot_type = 'tour'),
  constraint chk_embed_stats_views_non_negative
    check (views_count >= 0)
);

create index if not exists idx_embed_stats_venue_id
  on public.embed_stats (venue_id);

create index if not exists idx_embed_stats_tour_id
  on public.embed_stats (tour_id);

create index if not exists idx_embed_stats_venue_embed_type
  on public.embed_stats (venue_id, embed_type);

create index if not exists idx_embed_stats_venue_chatbot_type
  on public.embed_stats (venue_id, chatbot_type);

create index if not exists idx_embed_stats_venue_tour_type
  on public.embed_stats (venue_id, tour_id, embed_type, created_at desc);

create index if not exists idx_embed_stats_venue_last_viewed
  on public.embed_stats (venue_id, last_viewed_at desc);

create index if not exists idx_embed_stats_venue_domain
  on public.embed_stats (venue_id, domain);

drop trigger if exists trg_embed_stats_set_updated_at on public.embed_stats;
create trigger trg_embed_stats_set_updated_at
before update on public.embed_stats
for each row
execute function public.set_updated_at_timestamp();
