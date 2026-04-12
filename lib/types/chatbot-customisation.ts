// ================================================
// CHATBOT CUSTOMISATION HELPER TYPES
// TourBots AI platform — customisation type system
// ================================================

import { ChatbotCustomisation } from '../types';

// ==================== ANIMATION TYPES ====================

export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type ChatEntranceAnimation = 'slide-up' | 'slide-down' | 'fade-in' | 'scale-up' | 'none';
export type MessageAnimation = 'fade-in' | 'slide-in' | 'scale-in' | 'none';
export type ButtonHoverEffect = 'scale' | 'glow' | 'lift' | 'none';
export type ChatButtonAnimation = 'none' | 'bounce' | 'pulse' | 'shake' | 'glow';
export type IdleAnimation = 'bounce' | 'pulse' | 'shake' | 'glow' | 'none';

// ==================== VISUAL EFFECTS TYPES ====================

export type ShadowIntensity = 'none' | 'light' | 'medium' | 'heavy';
export type AvatarStyle = 'circle' | 'square' | 'rounded';

// ==================== TYPOGRAPHY TYPES ====================

export type FontWeight = 'light' | 'normal' | 'medium' | 'bold';
export type TimestampFormat = '12h' | '24h' | 'relative';

// Common font families for the selector
export const DEFAULT_FONT_FAMILIES = [
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
  '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  '"Source Sans Pro", -apple-system, BlinkMacSystemFont, sans-serif',
  '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
  '"Montserrat", -apple-system, BlinkMacSystemFont, sans-serif',
  'Georgia, "Times New Roman", Times, serif',
  '"Playfair Display", Georgia, serif',
] as const;

// ==================== BUTTON TYPES ====================

export type SendButtonStyle = 'icon' | 'text' | 'icon-text';
export type SendButtonIcon = 'Send' | 'ArrowRight' | 'ChevronRight' | 'Play' | 'MessageCircle';
export type ButtonSize = 'small' | 'medium' | 'large';

// ==================== INDICATOR TYPES ====================

export type TypingIndicatorStyle = 'dots' | 'wave' | 'pulse' | 'none';
export type TypingIndicatorAnimation = 'dots' | 'wave' | 'pulse';
export type LoadingSpinnerStyle = 'dots' | 'circle' | 'bars' | 'pulse';
export type LoadingAnimation = 'spinner' | 'dots' | 'bars';

// ==================== MOBILE TYPES ====================

export type MobileButtonSize = 'small' | 'medium' | 'large';
export type MobileButtonPosition = 'bottom-right' | 'bottom-left';

// ==================== PRESET SYSTEM ====================

export interface CustomisationPreset {
  name: string;
  description: string;
  preview_image?: string;
  customisation: Partial<Omit<ChatbotCustomisation, 'id' | 'venue_id' | 'chatbot_type' | 'created_at' | 'updated_at' | 'is_active'>>;
  category: 'modern' | 'professional' | 'playful' | 'minimal' | 'corporate';
  tags: string[];
}

// ==================== CUSTOMISATION CATEGORIES ====================

export interface CustomisationCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: (keyof ChatbotCustomisation)[];
  order: number;
}

// ==================== FORM VALIDATION ====================

export interface ValidationRule {
  field: keyof ChatbotCustomisation;
  min?: number;
  max?: number;
  required?: boolean;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean | string;
}

export interface FieldConstraints {
  [key: string]: {
    min?: number;
    max?: number;
    options?: readonly string[];
    required?: boolean;
  };
}

// ==================== RESPONSIVE CONTROLS ====================

export interface ResponsiveValue<T> {
  desktop: T;
  mobile: T;
}

export interface ResponsiveFieldConfig {
  label: string;
  desktopField: keyof ChatbotCustomisation;
  mobileField: keyof ChatbotCustomisation;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

// ==================== COLOUR SYSTEM ====================

export interface ColourPalette {
  name: string;
  colours: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
}

export const DEFAULT_COLOUR_PALETTES: ColourPalette[] = [
  {
    name: 'Professional Blue',
    colours: {
      primary: '#1E40AF',
      secondary: '#3B82F6',
      accent: '#60A5FA',
      background: '#F8FAFC',
      text: '#1E293B',
      muted: '#64748B',
    },
  },
  {
    name: 'Vibrant Purple',
    colours: {
      primary: '#7C3AED',
      secondary: '#8B5CF6',
      accent: '#A78BFA',
      background: '#FAFAFA',
      text: '#374151',
      muted: '#6B7280',
    },
  },
  {
    name: 'Modern Green',
    colours: {
      primary: '#059669',
      secondary: '#10B981',
      accent: '#34D399',
      background: '#F0FDF4',
      text: '#064E3B',
      muted: '#6B7280',
    },
  },
  {
    name: 'Corporate Grey',
    colours: {
      primary: '#374151',
      secondary: '#4B5563',
      accent: '#6B7280',
      background: '#F9FAFB',
      text: '#111827',
      muted: '#9CA3AF',
    },
  },
] as const;

// ==================== COMPONENT PROPS ====================

export interface ColourPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  presets?: string[];
  showGradients?: boolean;
  showOpacity?: boolean;
  disabled?: boolean;
}

