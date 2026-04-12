// ================================================
// CHATBOT CUSTOMISATION CATEGORIES & CONSTANTS
// TourBots AI platform — customisation organisation
// ================================================

import { CustomisationCategory } from '../types/chatbot-customisation';

// ==================== CUSTOMISATION CATEGORIES ====================

export const CUSTOMISATION_CATEGORIES: CustomisationCategory[] = [
  {
    id: 'colors',
    name: 'Colours & Branding',
    description: 'Chat button, window, and message colours',
    icon: 'Palette',
    order: 1,
    fields: [
      'chat_button_color',
      'header_background_color',
      'header_text_color',
      'user_message_background',
      'user_message_text_color',
      'ai_message_background',
      'ai_message_text_color',
      'input_background_color',
      'send_button_color',
      'send_button_icon_color',
      'send_button_hover_color',
      'chat_button_hover_color',
    ]
  },
  {
    id: 'typography',
    name: 'Typography',
    description: 'Font families, sizes, and weights',
    icon: 'Type',
    order: 2,
    fields: [
      'font_family',
      'header_text_size',
      'message_text_size',
      'placeholder_text_size',
      'input_placeholder_text',
      'placeholder_text_color', // 🆕 Desktop placeholder colour
      'input_text_color', // 🆕 Desktop input text colour
      'branding_text_size',
      'message_font_weight',
      'header_font_weight',
    ]
  },
  {
    id: 'layout',
    name: 'Layout & Dimensions',
    description: 'Window size, positioning, and spacing',
    icon: 'Layout',
    order: 3,
    fields: [
      'chat_window_width',
      'chat_window_height',
      'header_height',
      'input_height',
      'chat_button_bottom_offset',
      'chat_button_side_offset',
      'chat_offset_bottom',
      'chat_offset_side',
      'message_max_width',
      'window_width',
      'window_height',
    ]
  },
  {
    id: 'visual-effects',
    name: 'Visual Effects',
    description: 'Shadows, borders, and styling',
    icon: 'Sparkles',
    order: 4,
    fields: [
      'chat_button_shadow_intensity',
      'chat_window_shadow_intensity',
      'message_shadow_enabled',
      'chat_button_shadow',
      'chat_button_border_radius',
      'chat_window_border_radius',
      'message_border_radius',
      'input_border_radius',
      'send_button_border_radius',
    ]
  },
  {
    id: 'animations',
    name: 'Animations',
    description: 'Motion, transitions, and interactive effects',
    icon: 'Zap',
    order: 5,
    fields: [
      'enable_animations',
      'animation_speed',
      'chat_entrance_animation',
      'message_animation',
      'button_hover_effect',
      'chat_button_animation',
      'animation_interval',
      'idle_animation_enabled',
      'idle_animation_type',
      'idle_animation_interval',
    ]
  },
  {
    id: 'avatars',
    name: 'Avatars',
    description: 'User and bot avatar customisation',
    icon: 'Users',
    order: 6,
    fields: [
      'show_user_avatar',
      'show_bot_avatar',
      'avatar_style',
      'custom_bot_avatar_url',
      'custom_user_avatar_url',
      'bot_avatar_icon',
      'user_avatar_icon',
    ]
  },
  {
    id: 'interactions',
    name: 'Interactions',
    description: 'Typing indicators, loading states, and feedback',
    icon: 'MessageCircle',
    order: 7,
    fields: [
      'typing_indicator_enabled',
      'typing_indicator_style',
      'typing_indicator_color',
      'typing_indicator_speed',
      'typing_indicator_animation',
      'loading_spinner_style',
      'loading_text_enabled',
      'loading_spinner_color',
      'loading_animation',
      'loading_text_color',
      'loading_background_color',
      'show_timestamps',
      'timestamp_format',
      'welcome_message_delay',
    ]
  },
  {
    id: 'buttons',
    name: 'Buttons & Controls',
    description: 'Send button styling and chat button customisation',
    icon: 'Mouse',
    order: 8,
    fields: [
      'chat_button_size',
      'chat_button_position',
      'chat_button_icon',
      'icon_size',
      'header_icon_size',
      'send_button_style',
      'send_button_size',
      'send_button_icon',
    ]
  },
  {
    id: 'mobile',
    name: 'Mobile Customisation',
    description: 'Mobile-specific overrides and responsive design',
    icon: 'Smartphone',
    order: 9,
    fields: [
      'mobile_chat_button_color',
      'mobile_chat_button_size',
      'mobile_chat_button_position',
      'mobile_icon_size',
      'mobile_chat_button_border_radius',
      'mobile_chat_button_bottom_offset',
      'mobile_chat_button_side_offset',
      'mobile_chat_window_width',
      'mobile_chat_window_height',
      'mobile_chat_window_border_radius',
      'mobile_header_height',
      'mobile_input_height',
      'mobile_fullscreen',
      'mobile_message_border_radius',
      'mobile_input_border_radius',
      'mobile_message_max_width',
      'mobile_font_family',
      'mobile_header_text_size',
      'mobile_message_text_size',
      'mobile_placeholder_text_size',
      'mobile_input_placeholder_text',
      'mobile_placeholder_text_color', // 🆕 Mobile placeholder colour
      'mobile_input_text_color', // 🆕 Mobile input text colour
      'mobile_branding_text_size',
      'mobile_show_user_avatar',
      'mobile_show_bot_avatar',
      'mobile_header_background_color',
      'mobile_header_text_color',
      'mobile_ai_message_background',
      'mobile_ai_message_text_color',
      'mobile_user_message_background',
      'mobile_input_background_color',
      'mobile_send_button_color',
      'mobile_typing_indicator_enabled',
      'mobile_chat_button_icon',
      'mobile_chat_button_hover_color',
      'mobile_chat_button_shadow',
      'mobile_chat_button_shadow_intensity',
      'mobile_chat_button_animation',
      'mobile_header_icon_size',
      'mobile_button_hover_effect',
      'mobile_window_title',
      'mobile_chat_window_shadow_intensity',
      'mobile_chat_offset_bottom',
      'mobile_chat_offset_side',
      'mobile_welcome_message_delay',
      'mobile_send_button_icon_color',
      'mobile_send_button_style',
      'mobile_send_button_size',
      'mobile_send_button_border_radius',
      'mobile_send_button_icon',
      'mobile_send_button_hover_color',
      'mobile_message_font_weight',
      'mobile_header_font_weight',
      'mobile_user_message_text_color',
      'mobile_message_shadow_enabled',
      'mobile_avatar_style',
      'mobile_custom_bot_avatar_url',
      'mobile_custom_user_avatar_url',
      'mobile_bot_avatar_icon',
      'mobile_user_avatar_icon',
      'mobile_enable_animations',
      'mobile_animation_speed',
      'mobile_chat_entrance_animation',
      'mobile_message_animation',
      'mobile_animation_interval',
      'mobile_idle_animation_enabled',
      'mobile_idle_animation_type',
      'mobile_idle_animation_interval',
      'mobile_typing_indicator_style',
      'mobile_typing_indicator_color',
      'mobile_typing_indicator_speed',
      'mobile_typing_indicator_animation',
      'mobile_loading_spinner_style',
      'mobile_loading_text_enabled',
      'mobile_loading_spinner_color',
      'mobile_loading_animation',
      'mobile_loading_text_color',
      'mobile_loading_background_color',
      'mobile_show_powered_by',
      'mobile_show_timestamps',
      'mobile_timestamp_format',
      'mobile_custom_logo_url',
    ]
  },
  {
    id: 'branding',
    name: 'Branding & Content',
    description: 'Logos, titles, and branding elements',
    icon: 'Award',
    order: 10,
    fields: [
      'window_title',
      'custom_logo_url',
      'show_powered_by',
    ]
  },
] as const;

