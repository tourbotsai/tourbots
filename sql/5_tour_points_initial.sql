-- 5_tour_points_initial.sql
-- Bootstrap tour_points table for saved navigation positions.
-- Run this after 3_tours_initial.sql.

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

create table if not exists public.tour_points (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null,
  name text not null,
  sweep_id text not null,
  position jsonb not null,
  rotation jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_tour_points_tour_id
    foreign key (tour_id) references public.tours(id)
    on delete cascade,
  constraint chk_tour_points_name_not_blank
    check (length(trim(name)) > 0),
  constraint chk_tour_points_position_object
    check (jsonb_typeof(position) = 'object'),
  constraint chk_tour_points_rotation_object
    check (jsonb_typeof(rotation) = 'object')
);

create index if not exists idx_tour_points_tour_id on public.tour_points(tour_id);
create index if not exists idx_tour_points_tour_id_created_at on public.tour_points(tour_id, created_at);
create index if not exists idx_tour_points_tour_id_name on public.tour_points(tour_id, name);
create index if not exists idx_tour_points_sweep_id on public.tour_points(sweep_id);

drop trigger if exists trg_tour_points_set_updated_at on public.tour_points;
create trigger trg_tour_points_set_updated_at
before update on public.tour_points
for each row
execute function public.set_updated_at_timestamp();
