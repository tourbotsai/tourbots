-- 11_chatbot_customisations_initial.sql
-- Bootstrap chatbot customisation table for tour chatbot styling.
-- Run this after 2_venues_initial.sql.

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

create table if not exists public.chatbot_customisations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  chatbot_type text not null default 'tour',

  -- Existing basic fields
  chat_button_color text,
  chat_button_size text,
  chat_button_position text,
  chat_button_icon text,
  icon_size integer,
  header_icon_size integer,
  header_icon text,
  header_background_color text,
  header_text_color text,
  window_title text,
  window_width integer,
  window_height integer,
  ai_message_background text,
  ai_message_text_color text,
  user_message_background text,
  user_message_text_color text,
  input_background_color text,
  send_button_color text,
  send_button_icon_color text,
  show_powered_by boolean,
  custom_logo_url text,
  custom_header_icon_url text,

  -- Desktop expansion
  font_family text,
  header_text_size integer,
  message_text_size integer,
  placeholder_text_size integer,
  input_placeholder_text text,
  placeholder_text_color text,
  input_text_color text,
  branding_text_size integer,
  message_font_weight text,
  header_font_weight text,

  -- Visual effects and shadows
  chat_button_shadow_intensity text,
  chat_window_shadow_intensity text,
  message_shadow_enabled boolean,
  chat_button_shadow text,

  -- Border radius controls
  chat_button_border_radius integer,
  chat_window_border_radius integer,
  message_border_radius integer,
  input_border_radius integer,

  -- Animation and interaction controls
  enable_animations boolean,
  animation_speed text,
  chat_entrance_animation text,
  message_animation text,
  button_hover_effect text,
  chat_button_animation text,
  animation_interval integer,
  idle_animation_enabled boolean,
  idle_animation_type text,
  idle_animation_interval integer,

  -- Message features
  show_timestamps boolean,
  timestamp_format text,
  message_max_width integer,

  -- Avatar customisation
  show_user_avatar boolean,
  show_bot_avatar boolean,
  avatar_style text,
  custom_bot_avatar_url text,
  custom_user_avatar_url text,
  bot_avatar_icon text,
  user_avatar_icon text,

  -- Enhanced send button styling
  send_button_style text,
  send_button_size text,
  send_button_border_radius integer,
  send_button_icon text,
  send_button_hover_color text,
  chat_button_hover_color text,

  -- Typing indicator customisation
  typing_indicator_enabled boolean,
  typing_indicator_style text,
  typing_indicator_color text,
  typing_indicator_speed text,
  typing_indicator_animation text,

  -- Loading states
  loading_spinner_style text,
  loading_text_enabled boolean,
  loading_spinner_color text,
  loading_animation text,
  loading_text_color text,
  loading_background_color text,

  -- Layout and dimensions
  chat_window_height integer,
  chat_window_width integer,
  header_height integer,
  input_height integer,
  chat_button_bottom_offset integer,
  chat_button_side_offset integer,
  chat_offset_bottom integer,
  chat_offset_side integer,
  welcome_message_delay integer,

  -- Mobile expansion
  mobile_chat_button_color text,
  mobile_chat_button_size text,
  mobile_chat_button_position text,
  mobile_icon_size integer,
  mobile_chat_button_border_radius integer,
  mobile_chat_button_bottom_offset integer,
  mobile_chat_button_side_offset integer,
  mobile_chat_window_width integer,
  mobile_chat_window_height integer,
  mobile_chat_window_border_radius integer,
  mobile_header_height integer,
  mobile_input_height integer,
  mobile_fullscreen boolean,
  mobile_message_border_radius integer,
  mobile_input_border_radius integer,
  mobile_message_max_width integer,
  mobile_font_family text,
  mobile_header_text_size integer,
  mobile_message_text_size integer,
  mobile_placeholder_text_size integer,
  mobile_input_placeholder_text text,
  mobile_placeholder_text_color text,
  mobile_input_text_color text,
  mobile_branding_text_size integer,
  mobile_show_user_avatar boolean,
  mobile_show_bot_avatar boolean,
  mobile_header_background_color text,
  mobile_header_text_color text,
  mobile_ai_message_background text,
  mobile_ai_message_text_color text,
  mobile_user_message_background text,
  mobile_input_background_color text,
  mobile_send_button_color text,
  mobile_typing_indicator_enabled boolean,

  -- Mobile expanded features
  mobile_chat_button_icon text,
  mobile_chat_button_hover_color text,
  mobile_chat_button_shadow boolean,
  mobile_chat_button_shadow_intensity text,
  mobile_chat_button_animation text,
  mobile_header_icon_size integer,
  mobile_header_icon text,
  mobile_button_hover_effect text,
  mobile_window_title text,
  mobile_chat_window_shadow_intensity text,
  mobile_chat_offset_bottom integer,
  mobile_chat_offset_side integer,
  mobile_welcome_message_delay integer,
  mobile_send_button_icon_color text,
  mobile_send_button_style text,
  mobile_send_button_size text,
  mobile_send_button_border_radius integer,
  mobile_send_button_icon text,
  mobile_send_button_hover_color text,
  mobile_message_font_weight text,
  mobile_header_font_weight text,
  mobile_user_message_text_color text,
  mobile_message_shadow_enabled boolean,
  mobile_avatar_style text,
  mobile_custom_bot_avatar_url text,
  mobile_custom_user_avatar_url text,
  mobile_bot_avatar_icon text,
  mobile_user_avatar_icon text,
  mobile_enable_animations boolean,
  mobile_animation_speed text,
  mobile_chat_entrance_animation text,
  mobile_message_animation text,
  mobile_animation_interval integer,
  mobile_idle_animation_enabled boolean,
  mobile_idle_animation_type text,
  mobile_idle_animation_interval integer,
  mobile_typing_indicator_style text,
  mobile_typing_indicator_color text,
  mobile_typing_indicator_speed text,
  mobile_typing_indicator_animation text,
  mobile_loading_spinner_style text,
  mobile_loading_text_enabled boolean,
  mobile_loading_spinner_color text,
  mobile_loading_animation text,
  mobile_loading_text_color text,
  mobile_loading_background_color text,
  mobile_show_powered_by boolean,
  mobile_show_timestamps boolean,
  mobile_timestamp_format text,
  mobile_custom_logo_url text,
  mobile_custom_header_icon_url text,

  -- Metadata
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_chatbot_customisations_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_chatbot_customisations_type_tour_only
    check (chatbot_type = 'tour')
);

create unique index if not exists idx_chatbot_customisations_venue_type_unique
  on public.chatbot_customisations(venue_id, chatbot_type);

create index if not exists idx_chatbot_customisations_venue_id
  on public.chatbot_customisations(venue_id);

drop trigger if exists trg_chatbot_customisations_set_updated_at on public.chatbot_customisations;
create trigger trg_chatbot_customisations_set_updated_at
before update on public.chatbot_customisations
for each row
execute function public.set_updated_at_timestamp();