// ==================== FIELD GROUPINGS ====================

export const FIELD_GROUPS = {
  DESKTOP_ONLY: [
    'chat_window_width',
    'chat_window_height',
    'window_width',
    'window_height',
    'header_height',
    'input_height',
    'chat_button_bottom_offset',
    'chat_button_side_offset',
    'chat_offset_bottom',
    'chat_offset_side',
  ],
  MOBILE_ONLY: [
    'mobile_chat_button_color',
    'mobile_chat_button_size',
    'mobile_chat_button_position',
    'mobile_icon_size',
    'mobile_chat_button_border_radius',
    'mobile_chat_button_bottom_offset',
    'mobile_chat_button_side_offset',
    'mobile_chat_window_width',
    'mobile_chat_window_height',
    'mobile_chat_window_border_radius',
    'mobile_header_height',
    'mobile_input_height',
    'mobile_fullscreen',
    'mobile_message_border_radius',
    'mobile_input_border_radius',
    'mobile_message_max_width',
    'mobile_font_family',
    'mobile_header_text_size',
    'mobile_message_text_size',
    'mobile_placeholder_text_size',
    'mobile_input_placeholder_text',
    'mobile_placeholder_text_color', // 🆕 Mobile placeholder colour
    'mobile_input_text_color', // 🆕 Mobile input text colour
    'mobile_branding_text_size',
    'mobile_show_user_avatar',
    'mobile_show_bot_avatar',
    'mobile_header_background_color',
    'mobile_header_text_color',
    'mobile_ai_message_background',
    'mobile_ai_message_text_color',
    'mobile_user_message_background',
    'mobile_input_background_color',
    'mobile_send_button_color',
    'mobile_typing_indicator_enabled',
    
    // NEW MOBILE FIELDS - Complete Desktop/Mobile Separation
    'mobile_chat_button_icon',
    'mobile_chat_button_hover_color',
    'mobile_chat_button_shadow',
    'mobile_chat_button_shadow_intensity',
    'mobile_chat_button_animation',
    'mobile_header_icon_size',
    'mobile_button_hover_effect',
    'mobile_window_title',
    'mobile_chat_window_shadow_intensity',
    'mobile_chat_offset_bottom',
    'mobile_chat_offset_side',
    'mobile_welcome_message_delay',
    'mobile_send_button_icon_color',
    'mobile_send_button_style',
    'mobile_send_button_size',
    'mobile_send_button_border_radius',
    'mobile_send_button_icon',
    'mobile_send_button_hover_color',
    'mobile_message_font_weight',
    'mobile_header_font_weight',
    'mobile_user_message_text_color',
    'mobile_message_shadow_enabled',
    'mobile_avatar_style',
    'mobile_custom_bot_avatar_url',
    'mobile_custom_user_avatar_url',
    'mobile_bot_avatar_icon',
    'mobile_user_avatar_icon',
    'mobile_enable_animations',
    'mobile_animation_speed',
    'mobile_chat_entrance_animation',
    'mobile_message_animation',
    'mobile_animation_interval',
    'mobile_idle_animation_enabled',
    'mobile_idle_animation_type',
    'mobile_idle_animation_interval',
    'mobile_typing_indicator_style',
    'mobile_typing_indicator_color',
    'mobile_typing_indicator_speed',
    'mobile_typing_indicator_animation',
    'mobile_loading_spinner_style',
    'mobile_loading_text_enabled',
    'mobile_loading_spinner_color',
    'mobile_loading_animation',
    'mobile_loading_text_color',
    'mobile_loading_background_color',
    'mobile_show_powered_by',
    'mobile_show_timestamps',
    'mobile_timestamp_format',
    'mobile_custom_logo_url',
  ],
  RESPONSIVE: [
    'font_family',
    'header_text_size',
    'message_text_size',
    'placeholder_text_size',
    'branding_text_size',
    'show_user_avatar',
    'show_bot_avatar',
    'typing_indicator_enabled',
  ],
  COLOUR_FIELDS: [
    'chat_button_color',
    'header_background_color',
    'header_text_color',
    'user_message_background',
    'user_message_text_color',
    'ai_message_background',
    'ai_message_text_color',
    'input_background_color',
    'send_button_color',
    'send_button_icon_color',
    'send_button_hover_color',
    'chat_button_hover_color',
    'typing_indicator_color',
    'loading_spinner_color',
    'loading_text_color',
    'loading_background_color',
    'mobile_chat_button_color',
    'mobile_header_background_color',
    'mobile_header_text_color',
    'mobile_ai_message_background',
    'mobile_ai_message_text_color',
    'mobile_user_message_background',
    'mobile_input_background_color',
    'mobile_send_button_color',
    'mobile_chat_button_hover_color',
    'mobile_send_button_icon_color',
    'mobile_send_button_hover_color',
    'mobile_user_message_text_color',
    'mobile_typing_indicator_color',
    'mobile_loading_spinner_color',
    'mobile_loading_text_color',
    'mobile_loading_background_color',
  ],
  TYPOGRAPHY_FIELDS: [
    'font_family',
    'header_text_size',
    'message_text_size',
    'placeholder_text_size',
    'branding_text_size',
    'message_font_weight',
    'header_font_weight',
    'mobile_font_family',
    'mobile_header_text_size',
    'mobile_message_text_size',
    'mobile_placeholder_text_size',
    'mobile_branding_text_size',
    'mobile_message_font_weight',
    'mobile_header_font_weight',
  ],
  ANIMATION_FIELDS: [
    'enable_animations',
    'animation_speed',
    'chat_entrance_animation',
    'message_animation',
    'button_hover_effect',
    'chat_button_animation',
    'animation_interval',
    'idle_animation_enabled',
    'idle_animation_type',
    'idle_animation_interval',
    'mobile_enable_animations',
    'mobile_animation_speed',
    'mobile_chat_entrance_animation',
    'mobile_message_animation',
    'mobile_button_hover_effect',
    'mobile_chat_button_animation',
    'mobile_animation_interval',
    'mobile_idle_animation_enabled',
    'mobile_idle_animation_type',
    'mobile_idle_animation_interval',
  ],
} as const;

