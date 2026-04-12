-- 48_embed_tour_moves.sql
-- Per-navigation events from embedded Matterport tours (tour "moves": sweep changes).
-- Run after 25_tour_scoped_embed_stats.sql (needs venues + tours FKs).
--
-- Why a separate table (not extra columns on embed_stats):
-- - embed_stats rows are coarse-grained view/chatbot events with views_count / last_viewed_at.
-- - Moves are high-volume, append-only, and carry sweep + pose; mixing them would complicate
--   CHECK constraints and every dashboard query that sums embed_stats.views_count.
--
-- RLS: same model as embed_stats — inserts/reads only via server routes using service_role;
-- no direct anon/authenticated access.

create table if not exists public.embed_tour_moves (
  id uuid primary key default gen_random_uuid(),
  embed_id text not null,
  venue_id uuid not null,
  tour_id uuid,
  sweep_id text not null,
  position jsonb not null,
  rotation jsonb not null,
  domain text,
  page_url text,
  user_agent text,
  matterport_model_id text,
  created_at timestamptz not null default now(),

  constraint fk_embed_tour_moves_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint fk_embed_tour_moves_tour
    foreign key (tour_id) references public.tours(id)
    on delete set null,
  constraint chk_embed_tour_moves_position_object
    check (jsonb_typeof(position) = 'object'),
  constraint chk_embed_tour_moves_rotation_object
    check (jsonb_typeof(rotation) = 'object')
);

comment on table public.embed_tour_moves is
  'Each row is one Matterport sweep transition in an embedded tour (for analytics).';

comment on column public.embed_tour_moves.position is
  'Camera position, e.g. {"x": number, "y": number, "z": number} — normalise in the client.';

comment on column public.embed_tour_moves.rotation is
  'Camera rotation (e.g. pitch/yaw), e.g. {"x": number, "y": number} — normalise in the client.';

comment on column public.embed_tour_moves.matterport_model_id is
  'Showcase model id when the embed switches models (multi-tour); optional.';

create index if not exists idx_embed_tour_moves_venue_created  on public.embed_tour_moves (venue_id, created_at desc);

create index if not exists idx_embed_tour_moves_venue_tour_created
  on public.embed_tour_moves (venue_id, tour_id, created_at desc);

create index if not exists idx_embed_tour_moves_embed_id
  on public.embed_tour_moves (embed_id);

create index if not exists idx_embed_tour_moves_sweep_id
  on public.embed_tour_moves (sweep_id);

alter table public.embed_tour_moves enable row level security;

drop policy if exists service_role_all_embed_tour_moves on public.embed_tour_moves;
create policy service_role_all_embed_tour_moves
  on public.embed_tour_moves
  for all
  to service_role
  using (true)
  with check (true);
