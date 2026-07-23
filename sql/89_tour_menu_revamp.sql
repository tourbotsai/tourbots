-- 89_tour_menu_revamp.sql
-- Additive chrome + nav_list support for the tour menu revamp.
-- Run after 87_billing_unit_rename_space_to_bot.sql (and 64_tour_menu_padding_vertical.sql).
-- Existing menus backfill to menu_style = 'modal'. App defaults NEW menus to 'icon'.

-- ---------------------------------------------------------------------------
-- 1) Chrome columns on tour_menu_settings
-- ---------------------------------------------------------------------------
alter table public.tour_menu_settings
  add column if not exists menu_style text not null default 'modal';

alter table public.tour_menu_settings
  add column if not exists anchor_side text not null default 'left';

alter table public.tour_menu_settings
  add column if not exists start_open boolean not null default true;

alter table public.tour_menu_settings
  add column if not exists drawer_width integer not null default 360;

alter table public.tour_menu_settings
  add column if not exists mobile_drawer_width integer;

alter table public.tour_menu_settings
  add column if not exists mobile_max_width integer;

alter table public.tour_menu_settings
  add column if not exists mobile_padding integer;

alter table public.tour_menu_settings
  add column if not exists mobile_padding_vertical integer;

alter table public.tour_menu_settings
  add column if not exists mobile_widget_position text;

alter table public.tour_menu_settings
  add column if not exists mobile_widget_size text;

alter table public.tour_menu_settings
  add column if not exists avoid_chat_launcher boolean not null default true;

-- Backfill any null-ish legacy rows (defaults already applied for new columns)
update public.tour_menu_settings
set menu_style = 'modal'
where menu_style is null or trim(menu_style) = '';

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_style;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_style
  check (menu_style in ('modal', 'drawer', 'icon'));

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_anchor_side;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_anchor_side
  check (anchor_side in ('left', 'right'));

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_drawer_width;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_drawer_width
  check (drawer_width between 240 and 560);

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_mobile_drawer_width;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_mobile_drawer_width
  check (mobile_drawer_width is null or mobile_drawer_width between 240 and 560);

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_mobile_max_width;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_mobile_max_width
  check (mobile_max_width is null or mobile_max_width between 300 and 1000);

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_mobile_padding;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_mobile_padding
  check (mobile_padding is null or mobile_padding between 12 and 48);

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_mobile_widget_position;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_mobile_widget_position
  check (
    mobile_widget_position is null
    or mobile_widget_position in ('bottom-left', 'bottom-right', 'top-left', 'top-right')
  );

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_mobile_widget_size;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_mobile_widget_size
  check (
    mobile_widget_size is null
    or mobile_widget_size in ('small', 'medium', 'large')
  );

-- ---------------------------------------------------------------------------
-- 2) Allow nav_list block type
-- ---------------------------------------------------------------------------
alter table public.tour_menu_blocks
  drop constraint if exists chk_tour_menu_block_type;

alter table public.tour_menu_blocks
  add constraint chk_tour_menu_block_type
  check (block_type in ('text', 'buttons', 'logo', 'table', 'spacer', 'nav_list'));

-- Verification (run manually):
-- select menu_style, anchor_side, drawer_width from public.tour_menu_settings limit 5;
-- select distinct block_type from public.tour_menu_blocks;