export interface AnimationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  animations: readonly string[];
  showPreview?: boolean;
  disabled?: boolean;
}

export interface ResponsiveSliderProps {
  desktopValue: number;
  mobileValue: number;
  onDesktopChange: (value: number) => void;
  onMobileChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  label?: string;
  disabled?: boolean;
}

export interface FontSelectorProps {
  value: string;
  onChange: (value: string) => void;
  families?: readonly string[];
  showPreview?: boolean;
  disabled?: boolean;
}

export interface PresetCardProps {
  preset: CustomisationPreset;
  isSelected?: boolean;
  onSelect: (preset: CustomisationPreset) => void;
  onPreview?: (preset: CustomisationPreset) => void;
}

// ==================== ADVANCED FEATURES ====================

export interface CustomisationExport {
  version: string;
  timestamp: string;
  chatbotType: 'tour';
  customisation: Partial<ChatbotCustomisation>;
  metadata: {
    exportedBy?: string;
    venueName?: string;
    description?: string;
  };
}

export interface CustomisationImport {
  file: File;
  overwriteExisting: boolean;
  preserveColours: boolean;
  preserveDimensions: boolean;
}

// ==================== LIVE PREVIEW ====================

export interface PreviewMode {
  device: 'desktop' | 'mobile';
  theme: 'light' | 'dark';
  showInteractions: boolean;
  showAnimation: boolean;
}

export interface PreviewMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  showAvatar?: boolean;
}

export interface PreviewControls {
  mode: PreviewMode;
  messages: PreviewMessage[];
  showTypingIndicator: boolean;
  showLoadingState: boolean;
  isMinimised: boolean;
}

// ==================== ERROR HANDLING ====================

export interface ValidationError {
  field: keyof ChatbotCustomisation;
  message: string;
  code: string;
}

export interface CustomisationError {
  type: 'validation' | 'api' | 'preset' | 'export' | 'import';
  message: string;
  field?: keyof ChatbotCustomisation;
  details?: Record<string, any>;
}

// ==================== ANALYTICS ====================

export interface CustomisationAnalytics {
  mostUsedPresets: string[];
  popularColours: string[];
  commonAnimations: string[];
  deviceBreakdown: {
    desktop: number;
    mobile: number;
  };
  featureUsage: Record<keyof ChatbotCustomisation, number>;
}

// ==================== TYPE GUARDS ====================

export const isChatbotCustomisation = (obj: any): obj is ChatbotCustomisation => {
  return obj && typeof obj === 'object' && 'id' in obj && 'venue_id' in obj && 'chatbot_type' in obj;
};

export const isCustomisationPreset = (obj: any): obj is CustomisationPreset => {
  return obj && typeof obj === 'object' && 'name' in obj && 'customisation' in obj;
};

// ==================== UTILITY TYPES ====================

export type CustomisationField = keyof ChatbotCustomisation;
export type EditableCustomisationFields = Omit<ChatbotCustomisation, 'id' | 'venue_id' | 'chatbot_type' | 'created_at' | 'updated_at'>;
export type CustomisationUpdate = Partial<EditableCustomisationFields>;

// ==================== CONSTANTS ====================

export const FIELD_CONSTRAINTS: FieldConstraints = {
  // Typography constraints
  header_text_size: { min: 10, max: 32, required: true },
  message_text_size: { min: 8, max: 24, required: true },
  placeholder_text_size: { min: 8, max: 20, required: true },
  branding_text_size: { min: 8, max: 16, required: true },
  
  // Border radius constraints
  chat_button_border_radius: { min: 0, max: 50, required: true },
  chat_window_border_radius: { min: 0, max: 24, required: true },
  message_border_radius: { min: 0, max: 24, required: true },
  input_border_radius: { min: 0, max: 24, required: true },
  
  // Layout constraints
  chat_window_height: { min: 400, max: 800, required: true },
  chat_window_width: { min: 320, max: 500, required: true },
  header_height: { min: 40, max: 80, required: true },
  input_height: { min: 30, max: 60, required: true },
  message_max_width: { min: 60, max: 95, required: true },
  
  // Animation constraints
  animation_interval: { min: 1, max: 30, required: true },
  idle_animation_interval: { min: 1000, max: 30000, required: true },
  
  // Mobile constraints
  mobile_chat_window_width: { min: 280, max: 400, required: true },
  mobile_chat_window_height: { min: 350, max: 600, required: true },
  mobile_header_text_size: { min: 10, max: 24, required: true },
  mobile_message_text_size: { min: 8, max: 20, required: true },
  mobile_message_max_width: { min: 70, max: 95, required: true },
} as const; 