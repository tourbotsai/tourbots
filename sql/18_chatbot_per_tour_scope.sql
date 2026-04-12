-- 18_chatbot_per_tour_scope.sql
-- Scope chatbot customisation and analytics to a tour location.

-- 1) Chatbot customisations become per-tour (location) instead of venue-wide.
alter table public.chatbot_customisations
  add column if not exists tour_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_chatbot_customisations_tour'
  ) then
    alter table public.chatbot_customisations
      add constraint fk_chatbot_customisations_tour
      foreign key (tour_id) references public.tours(id)
      on delete cascade;
  end if;
end $$;

-- Backfill existing rows to the first primary location per venue.
with primary_location as (
  select distinct on (venue_id) venue_id, id as tour_id
  from public.tours
  where is_active = true
    and (tour_type = 'primary' or tour_type is null)
  order by venue_id, display_order asc, created_at asc
)
update public.chatbot_customisations cc
set tour_id = pl.tour_id
from primary_location pl
where cc.venue_id = pl.venue_id
  and cc.tour_id is null;

drop index if exists public.idx_chatbot_customisations_venue_type_unique;

create unique index if not exists idx_chatbot_customisations_tour_unique
  on public.chatbot_customisations(venue_id, tour_id, chatbot_type);

create index if not exists idx_chatbot_customisations_tour_id
  on public.chatbot_customisations(tour_id);

-- 2) Conversation analytics become per-tour aware.
alter table public.conversations
  add column if not exists tour_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_conversations_tour'
  ) then
    alter table public.conversations
      add constraint fk_conversations_tour
      foreign key (tour_id) references public.tours(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_conversations_tour_id
  on public.conversations(tour_id);

create index if not exists idx_conversations_venue_tour_created
  on public.conversations(venue_id, tour_id, created_at desc);
