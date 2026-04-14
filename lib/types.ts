// User type for Supabase user row
export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_image_url?: string | null;
  role: string; // 'platform_admin', 'admin', 'user'
  venue_id?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Venue type for Supabase venue row
export interface Venue {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  phone?: string | null;
  email?: string | null;
  address: string;
  city: string;
  postcode: string;
  country: string;
  owner_id?: string | null;
  subscription_plan: SubscriptionPlan;
  subscription_status: string; // 'active', 'cancelled', 'past_due'
  stripe_customer_id?: string | null;
  theme_preference: 'light' | 'dark';
  is_active: boolean;
  in_setup: boolean; // NEW: Setup mode flag
  /** Set when the venue copies the simple iframe embed (Share & Embed). */
  pressed_share?: boolean;
  /** When true, the dashboard onboarding checklist is hidden (Settings → Display Preferences). */
  hide_onboarding_checklist?: boolean;
  created_at: string;
  updated_at: string;
}

// Combined User + Venue data for easy use in components
export interface UserWithVenue extends User {
  venue: Venue;
}

// Venue information for detailed chatbot context
export interface VenueInformation {
  id: string;
  venue_id: string;
  
  // Basic Information
  venue_name?: string | null;
  tagline?: string | null;
  description?: string | null;
  website_url?: string | null;
  phone_number?: string | null;
  email?: string | null;
  
  // Location & Contact
  full_address?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  parking_information?: string | null;
  public_transport?: string | null;
  
  // Opening Hours
  monday_hours?: string | null;
  tuesday_hours?: string | null;
  wednesday_hours?: string | null;
  thursday_hours?: string | null;
  friday_hours?: string | null;
  saturday_hours?: string | null;
  sunday_hours?: string | null;
  holiday_hours?: string | null;
  
  // Facilities & Equipment
  cardio_equipment?: string | null;
  strength_equipment?: string | null;
  functional_training?: string | null;
  speciality_areas?: string | null;
  changing_facilities?: string | null;
  additional_amenities?: string | null;
  
  // Membership & Pricing
  membership_types?: string | null;
  pricing_information?: string | null;
  student_discounts?: string | null;
  corporate_memberships?: string | null;
  day_passes?: string | null;
  payment_methods?: string | null;
  
  // Classes & Programs
  group_fitness_classes?: string | null;
  personal_training?: string | null;
  speciality_programs?: string | null;
  class_schedule?: string | null;
  
  // Policies & Rules
  age_restrictions?: string | null;
  guest_policy?: string | null;
  cancellation_policy?: string | null;
  health_safety?: string | null;
  dress_code?: string | null;
  
  // Staff & Services
  personal_trainers?: string | null;
  nutritionists?: string | null;
  physiotherapy?: string | null;
  other_services?: string | null;
  
  // Special Features
  accessibility?: string | null;
  technology?: string | null;
  community_programs?: string | null;
  awards_certifications?: string | null;
  
  created_at: string;
  updated_at: string;
}

// Tour type for VR tours
export interface Tour {
  id: string;
  venue_id: string;
  parent_tour_id?: string | null;
  title: string;
  description?: string | null;
  matterport_tour_id: string;
  matterport_url: string;
  thumbnail_url?: string | null;
  is_active: boolean;
  view_count: number;
  // Multi-model support fields
  tour_type?: 'primary' | 'secondary';
  display_order?: number;
  navigation_keywords?: string[];
  created_at: string;
  updated_at: string;
}

// Tour point for navigation
export interface TourPoint {
  id: string;
  tour_id: string;
  name: string;
  sweep_id: string;
  position?: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    x: number;
    y: number;
  };
  created_at: string;
  updated_at: string;
}

// Tour Menu Settings for customisable landing overlays
export interface TourMenuSettings {
  id: string;
  venue_id: string;
  tour_id: string;
  
  // Feature control
  enabled: boolean;
  show_close_button: boolean;
  
  // Layout
  position: 'center' | 'top' | 'bottom';
  max_width: number;
  padding: number;
  border_radius: number;
  
  // Styling
  menu_background_color: string;
  backdrop_blur: boolean;
  
  // Animation
  entrance_animation: 'fade-scale' | 'slide-up' | 'slide-down' | 'none';
  
  // Widget Settings (Reopen Button)
  show_reopen_widget: boolean;
  widget_position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  widget_icon: 'HelpCircle' | 'Info' | 'Menu';
  widget_size: 'small' | 'medium' | 'large';
  widget_color: string;
  widget_hover_color: string;
  widget_icon_color: string;
  widget_x_offset: number;
  widget_y_offset: number;
  widget_tooltip_text: string;
  widget_border_radius: number;
  widget_shadow_intensity: 'none' | 'light' | 'medium' | 'heavy';
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Tour Menu Block - individual content blocks
export interface TourMenuBlock {
  id: string;
  menu_id: string;
  block_type: 'text' | 'buttons' | 'logo' | 'table' | 'spacer';
  display_order: number;
  alignment: 'left' | 'center' | 'right';
  margin_top: number;
  margin_bottom: number;
  content: TourMenuBlockContent;
  styling: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Union type for all block content types
export type TourMenuBlockContent = 
  | TextBlockContent 
  | ButtonsBlockContent 
  | LogoBlockContent 
  | TableBlockContent 
  | SpacerBlockContent;

// Text Block Content
export interface TextBlockContent {
  text_type: 'header' | 'subheader' | 'paragraph';
  text: string;
  font_size: number;
  font_weight: 'light' | 'normal' | 'semibold' | 'bold';
  color: string;
  line_height: number;
}

// Buttons Block Content
export interface ButtonsBlockContent {
  buttons: MenuButton[];
  buttons_per_row: 1 | 2 | 3 | 4; // Desktop
  mobile_buttons_per_row?: 1 | 2 | 3 | 4; // Mobile (optional - falls back to desktop)
  button_size: 'small' | 'medium' | 'large';
  button_style: 'solid' | 'outline' | 'ghost';
  gap: number;
}

// Individual Menu Button
export interface MenuButton {
  id: string;
  label: string;
  action_type: 'tour_point' | 'tour_model' | 'url' | 'close_menu' | 'open_chat';
  target_id: string; // For tour_point: point.id, for tour_model: tour.id, for url: URL string, for open_chat: empty
  target_tour_id?: string; // For tour_point: selected source tour.id when multiple models exist
  target_model_id?: string; // For tour_model: matterport_tour_id (direct model ID)
  target_model_name?: string; // For tour_model: tour.title
  button_color: string;
  text_color: string;
  icon?: string;
}

// Logo Block Content
export interface LogoBlockContent {
  image_url: string;
  width: number;
  height: number;
  desktop_size?: number;
  mobile_size?: number;
  alt_text: string;
}

// Table Block Content
export interface TableBlockContent {
  headers: string[];
  rows: string[][];
  header_background: string;
  border_color: string;
  text_size: number;
}

// Spacer Block Content
export interface SpacerBlockContent {
  height: number;
}

// Tour Menu Widget Constants
export const WIDGET_SIZE_MAP = {
  small: 40,
  medium: 56,
  large: 72
} as const;

export const WIDGET_ICON_SIZE_MAP = {
  small: 20,
  medium: 28,
  large: 36
} as const;

export const WIDGET_SHADOW_MAP = {
  none: 'none',
  light: '0 2px 8px rgba(0, 0, 0, 0.1)',
  medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
  heavy: '0 8px 24px rgba(0, 0, 0, 0.25)'
} as const;

// Chatbot configuration
export interface ChatbotConfig {
  id: string;
  venue_id: string;
  tour_id: string;
  chatbot_type: 'tour';
  chatbot_name: string;
  welcome_message?: string | null;
  personality_prompt?: string | null;
  instruction_prompt?: string | null;
  guardrails_enabled?: boolean | null;
  guardrail_prompt?: string | null;
  openai_vector_store_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Rate limiting fields
  rate_limit_requests_per_minute?: number | null;
  rate_limit_requests_per_hour?: number | null;
  rate_limit_requests_per_day?: number | null;
  rate_limit_requests_per_week?: number | null;
  rate_limit_requests_per_month?: number | null;
  rate_limit_burst_limit?: number | null;
  enable_rate_limiting?: boolean | null;
  
