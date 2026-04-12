-- 17_tour_locations_multi_tour.sql
-- Enables one account/venue to have multiple tour locations.
-- Each location is a primary row in public.tours and can have many secondary model rows.

alter table public.tours
  add column if not exists parent_tour_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_tours_parent_tour_id_tours'
  ) then
    alter table public.tours
      add constraint fk_tours_parent_tour_id_tours
      foreign key (parent_tour_id) references public.tours(id)
      on delete cascade;
  end if;
end $$;

create index if not exists idx_tours_parent_tour_id on public.tours(parent_tour_id);

-- Remove single-location restriction so a venue can have multiple primary locations.
drop index if exists public.idx_tours_one_primary_per_venue;

-- Backfill legacy secondary rows so they point at their location's primary row.
with venue_primary as (
  select distinct on (venue_id) venue_id, id as primary_tour_id
  from public.tours
  where tour_type = 'primary'
  order by venue_id, display_order asc, created_at asc
)
update public.tours t
set parent_tour_id = vp.primary_tour_id
from venue_primary vp
where t.venue_id = vp.venue_id
  and t.tour_type = 'secondary'
  and t.parent_tour_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_tours_parent_relationship'
  ) then
    alter table public.tours
      add constraint chk_tours_parent_relationship
      check (
        (tour_type = 'primary' and parent_tour_id is null) or
        (tour_type = 'secondary' and parent_tour_id is not null)
      );
  end if;
end $$;
