import { supabase } from './supabase';
import { ChatbotCustomisation } from './types';
import { CustomisationPreset } from './types/chatbot-customisation';

// Get customisation for a specific venue and chatbot type
export async function getChatbotCustomisation(
  venueId: string,
  chatbotType: 'tour',
  tourId?: string | null
): Promise<ChatbotCustomisation | null> {
  let query = supabase
    .from('chatbot_customisations')
    .select('*')
    .eq('venue_id', venueId)
    .eq('chatbot_type', chatbotType);

  if (tourId) {
    query = query.eq('tour_id', tourId);
  } else {
    query = query.is('tour_id', null);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw error;
  }
  return data;
}

// Create or update customisation (upsert)
export async function upsertChatbotCustomisation(
  venueId: string,
  chatbotType: 'tour',
  tourId: string,
  customisation: Partial<Omit<ChatbotCustomisation, 'id' | 'venue_id' | 'chatbot_type' | 'created_at' | 'updated_at'>>
): Promise<ChatbotCustomisation> {
  const { data, error } = await supabase
    .from('chatbot_customisations')
    .upsert({
      venue_id: venueId,
      tour_id: tourId,
      chatbot_type: chatbotType,
      ...customisation,
    }, {
      onConflict: 'venue_id,tour_id,chatbot_type'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all customisations for a venue
export async function getVenueChatbotCustomisations(
  venueId: string
): Promise<ChatbotCustomisation[]> {
  const { data, error } = await supabase
    .from('chatbot_customisations')
    .select('*')
    .eq('venue_id', venueId)
    .order('chatbot_type');

  if (error) throw error;
  return data || [];
}

// Delete customisation
export async function deleteChatbotCustomisation(
  venueId: string,
  chatbotType: 'tour',
  tourId: string
): Promise<void> {
  const { error } = await supabase
    .from('chatbot_customisations')
    .delete()
    .eq('venue_id', venueId)
    .eq('chatbot_type', chatbotType)
    .eq('tour_id', tourId);

  if (error) throw error;
}

// Get default customisation values (LEGACY - for backward compatibility)
export function getDefaultCustomisation(_chatbotType: 'tour' = 'tour'): Partial<ChatbotCustomisation> {
  const baseDefaults = {
    chat_button_size: 'medium' as const,
    chat_button_position: 'bottom-right' as const,
    chat_button_icon: 'MessageCircle',
    icon_size: 24, // Default icon size in pixels
    header_icon_size: 16, // Default header icon size in pixels
    header_text_color: '#FFFFFF',
    window_width: 350,
    window_height: 500,
    ai_message_background: '#F3F4F6',
    ai_message_text_color: '#111827',
    input_background_color: '#FFFFFF',
    show_powered_by: true,
    is_active: true,
  };

  return {
    ...baseDefaults,
    chat_button_color: '#1E40AF',
    header_background_color: '#1E40AF',
    user_message_background: '#1E40AF',
    user_message_text_color: '#FFFFFF',
    send_button_color: '#1E40AF',
    send_button_icon_color: '#FFFFFF',
    window_title: 'Tour Assistant',
    input_placeholder_text: 'Ask me anything...',
  };
}

// ADVANCED DEFAULT CUSTOMISATION - Complete set with all new fields
export function getAdvancedDefaultCustomisation(
  _chatbotType: 'tour' = 'tour'
): Partial<ChatbotCustomisation> {
  const baseDefaults = {
    // EXISTING FIELDS
    chat_button_size: 'medium' as const,
    chat_button_position: 'bottom-right' as const,
    chat_button_icon: 'MessageCircle',
    icon_size: 48,
    header_icon_size: 30,
    header_text_color: '#FFFFFF',
    window_width: 300,
    window_height: 400,
    ai_message_background: '#F3F4F6',
    ai_message_text_color: '#111827',
    input_background_color: '#FFFFFF',
    show_powered_by: true,
    is_active: true,
    
    // ADVANCED TYPOGRAPHY SYSTEM
    font_family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    header_text_size: 14,
    message_text_size: 12,
    placeholder_text_size: 12,
    input_placeholder_text: 'Ask me anything...',
    placeholder_text_color: '#6B7280', // 🆕 Desktop placeholder colour (gray-500)
    input_text_color: '#111827', // 🆕 Desktop input text colour (gray-900)
    branding_text_size: 12,
    message_font_weight: 'normal' as const,
    header_font_weight: 'bold' as const,
    
    // VISUAL EFFECTS & SHADOWS
    chat_button_shadow_intensity: 'heavy' as const,
    chat_window_shadow_intensity: 'heavy' as const,
    message_shadow_enabled: false,
    chat_button_shadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    
    // BORDER RADIUS CONTROLS
    chat_button_border_radius: 12,
    chat_window_border_radius: 0,
    message_border_radius: 8,
    input_border_radius: 0,
    
    // ANIMATION & INTERACTION CONTROLS
    enable_animations: true,
    animation_speed: 'normal' as const,
    chat_entrance_animation: 'scale-up' as const,
    message_animation: 'slide-in' as const,
    button_hover_effect: 'scale' as const,
    chat_button_animation: 'none' as const,
    animation_interval: 5,
    idle_animation_enabled: true,
    idle_animation_type: 'shake' as const,
    idle_animation_interval: 3000,
    
    // MESSAGE FEATURES
    show_timestamps: false,
    timestamp_format: '12h' as const,
    message_max_width: 90,
    
    // AVATAR CUSTOMISATION
    show_user_avatar: true,
    show_bot_avatar: true,
    avatar_style: 'circle' as const,
    bot_avatar_icon: 'Bot',
    user_avatar_icon: 'User',
    
    // ENHANCED SEND BUTTON STYLING
    send_button_style: 'icon' as const,
    send_button_size: 'medium' as const,
    send_button_border_radius: 0,
    send_button_icon: 'Send' as const,
    send_button_hover_color: '#40A9FF',
    chat_button_hover_color: '#40A9FF',
    
    // TYPING INDICATOR CUSTOMISATION
    typing_indicator_enabled: true,
    typing_indicator_style: 'dots' as const,
    typing_indicator_speed: 'normal' as const,
    typing_indicator_animation: 'dots' as const,
    
    // LOADING STATES
    loading_spinner_style: 'dots' as const,
    loading_text_enabled: true,
    loading_animation: 'spinner' as const,
    loading_text_color: '#666666',
    loading_background_color: '#FFFFFF',
    
    // LAYOUT & DIMENSIONS
    chat_window_height: 600,
    chat_window_width: 400,
    header_height: 40,
    input_height: 36,
    chat_button_bottom_offset: 20,
    chat_button_side_offset: 20,
    chat_offset_bottom: 20,
    chat_offset_side: 20,
    welcome_message_delay: 0,
    
    // MOBILE EXPANSION
    mobile_chat_button_size: 'medium' as const,
    mobile_chat_button_position: 'bottom-right' as const,
    mobile_icon_size: 42,
    mobile_chat_button_border_radius: 8,
    mobile_chat_button_bottom_offset: 15,
    mobile_chat_button_side_offset: 15,
    mobile_chat_window_width: 280,
    mobile_chat_window_height: 500,
    mobile_chat_window_border_radius: 0,
    mobile_header_height: 40,
    mobile_input_height: 36,
    mobile_fullscreen: false,
    mobile_message_border_radius: 10,
    mobile_input_border_radius: 0,
    mobile_message_max_width: 95,
    mobile_header_text_size: 14,
    mobile_message_text_size: 13,
    mobile_placeholder_text_size: 13,
    mobile_input_placeholder_text: 'Ask me anything...',
    mobile_placeholder_text_color: '#9CA3AF', // 🆕 Mobile placeholder colour (gray-400)
    mobile_input_text_color: '#111827', // 🆕 Mobile input text colour (gray-900)
    mobile_branding_text_size: 11,
    mobile_show_user_avatar: true,
    mobile_show_bot_avatar: true,
    mobile_typing_indicator_enabled: true,
    
    // MOBILE EXPANDED FEATURES - Complete Desktop/Mobile Separation
    // Mobile Chat Button & Icons (7 additional fields)
    mobile_chat_button_icon: 'MessageCircle',
    mobile_chat_button_hover_color: '#40A9FF',
    mobile_chat_button_shadow: true,
    mobile_chat_button_shadow_intensity: 'heavy' as const,
    mobile_chat_button_animation: 'none' as const,
    mobile_header_icon_size: 28,
    mobile_button_hover_effect: 'scale' as const,
    
    // Mobile Chat Window & Layout (5 additional fields)
    mobile_window_title: 'Virtual Tour AI',
    mobile_chat_window_shadow_intensity: 'heavy' as const,
    mobile_chat_offset_bottom: 15,
    mobile_chat_offset_side: 15,
    mobile_welcome_message_delay: 0,
    
    // Mobile Send Button (6 additional fields)
    mobile_send_button_icon_color: '#FFFFFF',
    mobile_send_button_style: 'icon' as const,
    mobile_send_button_size: 'medium' as const,
    mobile_send_button_border_radius: 0,
    mobile_send_button_icon: 'Send' as const,
    mobile_send_button_hover_color: '#40A9FF',
    
    // Mobile Typography & Fonts (2 additional fields)
    mobile_message_font_weight: 'normal' as const,
    mobile_header_font_weight: 'bold' as const,
    
    // Mobile Message Styling (2 additional fields)
    mobile_user_message_text_color: '#FFFFFF',
    mobile_message_shadow_enabled: false,
    
    // Mobile Avatars (5 additional fields)
    mobile_avatar_style: 'circle' as const,
    mobile_custom_bot_avatar_url: null,
    mobile_custom_user_avatar_url: null,
    mobile_bot_avatar_icon: 'Bot',
    mobile_user_avatar_icon: 'User',
    
    // Mobile Animations (8 additional fields)
    mobile_enable_animations: true,
    mobile_animation_speed: 'normal' as const,
    mobile_chat_entrance_animation: 'slide-up' as const,
    mobile_message_animation: 'fade-in' as const,
    mobile_animation_interval: 5,
    mobile_idle_animation_enabled: true,
    mobile_idle_animation_type: 'shake' as const,
    mobile_idle_animation_interval: 3000,
    
    // Mobile Typing Indicator (4 additional fields)
    mobile_typing_indicator_style: 'dots' as const,
    mobile_typing_indicator_color: '#666666',
    mobile_typing_indicator_speed: 'normal' as const,
    mobile_typing_indicator_animation: 'dots' as const,
    
    // Mobile Loading States (6 additional fields)
    mobile_loading_spinner_style: 'dots' as const,
    mobile_loading_text_enabled: true,
    mobile_loading_spinner_color: '#1890FF',
    mobile_loading_animation: 'spinner' as const,
    mobile_loading_text_color: '#666666',
    mobile_loading_background_color: '#FFFFFF',
    
    // Mobile Branding & Timestamps (4 additional fields)
    mobile_show_powered_by: true,
    mobile_show_timestamps: false,
    mobile_timestamp_format: '12h' as const,
    mobile_custom_logo_url: null,
  };

  return {
    ...baseDefaults,
    chat_button_color: '#1E40AF',
    header_background_color: '#1E40AF',
    user_message_background: '#1E40AF',
    user_message_text_color: '#FFFFFF',
    send_button_color: '#1E40AF',
    send_button_icon_color: '#FFFFFF',
    window_title: 'Tour Assistant',
    input_placeholder_text: 'Ask me anything...',
    mobile_chat_button_color: '#1E40AF',
    mobile_header_background_color: '#1E40AF',
    mobile_header_text_color: '#FFFFFF',
    mobile_user_message_background: '#1E40AF',
    mobile_send_button_color: '#1E40AF',
    mobile_send_button_icon_color: '#FFFFFF',
    mobile_window_title: 'Tour Assistant',
    mobile_input_placeholder_text: 'Ask me anything...',
    mobile_placeholder_text_color: '#9CA3AF',
    mobile_input_text_color: '#111827',
    mobile_ai_message_background: '#F3F4F6',
    mobile_ai_message_text_color: '#111827',
    mobile_input_background_color: '#FFFFFF',
    mobile_send_button_hover_color: '#1E40AF',
    mobile_chat_button_hover_color: '#1E40AF',
    mobile_user_message_text_color: '#FFFFFF',
    mobile_font_family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mobile_message_animation: 'slide-in' as const,
    typing_indicator_color: '#1E40AF',
    loading_spinner_color: '#1E40AF',
    mobile_typing_indicator_color: '#1E40AF',
    mobile_loading_spinner_color: '#1E40AF',
  };
}

// PRESET MANAGEMENT SYSTEM

export const customisationPresets: CustomisationPreset[] = [
  {
    name: 'Modern Minimal',
    description: 'Clean, minimal design with subtle animations and rounded corners',
    category: 'modern',
    tags: ['minimal', 'clean', 'modern', 'subtle'],
    customisation: {
      // Border radius for modern look
      chat_button_border_radius: 50,
      chat_window_border_radius: 16,
      message_border_radius: 16,
      input_border_radius: 8,
      send_button_border_radius: 8,
      
      // Subtle animations
      enable_animations: true,
      animation_speed: 'normal',
      chat_entrance_animation: 'fade-in',
      message_animation: 'slide-in',
      button_hover_effect: 'scale',
      
      // Light shadows
      chat_button_shadow_intensity: 'light',
      chat_window_shadow_intensity: 'light',
      message_shadow_enabled: false,
      
      // Typography
      font_family: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      header_font_weight: 'medium',
      message_font_weight: 'normal',
      
      // Mobile optimisation
      mobile_chat_window_border_radius: 12,
      mobile_message_border_radius: 12,
      mobile_input_border_radius: 20,
    }
  },
  {
    name: 'Professional Business',
    description: 'Corporate styling with structured layout and professional typography',
    category: 'professional',
    tags: ['professional', 'corporate', 'business', 'structured'],
    customisation: {
      // Sharp, professional borders
      chat_button_border_radius: 8,
      chat_window_border_radius: 8,
      message_border_radius: 8,
      input_border_radius: 4,
      send_button_border_radius: 4,
      
      // Controlled animations
      enable_animations: true,
      animation_speed: 'normal',
      chat_entrance_animation: 'slide-up',
      message_animation: 'fade-in',
      button_hover_effect: 'lift',
      
      // Medium shadows for depth
      chat_button_shadow_intensity: 'medium',
      chat_window_shadow_intensity: 'medium',
      message_shadow_enabled: true,
      
      // Professional typography
      font_family: '"Source Sans Pro", -apple-system, BlinkMacSystemFont, sans-serif',
      header_font_weight: 'bold',
      message_font_weight: 'normal',
      header_text_size: 15,
      message_text_size: 14,
      
      // Professional features
      show_timestamps: true,
      timestamp_format: '24h',
      typing_indicator_style: 'dots',
      
      // Mobile professional styling
      mobile_chat_window_border_radius: 6,
      mobile_message_border_radius: 6,
      mobile_fullscreen: false,
    }
  },
  {
    name: 'Fun & Engaging',
    description: 'Playful design with bouncy animations and vibrant styling',
    category: 'playful',
    tags: ['fun', 'playful', 'engaging', 'bouncy', 'vibrant'],
    customisation: {
      // Rounded, playful borders
      chat_button_border_radius: 50,
      chat_window_border_radius: 20,
      message_border_radius: 20,
      input_border_radius: 25,
      send_button_border_radius: 20,
      
      // Energetic animations
      enable_animations: true,
      animation_speed: 'fast',
      chat_entrance_animation: 'scale-up',
      message_animation: 'scale-in',
      button_hover_effect: 'scale',
      
      // Idle animations for engagement
      idle_animation_enabled: true,
      idle_animation_type: 'bounce',
      idle_animation_interval: 3000,
      chat_button_animation: 'pulse',
      
      // Strong shadows for pop
      chat_button_shadow_intensity: 'heavy',
      chat_window_shadow_intensity: 'medium',
      message_shadow_enabled: true,
      
      // Playful typography
      font_family: '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
      header_font_weight: 'bold',
      message_font_weight: 'medium',
      
      // Fun features
      show_timestamps: false,
      typing_indicator_style: 'wave',
      typing_indicator_speed: 'fast',
      loading_spinner_style: 'bars',
      
      // Mobile playful styling
      mobile_chat_window_border_radius: 16,
      mobile_message_border_radius: 16,
      mobile_input_border_radius: 20,
    }
  },
  {
    name: 'Corporate Elite',
    description: 'Premium corporate design with sophisticated styling',
    category: 'corporate',
    tags: ['corporate', 'premium', 'sophisticated', 'elite'],
    customisation: {
      // Sophisticated borders
      chat_button_border_radius: 6,
      chat_window_border_radius: 6,
      message_border_radius: 6,
      input_border_radius: 6,
      send_button_border_radius: 6,
      
      // Refined animations
      enable_animations: true,
      animation_speed: 'slow',
      chat_entrance_animation: 'slide-up',
      message_animation: 'fade-in',
      button_hover_effect: 'lift',
      
      // Subtle shadows
      chat_button_shadow_intensity: 'medium',
      chat_window_shadow_intensity: 'light',
      message_shadow_enabled: false,
      
      // Corporate typography
      font_family: 'Georgia, "Times New Roman", Times, serif',
      header_font_weight: 'bold',
      message_font_weight: 'normal',
      header_text_size: 16,
      message_text_size: 14,
      placeholder_text_size: 13,
      
      // Professional features
      show_timestamps: true,
      timestamp_format: '24h',
      typing_indicator_style: 'dots',
      typing_indicator_speed: 'slow',
      
      // Corporate mobile styling
      mobile_chat_window_border_radius: 4,
      mobile_message_border_radius: 4,
      mobile_header_text_size: 15,
      mobile_message_text_size: 13,
    }
  },
  {
    name: 'Sleek & Modern',
    description: 'Contemporary design with smooth animations and modern aesthetics',
    category: 'modern',
    tags: ['sleek', 'modern', 'contemporary', 'smooth'],
    customisation: {
      // Modern borders
      chat_button_border_radius: 24,
      chat_window_border_radius: 12,
      message_border_radius: 18,
      input_border_radius: 24,
      send_button_border_radius: 12,
      
      // Smooth animations
      enable_animations: true,
      animation_speed: 'normal',
      chat_entrance_animation: 'slide-up',
      message_animation: 'slide-in',
      button_hover_effect: 'glow',
      
      // Modern shadows
      chat_button_shadow_intensity: 'medium',
      chat_window_shadow_intensity: 'light',
      message_shadow_enabled: false,
      
      // Modern typography
      font_family: '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
      header_font_weight: 'medium',
      message_font_weight: 'normal',
      
      // Modern features
      show_timestamps: false,
      typing_indicator_style: 'pulse',
      loading_spinner_style: 'circle',
      
      // Modern mobile styling
      mobile_chat_window_border_radius: 10,
      mobile_message_border_radius: 14,
      mobile_input_border_radius: 20,
    }
  }
];

// Get preset by name
export function getPresetByName(name: string): CustomisationPreset | null {
  return customisationPresets.find(preset => preset.name === name) || null;
}

// Apply preset to current customisation
export function applyPreset(
  currentCustomisation: ChatbotCustomisation,
  presetName: string
): ChatbotCustomisation {
  const preset = getPresetByName(presetName);
  if (!preset) return currentCustomisation;
  
  return {
    ...currentCustomisation,
    ...preset.customisation
  };
}

// Get presets by category
export function getPresetsByCategory(category: CustomisationPreset['category']): CustomisationPreset[] {
  return customisationPresets.filter(preset => preset.category === category);
}

// Get presets by tags
export function getPresetsByTags(tags: string[]): CustomisationPreset[] {
  return customisationPresets.filter(preset => 
    tags.some(tag => preset.tags.includes(tag.toLowerCase()))
  );
}

// Merge multiple presets (later presets override earlier ones)
export function mergePresets(
  currentCustomisation: ChatbotCustomisation,
  presetNames: string[]
): ChatbotCustomisation {
  let result = { ...currentCustomisation };
  
  for (const presetName of presetNames) {
    const preset = getPresetByName(presetName);
    if (preset) {
      result = {
        ...result,
        ...preset.customisation
      };
    }
  }
  
  return result;
}

// Generate a colour-coordinated customisation based on primary colour
export function generateCoordinatedCustomisation(
  baseCustomisation: ChatbotCustomisation,
  primaryColour: string
): Partial<ChatbotCustomisation> {
  // This would use colour theory to generate complementary colours
  // For now, we'll use the primary colour consistently
  return {
    chat_button_color: primaryColour,
    header_background_color: primaryColour,
    user_message_background: primaryColour,
    send_button_color: primaryColour,
    mobile_chat_button_color: primaryColour,
    mobile_header_background_color: primaryColour,
    mobile_user_message_background: primaryColour,
    mobile_send_button_color: primaryColour,
    typing_indicator_color: primaryColour,
    loading_spinner_color: primaryColour,
  };
}

// Validation function for customisation values
export function validateCustomisation(customisation: Partial<ChatbotCustomisation>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Typography validation
  if (customisation.header_text_size && (customisation.header_text_size < 10 || customisation.header_text_size > 32)) {
    errors.push('Header text size must be between 10 and 32 pixels');
  }
  
  if (customisation.message_text_size && (customisation.message_text_size < 8 || customisation.message_text_size > 24)) {
    errors.push('Message text size must be between 8 and 24 pixels');
  }
  
  // Mobile typography validation
  if (customisation.mobile_header_text_size && (customisation.mobile_header_text_size < 10 || customisation.mobile_header_text_size > 28)) {
    errors.push('Mobile header text size must be between 10 and 28 pixels');
  }
  
  if (customisation.mobile_message_text_size && (customisation.mobile_message_text_size < 8 || customisation.mobile_message_text_size > 20)) {
    errors.push('Mobile message text size must be between 8 and 20 pixels');
  }

  // Border radius validation
  if (customisation.chat_button_border_radius && (customisation.chat_button_border_radius < 0 || customisation.chat_button_border_radius > 50)) {
    errors.push('Chat button border radius must be between 0 and 50 pixels');
  }
  
  if (customisation.chat_window_border_radius && (customisation.chat_window_border_radius < 0 || customisation.chat_window_border_radius > 24)) {
    errors.push('Chat window border radius must be between 0 and 24 pixels');
  }
  
  // Mobile border radius validation
  if (customisation.mobile_chat_button_border_radius && (customisation.mobile_chat_button_border_radius < 0 || customisation.mobile_chat_button_border_radius > 50)) {
    errors.push('Mobile chat button border radius must be between 0 and 50 pixels');
  }
  
  if (customisation.mobile_chat_window_border_radius && (customisation.mobile_chat_window_border_radius < 0 || customisation.mobile_chat_window_border_radius > 24)) {
    errors.push('Mobile chat window border radius must be between 0 and 24 pixels');
  }

  // Layout validation
  if (customisation.chat_window_width && (customisation.chat_window_width < 320 || customisation.chat_window_width > 500)) {
    errors.push('Chat window width must be between 320 and 500 pixels');
  }
  
  if (customisation.chat_window_height && (customisation.chat_window_height < 400 || customisation.chat_window_height > 800)) {
    errors.push('Chat window height must be between 400 and 800 pixels');
  }

  // Mobile layout validation
  if (customisation.mobile_chat_window_width && (customisation.mobile_chat_window_width < 280 || customisation.mobile_chat_window_width > 400)) {
    errors.push('Mobile chat window width must be between 280 and 400 pixels');
  }
  
  if (customisation.mobile_chat_window_height && (customisation.mobile_chat_window_height < 300 || customisation.mobile_chat_window_height > 600)) {
    errors.push('Mobile chat window height must be between 300 and 600 pixels');
  }

  // Animation validation
  if (customisation.animation_interval && (customisation.animation_interval < 1 || customisation.animation_interval > 30)) {
    errors.push('Animation interval must be between 1 and 30 seconds');
  }
  
  // Mobile animation validation
  if (customisation.mobile_animation_interval && (customisation.mobile_animation_interval < 1 || customisation.mobile_animation_interval > 30)) {
    errors.push('Mobile animation interval must be between 1 and 30 seconds');
  }
  
  if (customisation.mobile_idle_animation_interval && (customisation.mobile_idle_animation_interval < 1000 || customisation.mobile_idle_animation_interval > 30000)) {
    errors.push('Mobile idle animation interval must be between 1000 and 30000 milliseconds');
  }

  // Enum validation
  const validAnimationSpeeds = ['slow', 'normal', 'fast'];
  if (customisation.animation_speed && !validAnimationSpeeds.includes(customisation.animation_speed)) {
    errors.push('Animation speed must be slow, normal, or fast');
  }
  
  if (customisation.mobile_animation_speed && !validAnimationSpeeds.includes(customisation.mobile_animation_speed)) {
    errors.push('Mobile animation speed must be slow, normal, or fast');
  }

  const validShadowIntensities = ['none', 'light', 'medium', 'heavy'];
  if (customisation.chat_button_shadow_intensity && !validShadowIntensities.includes(customisation.chat_button_shadow_intensity)) {
    errors.push('Shadow intensity must be none, light, medium, or heavy');
  }
  
  if (customisation.mobile_chat_button_shadow_intensity && !validShadowIntensities.includes(customisation.mobile_chat_button_shadow_intensity)) {
    errors.push('Mobile shadow intensity must be none, light, medium, or heavy');
  }
  
  const validHoverEffects = ['scale', 'glow', 'lift', 'none'];
  if (customisation.button_hover_effect && !validHoverEffects.includes(customisation.button_hover_effect)) {
    errors.push('Button hover effect must be scale, glow, lift, or none');
  }
  
  if (customisation.mobile_button_hover_effect && !validHoverEffects.includes(customisation.mobile_button_hover_effect)) {
    errors.push('Mobile button hover effect must be scale, glow, lift, or none');
  }
  
  const validAvatarStyles = ['circle', 'square', 'rounded'];
  if (customisation.avatar_style && !validAvatarStyles.includes(customisation.avatar_style)) {
    errors.push('Avatar style must be circle, square, or rounded');
  }
  
  if (customisation.mobile_avatar_style && !validAvatarStyles.includes(customisation.mobile_avatar_style)) {
    errors.push('Mobile avatar style must be circle, square, or rounded');
  }
  
  const validTimestampFormats = ['12h', '24h', 'relative'];
  if (customisation.timestamp_format && !validTimestampFormats.includes(customisation.timestamp_format)) {
    errors.push('Timestamp format must be 12h, 24h, or relative');
  }
  
  if (customisation.mobile_timestamp_format && !validTimestampFormats.includes(customisation.mobile_timestamp_format)) {
    errors.push('Mobile timestamp format must be 12h, 24h, or relative');
  }

  // Offset validation
  if (customisation.chat_offset_bottom && (customisation.chat_offset_bottom < 0 || customisation.chat_offset_bottom > 100)) {
    errors.push('Chat offset bottom must be between 0 and 100 pixels');
  }
  
  if (customisation.mobile_chat_offset_bottom && (customisation.mobile_chat_offset_bottom < 0 || customisation.mobile_chat_offset_bottom > 100)) {
    errors.push('Mobile chat offset bottom must be between 0 and 100 pixels');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 