// ==================== ENUM OPTIONS ====================

export const ENUM_OPTIONS = {
  CHAT_BUTTON_SIZE: ['small', 'medium', 'large'] as const,
  CHAT_BUTTON_POSITION: ['bottom-right', 'bottom-left'] as const,
  MESSAGE_FONT_WEIGHT: ['light', 'normal', 'medium', 'bold'] as const,
  HEADER_FONT_WEIGHT: ['light', 'normal', 'medium', 'bold'] as const,
  SHADOW_INTENSITY: ['none', 'light', 'medium', 'heavy'] as const,
  ANIMATION_SPEED: ['slow', 'normal', 'fast'] as const,
  CHAT_ENTRANCE_ANIMATION: ['slide-up', 'slide-down', 'fade-in', 'scale-up', 'none'] as const,
  MESSAGE_ANIMATION: ['fade-in', 'slide-in', 'scale-in', 'none'] as const,
  BUTTON_HOVER_EFFECT: ['scale', 'glow', 'lift', 'none'] as const,
  CHAT_BUTTON_ANIMATION: ['none', 'bounce', 'pulse', 'shake', 'glow'] as const,
  IDLE_ANIMATION_TYPE: ['bounce', 'pulse', 'shake', 'glow', 'none'] as const,
  TIMESTAMP_FORMAT: ['12h', '24h', 'relative'] as const,
  AVATAR_STYLE: ['circle', 'square', 'rounded'] as const,
  SEND_BUTTON_STYLE: ['icon', 'text', 'icon-text'] as const,
  SEND_BUTTON_ICON: ['Send', 'ArrowRight', 'ChevronRight', 'Play', 'MessageCircle'] as const,
  TYPING_INDICATOR_STYLE: ['dots', 'wave', 'pulse', 'none'] as const,
  TYPING_INDICATOR_ANIMATION: ['dots', 'wave', 'pulse'] as const,
  LOADING_SPINNER_STYLE: ['dots', 'circle', 'bars', 'pulse'] as const,
  LOADING_ANIMATION: ['spinner', 'dots', 'bars'] as const,
  MOBILE_BUTTON_SIZE: ['small', 'medium', 'large'] as const,
  MOBILE_BUTTON_POSITION: ['bottom-right', 'bottom-left'] as const,
} as const;

