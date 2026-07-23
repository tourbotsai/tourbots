-- 90_embed_menu_events.sql
-- Append-only tour menu analytics (opens, closes, item clicks, AI prompts).
-- Run after 89_tour_menu_revamp.sql (needs venues + tours FKs; mirrors 48_embed_tour_moves).
--
-- RLS: inserts/reads only via server routes using service_role.

create table if not exists public.embed_menu_events (
  id uuid primary key default gen_random_uuid(),
  embed_id text not null,
  venue_id uuid not null,
  tour_id uuid,
  event_type text not null,
  menu_style text,
  trigger_source text,
  item_id text,
  item_label text,
  item_type text,
  action_type text,
  target_ref text,
  domain text,
  page_url text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint fk_embed_menu_events_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint fk_embed_menu_events_tour
    foreign key (tour_id) references public.tours(id)
    on delete set null,
  constraint chk_embed_menu_events_event_type
    check (event_type in (
      'menu_opened',
      'menu_closed',
      'menu_item_clicked',
      'menu_ai_prompt_sent'
    )),
  constraint chk_embed_menu_events_menu_style
    check (menu_style is null or menu_style in ('modal', 'drawer', 'icon')),
  constraint chk_embed_menu_events_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);

comment on table public.embed_menu_events is
  'Each row is one tour-menu UI event (open/close/item click/AI prompt) for analytics.';

create index if not exists idx_embed_menu_events_venue_created
  on public.embed_menu_events (venue_id, created_at desc);

create index if not exists idx_embed_menu_events_venue_tour_created
  on public.embed_menu_events (venue_id, tour_id, created_at desc);

create index if not exists idx_embed_menu_events_venue_type_created
  on public.embed_menu_events (venue_id, event_type, created_at desc);

create index if not exists idx_embed_menu_events_embed_id
  on public.embed_menu_events (embed_id);

alter table public.embed_menu_events enable row level security;

drop policy if exists service_role_all_embed_menu_events on public.embed_menu_events;
create policy service_role_all_embed_menu_events
  on public.embed_menu_events
  for all
  to service_role
  using (true)
  with check (true);

-- Verification (run manually):
-- select event_type, menu_style, count(*) from public.embed_menu_events group by 1, 2;
