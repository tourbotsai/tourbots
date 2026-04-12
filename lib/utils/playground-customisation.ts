import { ChatbotCustomisation } from '@/lib/types';

/**
 * Mode-aware field selection utility - gets the effective value based on current mode
 * Uses the same pattern as EnhancedLivePreview for consistency
 */
export const getEffectiveValue = (
  customisation: Partial<ChatbotCustomisation>,
  desktopKey: keyof ChatbotCustomisation,
  mobileKey: keyof ChatbotCustomisation,
  fallback: any,
  mode: 'desktop' | 'mobile'
) => {
  if (mode === 'mobile') {
    const mobileValue = customisation[mobileKey];
    const desktopValue = customisation[desktopKey];
    return mobileValue !== undefined && mobileValue !== null ? mobileValue : (desktopValue ?? fallback);
  }
  return customisation[desktopKey] ?? fallback;
};

/**
 * Get complete effective customisation object for playground use
 */
export const getEffectiveCustomisation = (
  customisation: Partial<ChatbotCustomisation>,
  mode: 'desktop' | 'mobile'
): PlaygroundCustomisation => {
  return {
    // Basic customisation with mode-aware values
    header_background_color: getEffectiveValue(customisation, 'header_background_color', 'mobile_header_background_color', '#1890FF', mode),
    header_text_color: getEffectiveValue(customisation, 'header_text_color', 'mobile_header_text_color', '#FFFFFF', mode),
    window_title: getEffectiveValue(customisation, 'window_title', 'mobile_window_title', 'Chat with us!', mode),
    ai_message_background: getEffectiveValue(customisation, 'ai_message_background', 'mobile_ai_message_background', '#F1F5F9', mode),
    ai_message_text_color: getEffectiveValue(customisation, 'ai_message_text_color', 'mobile_ai_message_text_color', '#09090B', mode),
    user_message_background: getEffectiveValue(customisation, 'user_message_background', 'mobile_user_message_background', '#1890FF', mode),
    user_message_text_color: getEffectiveValue(customisation, 'user_message_text_color', 'mobile_user_message_text_color', '#FFFFFF', mode),
    input_background_color: getEffectiveValue(customisation, 'input_background_color', 'mobile_input_background_color', '#FFFFFF', mode),
    input_text_color: getEffectiveValue(customisation, 'input_text_color', 'mobile_input_text_color', '#111827', mode), // 🆕 Customisable input text
    placeholder_text_color: getEffectiveValue(customisation, 'placeholder_text_color', 'mobile_placeholder_text_color', '#6B7280', mode), // 🆕 Customisable placeholder
    input_border_color: '#D1D5DB',
    chat_button_color: getEffectiveValue(customisation, 'chat_button_color', 'mobile_chat_button_color', '#1890FF', mode),
    chat_button_size: getEffectiveValue(customisation, 'chat_button_size', 'mobile_chat_button_size', 'medium', mode),
    show_powered_by: getEffectiveValue(customisation, 'show_powered_by', 'mobile_show_powered_by', true, mode),
    brand_name: 'TourBots AI',
    brand_url: 'https://tourbots.ai',
    custom_logo_url: getEffectiveValue(customisation, 'custom_logo_url', 'mobile_custom_logo_url', null, mode),
    header_icon_size: getEffectiveValue(customisation, 'header_icon_size', 'mobile_header_icon_size', 20, mode),
    header_icon: getEffectiveValue(customisation, 'header_icon', 'mobile_header_icon', 'Bot', mode),
    custom_header_icon_url: getEffectiveValue(customisation, 'custom_header_icon_url', 'mobile_custom_header_icon_url', null, mode),
    icon_size: getEffectiveValue(customisation, 'icon_size', 'mobile_icon_size', 24, mode),
    chat_button_icon: getEffectiveValue(customisation, 'chat_button_icon', 'mobile_chat_button_icon', 'MessageCircle', mode),
    chat_button_position: getEffectiveValue(customisation, 'chat_button_position', 'mobile_chat_button_position', 'bottom-right', mode),

    // Layout & Dimensions with mode-aware values
    chat_window_width: getEffectiveValue(customisation, 'window_width', 'mobile_chat_window_width', mode === 'mobile' ? 350 : 400, mode),
    chat_window_height: getEffectiveValue(customisation, 'window_height', 'mobile_chat_window_height', mode === 'mobile' ? 500 : 600, mode),
    chat_button_bottom_offset: getEffectiveValue(customisation, 'chat_button_bottom_offset', 'mobile_chat_button_bottom_offset', 20, mode),
    chat_button_side_offset: getEffectiveValue(customisation, 'chat_button_side_offset', 'mobile_chat_button_side_offset', 20, mode),
    header_height: getEffectiveValue(customisation, 'header_height', 'mobile_header_height', 60, mode),
    input_height: getEffectiveValue(customisation, 'input_height', 'mobile_input_height', 50, mode),

    // Chat Window Positioning (separate from button)
    chat_offset_bottom: getEffectiveValue(customisation, 'chat_offset_bottom', 'mobile_chat_offset_bottom', 20, mode),
    chat_offset_side: getEffectiveValue(customisation, 'chat_offset_side', 'mobile_chat_offset_side', 20, mode),

    // Border Radius with mode-aware values
    chat_button_border_radius: getEffectiveValue(customisation, 'chat_button_border_radius', 'mobile_chat_button_border_radius', 50, mode),
    chat_window_border_radius: getEffectiveValue(customisation, 'chat_window_border_radius', 'mobile_chat_window_border_radius', 12, mode),
    message_border_radius: getEffectiveValue(customisation, 'message_border_radius', 'mobile_message_border_radius', 8, mode),
    input_border_radius: getEffectiveValue(customisation, 'input_border_radius', 'mobile_input_border_radius', 20, mode),

    // Send Button Border Radius (separate from input)
    send_button_border_radius: getEffectiveValue(customisation, 'send_button_border_radius', 'mobile_send_button_border_radius', 8, mode),

    // Avatars with mode-aware values
    show_user_avatar: getEffectiveValue(customisation, 'show_user_avatar', 'mobile_show_user_avatar', true, mode),
    show_bot_avatar: getEffectiveValue(customisation, 'show_bot_avatar', 'mobile_show_bot_avatar', true, mode),
    user_avatar_icon: getEffectiveValue(customisation, 'user_avatar_icon', 'mobile_user_avatar_icon', 'User', mode),
    bot_avatar_icon: getEffectiveValue(customisation, 'bot_avatar_icon', 'mobile_bot_avatar_icon', 'Bot', mode),
    custom_user_avatar_url: getEffectiveValue(customisation, 'custom_user_avatar_url', 'mobile_custom_user_avatar_url', null, mode),
    custom_bot_avatar_url: getEffectiveValue(customisation, 'custom_bot_avatar_url', 'mobile_custom_bot_avatar_url', null, mode),
    
    // Avatar Style (circle/square/rounded)
    avatar_style: getEffectiveValue(customisation, 'avatar_style', 'mobile_avatar_style', 'circle', mode),

    // Send Button with mode-aware values
    send_button_color: getEffectiveValue(customisation, 'send_button_color', 'mobile_send_button_color', '#1890FF', mode),
    send_button_hover_color: getEffectiveValue(customisation, 'send_button_hover_color', 'mobile_send_button_hover_color', '#40A9FF', mode),
    send_button_icon: getEffectiveValue(customisation, 'send_button_icon', 'mobile_send_button_icon', 'Send', mode),
    send_button_size: getEffectiveValue(customisation, 'send_button_size', 'mobile_send_button_size', 'medium', mode),
    
    // Enhanced Send Button Options
    send_button_icon_color: getEffectiveValue(customisation, 'send_button_icon_color', 'mobile_send_button_icon_color', '#FFFFFF', mode),
    send_button_style: getEffectiveValue(customisation, 'send_button_style', 'mobile_send_button_style', 'icon', mode),

    // Message Settings with mode-aware values
    show_timestamps: getEffectiveValue(customisation, 'show_timestamps', 'mobile_show_timestamps', false, mode),
    timestamp_format: getEffectiveValue(customisation, 'timestamp_format', 'mobile_timestamp_format', '12h', mode),
    message_max_width: getEffectiveValue(customisation, 'message_max_width', 'mobile_message_max_width', mode === 'mobile' ? 85 : 80, mode),

    // Message Shadows
    message_shadow_enabled: getEffectiveValue(customisation, 'message_shadow_enabled', 'mobile_message_shadow_enabled', false, mode),

    // Shadows with mode-aware values
    chat_button_shadow: getEffectiveValue(customisation, 'chat_button_shadow', 'mobile_chat_button_shadow', true, mode),
    chat_button_hover_color: getEffectiveValue(customisation, 'chat_button_hover_color', 'mobile_chat_button_hover_color', '#40A9FF', mode),
    
    // Shadow Intensity Controls
    chat_button_shadow_intensity: getEffectiveValue(customisation, 'chat_button_shadow_intensity', 'mobile_chat_button_shadow_intensity', 'medium', mode),
    chat_window_shadow_intensity: getEffectiveValue(customisation, 'chat_window_shadow_intensity', 'mobile_chat_window_shadow_intensity', 'medium', mode),

    // Button Hover Effects
    button_hover_effect: getEffectiveValue(customisation, 'button_hover_effect', 'mobile_button_hover_effect', 'scale', mode),

    // Animations with mode-aware values
    chat_button_animation: getEffectiveValue(customisation, 'chat_button_animation', 'chat_button_animation', 'none', mode),
    typing_indicator_enabled: getEffectiveValue(customisation, 'typing_indicator_enabled', 'mobile_typing_indicator_enabled', true, mode),

    // Complete Animation System
    enable_animations: getEffectiveValue(customisation, 'enable_animations', 'mobile_enable_animations', true, mode),
    animation_speed: getEffectiveValue(customisation, 'animation_speed', 'mobile_animation_speed', 'normal', mode),
    chat_entrance_animation: getEffectiveValue(customisation, 'chat_entrance_animation', 'mobile_chat_entrance_animation', 'slide-up', mode),
    message_animation: getEffectiveValue(customisation, 'message_animation', 'mobile_message_animation', 'fade-in', mode),
    animation_interval: getEffectiveValue(customisation, 'animation_interval', 'mobile_animation_interval', 5, mode),
    idle_animation_enabled: getEffectiveValue(customisation, 'idle_animation_enabled', 'mobile_idle_animation_enabled', false, mode),
    idle_animation_type: getEffectiveValue(customisation, 'idle_animation_type', 'mobile_idle_animation_type', 'pulse', mode),
    idle_animation_interval: getEffectiveValue(customisation, 'idle_animation_interval', 'mobile_idle_animation_interval', 10000, mode),

    // Loading settings with mode-aware values
    loading_animation: getEffectiveValue(customisation, 'loading_animation', 'mobile_loading_animation', 'spinner', mode),
    loading_text_color: getEffectiveValue(customisation, 'loading_text_color', 'mobile_loading_text_color', '#666', mode),
    loading_background_color: getEffectiveValue(customisation, 'loading_background_color', 'mobile_loading_background_color', 'white', mode),
    loading_spinner_color: getEffectiveValue(customisation, 'loading_spinner_color', 'mobile_loading_spinner_color', '#1890FF', mode),
    
    // Advanced Loading Controls
    loading_spinner_style: getEffectiveValue(customisation, 'loading_spinner_style', 'mobile_loading_spinner_style', 'circle', mode),
    loading_text_enabled: getEffectiveValue(customisation, 'loading_text_enabled', 'mobile_loading_text_enabled', true, mode),

    // Typing indicator with mode-aware values
    typing_indicator_animation: getEffectiveValue(customisation, 'typing_indicator_animation', 'typing_indicator_animation', 'dots', mode),
    
    // Advanced Typing Indicator Controls
    typing_indicator_style: getEffectiveValue(customisation, 'typing_indicator_style', 'mobile_typing_indicator_style', 'dots', mode),
    typing_indicator_color: getEffectiveValue(customisation, 'typing_indicator_color', 'mobile_typing_indicator_color', '#666666', mode),
    typing_indicator_speed: getEffectiveValue(customisation, 'typing_indicator_speed', 'mobile_typing_indicator_speed', 'normal', mode),

    // Welcome message settings with mode-aware values
    welcome_message_delay: getEffectiveValue(customisation, 'welcome_message_delay', 'mobile_welcome_message_delay', 1000, mode),

    // Typography configuration with mode-aware values
    font_family: getEffectiveValue(customisation, 'font_family', 'mobile_font_family', 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', mode),
    header_text_size: getEffectiveValue(customisation, 'header_text_size', 'mobile_header_text_size', mode === 'mobile' ? 14 : 16, mode),
    message_text_size: getEffectiveValue(customisation, 'message_text_size', 'mobile_message_text_size', mode === 'mobile' ? 12 : 14, mode),
    placeholder_text_size: getEffectiveValue(customisation, 'placeholder_text_size', 'mobile_placeholder_text_size', mode === 'mobile' ? 12 : 14, mode),
    input_placeholder_text: getEffectiveValue(customisation, 'input_placeholder_text', 'mobile_input_placeholder_text', 'Type your message...', mode),
    branding_text_size: getEffectiveValue(customisation, 'branding_text_size', 'mobile_branding_text_size', mode === 'mobile' ? 10 : 12, mode),
    message_font_weight: getEffectiveValue(customisation, 'message_font_weight', 'mobile_message_font_weight', 'normal', mode),
    header_font_weight: getEffectiveValue(customisation, 'header_font_weight', 'mobile_header_font_weight', 'medium', mode),

    // Mode information
    mode,
  };
};

/**
 * Generate inline CSS styles from customisation object
 */
export const getPlaygroundStyles = (customisation: PlaygroundCustomisation) => {
  return {
    chatWindow: {
      width: `${customisation.chat_window_width}px`,
      height: `${customisation.chat_window_height}px`,
      borderRadius: `${customisation.chat_window_border_radius}px`,
      fontFamily: customisation.font_family,
    },
    header: {
      backgroundColor: customisation.header_background_color,
      color: customisation.header_text_color,
      height: `${customisation.header_height}px`,
      fontSize: `${customisation.header_text_size}px`,
      fontWeight: getFontWeightValue(customisation.header_font_weight),
    },
    input: {
      backgroundColor: customisation.input_background_color,
      borderRadius: `${customisation.input_border_radius}px`,
      height: `${customisation.input_height}px`,
      fontSize: `${customisation.placeholder_text_size}px`,
      color: customisation.input_text_color, // 🆕 Input text colour
      // @ts-ignore - CSS custom property for placeholder
      '--placeholder-color': customisation.placeholder_text_color, // 🆕 Placeholder colour
    },
    sendButton: {
      backgroundColor: customisation.send_button_color,
      borderRadius: `${customisation.send_button_border_radius}px`,
    },
    chatButton: {
      backgroundColor: customisation.chat_button_color,
      borderRadius: `${customisation.chat_button_border_radius}px`,
    },
    message: {
      borderRadius: `${customisation.message_border_radius}px`,
      fontSize: `${customisation.message_text_size}px`,
      fontWeight: getFontWeightValue(customisation.message_font_weight),
      maxWidth: `${customisation.message_max_width}%`,
    },
    userMessage: {
      backgroundColor: customisation.user_message_background,
      color: customisation.user_message_text_color,
    },
    aiMessage: {
      backgroundColor: customisation.ai_message_background,
      color: customisation.ai_message_text_color,
    },
  };
};

/**
 * Convert font weight strings to numbers for better CSS compatibility
 */
export const getFontWeightValue = (weight: string) => {
  switch (weight) {
    case 'light': return 300;
    case 'normal': return 400;
    case 'medium': return 500;
    case 'bold': return 700;
    default: return 500;
  }
};

/**
 * Validate that all required customisation fields are present
 */
export const validateCustomisationFields = (customisation: Partial<ChatbotCustomisation>): boolean => {
  const requiredFields = [
    'chat_button_color',
    'header_background_color',
    'header_text_color',
    'user_message_background',
    'user_message_text_color',
    'ai_message_background',
    'ai_message_text_color',
    'send_button_color',
  ];

  return requiredFields.every(field => customisation[field as keyof ChatbotCustomisation] !== undefined);
};

/**
 * Get field mappings for desktop vs mobile modes
 */
export const getModeSpecificFields = (mode: 'desktop' | 'mobile') => {
  const baseFields = {
    chat_button_color: mode === 'mobile' ? 'mobile_chat_button_color' : 'chat_button_color',
    header_background_color: mode === 'mobile' ? 'mobile_header_background_color' : 'header_background_color',
    window_title: mode === 'mobile' ? 'mobile_window_title' : 'window_title',
    // Add more field mappings as needed
  };

  return baseFields;
};

/**
 * Type definition for processed playground customisation
 */
export interface PlaygroundCustomisation {
  // Basic colors and branding
  header_background_color: string;
  header_text_color: string;
  window_title: string;
  ai_message_background: string;
  ai_message_text_color: string;
  user_message_background: string;
  user_message_text_color: string;
  input_background_color: string;
  input_text_color: string; // 🆕 Customisable input text colour
  placeholder_text_color: string; // 🆕 Customisable placeholder colour
  input_border_color: string;
  chat_button_color: string;
  chat_button_size: string;
  show_powered_by: boolean;
  brand_name: string;
  brand_url: string;
  custom_logo_url: string | null;
  header_icon_size: number;
  header_icon: string;
  custom_header_icon_url: string | null;
  icon_size: number;
  chat_button_icon: string;
  chat_button_position: string;

  // Layout & Dimensions
  chat_window_width: number;
  chat_window_height: number;
  chat_button_bottom_offset: number;
  chat_button_side_offset: number;
  header_height: number;
  input_height: number;
  chat_offset_bottom: number;
  chat_offset_side: number;

  // Border Radius
  chat_button_border_radius: number;
  chat_window_border_radius: number;
  message_border_radius: number;
  input_border_radius: number;
  send_button_border_radius: number;

  // Avatars
  show_user_avatar: boolean;
  show_bot_avatar: boolean;
  user_avatar_icon: string;
  bot_avatar_icon: string;
  custom_user_avatar_url: string | null;
  custom_bot_avatar_url: string | null;
  avatar_style: string;

  // Send Button
  send_button_color: string;
  send_button_hover_color: string;
  send_button_icon: string;
  send_button_size: string;
  send_button_icon_color: string;
  send_button_style: string;

  // Messages
  show_timestamps: boolean;
  timestamp_format: string;
  message_max_width: number;
  message_shadow_enabled: boolean;

  // Shadows
  chat_button_shadow: boolean;
  chat_button_hover_color: string;
  chat_button_shadow_intensity: string;
  chat_window_shadow_intensity: string;
  button_hover_effect: string;

  // Animations
  chat_button_animation: string;
  typing_indicator_enabled: boolean;
  enable_animations: boolean;
  animation_speed: string;
  chat_entrance_animation: string;
  message_animation: string;
  animation_interval: number;
  idle_animation_enabled: boolean;
  idle_animation_type: string;
  idle_animation_interval: number;

  // Loading
  loading_animation: string;
  loading_text_color: string;
  loading_background_color: string;
  loading_spinner_color: string;
  loading_spinner_style: string;
  loading_text_enabled: boolean;

  // Typing Indicator
  typing_indicator_animation: string;
  typing_indicator_style: string;
  typing_indicator_color: string;
  typing_indicator_speed: string;

  // Welcome message
  welcome_message_delay: number;

  // Typography
  font_family: string;
  header_text_size: number;
  message_text_size: number;
  placeholder_text_size: number;
  input_placeholder_text: string;
  branding_text_size: number;
  message_font_weight: string;
  header_font_weight: string;

  // Mode
  mode: 'desktop' | 'mobile';
} 