// ==================== VALIDATION CONSTRAINTS ====================

export const VALIDATION_CONSTRAINTS = {
  TEXT_SIZE: { min: 8, max: 32 },
  BORDER_RADIUS: { min: 0, max: 50 },
  WINDOW_DIMENSIONS: { 
    width: { min: 320, max: 500 },
    height: { min: 400, max: 800 }
  },
  MOBILE_DIMENSIONS: {
    width: { min: 280, max: 400 },
    height: { min: 350, max: 600 }
  },
  ANIMATION_INTERVAL: { min: 1, max: 30 },
  IDLE_ANIMATION_INTERVAL: { min: 1000, max: 30000 },
  MESSAGE_MAX_WIDTH: { min: 60, max: 95 },
  MOBILE_MESSAGE_MAX_WIDTH: { min: 70, max: 95 },
  ICON_SIZE: { min: 12, max: 48 },
  MOBILE_ICON_SIZE: { min: 12, max: 32 },
  OFFSET: { min: 5, max: 100 },
  MOBILE_OFFSET: { min: 5, max: 50 },
} as const;

// ==================== UI LABELS ====================

export const UI_LABELS = {
  CATEGORIES: {
    colors: 'Colours & Branding',
    typography: 'Typography',
    layout: 'Layout & Dimensions',
    'visual-effects': 'Visual Effects',
    animations: 'Animations',
    avatars: 'Avatars',
    interactions: 'Interactions',
    buttons: 'Buttons & Controls',
    mobile: 'Mobile Customisation',
    branding: 'Branding & Content',
  },
  CHAT_BUTTON_SIZE: {
    small: 'Small (40px)',
    medium: 'Medium (56px)',
    large: 'Large (72px)',
  },
  CHAT_BUTTON_POSITION: {
    'bottom-right': 'Bottom Right',
    'bottom-left': 'Bottom Left',
  },
  FONT_WEIGHT: {
    light: 'Light (300)',
    normal: 'Normal (400)',
    medium: 'Medium (500)',
    bold: 'Bold (700)',
  },
  SHADOW_INTENSITY: {
    none: 'No Shadow',
    light: 'Light Shadow',
    medium: 'Medium Shadow',
    heavy: 'Heavy Shadow',
  },
  ANIMATION_SPEED: {
    slow: 'Slow (0.5s)',
    normal: 'Normal (0.3s)',
    fast: 'Fast (0.15s)',
  },
  ENTRANCE_ANIMATION: {
    'slide-up': 'Slide Up',
    'slide-down': 'Slide Down',
    'fade-in': 'Fade In',
    'scale-up': 'Scale Up',
    none: 'No Animation',
  },
  MESSAGE_ANIMATION: {
    'fade-in': 'Fade In',
    'slide-in': 'Slide In',
    'scale-in': 'Scale In',
    none: 'No Animation',
  },
  HOVER_EFFECT: {
    scale: 'Scale',
    glow: 'Glow',
    lift: 'Lift',
    none: 'No Effect',
  },
  BUTTON_ANIMATION: {
    none: 'No Animation',
    bounce: 'Bounce',
    pulse: 'Pulse',
    shake: 'Shake',
    glow: 'Glow',
  },
  TIMESTAMP_FORMAT: {
    '12h': '12-hour (2:30 PM)',
    '24h': '24-hour (14:30)',
    relative: 'Relative (2 mins ago)',
  },
  AVATAR_STYLE: {
    circle: 'Circle',
    square: 'Square',
    rounded: 'Rounded Square',
  },
  SEND_BUTTON_STYLE: {
    icon: 'Icon Only',
    text: 'Text Only',
    'icon-text': 'Icon + Text',
  },
  SEND_BUTTON_ICON: {
    Send: 'Send Icon',
    ArrowRight: 'Arrow Right',
    ChevronRight: 'Chevron Right',
    Play: 'Play Button',
    MessageCircle: 'Message Circle',
  },
  TYPING_INDICATOR: {
    dots: 'Dots',
    wave: 'Wave',
    pulse: 'Pulse',
    none: 'Disabled',
  },
  LOADING_SPINNER: {
    dots: 'Dots',
    circle: 'Circle',
    bars: 'Bars',
    pulse: 'Pulse',
  },
} as const;

