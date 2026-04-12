-- 4_tour_menu_initial.sql
-- Bootstrap tables required for Tour Menu Builder.
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

create table if not exists public.tour_menu_settings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  tour_id uuid not null unique,

  enabled boolean not null default false,
  show_close_button boolean not null default true,

  position text not null default 'center',
  max_width integer not null default 600,
  padding integer not null default 24,
  border_radius integer not null default 16,

  menu_background_color text not null default '#FFFFFF',
  backdrop_blur boolean not null default true,
  entrance_animation text not null default 'fade-scale',

  show_reopen_widget boolean not null default true,
  widget_position text not null default 'bottom-left',
  widget_icon text not null default 'HelpCircle',
  widget_size text not null default 'medium',
  widget_color text not null default '#FFFFFF',
  widget_hover_color text not null default '#FFFFFF',
  widget_icon_color text not null default '#EF4444',
  widget_x_offset integer not null default 24,
  widget_y_offset integer not null default 24,
  widget_tooltip_text text not null default 'Reopen Tour Menu',
  widget_border_radius integer not null default 50,
  widget_shadow_intensity text not null default 'medium',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_tour_menu_settings_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint fk_tour_menu_settings_tour
    foreign key (tour_id) references public.tours(id)
    on delete cascade,

  constraint chk_tour_menu_position
    check (position in ('center', 'top', 'bottom')),
  constraint chk_tour_menu_animation
    check (entrance_animation in ('fade-scale', 'slide-up', 'slide-down', 'none')),
  constraint chk_tour_menu_widget_position
    check (widget_position in ('bottom-left', 'bottom-right', 'top-left', 'top-right')),
  constraint chk_tour_menu_widget_icon
    check (widget_icon in ('HelpCircle', 'Info', 'Menu')),
  constraint chk_tour_menu_widget_size
    check (widget_size in ('small', 'medium', 'large')),
  constraint chk_tour_menu_widget_shadow
    check (widget_shadow_intensity in ('none', 'light', 'medium', 'heavy')),
  constraint chk_tour_menu_max_width
    check (max_width between 300 and 1000),
  constraint chk_tour_menu_padding
    check (padding between 12 and 48),
  constraint chk_tour_menu_widget_x_offset
    check (widget_x_offset between 0 and 200),
  constraint chk_tour_menu_widget_y_offset
    check (widget_y_offset between 0 and 200),
  constraint chk_tour_menu_widget_border_radius
    check (widget_border_radius between 0 and 100),
  constraint chk_tour_menu_hex_colours
    check (
      menu_background_color ~* '^#[0-9A-F]{6}$'
      and widget_color ~* '^#[0-9A-F]{6}$'
      and widget_hover_color ~* '^#[0-9A-F]{6}$'
      and widget_icon_color ~* '^#[0-9A-F]{6}$'
    )
);

create index if not exists idx_tour_menu_settings_venue_id on public.tour_menu_settings(venue_id);
create index if not exists idx_tour_menu_settings_tour_id on public.tour_menu_settings(tour_id);

drop trigger if exists trg_tour_menu_settings_set_updated_at on public.tour_menu_settings;
create trigger trg_tour_menu_settings_set_updated_at
before update on public.tour_menu_settings
for each row
execute function public.set_updated_at_timestamp();

create table if not exists public.tour_menu_blocks (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null,
  block_type text not null,
  display_order integer not null default 0,
  alignment text not null default 'center',
  margin_top integer not null default 0,
  margin_bottom integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  styling jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_tour_menu_blocks_menu
    foreign key (menu_id) references public.tour_menu_settings(id)
    on delete cascade,
  constraint chk_tour_menu_block_type
    check (block_type in ('text', 'buttons', 'logo', 'table', 'spacer')),
  constraint chk_tour_menu_block_alignment
    check (alignment in ('left', 'center', 'right'))
);

create index if not exists idx_tour_menu_blocks_menu_id on public.tour_menu_blocks(menu_id);
create index if not exists idx_tour_menu_blocks_order on public.tour_menu_blocks(menu_id, display_order);

drop trigger if exists trg_tour_menu_blocks_set_updated_at on public.tour_menu_blocks;
create trigger trg_tour_menu_blocks_set_updated_at
before update on public.tour_menu_blocks
for each row
execute function public.set_updated_at_timestamp();

-- Optional: ensure the logo upload bucket exists for menu logos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chatbots',
  'chatbots',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;