  // Hard limiting fields
  hard_limits_enabled?: boolean | null;
  hard_limit_daily_messages?: number | null;
  hard_limit_weekly_messages?: number | null;
  hard_limit_monthly_messages?: number | null;
  hard_limit_yearly_messages?: number | null;
  
  // Relations
  venues?: Venue;
}

// Hard limit configuration
export interface HardLimitConfig {
  enabled: boolean;
  dailyMessages: number;
  weeklyMessages: number;
  monthlyMessages: number;
  yearlyMessages: number;
}

// Hard limit usage tracking
export interface HardLimitUsage {
  id: string;
  venue_id: string;
  chatbot_type: 'tour';
  tour_id?: string | null;
  daily_messages_used: number;
  weekly_messages_used: number;
  monthly_messages_used: number;
  yearly_messages_used: number;
  daily_reset_at: string;
  weekly_reset_at: string;
  monthly_reset_at: string;
  yearly_reset_at: string;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Hard limit check result
export interface HardLimitResult {
  allowed: boolean;
  limitType: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  currentUsage: number;
  limit: number;
  resetTime: Date;
  message?: string;
  remaining: number;
  usagePercentage: number;
}

// Combined hard limit data for UI
export interface HardLimitStatus {
  config: HardLimitConfig;
  usage: HardLimitUsage;
  isApproachingLimit: boolean;
  alerts: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    yearly: boolean;
  };
}

// Chatbot conversations
export interface Conversation {
  id: string;
  venue_id: string;
  tour_id?: string | null;
  session_id: string;
  conversation_id: string;
  message_position: number;
  visitor_id?: string | null;
  message?: string | null;
  response?: string | null;
  message_type: 'visitor' | 'bot';
  chatbot_type?: 'tour' | null;
  ip_address?: string | null;
  user_agent?: string | null;
  page_url?: string | null;
  domain?: string | null;
  embed_id?: string | null;
  response_time_ms?: number | null;
  created_at: string;
}

// Chatbot documents for vector store
export interface ChatbotDocument {
  id: string;
  chatbot_config_id: string;
  venue_id: string;
  tour_id: string;
  original_filename: string;
  file_size?: number | null;
  file_type?: string | null;
  openai_file_id: string;
  openai_vector_store_id: string;
  uploaded_by?: string | null;
  chatbot_type?: 'tour' | null;
  file_path?: string | null;
  file_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotInfoField {
  id: string;
  section_id: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'url' | 'phone' | 'email';
  field_value?: string | null;
  display_order: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatbotInfoSection {
  id: string;
  chatbot_config_id: string;
  section_key: string;
  section_title: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  fields?: ChatbotInfoField[];
}

export type ChatbotTriggerConditionType = 'keywords' | 'message_count';
export type ChatbotTriggerActionType = 'ai_message' | 'open_url' | 'navigate_tour_point' | 'switch_tour_model';

export interface ChatbotTrigger {
  id: string;
  chatbot_config_id: string;
  venue_id: string;
  tour_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  condition_type: ChatbotTriggerConditionType;
  condition_keywords?: string[] | null;
  condition_message_count?: number | null;
  action_type: ChatbotTriggerActionType;
  action_message: string;
  action_url?: string | null;
  action_tour_point_id?: string | null;
  action_tour_model_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotTriggerTourPointOption {
  id: string;
  name: string;
}

export interface ChatbotTriggerTourModelOption {
  id: string;
  name: string;
  matterport_tour_id: string;
}

// Chatbot customisation settings - MASSIVELY EXPANDED
export interface ChatbotCustomisation {
  id: string;
  venue_id: string;
  tour_id?: string | null;
  chatbot_type: 'tour';
  
  // EXISTING BASIC FIELDS
  chat_button_color: string;
  chat_button_size: 'small' | 'medium' | 'large';
  chat_button_position: 'bottom-right' | 'bottom-left';
  chat_button_icon: string;
  icon_size: number; // Size of the icon in pixels (16-80)
  header_icon_size: number; // Size of the header icon in pixels (12-32)
  header_icon: string; // Header icon selection (Bot, MessageCircle, Headphones, Users, Crown, Shield)
  header_background_color: string;
  header_text_color: string;
  window_title?: string | null;
  window_width: number;
  window_height: number;
  ai_message_background: string;
  ai_message_text_color: string;
  user_message_background: string;
  user_message_text_color: string;
  input_background_color: string;
  send_button_color: string;
  send_button_icon_color: string;
  show_powered_by: boolean;
  custom_logo_url?: string | null;
  custom_header_icon_url?: string | null; // Custom header icon image URL
  
  // DESKTOP EXPANSION
  // Typography System
  font_family: string;
  header_text_size: number;
  message_text_size: number;
  placeholder_text_size: number;
  input_placeholder_text: string;
  placeholder_text_color: string; // 🆕 Placeholder text colour
  input_text_color: string; // 🆕 Input text colour
  branding_text_size: number;
  message_font_weight: 'light' | 'normal' | 'medium' | 'bold';
  header_font_weight: 'light' | 'normal' | 'medium' | 'bold';
  
  // Visual Effects & Shadows
  chat_button_shadow_intensity: 'none' | 'light' | 'medium' | 'heavy';
  chat_window_shadow_intensity: 'none' | 'light' | 'medium' | 'heavy';
  message_shadow_enabled: boolean;
  chat_button_shadow: string;
  
  // Border Radius Controls
  chat_button_border_radius: number;
  chat_window_border_radius: number;
  message_border_radius: number;
  input_border_radius: number;
  
  // Animation & Interaction Controls
  enable_animations: boolean;
  animation_speed: 'slow' | 'normal' | 'fast';
  chat_entrance_animation: 'slide-up' | 'slide-down' | 'fade-in' | 'scale-up' | 'none';
  message_animation: 'fade-in' | 'slide-in' | 'scale-in' | 'none';
  button_hover_effect: 'scale' | 'glow' | 'lift' | 'none';
  chat_button_animation: 'none' | 'bounce' | 'pulse' | 'shake' | 'glow';
  animation_interval: number;
  idle_animation_enabled: boolean;
  idle_animation_type: 'bounce' | 'pulse' | 'shake' | 'glow' | 'none';
  idle_animation_interval: number;
  
  // Message Features
  show_timestamps: boolean;
  timestamp_format: '12h' | '24h' | 'relative';
  message_max_width: number;
  
  // Avatar Customisation
  show_user_avatar: boolean;
  show_bot_avatar: boolean;
  avatar_style: 'circle' | 'square' | 'rounded';
  custom_bot_avatar_url?: string | null;
  custom_user_avatar_url?: string | null;
  bot_avatar_icon: string;
  user_avatar_icon: string;
  
  // Enhanced Send Button Styling
  send_button_style: 'icon' | 'text' | 'icon-text';
  send_button_size: 'small' | 'medium' | 'large';
  send_button_border_radius: number;
  send_button_icon: 'Send' | 'ArrowRight' | 'ChevronRight' | 'Play' | 'MessageCircle';
  send_button_hover_color: string;
  chat_button_hover_color: string;
  
  // Typing Indicator Customisation
  typing_indicator_enabled: boolean;
  typing_indicator_style: 'dots' | 'wave' | 'pulse' | 'none';
  typing_indicator_color?: string | null;
  typing_indicator_speed: 'slow' | 'normal' | 'fast';
  typing_indicator_animation: 'dots' | 'wave' | 'pulse';
  
  // Loading States
  loading_spinner_style: 'dots' | 'circle' | 'bars' | 'pulse';
  loading_text_enabled: boolean;
  loading_spinner_color?: string | null;
  loading_animation: 'spinner' | 'dots' | 'bars';
  loading_text_color: string;
  loading_background_color: string;
  
  // Layout & Dimensions
  chat_window_height: number;
  chat_window_width: number;
  header_height: number;
  input_height: number;
  chat_button_bottom_offset: number;
  chat_button_side_offset: number;
  chat_offset_bottom: number;
  chat_offset_side: number;
  welcome_message_delay: number;
  
  // MOBILE EXPANSION
  // Mobile Chat Button
  mobile_chat_button_color?: string | null;
  mobile_chat_button_size: 'small' | 'medium' | 'large';
  mobile_chat_button_position: 'bottom-right' | 'bottom-left';
  mobile_icon_size: number;
  mobile_chat_button_border_radius: number;
  mobile_chat_button_bottom_offset: number;
  mobile_chat_button_side_offset: number;
  
  // Mobile Chat Window
  mobile_chat_window_width: number;
  mobile_chat_window_height: number;
  mobile_chat_window_border_radius: number;
  mobile_header_height: number;
  mobile_input_height: number;
  mobile_fullscreen: boolean;
  
  // Mobile Message Styling
  mobile_message_border_radius: number;
  mobile_input_border_radius: number;
  mobile_message_max_width: number;
  
  // Mobile Typography
  mobile_font_family?: string | null;
  mobile_header_text_size: number;
  mobile_message_text_size: number;
  mobile_placeholder_text_size: number;
  mobile_input_placeholder_text: string;
  mobile_placeholder_text_color: string; // 🆕 Mobile placeholder text colour
  mobile_input_text_color: string; // 🆕 Mobile input text colour
  mobile_branding_text_size: number;
  
  // Mobile Avatar Controls
  mobile_show_user_avatar: boolean;
  mobile_show_bot_avatar: boolean;
  
  // Mobile Color Overrides
  mobile_header_background_color?: string | null;
  mobile_header_text_color?: string | null;
  mobile_ai_message_background?: string | null;
  mobile_ai_message_text_color?: string | null;
  mobile_user_message_background?: string | null;
  mobile_input_background_color?: string | null;
  mobile_send_button_color?: string | null;
  
  // Mobile Interaction Features
  mobile_typing_indicator_enabled: boolean;
  
  // MOBILE EXPANDED FEATURES - Complete Desktop/Mobile Separation
  // Mobile Chat Button & Icons (7 additional fields)
  mobile_chat_button_icon: string;
  mobile_chat_button_hover_color: string;
  mobile_chat_button_shadow: boolean;
  mobile_chat_button_shadow_intensity: 'none' | 'light' | 'medium' | 'heavy';
  mobile_chat_button_animation: 'none' | 'bounce' | 'pulse' | 'shake' | 'glow';
  mobile_header_icon_size: number;
  mobile_header_icon: string; // Mobile header icon selection (Bot, MessageCircle, Headphones, Users, Crown, Shield)
  mobile_button_hover_effect: 'scale' | 'glow' | 'lift' | 'none';
  
  // Mobile Chat Window & Layout (5 additional fields)
  mobile_window_title?: string | null;
  mobile_chat_window_shadow_intensity: 'none' | 'light' | 'medium' | 'heavy';
  mobile_chat_offset_bottom: number;
  mobile_chat_offset_side: number;
  mobile_welcome_message_delay: number;
  
  // Mobile Send Button (6 additional fields)
  mobile_send_button_icon_color: string;
  mobile_send_button_style: 'icon' | 'text' | 'icon-text';
  mobile_send_button_size: 'small' | 'medium' | 'large';
  mobile_send_button_border_radius: number;
  mobile_send_button_icon: 'Send' | 'ArrowRight' | 'ChevronRight' | 'Play' | 'MessageCircle';
  mobile_send_button_hover_color: string;
  
  // Mobile Typography & Fonts (2 additional fields)
  mobile_message_font_weight: 'light' | 'normal' | 'medium' | 'bold';
  mobile_header_font_weight: 'light' | 'normal' | 'medium' | 'bold';
  
  // Mobile Message Styling (2 additional fields)
  mobile_user_message_text_color: string;
  mobile_message_shadow_enabled: boolean;
  
  // Mobile Avatars (5 additional fields)
  mobile_avatar_style: 'circle' | 'square' | 'rounded';
  mobile_custom_bot_avatar_url?: string | null;
  mobile_custom_user_avatar_url?: string | null;
  mobile_bot_avatar_icon: string;
  mobile_user_avatar_icon: string;
  
  // Mobile Animations (8 additional fields)
  mobile_enable_animations: boolean;
  mobile_animation_speed: 'slow' | 'normal' | 'fast';
  mobile_chat_entrance_animation: 'slide-up' | 'slide-down' | 'fade-in' | 'scale-up' | 'none';
  mobile_message_animation: 'fade-in' | 'slide-in' | 'scale-in' | 'none';
  mobile_animation_interval: number;
  mobile_idle_animation_enabled: boolean;
  mobile_idle_animation_type: 'bounce' | 'pulse' | 'shake' | 'glow' | 'none';
  mobile_idle_animation_interval: number;
  
  // Mobile Typing Indicator (4 additional fields)
  mobile_typing_indicator_style: 'dots' | 'wave' | 'pulse' | 'none';
  mobile_typing_indicator_color?: string | null;
  mobile_typing_indicator_speed: 'slow' | 'normal' | 'fast';
  mobile_typing_indicator_animation: 'dots' | 'wave' | 'pulse';
  
  // Mobile Loading States (6 additional fields)
  mobile_loading_spinner_style: 'dots' | 'circle' | 'bars' | 'pulse';
  mobile_loading_text_enabled: boolean;
  mobile_loading_spinner_color?: string | null;
  mobile_loading_animation: 'spinner' | 'dots' | 'bars';
  mobile_loading_text_color: string;
  mobile_loading_background_color: string;
  
  // Mobile Branding & Timestamps (4 additional fields)
  mobile_show_powered_by: boolean;
  mobile_show_timestamps: boolean;
  mobile_timestamp_format: '12h' | '24h' | 'relative';
  mobile_custom_logo_url?: string | null;
  mobile_custom_header_icon_url?: string | null; // Mobile custom header icon image URL
  
  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Lead capture - Updated to match new SQL schema
export interface Lead {
  id: string;
  venue_id: string;
  conversation_id?: string | null;
  session_id?: string | null;
  chatbot_type?: 'tour' | null;
  
  // Contact Information
  visitor_name?: string | null;
  visitor_email?: string | null;
  visitor_phone?: string | null;
  
  // Lead Intelligence
  source: string; // Default: 'chatbot'
  lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  interest_level?: 'high' | 'medium' | 'low' | null;
  lead_score: number; // Default: 0
  
  // Context & Notes
  lead_notes?: string | null;
  conversation_context?: any; // JSONB
  interests?: string[] | null; // JSONB array
  
  // Tracking
  ip_address?: string | null;
  user_agent?: string | null;
  page_url?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  
  // Follow-up
  follow_up_date?: string | null;
  assigned_to?: string | null;
  last_contacted_at?: string | null;
  
  created_at: string;
  updated_at: string;
}

// Lead activities for tracking interactions
export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: 
    | 'email_sent' 
    | 'call_made' 
    | 'note_added' 
    | 'status_changed' 
    | 'lead_created'
    | 'lead_captured'        // NEW: When lead is captured from chatbot
    | 'trigger_activated'    // NEW: When custom trigger fires
    | 'ai_scored'           // NEW: When AI scores the lead
    | 'score_updated';      // NEW: When score is manually updated
  description?: string | null;
  performed_by?: string | null;
  metadata?: any; // JSONB - stores trigger details, score info, etc.
  created_at: string;
}

// Lead analytics view
export interface LeadAnalytics {
  venue_id: string;
  total_leads: number;
  leads_this_month: number;
  converted_leads: number;
  tour_leads: number;
  avg_lead_score: number;
  high_interest_leads: number;
  conversion_rate: number;
}

// Lead filters for querying and filtering leads
export interface LeadFilters {
  status?: string[];
  chatbot_type?: string[];
  interest_level?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
  assigned_to?: string;
  source?: string[];
  lead_score_min?: number;
  lead_score_max?: number;
  score_quality?: string;
}

export type ScoreQuality = 'high' | 'medium' | 'low' | 'poor';

// Analytics data
export interface Analytics {
  id: string;
  venue_id: string;
  tour_id?: string | null;
  event_type: string; // 'tour_view', 'chat_started', 'lead_captured'
  visitor_id?: string | null;
  session_duration?: number | null;
  page_views?: number | null;
  device_type?: string | null;
  location?: string | null;
  created_at: string;
}

// Embed analytics data (for tour views and chatbot usage tracking)
export interface EmbedStat {
  id: string;
  venue_id: string;
  tour_id?: string | null;
  embed_id: string;
  embed_type: 'tour' | 'chatbot';
  domain?: string | null;
  page_url?: string | null;
  views_count: number;
  last_viewed_at: string;
  created_at: string;
  updated_at: string;
  chatbot_type?: 'tour' | null;
  user_agent?: string | null;
}

// Subscription data (updated to match new database table)
export interface Subscription {
  id: string;
  venue_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan_name: string; // 'essential', 'professional', 'premium'
  status: string; // 'pending', 'active', 'trialing', 'cancelled', 'past_due'
  current_price?: number | null;
  billing_cycle: string; // 'monthly', 'yearly'
  next_billing_date?: string | null;
  cancel_at_period_end?: boolean;
  cancel_at?: string | null;
  canceled_at?: string | null;
  trial_period_days?: number | null; // NEW
  trial_end_date?: string | null; // NEW
  trial_started_at?: string | null; // NEW
  is_trial: boolean; // NEW
  created_at: string;
  updated_at: string;
}

// Billing catalogue and venue billing records
export interface BillingPlan {
  id: string;
  code: 'free' | 'pro' | string;
  name: string;
  description?: string | null;
  monthly_price_gbp: number;
  yearly_price_gbp?: number | null;
  included_spaces: number;
  included_messages: number;
  stripe_price_monthly_sandbox?: string | null;
  stripe_price_yearly_sandbox?: string | null;
  stripe_price_monthly_live?: string | null;
  stripe_price_yearly_live?: string | null;
  is_public: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BillingAddon {
  id: string;
  code: 'extra_space' | 'message_block' | 'white_label' | 'agency_portal' | string;
  name: string;
  description?: string | null;
  unit_label: string;
  monthly_price_gbp: number;
  stripe_price_monthly_sandbox?: string | null;
  stripe_price_monthly_live?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VenueBillingRecord {
  id: string;
  venue_id: string;
  plan_code: string;
  billing_status: 'free' | 'active' | 'past_due' | 'cancelled' | 'trialing';
  billing_override_enabled: boolean;
  override_plan_code?: string | null;
  addon_extra_spaces: number;
  addon_message_blocks: number;
  addon_white_label: boolean;
  addon_agency_portal: boolean;
  effective_space_limit?: number | null;
  effective_message_limit?: number | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Payment links for admin-created payment links
export interface PaymentLink {
  id: string;
  venue_id: string;
  stripe_payment_link_id: string;
  stripe_payment_link_url: string;
  stripe_checkout_session_id?: string | null; // NEW
  plan_name: string;
  custom_price?: number | null;
  trial_period_days?: number | null; // NEW
  status: string; // 'pending', 'paid', 'expired'
  created_by: string;
  customer_email: string;
  created_at: string;
  updated_at: string;
}

// Invoices for billing history
export interface Invoice {
  id: string;
  venue_id: string;
  stripe_invoice_id: string;
  amount_paid: number;
  currency: string;
  status: string; // 'paid', 'pending', 'failed'
  invoice_pdf?: string | null;
  billing_reason?: string | null;
  created_at: string;
}

// Chat message for playground
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean; // Flag to show typing animation and streaming cursor
}

// Conversation message for AI scoring (simplified ChatMessage)
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// Stripe-specific types
export interface StripePrice {
  id: string;
  amount: number;
  currency: string;
  interval?: 'month' | 'year';
  product_name: string;
}

export interface PaymentLinkRequest {
  venueId: string;
  customerEmail: string;
  planName: 'free' | 'pro' | 'essential' | 'professional';
  customPrice?: number;
  billingCycle?: 'monthly' | 'yearly';
  trialPeriodDays?: number; // NEW: 0 for no trial, 30/60/90 for trial
  createdBy?: string;
}

// NEW: Checkout Session Request (for trials)
export interface CheckoutSessionRequest {
  venueId: string;
  customerEmail: string;
  planName: 'essential' | 'professional';
  customPrice?: number;
  billingCycle?: 'monthly' | 'yearly';
  trialPeriodDays: number; // Required for checkout sessions
  createdBy?: string;
}

// NEW: Checkout Session Response
export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
  expiresAt: string;
}

// Admin venue creation (admin panel)
export interface AdminVenueCreationRequest {
  venueName: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  planName: 'essential' | 'professional';
  customPassword?: string; // Optional custom password
  enableSetupMode: boolean; // Start in setup mode?
}

// NEW: Trial Subscription Details
export interface TrialSubscription {
  subscription_id: string;
  venue_id: string;
  venue_name: string;
  venue_email: string;
  in_setup: boolean;
  plan_name: string;
  current_price: number;
  trial_period_days: number | null;
  trial_started_at: string | null;
  trial_end_date: string | null;
  status: string;
  stripe_subscription_id: string | null;
  created_at: string;
  days_remaining: number | null;
  trial_status: 'no_trial' | 'expired' | 'expiring_soon' | 'active_trial';
}

export interface PaymentLinkResponse {
  paymentLink: string;
  linkId: string;
  expiresAt?: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  planName?: string;
  currentPrice?: number;
  nextBillingDate?: string;
  status: 'pending' | 'active' | 'trialing' | 'cancelled' | 'past_due';
}

// Platform Admin Dashboard Types
export interface PlatformMetrics {
  totalVenues: number;
  activeUsers: number;
  totalMessages: number;
  totalConversations: number;
  monthlyRevenue: number;
  totalTourViews: number;
  activeSubscriptions: number;
  
  // Growth indicators
  venuesGrowth: number;
  usersGrowth: number;
  conversationsGrowth: number;
  revenueGrowth: number;
}

export interface PlatformHealth {
  systemStatus: 'operational' | 'degraded' | 'down';
  activeSessions: number;
  conversationsToday: number;
  activeVenuesThisMonth: number;
  monthlyRevenue: number;
}

export interface RevenueAnalytics {
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  totalRevenue: number;
  subscriptionBreakdown: Array<{
    plan: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  monthlyData: Array<{
    month: string;
    revenue: number;
    subscriptions: number;
  }>;
}

export interface CustomerEngagement {
  topPerformingVenues: Array<{
    id: string;
    name: string;
    city: string;
    tourViews: number;
    conversations: number;
    healthScore: number;
  }>;
  geographicDistribution: Array<{
    city: string;
    venueCount: number;
    totalActivity: number;
  }>;
  deviceAnalytics: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  chatbotPerformance: {
    averageResponseTime: number;
    totalSessions: number;
  };
}

export interface PlatformActivity {
  id: string;
  type: 'venue_signup' | 'tour_upload' | 'subscription_change' | 'support_ticket' | 'payment_received';
  title: string;
  description: string;
  venueName?: string;
  timestamp: string;
  metadata?: any;
}

export interface AdminDashboardData {
  metrics: PlatformMetrics;
  health: PlatformHealth;
  revenue: RevenueAnalytics;
  engagement: CustomerEngagement;
  recentActivity: PlatformActivity[];
}

// Subscription plan type
export type SubscriptionPlan = 'essential' | 'professional' | 'premium';

// Admin Lead Management Types
export interface PlatformLeadMetrics {
  totalLeads: number;
  leadsThisMonth: number;
  leadGrowthRate: number;
  avgLeadScore: number;
  conversionRate: number;
  convertedLeads: number;
  highInterestLeads: number;
  followUpRate: number;
  tourLeads: number;
  activeVenuesWithLeads: number;
  totalActiveVenues: number;
}

export interface VenueLeadPerformance {
  id: string;
  name: string;
  city: string;
  totalLeads: number;
  leadsThisMonth: number;
  conversionRate: number;
  avgLeadScore: number;
  highInterestLeads: number;
  tourLeads: number;
  lastLeadDate?: string;
  subscriptionPlan: SubscriptionPlan;
  healthScore: number;
}

export interface AdminLeadsResponse {
  platformMetrics: PlatformLeadMetrics;
  venuePerformance: VenueLeadPerformance[];
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Lead Analytics Dashboard Types
export interface LeadDashboardData {
  metrics: {
    totalLeads: number;
    leadsThisMonth: number;
    convertedLeads: number;
    tourLeads: number;
    avgLeadScore: number;
    highInterestLeads: number;
    qualifiedLeads: number;
    conversionRate: number;
    leadGrowthRate: number;
    averageResponseTime: number;
    followUpRate: number;
    leadsByStatus: Record<string, number>;
  };
  sourceAnalytics: {
    tour: { count: number; percentage: number; conversionRate: number };
  };
  timeSeriesData: Array<{
    date: string;
    leads: number;
    conversions: number;
    score: number;
  }>;
  funnelAnalytics: {
    chatSessions: number;
    leadsGenerated: number;
    contacted: number;
    qualified: number;
    converted: number;
    conversionRates: {
      sessionToLead: number;
      leadToContact: number;
      contactToQualified: number;
      qualifiedToConversion: number;
    };
  };
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    value?: string;
  }>;
}

// Venue-specific lead scoring interfaces
export interface VenueScoringProfile {
  id: string;
  venue_id: string;
  is_active: boolean;
  scoring_model: 'weighted' | 'tier_based' | 'advanced';
  
  // Scoring weights
  contact_weights: {
    email_provided: number;
    phone_provided: number;
    full_name_provided: number;
  };
  
  interest_weights: {
    high: number;
    medium: number;
    low: number;
  };
  
  engagement_weights: {
    messages_1_3: number;
    messages_4_6: number;
    messages_7_10: number;
    messages_10_plus: number;
  };
  
  timing_weights: {
    within_1_hour: number;
    within_24_hours: number;
    within_3_days: number;
    within_week: number;
    older: number;
  };
  
  source_weights: {
    tour_chatbot: number;
    contact_form: number;
    phone_call: number;
    referral: number;
  };
  
  custom_keywords: {
    high_intent: {
      keywords: string[];
      points: number;
    };
    urgency: {
      keywords: string[];
      points: number;
    };
    price_objections: {
      keywords: string[];
      points: number;
    };
  };
  
  interest_categories: Record<string, number>;
  
  score_thresholds: {
    hot_lead: number;
    warm_lead: number;
    cold_lead: number;
    poor_lead: number;
  };
  
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ScoringHistory {
  id: string;
  lead_id: string;
  venue_id: string;
  previous_score: number | null;
  new_score: number;
  score_change: number;
  scoring_factors: any; // JSONB
  calculation_method: string;
  trigger_event: string;
  triggered_by?: string | null;
  created_at: string;
}

export interface ScoringBreakdown {
  contact_score: number;
  interest_score: number;
  engagement_score: number;
  timing_score: number;
  source_score: number;
  keyword_score: number;
  category_score: number;
  total_score: number;
  category: 'hot' | 'warm' | 'cold' | 'poor';
}

export interface ScoringCalculationResult {
  score: number;
  breakdown: ScoringBreakdown;
  category: string;
  reasoning: string[];
  confidence: number;
}

export interface ScoringWeights {
  contact_weights: VenueScoringProfile['contact_weights'];
  interest_weights: VenueScoringProfile['interest_weights'];
  engagement_weights: VenueScoringProfile['engagement_weights'];
  timing_weights: VenueScoringProfile['timing_weights'];
  source_weights: VenueScoringProfile['source_weights'];
}

// Scoring configuration presets
export interface ScoringPreset {
  name: string;
  description: string;
  weights: ScoringWeights;
  thresholds: VenueScoringProfile['score_thresholds'];
  custom_keywords: VenueScoringProfile['custom_keywords'];
}

// Lead with enhanced scoring information
export interface LeadWithScoring extends Lead {
  scoring_breakdown?: ScoringBreakdown;
  scoring_history?: ScoringHistory[];
  score_category?: 'hot' | 'warm' | 'cold' | 'poor';
}

// Blog type for resources
export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  header_image?: string | null;
  additional_images?: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string[];
  is_published: boolean;
  published_at?: string | null;
  scheduled_publish_at?: string | null;
  is_scheduled?: boolean;
  schedule_timezone?: string;
  view_count: number;
  reading_time_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

// Guide type for resources
export interface Guide {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  header_image?: string | null;
  additional_images?: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
  published_at?: string | null;
  view_count: number;
  reading_time_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

// Resource filters for blogs and guides
export interface ResourceFilters {
  tags?: string[];
  search?: string;
  published?: boolean;
  scheduled?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // For guides only
  limit?: number;
  offset?: number;
}

// Help Center types for user-facing help system
export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  header_image?: string | null;
  additional_images?: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string[];
  category: 'getting-started' | 'tours' | 'chatbots' | 'analytics' | 'billing' | 'troubleshooting';
  priority: number;
  is_published: boolean;
  published_at?: string | null;
  view_count: number;
  reading_time_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

// Help article filters
export interface HelpArticleFilters {
  category?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

// Help article categories with metadata
export interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sort_order: number;
  article_count: number;
}

// Support conversation types for app Help Centre contact tab
export interface SupportConversation {
  id: string;
  venue_id: string;
  created_by_user_id: string;
  requester_name: string;
  requester_email: string;
  requester_phone?: string | null;
  requester_company?: string | null;
  help_topic: string;
  subject?: string | null;
  status: 'open' | 'closed';
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'admin';
  sender_user_id?: string | null;
  message: string;
  created_at: string;
}

// ============================================
// SALES SYSTEM TYPES
// ============================================

// Sales lead data model
export interface SalesLead {
  id: string;
  place_id: string; // External source identifier for deduplication
  
  // Basic Business Info
  venue_name: string;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null; // Business email only
  google_rating?: number | null;
  total_reviews?: number | null;
  business_status: string; // OPERATIONAL, CLOSED_TEMPORARILY, etc
  
  // Lead Management
  lead_status: 'new' | 'researching' | 'contacted' | 'qualified' | 'demo_scheduled' | 'proposal_sent' | 'negotiating' | 'closed_won' | 'closed_lost' | 'not_interested';
  lead_score: number; // 0-100
  priority: 'low' | 'medium' | 'high';
  estimated_value?: number | null;
  
  // Contact Tracking
  contact_attempts: number;
  last_contacted_at?: string | null;
  next_follow_up_date?: string | null;
  assigned_to?: string | null; // User ID
  
  // Research Data
  notes?: string | null;
  competition_analysis?: any | null; // JSONB
  estimated_budget_range?: string | null;
  decision_maker_info?: any | null; // JSONB
  social_media_links?: any | null; // JSONB
  
  // Source metadata
  place_types?: string[] | null;
  opening_hours?: any | null; // JSONB
  photos?: string[] | null; // Google photo references
  formatted_address?: string | null;
  international_phone_number?: string | null;
  
  // Search metadata
  search_query?: string | null; // What search found this
  search_location?: string | null; // Where we searched
  search_date: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Sales activity tracking
export interface SalesActivity {
  id: string;
  sales_lead_id: string;
  sequence_id?: string;
  
  activity_type: 'call' | 'email' | 'demo' | 'proposal' | 'meeting' | 'note' | 'linkedin_connection' | 'follow_up' | 'research' | 'email_sent' | 'email_scheduled' | 'sequence_created' | 'sequence_updated' | 'sequence_enrolled' | 'sequence_stopped' | 'sequence_completed';
  
  subject?: string | null;
  description?: string | null;
  outcome?: string | null;
  next_action?: string | null;
  duration_minutes?: number | null;
  
  // Email-specific fields
  email_to?: string | null;
  email_subject?: string | null;
  email_body?: string | null;
  email_sent_at?: string | null;
  email_metadata?: any | null; // JSONB
  
  // Scheduling
  scheduled_for?: string | null;
  completed_at?: string | null;
  
  // Metadata
  created_by?: string | null; // User ID
  created_at: string;
}

// Extended sales lead with relationships
export interface SalesLeadWithRelations extends SalesLead {
  activities?: SalesActivity[];
  assigned_user?: User;
  latest_activity?: SalesActivity;
}

// Sales dashboard metrics
export interface SalesMetrics {
  totalLeads: number;
  leadsThisMonth: number;
  leadsThisWeek: number;
  newLeads: number;
  qualifiedLeads: number;
  totalValue: number;
  avgLeadScore: number;
  conversionRate: number;
  activeSearchCampaigns: number;
  apiCallsThisMonth: number;
  apiCostThisMonth: number;
}

// Sales lead filters for querying
export interface SalesLeadFilters {
  status?: string[];
  priority?: string[];
  assigned_to?: string;
  city?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
  lead_score_min?: number;
  lead_score_max?: number;
  has_phone?: boolean;
  has_email?: boolean;
  has_website?: boolean;
  business_status?: string[];
  limit?: number;
  offset?: number;
}

// Sales lead creation from Places API
export interface SalesLeadCreateData {
  place_id: string;
  venue_name: string;
  address?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  website?: string;
  email?: string;
  google_rating?: number;
  total_reviews?: number;
  business_status?: string;
  place_types?: string[];
  opening_hours?: any;
  photos?: string[];
  formatted_address?: string;
  international_phone_number?: string;
  search_query?: string;
  search_location?: string;
  lead_status?: SalesLead['lead_status'];
  priority?: SalesLead['priority'];
  notes?: string;
  estimated_value?: number;
}

// Sales activity creation
export interface SalesActivityCreateData {
  sales_lead_id?: string;
  sequence_id?: string;
  activity_type: SalesActivity['activity_type'];
  subject?: string;
  description?: string;
  outcome?: string;
  next_action?: string;
  duration_minutes?: number;
  scheduled_for?: string;
  completed_at?: string;
  // Email fields
  email_to?: string;
  email_subject?: string;
  email_body?: string;
  email_sent_at?: string;
  email_metadata?: any;
}

// Sales lead update data
export interface SalesLeadUpdateData {
  lead_status?: SalesLead['lead_status'];
  priority?: SalesLead['priority'];
  lead_score?: number;
  estimated_value?: number;
  next_follow_up_date?: string;
  assigned_to?: string;
  notes?: string;
  email?: string;
  phone?: string;
  website?: string;
  decision_maker_info?: any;
  competition_analysis?: any;
  social_media_links?: any;
  estimated_budget_range?: string;
}

// Sales performance analytics
export interface SalesPerformanceAnalytics {
  leadsPerMonth: Array<{
    month: string;
    leads: number;
    qualified: number;
    converted: number;
  }>;
  leadSourceBreakdown: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  conversionFunnel: {
    new: number;
    researching: number;
    contacted: number;
    qualified: number;
    demo_scheduled: number;
    proposal_sent: number;
    negotiating: number;
    closed_won: number;
    closed_lost: number;
  };
  topPerformingLocations: Array<{
    city: string;
    leads: number;
    averageScore: number;
  }>;
  averageTimeToConversion: number; // days
  totalPipelineValue: number;
}

// Sales activity update data
export interface SalesActivityUpdateData {
  activity_type?: SalesActivity['activity_type'];
  subject?: string;
  description?: string;
  outcome?: string;
  next_action?: string;
  duration_minutes?: number;
  scheduled_for?: string;
  completed_at?: string;
  // Email fields
  email_to?: string;
  email_subject?: string;
  email_body?: string;
  email_sent_at?: string;
  email_metadata?: any;
}

// Previous search from Google API usage
export interface PreviousSearch {
  id: string;
  search_query: string;
  created_at: string;
}

// Extended activity with lead information for admin overview
export interface AdminActivityOverview extends SalesActivity {
  // Lead information
  venue_name: string;
  lead_email?: string | null;
  lead_phone?: string | null;
  city?: string | null;
  lead_status: SalesLead['lead_status'];
  lead_score: number;
  
  // Creator information
  created_by_name?: string | null;
  created_by_last_name?: string | null;
  created_by_email?: string | null;
}

// Activity filters for admin overview
export interface ActivityFilters {
  activity_type?: string[];
  search?: string;
  venue_name?: string;
  lead_status?: string[];
  date_from?: string;
  date_to?: string;
  created_by?: string;
  limit?: number;
  offset?: number;
}

// Email sending request
export interface EmailSendRequest {
  to: string;
  subject: string;
  body: string;
  sales_lead_id?: string;
  template_type?: 'sales_outreach' | 'follow_up' | 'proposal' | 'custom';
}

// Email template data
export interface EmailTemplateData {
  recipientName?: string;
  venueName?: string;
  senderName?: string;
  customContent?: string;
}

// AI Email Generation types
export interface AIEmailGenerationRequest {
  leadId: string;
  instructions: string;
  emailType?: 'sales_outreach' | 'follow_up' | 'proposal' | 'custom';
}

export interface AIEmailGenerationResponse {
  success: boolean;
  subject?: string;
  body?: string;
  error?: string;
}

export interface LeadContextData {
  // Lead basic info
  venueName: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  leadStatus: string;
  leadScore: number;
  priority: string;
  notes?: string;
  estimatedValue?: number;
  
  // Lead activities history
  activities: Array<{
    type: string;
    subject?: string;
    description?: string;
    date: string;
    outcome?: string;
  }>;
  
  // Contact history
  contactAttempts: number;
  lastContactedAt?: string;
  
  // Business context
  googleRating?: number;
  totalReviews?: number;
  businessStatus?: string;
}

// Scheduled emails queue
export interface ScheduledEmail {
  id: string;
  sales_lead_id: string;
  sales_activity_id: string;
  email_to: string;
  email_subject: string;
  email_body: string;
  scheduled_for: string;
  timezone: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  error_message?: string | null;
  attempts: number;
  sent_at?: string | null;
  created_at: string;
}

// Scheduled email creation data
export interface ScheduledEmailCreateData {
  sales_lead_id: string;
  sales_activity_id: string;
  email_to: string;
  email_subject: string;
  email_body: string;
  scheduled_for: string;
  timezone?: string;
}

// Email scheduling request
export interface EmailScheduleRequest {
  leadId: string;
  to: string;
  subject: string;
  body: string;
  scheduledFor: string;
  timezone?: string;
  templateType?: 'sales_outreach' | 'follow_up' | 'proposal' | 'custom';
}

// Email scheduling response
export interface EmailScheduleResponse {
  success: boolean;
  scheduledEmailId?: string;
  activityId?: string;
  error?: string;
}

// Email Enrichment Types
export interface EmailCandidate {
  email: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  reasoning: string;
}

export interface EmailEnrichmentResult {
  success: boolean;
  venueName: string;
  domain: string;
  candidates: EmailCandidate[];
  searchQuery: string;
  error?: string;
}

export interface EmailEnrichmentRequest {
  action: 'enrich' | 'update_email';
  selectedEmail?: string;
}

export interface EmailEnrichmentResponse {
  success: boolean;
  message?: string;
  error?: string;
  candidates?: EmailCandidate[];
  venueName?: string;
  domain?: string;
  searchQuery?: string;
}

// Email Sequence Types
export interface EmailSequence {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  enrollment_count?: number;
  step_count?: number;
  completion_rate?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  delay_days: number;
  delay_hours?: number;
  scheduled_date?: string; // For first step: absolute scheduled date (YYYY-MM-DD)
  scheduled_time?: string; // For first step: absolute scheduled time (HH:MM)
  scheduled_timezone?: string; // Timezone for scheduled time
  email_subject: string;
  email_body: string;
  email_type: 'sales_outreach' | 'follow_up' | 'proposal' | 'custom';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  sales_lead_id: string;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'stopped_reply' | 'stopped_manual';
  enrolled_at: string;
  completed_at?: string;
  stopped_reason?: string;
  created_by?: string;
}

export interface SequenceEmail {
  id: string;
  enrollment_id: string;
  step_id: string;
  sales_lead_id: string;
  sales_activity_id?: string;
  scheduled_email_id?: string;
  email_to: string;
  email_subject: string;
  email_body: string;
  scheduled_for: string;
  sent_at?: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  error_message?: string;
  created_at: string;
}

export interface EmailReply {
  id: string;
  enrollment_id: string;
  sales_lead_id: string;
  from_email: string;
  subject?: string;
  body?: string;
  received_at: string;
  message_id?: string;
  in_reply_to?: string;
  auto_detected: boolean;
  processed_at: string;
}

// Email Sequence Request/Response Types
export interface CreateSequenceRequest {
  name: string;
  description?: string;
  steps: Omit<SequenceStep, 'id' | 'sequence_id' | 'created_at' | 'updated_at'>[];
}

export interface EnrollLeadRequest {
  sequenceId: string;
  leadId: string;
}

export interface SequenceStatsResponse {
  totalSequences: number;
  activeEnrollments: number;
  emailsSent: number;
  repliesReceived: number;
  conversionRate: number;
}

// AI Sequence Email Generation Types
export interface AISequenceEmailRequest {
  sequenceName: string;
  sequenceDescription?: string;
  stepNumber: number;
  emailType: 'sales_outreach' | 'follow_up' | 'proposal' | 'custom';
  delayDays: number;
  delayHours?: number;
  instructions: string; // What the user wants for this step
}

export interface AISequenceEmailResponse {
  success: boolean;
  subject?: string;
  body?: string;
  error?: string;
}

// Extended enrollment interface with related data for lead detail views
export interface SequenceEnrollmentWithDetails extends SequenceEnrollment {
  email_sequences?: {
    name: string;
    sequence_steps?: Array<{
      id: string;
      step_number: number;
    }>;
  };
  next_email_at?: string;
} 

// User subscription status and access control
export interface UserSubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus: 'pending' | 'active' | 'trialing' | 'cancelled' | 'past_due' | 'incomplete';
  planType: 'essential' | 'professional' | 'premium' | null;
  canAccessFeatures: boolean;
  pendingPaymentRequired: boolean;
  inSetupMode: boolean; // NEW
  isTrialing: boolean; // NEW
  trialEndsAt?: string;
  trialDaysRemaining?: number; // NEW
  blockedReason?: string;
}

export interface BillingAccessControl {
  canAccessDashboard: boolean;
  canAccessTours: boolean;
  canAccessChatbots: boolean;
  canAccessLeads: boolean;
  canAccessAnalytics: boolean;
  canAccessSettings: boolean;
  featuresBlocked: string[];
  requiresPayment: boolean;
  paymentLink?: string;
}

// Ebook system types for lead capture
export interface Ebook {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  header_image?: string | null;
  additional_images?: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string[];
  is_published: boolean;
  published_at?: string | null;
  view_count: number;
  download_count: number;
  reading_time_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EbookLead {
  id: string;
  ebook_id: string;
  contact_name: string;
  venue_name: string;
  email: string;
  phone?: string | null;
  created_at: string;
}

export interface EbookLeadCreateData {
  ebook_id: string;
  contact_name: string;
  venue_name: string;
  email: string;
  phone?: string;
}

// ============================================================================
// STREAMING TYPES
// ============================================================================

// SSE Event Types
export type SSEEventType = 
  | 'start'
  | 'content'
  | 'function_call_delta'
  | 'function_call'
  | 'lead_captured'
  | 'done'
  | 'error';

export interface SSEEvent {
  type: SSEEventType;
  [key: string]: any;
}

export interface SSEContentEvent extends SSEEvent {
  type: 'content';
  content: string;
}

export interface SSEFunctionCallEvent extends SSEEvent {
  type: 'function_call';
  name: string;
  arguments: any;
}

export interface SSEErrorEvent extends SSEEvent {
  type: 'error';
  error: string;
}

export interface SSEDoneEvent extends SSEEvent {
  type: 'done';
  responseTime: number;
}

// Streaming Chat Message (extends existing ChatMessage)
export interface StreamingChatMessage extends ChatMessage {
  isStreaming?: boolean;
  streamError?: string;
} 