// ==================== FIELD DESCRIPTIONS ====================

export const FIELD_DESCRIPTIONS = {
  // Colours
  chat_button_color: 'The background colour of the chat button',
  header_background_color: 'Background colour of the chat window header',
  header_text_color: 'Text colour for the header title and controls',
  user_message_background: 'Background colour for user messages',
  user_message_text_color: 'Text colour for user messages',
  ai_message_background: 'Background colour for AI assistant messages',
  ai_message_text_color: 'Text colour for AI assistant messages',
  input_background_color: 'Background colour of the message input field',
  send_button_color: 'Background colour of the send button',
  send_button_icon_color: 'Colour of the send button icon',
  
  // Typography
  font_family: 'Font family used throughout the chat interface',
  header_text_size: 'Text size for the chat window header',
  message_text_size: 'Text size for chat messages',
  placeholder_text_size: 'Text size for input placeholder text',
  input_placeholder_text: 'Placeholder text shown in the message input field',
  placeholder_text_color: 'Colour of placeholder text in the message input field', // 🆕
  input_text_color: 'Colour of text the user types in the input field', // 🆕
  branding_text_size: 'Text size for branding elements',
  message_font_weight: 'Font weight for chat messages',
  header_font_weight: 'Font weight for header text',
  
  // Layout
  chat_window_width: 'Width of the chat window in pixels',
  chat_window_height: 'Height of the chat window in pixels',
  header_height: 'Height of the chat window header',
  input_height: 'Height of the message input area',
  chat_button_bottom_offset: 'Distance from bottom of screen',
  chat_button_side_offset: 'Distance from side of screen',
  message_max_width: 'Maximum width of messages as percentage',
  
  // Visual Effects
  chat_button_shadow_intensity: 'Shadow intensity for the chat button',
  chat_window_shadow_intensity: 'Shadow intensity for the chat window',
  message_shadow_enabled: 'Enable shadows on individual messages',
  chat_button_border_radius: 'Border roundness of the chat button',
  chat_window_border_radius: 'Border roundness of the chat window',
  message_border_radius: 'Border roundness of message bubbles',
  input_border_radius: 'Border roundness of the input field',
  
  // Animations
  enable_animations: 'Enable or disable all animations',
  animation_speed: 'Speed of transition animations',
  chat_entrance_animation: 'Animation when chat window opens',
  message_animation: 'Animation for new messages',
  button_hover_effect: 'Effect when hovering over buttons',
  chat_button_animation: 'Continuous animation for chat button',
  idle_animation_enabled: 'Enable idle attention-grabbing animation',
  idle_animation_type: 'Type of idle animation to use',
  idle_animation_interval: 'Time between idle animations (ms)',
  
  // Avatars
  show_user_avatar: 'Show avatar next to user messages',
  show_bot_avatar: 'Show avatar next to bot messages',
  avatar_style: 'Shape style for avatars',
  custom_bot_avatar_url: 'Custom image URL for bot avatar',
  custom_user_avatar_url: 'Custom image URL for user avatar',
  
  // Interactions
  typing_indicator_enabled: 'Show typing indicator when bot is responding',
  typing_indicator_style: 'Visual style of the typing indicator',
  typing_indicator_color: 'Colour of the typing indicator',
  loading_spinner_style: 'Style of loading spinner',
  loading_text_enabled: 'Show loading text alongside spinner',
  show_timestamps: 'Display timestamps on messages',
  timestamp_format: 'Format for timestamp display',
  
  // Mobile
  mobile_fullscreen: 'Use fullscreen mode on mobile devices',
  mobile_chat_window_width: 'Chat window width on mobile',
  mobile_chat_window_height: 'Chat window height on mobile',
  mobile_header_text_size: 'Header text size on mobile',
  mobile_message_text_size: 'Message text size on mobile',
  mobile_input_placeholder_text: 'Placeholder text for mobile message input field',
  mobile_placeholder_text_color: 'Colour of placeholder text on mobile devices', // 🆕
  mobile_input_text_color: 'Colour of typed text on mobile devices', // 🆕
} as const;

