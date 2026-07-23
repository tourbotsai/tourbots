-- 83_chatbot_integrations_and_custom_actions.sql
-- Outbound webhooks (Zapier/Make/n8n) + AI custom actions (write / query).
-- Run after 82_lead_form_drop_ai_inference_condition.sql.
-- tour_id is nullable for standalone / navigation-off website chatbots.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- chatbot_integration_endpoints — one webhook endpoint per chatbot
-- ---------------------------------------------------------------------------
create table if not exists public.chatbot_integration_endpoints (
  id uuid primary key default gen_random_uuid(),
  chatbot_config_id uuid not null,
  venue_id uuid not null,
  tour_id uuid,
  url text not null,
  signing_secret text not null,
  is_enabled boolean not null default true,
  subscribed_events text[] not null default array['lead.created']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_chatbot_integration_endpoints_config unique (chatbot_config_id),
  constraint fk_chatbot_integration_endpoints_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id) on delete cascade,
  constraint fk_chatbot_integration_endpoints_venue
    foreign key (venue_id) references public.venues(id) on delete cascade,
  constraint fk_chatbot_integration_endpoints_tour
    foreign key (tour_id) references public.tours(id) on delete set null,
  constraint chk_chatbot_integration_endpoints_url_https
    check (url ~* '^https://')
);

create index if not exists idx_chatbot_integration_endpoints_venue
  on public.chatbot_integration_endpoints(venue_id);

create index if not exists idx_chatbot_integration_endpoints_enabled
  on public.chatbot_integration_endpoints(chatbot_config_id, is_enabled);

drop trigger if exists trg_chatbot_integration_endpoints_updated_at
  on public.chatbot_integration_endpoints;
create trigger trg_chatbot_integration_endpoints_updated_at
  before update on public.chatbot_integration_endpoints
  for each row
  execute function public.set_updated_at_timestamp();

-- ---------------------------------------------------------------------------
-- chatbot_custom_actions — AI-callable write / query actions
-- ---------------------------------------------------------------------------
create table if not exists public.chatbot_custom_actions (
  id uuid primary key default gen_random_uuid(),
  chatbot_config_id uuid not null,
  venue_id uuid not null,
  tour_id uuid,
  name text not null,
  action_key text not null,
  mode text not null default 'write',
  is_active boolean not null default true,
  description text,
  webhook_url text,
  condition_type text not null default 'intent',
  condition_keywords text[] not null default '{}',
  condition_intent text,
  condition_message_count integer,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_chatbot_custom_actions_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id) on delete cascade,
  constraint fk_chatbot_custom_actions_venue
    foreign key (venue_id) references public.venues(id) on delete cascade,
  constraint fk_chatbot_custom_actions_tour
    foreign key (tour_id) references public.tours(id) on delete set null,
  constraint uq_chatbot_custom_actions_key unique (chatbot_config_id, action_key),
  constraint chk_chatbot_custom_actions_mode
    check (mode in ('write', 'query')),
  constraint chk_chatbot_custom_actions_condition_type
    check (condition_type in ('keywords', 'intent', 'message_count')),
  constraint chk_chatbot_custom_actions_action_key
    check (action_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint chk_chatbot_custom_actions_webhook_url
    check (webhook_url is null or webhook_url ~* '^https://')
);

create index if not exists idx_chatbot_custom_actions_config_active
  on public.chatbot_custom_actions(chatbot_config_id, is_active, display_order);

create index if not exists idx_chatbot_custom_actions_venue
  on public.chatbot_custom_actions(venue_id);

drop trigger if exists trg_chatbot_custom_actions_updated_at
  on public.chatbot_custom_actions;
create trigger trg_chatbot_custom_actions_updated_at
  before update on public.chatbot_custom_actions
  for each row
  execute function public.set_updated_at_timestamp();

-- ---------------------------------------------------------------------------
-- chatbot_webhook_deliveries — support / debug log
-- ---------------------------------------------------------------------------
create table if not exists public.chatbot_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  chatbot_config_id uuid,
  endpoint_id uuid,
  custom_action_id uuid,
  event text not null,
  mode text not null default 'write',
  request_url text not null,
  request_body jsonb,
  response_status integer,
  response_body text,
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now(),

  constraint fk_chatbot_webhook_deliveries_venue
    foreign key (venue_id) references public.venues(id) on delete cascade,
  constraint fk_chatbot_webhook_deliveries_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id) on delete set null,
  constraint fk_chatbot_webhook_deliveries_endpoint
    foreign key (endpoint_id) references public.chatbot_integration_endpoints(id) on delete set null,
  constraint fk_chatbot_webhook_deliveries_action
    foreign key (custom_action_id) references public.chatbot_custom_actions(id) on delete set null,
  constraint chk_chatbot_webhook_deliveries_mode
    check (mode in ('write', 'query'))
);

create index if not exists idx_chatbot_webhook_deliveries_venue_created
  on public.chatbot_webhook_deliveries(venue_id, created_at desc);

create index if not exists idx_chatbot_webhook_deliveries_config_created
  on public.chatbot_webhook_deliveries(chatbot_config_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS — service_role only (dashboard + public chat use service client)
-- ---------------------------------------------------------------------------
alter table public.chatbot_integration_endpoints enable row level security;
alter table public.chatbot_custom_actions enable row level security;
alter table public.chatbot_webhook_deliveries enable row level security;

drop policy if exists service_role_all_chatbot_integration_endpoints
  on public.chatbot_integration_endpoints;
create policy service_role_all_chatbot_integration_endpoints
  on public.chatbot_integration_endpoints
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists service_role_all_chatbot_custom_actions
  on public.chatbot_custom_actions;
create policy service_role_all_chatbot_custom_actions
  on public.chatbot_custom_actions
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists service_role_all_chatbot_webhook_deliveries
  on public.chatbot_webhook_deliveries;
create policy service_role_all_chatbot_webhook_deliveries
  on public.chatbot_webhook_deliveries
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.chatbot_integration_endpoints from anon, authenticated;
revoke all on table public.chatbot_custom_actions from anon, authenticated;
revoke all on table public.chatbot_webhook_deliveries from anon, authenticated;
