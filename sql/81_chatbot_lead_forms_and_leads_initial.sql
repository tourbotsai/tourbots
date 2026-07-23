-- 81_chatbot_lead_forms_and_leads_initial.sql
-- Venue chatbot lead capture: form config, fields, and submissions.
-- Run after 80_drop_legacy_platform_outbound_tables.sql.
-- tour_id is nullable so standalone / navigation-off website chatbots can capture leads.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- chatbot_lead_forms — one config per chatbot
-- ---------------------------------------------------------------------------
create table if not exists public.chatbot_lead_forms (
  id uuid primary key default gen_random_uuid(),
  chatbot_config_id uuid not null,
  venue_id uuid not null,
  tour_id uuid,
  is_enabled boolean not null default false,
  intro_message text,
  submit_label text not null default 'Send',
  success_message text not null default 'Thanks - we''ll be in touch shortly.',
  privacy_policy_url text,
  consent_checkbox_label text not null default 'By submitting, you agree to our privacy policy.',
  condition_type text not null default 'intent',
  condition_keywords text[] not null default '{}',
  condition_intent text,
  email_notifications_enabled boolean not null default false,
  notification_email text,
  once_per_conversation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_chatbot_lead_forms_config unique (chatbot_config_id),
  constraint fk_chatbot_lead_forms_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id) on delete cascade,
  constraint fk_chatbot_lead_forms_venue
    foreign key (venue_id) references public.venues(id) on delete cascade,
  constraint fk_chatbot_lead_forms_tour
    foreign key (tour_id) references public.tours(id) on delete set null,
  constraint chk_chatbot_lead_forms_condition_type
    check (condition_type in ('keywords', 'intent'))
);

create index if not exists idx_chatbot_lead_forms_venue
  on public.chatbot_lead_forms(venue_id);

create index if not exists idx_chatbot_lead_forms_enabled
  on public.chatbot_lead_forms(chatbot_config_id, is_enabled);

drop trigger if exists trg_chatbot_lead_forms_updated_at on public.chatbot_lead_forms;
create trigger trg_chatbot_lead_forms_updated_at
  before update on public.chatbot_lead_forms
  for each row
  execute function public.set_updated_at_timestamp();

-- ---------------------------------------------------------------------------
-- chatbot_lead_form_fields
-- ---------------------------------------------------------------------------
create table if not exists public.chatbot_lead_form_fields (
  id uuid primary key default gen_random_uuid(),
  lead_form_id uuid not null,
  field_key text not null,
  label text not null,
  field_type text not null,
  placeholder text,
  options jsonb,
  is_required boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_chatbot_lead_form_fields_form
    foreign key (lead_form_id) references public.chatbot_lead_forms(id) on delete cascade,
  constraint uq_chatbot_lead_form_fields_key unique (lead_form_id, field_key),
  constraint chk_chatbot_lead_form_fields_type
    check (field_type in ('text', 'email', 'phone', 'textarea', 'select'))
);

create index if not exists idx_chatbot_lead_form_fields_form_order
  on public.chatbot_lead_form_fields(lead_form_id, display_order);

drop trigger if exists trg_chatbot_lead_form_fields_updated_at on public.chatbot_lead_form_fields;
create trigger trg_chatbot_lead_form_fields_updated_at
  before update on public.chatbot_lead_form_fields
  for each row
  execute function public.set_updated_at_timestamp();

-- ---------------------------------------------------------------------------
-- leads — submissions (lean; consent snapshot required)
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  tour_id uuid,
  chatbot_config_id uuid,
  lead_form_id uuid,
  conversation_id uuid,
  session_id text,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  field_values jsonb not null default '{}'::jsonb,
  source text not null default 'chatbot',
  status text not null default 'new',
  consent_given boolean not null,
  consent_text text,
  consent_privacy_url text,
  consented_at timestamptz not null,
  page_url text,
  domain text,
  user_agent text,
  ip_address text,
  notification_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_leads_venue
    foreign key (venue_id) references public.venues(id) on delete cascade,
  constraint fk_leads_tour
    foreign key (tour_id) references public.tours(id) on delete set null,
  constraint fk_leads_chatbot_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id) on delete set null,
  constraint fk_leads_lead_form
    foreign key (lead_form_id) references public.chatbot_lead_forms(id) on delete set null,
  constraint chk_leads_status
    check (status in ('new', 'contacted', 'archived')),
  constraint chk_leads_consent_given
    check (consent_given = true)
);

create index if not exists idx_leads_venue_created
  on public.leads(venue_id, created_at desc);

create index if not exists idx_leads_config_created
  on public.leads(chatbot_config_id, created_at desc);

create index if not exists idx_leads_visitor_email
  on public.leads(visitor_email)
  where visitor_email is not null;

create index if not exists idx_leads_session_created
  on public.leads(session_id, created_at desc)
  where session_id is not null;

create index if not exists idx_leads_ip_created
  on public.leads(venue_id, ip_address, created_at desc)
  where ip_address is not null;

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at_timestamp();

-- ---------------------------------------------------------------------------
-- RLS — service_role only for writes; no anon/authenticated grants
-- (public submit goes through Next.js APIs using the service role client)
-- ---------------------------------------------------------------------------
alter table public.chatbot_lead_forms enable row level security;
alter table public.chatbot_lead_form_fields enable row level security;
alter table public.leads enable row level security;

drop policy if exists service_role_all_chatbot_lead_forms on public.chatbot_lead_forms;
create policy service_role_all_chatbot_lead_forms
  on public.chatbot_lead_forms
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists service_role_all_chatbot_lead_form_fields on public.chatbot_lead_form_fields;
create policy service_role_all_chatbot_lead_form_fields
  on public.chatbot_lead_form_fields
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists service_role_all_leads on public.leads;
create policy service_role_all_leads
  on public.leads
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.chatbot_lead_forms from anon, authenticated;
revoke all on table public.chatbot_lead_form_fields from anon, authenticated;
revoke all on table public.leads from anon, authenticated;