// ==================== HELPER FUNCTIONS ====================

export function getCategoryById(id: string): CustomisationCategory | undefined {
  return CUSTOMISATION_CATEGORIES.find(category => category.id === id);
}

export function getCategoriesByField(fieldName: string): CustomisationCategory[] {
  return CUSTOMISATION_CATEGORIES.filter(category => 
    category.fields.includes(fieldName as any)
  );
}

export function getFieldsByCategory(categoryId: string): string[] {
  const category = getCategoryById(categoryId);
  return category ? [...category.fields] : [];
}

export function isColourField(fieldName: string): boolean {
  return FIELD_GROUPS.COLOUR_FIELDS.includes(fieldName as any);
}

export function isTypographyField(fieldName: string): boolean {
  return FIELD_GROUPS.TYPOGRAPHY_FIELDS.includes(fieldName as any);
}

export function isAnimationField(fieldName: string): boolean {
  return FIELD_GROUPS.ANIMATION_FIELDS.includes(fieldName as any);
}

export function isMobileField(fieldName: string): boolean {
  return FIELD_GROUPS.MOBILE_ONLY.includes(fieldName as any);
}

export function isDesktopField(fieldName: string): boolean {
  return FIELD_GROUPS.DESKTOP_ONLY.includes(fieldName as any);
}

export function isResponsiveField(fieldName: string): boolean {
  return FIELD_GROUPS.RESPONSIVE.includes(fieldName as any);
}

// ==================== EXPORT COLLECTIONS ====================

export const CUSTOMISATION_CONSTANTS = {
  CATEGORIES: CUSTOMISATION_CATEGORIES,
  FIELD_GROUPS,
  ENUM_OPTIONS,
  VALIDATION_CONSTRAINTS,
  UI_LABELS,
  FIELD_DESCRIPTIONS,
} as const; 