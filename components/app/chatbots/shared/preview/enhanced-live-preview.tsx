"use client";

import { FC, useMemo, useEffect, useRef, useState } from 'react';
import { ChatbotCustomisation } from '@/lib/types';
import {
  Bot, MessageCircle, Send, User, X, Minimize2, MessageSquare, Headphones,
  HelpCircle, Mail, Phone, Users, Zap, Heart, Star, Settings, Info, Search,
  UserCheck, UserCog, Crown, Shield, Smile, Coffee, ArrowRight, ChevronRight, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MobilePreviewFrame from './mobile-preview-frame';
import { 
  calculateChatButtonShadow, 
  calculateChatWindowShadow, 
  calculateMessageShadow,
  calculateButtonHoverEffect,
  type ShadowIntensity 
} from '@/lib/utils/shadow-calculator';
import {
  getAnimationTiming,
  getAnimationDuration,
  getEntranceAnimationClass,
  getMessageAnimationClass,
  getIdleAnimationClass,
  getTypingIndicatorDelay,
  calculateAnimationInterval,
  generateCustomKeyframes,
  type AnimationSpeed,
  type AnimationType,
  type MessageAnimationType,
  type IdleAnimationType,
  type TypingIndicatorType
} from '@/lib/utils/animation-timing';

const ICON_MAP = {
  MessageCircle, MessageSquare, Bot, Headphones, HelpCircle, Mail, Phone,
  Users, Zap, Heart, Star, Settings, Info, Search, User, UserCheck, UserCog,
  Crown, Shield, Smile, Coffee
};

const SEND_ICON_MAP = {
  Send, ArrowRight, ChevronRight, Play, MessageCircle
};

interface EnhancedLivePreviewProps {
  customisation: Partial<ChatbotCustomisation>;
  welcomeMessage?: string | null;
  mode: 'desktop' | 'mobile';
  className?: string;
  templateOverride?: Partial<ChatbotCustomisation> | null;
  isTemplatePreview?: boolean;
}

const EnhancedLivePreview: FC<EnhancedLivePreviewProps> = ({ 
  customisation, 
  welcomeMessage, 
  mode, 
  className,
  templateOverride = null,
  isTemplatePreview = false
}) => {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [previousLoadingAnimation, setPreviousLoadingAnimation] = useState<string>('');
  const [previousLoadingTextColor, setPreviousLoadingTextColor] = useState<string>('');
  const [previousLoadingBgColor, setPreviousLoadingBgColor] = useState<string>('');
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [showAIThinking, setShowAIThinking] = useState(false);
  const [animationStylesInjected, setAnimationStylesInjected] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingPreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const welcomeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiThinkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use template override if provided, otherwise use regular customisation
  const effectiveCustomisation = useMemo(() => {
    if (templateOverride) {
      return { ...customisation, ...templateOverride };
    }
    return customisation;
  }, [customisation, templateOverride]);

  // Get effective customisation based on mode
  const getEffectiveValue = (desktopKey: keyof ChatbotCustomisation, mobileKey: keyof ChatbotCustomisation, fallback: any) => {
    if (mode === 'mobile') {
      const mobileValue = effectiveCustomisation[mobileKey];
      const desktopValue = effectiveCustomisation[desktopKey];
      const result = mobileValue !== undefined && mobileValue !== null ? mobileValue : (desktopValue ?? fallback);
      return result;
    }
    const result = effectiveCustomisation[desktopKey] ?? fallback;
    return result;
  };

  const custom = {
    // Basic customisation with mobile-aware values
    header_background_color: getEffectiveValue('header_background_color', 'mobile_header_background_color', '#1890FF'),
    header_text_color: getEffectiveValue('header_text_color', 'mobile_header_text_color', '#FFFFFF'),
    window_title: getEffectiveValue('window_title', 'mobile_window_title', 'Chat with us!'),
    ai_message_background: getEffectiveValue('ai_message_background', 'mobile_ai_message_background', '#F1F5F9'),
    ai_message_text_color: getEffectiveValue('ai_message_text_color', 'mobile_ai_message_text_color', '#09090B'),
    user_message_background: getEffectiveValue('user_message_background', 'mobile_user_message_background', '#1890FF'),
    user_message_text_color: getEffectiveValue('user_message_text_color', 'mobile_user_message_text_color', '#FFFFFF'),
    input_background_color: getEffectiveValue('input_background_color', 'mobile_input_background_color', '#FFFFFF'),
    input_text_color: getEffectiveValue('input_text_color', 'mobile_input_text_color', '#111827'), // 🆕 Customisable input text
    placeholder_text_color: getEffectiveValue('placeholder_text_color', 'mobile_placeholder_text_color', '#6B7280'), // 🆕 Customisable placeholder
    input_border_color: '#D1D5DB',
    chat_button_color: getEffectiveValue('chat_button_color', 'mobile_chat_button_color', '#1890FF'),
    chat_button_size: getEffectiveValue('chat_button_size', 'mobile_chat_button_size', 'medium'),
    show_powered_by: getEffectiveValue('show_powered_by', 'mobile_show_powered_by', true),
    brand_name: 'TourBots',
    brand_url: 'https://tourbots.ai',
    custom_logo_url: getEffectiveValue('custom_logo_url', 'mobile_custom_logo_url', null),
    header_icon_size: getEffectiveValue('header_icon_size', 'mobile_header_icon_size', 20),
    header_icon: getEffectiveValue('header_icon', 'mobile_header_icon', 'Bot'),
    custom_header_icon_url: getEffectiveValue('custom_header_icon_url', 'mobile_custom_header_icon_url', null),
    icon_size: getEffectiveValue('icon_size', 'mobile_icon_size', 24),
    chat_button_icon: getEffectiveValue('chat_button_icon', 'mobile_chat_button_icon', 'MessageCircle'),
    chat_button_position: getEffectiveValue('chat_button_position', 'mobile_chat_button_position', 'bottom-right'),

    // Layout & Dimensions with mobile-aware values
    chat_window_width: getEffectiveValue('window_width', 'mobile_chat_window_width', mode === 'mobile' ? 350 : 400),
    chat_window_height: getEffectiveValue('window_height', 'mobile_chat_window_height', mode === 'mobile' ? 500 : 600),
    chat_button_bottom_offset: getEffectiveValue('chat_button_bottom_offset', 'mobile_chat_button_bottom_offset', 20),
    chat_button_side_offset: getEffectiveValue('chat_button_side_offset', 'mobile_chat_button_side_offset', 20),
    header_height: getEffectiveValue('header_height', 'mobile_header_height', 60),
    input_height: getEffectiveValue('input_height', 'mobile_input_height', 50),
    input_placeholder_text: getEffectiveValue('input_placeholder_text', 'mobile_input_placeholder_text', 'Type your message...'),

    // NEW: Chat Window Positioning (separate from button)
    chat_offset_bottom: getEffectiveValue('chat_offset_bottom', 'mobile_chat_offset_bottom', 20),
    chat_offset_side: getEffectiveValue('chat_offset_side', 'mobile_chat_offset_side', 20),

    // Border Radius with mobile-aware values
    chat_button_border_radius: getEffectiveValue('chat_button_border_radius', 'mobile_chat_button_border_radius', 50),
    chat_window_border_radius: getEffectiveValue('chat_window_border_radius', 'mobile_chat_window_border_radius', 12),
    message_border_radius: getEffectiveValue('message_border_radius', 'mobile_message_border_radius', 8),
    input_border_radius: getEffectiveValue('input_border_radius', 'mobile_input_border_radius', 20),

    // NEW: Send Button Border Radius (separate from input)
    send_button_border_radius: getEffectiveValue('send_button_border_radius', 'mobile_send_button_border_radius', 8),

    // Avatars with mobile-aware values
    show_user_avatar: getEffectiveValue('show_user_avatar', 'mobile_show_user_avatar', true),
    show_bot_avatar: getEffectiveValue('show_bot_avatar', 'mobile_show_bot_avatar', true),
    user_avatar_icon: getEffectiveValue('user_avatar_icon', 'mobile_user_avatar_icon', 'User'),
    bot_avatar_icon: getEffectiveValue('bot_avatar_icon', 'mobile_bot_avatar_icon', 'Bot'),
    custom_user_avatar_url: getEffectiveValue('custom_user_avatar_url', 'mobile_custom_user_avatar_url', null),
    custom_bot_avatar_url: getEffectiveValue('custom_bot_avatar_url', 'mobile_custom_bot_avatar_url', null),
    
    // NEW: Avatar Style (circle/square/rounded)
    avatar_style: getEffectiveValue('avatar_style', 'mobile_avatar_style', 'circle'),

    // Send Button with mobile-aware values
    send_button_color: getEffectiveValue('send_button_color', 'mobile_send_button_color', '#1890FF'),
    send_button_hover_color: getEffectiveValue('send_button_hover_color', 'mobile_send_button_hover_color', '#40A9FF'),
    send_button_icon: getEffectiveValue('send_button_icon', 'mobile_send_button_icon', 'Send'),
    send_button_size: getEffectiveValue('send_button_size', 'mobile_send_button_size', 'medium'),
    
    // NEW: Enhanced Send Button Options
    send_button_icon_color: getEffectiveValue('send_button_icon_color', 'mobile_send_button_icon_color', '#FFFFFF'),
    send_button_style: getEffectiveValue('send_button_style', 'mobile_send_button_style', 'icon'),

    // Message Settings with mobile-aware values
    show_timestamps: getEffectiveValue('show_timestamps', 'mobile_show_timestamps', false),
    timestamp_format: getEffectiveValue('timestamp_format', 'mobile_timestamp_format', '12h'),
    message_max_width: getEffectiveValue('message_max_width', 'mobile_message_max_width', mode === 'mobile' ? 85 : 80),

    // NEW: Message Shadows
    message_shadow_enabled: getEffectiveValue('message_shadow_enabled', 'mobile_message_shadow_enabled', false),

    // Shadows with mobile-aware values
    chat_button_shadow: getEffectiveValue('chat_button_shadow', 'mobile_chat_button_shadow', true),
    chat_button_hover_color: getEffectiveValue('chat_button_hover_color', 'mobile_chat_button_hover_color', '#40A9FF'),
    
    // NEW: Shadow Intensity Controls
    chat_button_shadow_intensity: getEffectiveValue('chat_button_shadow_intensity', 'mobile_chat_button_shadow_intensity', 'medium') as ShadowIntensity,
    chat_window_shadow_intensity: getEffectiveValue('chat_window_shadow_intensity', 'mobile_chat_window_shadow_intensity', 'medium') as ShadowIntensity,

    // NEW: Button Hover Effects
    button_hover_effect: getEffectiveValue('button_hover_effect', 'mobile_button_hover_effect', 'scale'),

    // Animations with mobile-aware values
    chat_button_animation: getEffectiveValue('chat_button_animation', 'chat_button_animation', 'none'),
    typing_indicator_enabled: getEffectiveValue('typing_indicator_enabled', 'mobile_typing_indicator_enabled', true),

    // NEW: Complete Animation System
    enable_animations: getEffectiveValue('enable_animations', 'mobile_enable_animations', true),
    animation_speed: getEffectiveValue('animation_speed', 'mobile_animation_speed', 'normal') as AnimationSpeed,
    chat_entrance_animation: getEffectiveValue('chat_entrance_animation', 'mobile_chat_entrance_animation', 'slide-up') as AnimationType,
    message_animation: getEffectiveValue('message_animation', 'mobile_message_animation', 'fade-in') as MessageAnimationType,
    animation_interval: getEffectiveValue('animation_interval', 'mobile_animation_interval', 5),
    idle_animation_enabled: getEffectiveValue('idle_animation_enabled', 'mobile_idle_animation_enabled', false),
    idle_animation_type: getEffectiveValue('idle_animation_type', 'mobile_idle_animation_type', 'pulse') as IdleAnimationType,
    idle_animation_interval: getEffectiveValue('idle_animation_interval', 'mobile_idle_animation_interval', 10000),

    // Loading settings with mobile-aware values
    loading_animation: getEffectiveValue('loading_animation', 'mobile_loading_animation', 'spinner'),
    loading_text_color: getEffectiveValue('loading_text_color', 'mobile_loading_text_color', '#666'),
    loading_background_color: getEffectiveValue('loading_background_color', 'mobile_loading_background_color', 'white'),
    loading_spinner_color: getEffectiveValue('loading_spinner_color', 'mobile_loading_spinner_color', '#1890FF'),
    
    // NEW: Advanced Loading Controls
    loading_spinner_style: getEffectiveValue('loading_spinner_style', 'mobile_loading_spinner_style', 'circle'),
    loading_text_enabled: getEffectiveValue('loading_text_enabled', 'mobile_loading_text_enabled', true),

    // Typing indicator with mobile-aware values
    typing_indicator_animation: getEffectiveValue('typing_indicator_animation', 'typing_indicator_animation', 'dots'),
    
    // NEW: Advanced Typing Indicator Controls
    typing_indicator_style: getEffectiveValue('typing_indicator_style', 'mobile_typing_indicator_style', 'dots') as TypingIndicatorType,
    typing_indicator_color: getEffectiveValue('typing_indicator_color', 'mobile_typing_indicator_color', '#666666'),
    typing_indicator_speed: getEffectiveValue('typing_indicator_speed', 'mobile_typing_indicator_speed', 'normal') as AnimationSpeed,

    // Welcome message settings with mobile-aware values
    welcome_message_delay: getEffectiveValue('welcome_message_delay', 'mobile_welcome_message_delay', 1000),
  };

  // Typography configuration with mobile-aware values
  const typography = {
    font_family: getEffectiveValue('font_family', 'mobile_font_family', 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'),
    font_size_small: 12,
    font_size_medium: 14,
    font_size_large: 16,
    message_font_weight: getEffectiveValue('message_font_weight', 'mobile_message_font_weight', 'normal'),
    header_font_weight: getEffectiveValue('header_font_weight', 'mobile_header_font_weight', 'medium'),
    
    // Specific Font Sizes with mobile-aware values
    header_text_size: getEffectiveValue('header_text_size', 'mobile_header_text_size', mode === 'mobile' ? 14 : 16),
    message_text_size: getEffectiveValue('message_text_size', 'mobile_message_text_size', mode === 'mobile' ? 12 : 14),
    placeholder_text_size: getEffectiveValue('placeholder_text_size', 'mobile_placeholder_text_size', mode === 'mobile' ? 12 : 14),
    branding_text_size: getEffectiveValue('branding_text_size', 'mobile_branding_text_size', mode === 'mobile' ? 10 : 12),
  };

  // Convert font weight strings to numbers for better CSS compatibility
  const getFontWeightValue = (weight: string) => {
    switch (weight) {
      case 'light': return 300;
      case 'normal': return 400;
      case 'medium': return 500;
      case 'bold': return 700;
      default: return 500;
    }
  };
  
  const IconComponent = ICON_MAP[custom.chat_button_icon as keyof typeof ICON_MAP] || MessageCircle;
  const SendIconComponent = SEND_ICON_MAP[custom.send_button_icon as keyof typeof SEND_ICON_MAP] || Send;

  const chatButtonSizePx = useMemo(() => {
    if (mode === 'mobile') {
      switch (custom.chat_button_size) {
        case 'small': return 48;
        case 'large': return 80;
        case 'medium':
        default: return 60;
      }
    }

    switch (custom.chat_button_size) {
      case 'small': return 64;
      case 'large': return 104;
      case 'medium':
      default: return 80;
    }
  }, [custom.chat_button_size, mode]);

  const iconStyle = useMemo(() => ({
    width: `${custom.icon_size}px`,
    height: `${custom.icon_size}px`
  }), [custom.icon_size]);

  // NEW: Button hover styles
  const buttonHoverStyles = useMemo(() => {
    return calculateButtonHoverEffect(custom.button_hover_effect as 'scale' | 'glow' | 'lift' | 'none');
  }, [custom.button_hover_effect]);

  // NEW: Avatar styling
  const getAvatarStyle = (size: number = 32) => {
    const baseStyle = {
      width: size,
      height: size,
      fontSize: size * 0.5,
    };

    switch (custom.avatar_style) {
      case 'square':
        return { ...baseStyle, borderRadius: '0px' };
      case 'rounded':
        return { ...baseStyle, borderRadius: '8px' };
      case 'circle':
      default:
        return { ...baseStyle, borderRadius: '50%' };
    }
  };

  // NEW: Shadow calculations
  const chatButtonShadowStyle = useMemo(() => {
    return calculateChatButtonShadow(custom.chat_button_shadow, custom.chat_button_shadow_intensity);
  }, [custom.chat_button_shadow, custom.chat_button_shadow_intensity]);

  const chatWindowShadowStyle = useMemo(() => {
    return calculateChatWindowShadow(custom.chat_window_shadow_intensity);
  }, [custom.chat_window_shadow_intensity]);

  const messageShadowStyle = useMemo(() => {
    return calculateMessageShadow(custom.message_shadow_enabled);
  }, [custom.message_shadow_enabled]);

  // Convert send button size strings to numbers
  const getSendButtonSizeValue = (size: string) => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      case 'medium':
      default: return 20;
    }
  };

  const getSendButtonContainerSizeValue = (size: string) => {
    switch (size) {
      case 'small': return 30;
      case 'large': return 48;
      case 'medium':
      default: return 36;
    }
  };

  // NEW: Enhanced send button styles
  const sendButtonStyle = useMemo(() => {
    const buttonSize = getSendButtonContainerSizeValue(custom.send_button_size);
    
    const baseStyle = {
      backgroundColor: custom.send_button_color,
      borderRadius: `${custom.send_button_border_radius}px`,
      width: `${buttonSize}px`,
      height: `${buttonSize}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      border: 'none',
      padding: 0,
    };

    if (custom.send_button_style === 'text') {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        color: custom.send_button_color,
        width: 'auto',
        height: 'auto',
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: '500',
      };
    }

    return baseStyle;
  }, [custom.send_button_color, custom.send_button_border_radius, custom.send_button_size, custom.send_button_style]);

  // NEW: Animation classes
  const chatEntranceClass = useMemo(() => {
    if (!custom.enable_animations) return '';
    return getEntranceAnimationClass(custom.chat_entrance_animation, custom.animation_speed);
  }, [custom.enable_animations, custom.chat_entrance_animation, custom.animation_speed]);

  const messageAnimationClass = useMemo(() => {
    if (!custom.enable_animations) return '';
    return getMessageAnimationClass(custom.message_animation, custom.animation_speed);
  }, [custom.enable_animations, custom.message_animation, custom.animation_speed]);

  const idleAnimationClass = useMemo(() => {
    if (!custom.idle_animation_enabled) {
      return '';
    }
    const animationClass = getIdleAnimationClass(custom.idle_animation_type, custom.animation_speed);
    return animationClass;
  }, [custom.idle_animation_enabled, custom.idle_animation_type, custom.animation_speed]);

  const chatWindowStyle = useMemo(() => {
    if (mode === 'mobile') {
      // Use exact iPhone 15 Pro viewport dimensions to match real mobile
      const iPhoneViewportWidth = 393;
      const iPhoneViewportHeight = 852;
      
      // Apply same Math.min logic as embed script:
      // width: Math.min(width, window.innerWidth - 20)
      // height: Math.min(height, window.innerHeight - 80)
      const constrainedWidth = Math.min(custom.chat_window_width, iPhoneViewportWidth - 20);
      const constrainedHeight = Math.min(custom.chat_window_height, iPhoneViewportHeight - 80);
      
      return {
        width: `${constrainedWidth}px`,
        height: `${constrainedHeight}px`,
        borderRadius: `${custom.chat_window_border_radius}px`,
        boxShadow: chatWindowShadowStyle,
        fontFamily: typography.font_family,
      };
    }
    
    return {
      width: `${custom.chat_window_width}px`,
      height: `${custom.chat_window_height}px`,
      borderRadius: `${custom.chat_window_border_radius}px`,
      boxShadow: chatWindowShadowStyle,
      fontFamily: typography.font_family,
    };
  }, [
    mode, 
    custom.chat_window_width, 
    custom.chat_window_height, 
    custom.chat_window_border_radius, 
    chatWindowShadowStyle,
    typography.font_family
  ]);

  // NEW: Loading Animation Preview - triggers when loading animation changes (just like desktop)
  useEffect(() => {
    // Clear any existing loading preview timeout
    if (loadingPreviewTimeoutRef.current) {
      clearTimeout(loadingPreviewTimeoutRef.current);
    }

    // Skip if loading animation is "none" 
    if (custom.loading_animation === 'none') {
      setPreviousLoadingAnimation(custom.loading_animation);
      return;
    }

    // Only trigger preview if we have a previous value and it's different (not initial load)
    if (previousLoadingAnimation !== '' && previousLoadingAnimation !== custom.loading_animation) {
      // Start loading preview
      setIsLoadingPreview(true);
      
      // End loading preview after 3 seconds
      loadingPreviewTimeoutRef.current = setTimeout(() => {
        setIsLoadingPreview(false);
      }, 3000);
    }

    // Update previous value
    setPreviousLoadingAnimation(custom.loading_animation);

    return () => {
      if (loadingPreviewTimeoutRef.current) {
        clearTimeout(loadingPreviewTimeoutRef.current);
      }
    };
  }, [custom.loading_animation]);

  // NEW: Inject animation styles
  useEffect(() => {
    if (!animationStylesInjected && custom.enable_animations) {
      const styleElement = document.createElement('style');
      styleElement.textContent = generateCustomKeyframes();
      document.head.appendChild(styleElement);
      setAnimationStylesInjected(true);
    }
  }, [custom.enable_animations, animationStylesInjected]);

  // NEW: Enhanced welcome message timing with proper flow
  useEffect(() => {
    // Clear all timeouts
    if (welcomeTimeoutRef.current) {
      clearTimeout(welcomeTimeoutRef.current);
    }
    if (userMessageTimeoutRef.current) {
      clearTimeout(userMessageTimeoutRef.current);
    }
    if (aiThinkingTimeoutRef.current) {
      clearTimeout(aiThinkingTimeoutRef.current);
    }

    if (isChatOpen) {
      // Reset all message states when chat opens
      setShowWelcomeMessage(false);
      setShowUserMessage(false);
      setShowAIThinking(false);

      // Step 1: Show welcome message after defined delay (or immediately if delay is 0)
      if (custom.welcome_message_delay === 0) {
        // Show immediately for 0 delay
        setShowWelcomeMessage(true);
        
        // Step 2: Show user message 1 second after welcome message
        userMessageTimeoutRef.current = setTimeout(() => {
          setShowUserMessage(true);
          
          // Step 3: Show AI thinking 1 second after user message
          aiThinkingTimeoutRef.current = setTimeout(() => {
            setShowAIThinking(true);
          }, 1000);
        }, 1000);
      } else {
        // Use the defined delay
        welcomeTimeoutRef.current = setTimeout(() => {
          setShowWelcomeMessage(true);
          
          // Step 2: Show user message 1 second after welcome message
          userMessageTimeoutRef.current = setTimeout(() => {
            setShowUserMessage(true);
            
            // Step 3: Show AI thinking 1 second after user message
            aiThinkingTimeoutRef.current = setTimeout(() => {
              setShowAIThinking(true);
            }, 1000);
          }, 1000);
        }, custom.welcome_message_delay);
      }
    }

    return () => {
      if (welcomeTimeoutRef.current) {
        clearTimeout(welcomeTimeoutRef.current);
      }
      if (userMessageTimeoutRef.current) {
        clearTimeout(userMessageTimeoutRef.current);
      }
      if (aiThinkingTimeoutRef.current) {
        clearTimeout(aiThinkingTimeoutRef.current);
      }
    };
  }, [isChatOpen, custom.welcome_message_delay]);

  // NEW: Idle animation timing  
  useEffect(() => {
    if (idleAnimationTimeoutRef.current) {
      clearInterval(idleAnimationTimeoutRef.current);
    }

    if (custom.idle_animation_enabled && custom.idle_animation_interval > 0) {
      const interval = calculateAnimationInterval(custom.idle_animation_interval, custom.animation_speed);
      
      // For finite animations, just add the class and let it play
      const triggerAnimation = () => {
        const button = document.querySelector('[data-chat-button]') as HTMLElement;
        if (button) {
          // Remove class first to ensure it can be re-applied
          button.classList.remove(idleAnimationClass);
          // Force reflow
          void button.offsetHeight;
          // Add the animation class - it will play once and stop
          button.classList.add(idleAnimationClass);
        }
      };
      
      // Trigger immediately, then set up interval
      triggerAnimation();
      idleAnimationTimeoutRef.current = setInterval(triggerAnimation, interval);
    }

    return () => {
      if (idleAnimationTimeoutRef.current) {
        clearInterval(idleAnimationTimeoutRef.current);
      }
    };
  }, [custom.idle_animation_enabled, custom.idle_animation_interval, custom.animation_speed, idleAnimationClass]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    // Reset all message states when toggling chat
    setShowWelcomeMessage(false);
    setShowUserMessage(false);
    setShowAIThinking(false);
  };

  const renderAvatar = (isUser: boolean) => {
    const show = isUser ? custom.show_user_avatar : custom.show_bot_avatar;
    
    // Get the correct custom URL and icon based on mode - NO fallback to desktop custom URLs
    let customUrl = null;
    let iconName = '';
    
    if (mode === 'mobile') {
      // In mobile mode, use mobile custom URL if it exists, otherwise use mobile icon
      customUrl = isUser 
        ? effectiveCustomisation.mobile_custom_user_avatar_url 
        : effectiveCustomisation.mobile_custom_bot_avatar_url;
      iconName = isUser 
        ? (effectiveCustomisation.mobile_user_avatar_icon || 'User')
        : (effectiveCustomisation.mobile_bot_avatar_icon || 'Bot');
    } else {
      // In desktop mode, use desktop custom URL if it exists, otherwise use desktop icon
      customUrl = isUser 
        ? effectiveCustomisation.custom_user_avatar_url 
        : effectiveCustomisation.custom_bot_avatar_url;
      iconName = isUser 
        ? (effectiveCustomisation.user_avatar_icon || 'User')
        : (effectiveCustomisation.bot_avatar_icon || 'Bot');
    }
    
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || (isUser ? User : Bot);
    
    const bgColor = isUser ? custom.user_message_background : custom.ai_message_background;
    const textColor = isUser ? custom.user_message_text_color : custom.ai_message_text_color;
    
    const avatarSize = mode === 'mobile' ? 24 : 32;
    const iconSize = mode === 'mobile' ? 14 : 16;
    
    if (!show) return null;
    
    // Use getAvatarStyle to apply the correct border radius based on avatar_style
    const avatarContainerStyle = {
      ...getAvatarStyle(avatarSize),
      backgroundColor: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    };
    
    const avatarImageStyle = {
      width: `${avatarSize}px`,
      height: `${avatarSize}px`,
      objectFit: 'cover' as const,
      borderRadius: avatarContainerStyle.borderRadius, // Match container border radius
    };
    
    return (
      <div style={avatarContainerStyle}>
        {customUrl ? (
          <img 
            src={customUrl} 
            alt="Avatar" 
            style={avatarImageStyle}
          />
        ) : (
          <IconComponent size={iconSize} style={{ color: textColor }} />
        )}
      </div>
    );
  };

  const renderTimestamp = (isUser = false) => {
    if (!custom.show_timestamps) return null;
    
    const now = new Date();
    const timeString = custom.timestamp_format === '24h' 
      ? now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    return (
      <div className={cn(
        "text-xs opacity-70 mt-1",
        isUser ? "text-right" : "text-left"
      )}>
        {timeString}
      </div>
    );
  };

  const renderLoadingAnimation = () => {
    if (!isLoadingPreview) return null;
    
    if (custom.loading_animation === 'none') {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-neutral-800 z-50 rounded-lg">
          <div className="text-sm" style={{ color: custom.loading_text_color }}>
            {custom.loading_text_enabled ? 'Loading...' : ''}
          </div>
        </div>
      );
    }
    
    return (
      <div 
        className="absolute inset-0 flex items-center justify-center z-50 rounded-lg"
        style={{ 
          backgroundColor: custom.loading_background_color,
          borderRadius: `${custom.chat_window_border_radius}px`
        }}
      >
        <div className="flex flex-col items-center space-y-3">
          {custom.loading_animation === 'spinner' && (
            <div className="animate-spin rounded-full border-2 border-t-transparent w-8 h-8" 
                 style={{ 
                   borderColor: custom.loading_spinner_color,
                   borderTopColor: 'transparent' 
                 }}>
            </div>
          )}
          
          {custom.loading_animation === 'dots' && (
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ 
                    backgroundColor: custom.loading_spinner_color,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          )}
          
          {custom.loading_animation === 'bars' && (
            <div className="flex space-x-1 items-end">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-current animate-bounce"
                  style={{ 
                    backgroundColor: custom.loading_spinner_color,
                    height: `${12 + (i % 2) * 4}px`,
                    animationDelay: `${i * 0.15}s`
                  }}
                />
              ))}
            </div>
          )}
          
          {custom.loading_animation === 'pulse' && (
            <div className="w-8 h-8 rounded-full animate-pulse"
                 style={{ backgroundColor: custom.loading_spinner_color }}>
            </div>
          )}
          
          {custom.loading_text_enabled && (
            <div className="text-sm" style={{ color: custom.loading_text_color }}>
              Loading...
            </div>
          )}
        </div>
      </div>
    );
  };

  // NEW: Enhanced typing indicator - matches actual streaming implementation
  const renderTypingIndicator = () => {
    if (!custom.typing_indicator_enabled) return null;
    
    const typingStyle = custom.typing_indicator_style || 'dots';
    const typingColor = custom.typing_indicator_color || custom.header_background_color || '#3B82F6';
    const typingSpeed = custom.typing_indicator_speed || 'normal';
    const chatbotName = custom.window_title || 'AI Assistant';
    
    // Get animation duration based on speed
    const getAnimationDuration = () => {
      switch (typingSpeed) {
        case 'slow': return '2.0s';
        case 'fast': return '0.6s';
        case 'normal':
        default: return '1.0s';
      }
    };
    
    const animationDuration = getAnimationDuration();
    
    if (typingStyle === 'none') {
      return (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {chatbotName} is typing...
        </span>
      );
    }
    
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          {typingStyle === 'dots' && (
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ 
                    backgroundColor: typingColor,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: animationDuration
                  }}
                />
              ))}
            </div>
          )}
          
          {typingStyle === 'wave' && (
            <div className="flex space-x-1 items-end">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-current animate-bounce"
                  style={{ 
                    backgroundColor: typingColor,
                    height: `${8 + (i % 2) * 4}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: animationDuration
                  }}
                />
              ))}
            </div>
          )}
          
          {typingStyle === 'pulse' && (
            <div 
              className="w-8 h-4 rounded-full animate-pulse"
              style={{ 
                backgroundColor: typingColor,
                animationDuration: animationDuration
              }}
            />
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {chatbotName} is typing...
        </span>
      </div>
    );
  };

  // Render header icon with custom image support
  const renderHeaderIcon = () => {
    const iconSize = custom.header_icon_size;
    const iconColor = custom.header_text_color;
    const headerIcon = custom.header_icon || 'Bot';
    const customHeaderIconUrl = custom.custom_header_icon_url;
    
    const iconStyle = { 
      width: `${iconSize}px`, 
      height: `${iconSize}px`,
      color: iconColor
    };
    
    if (customHeaderIconUrl) {
      return (
        <>
          <img 
            src={customHeaderIconUrl} 
            alt="Custom header icon" 
            className="object-contain"
            style={{
              width: `${iconSize}px`,
              height: `${iconSize}px`
            }}
            onError={(e) => {
              // Fallback to default icon if custom image fails to load
              e.currentTarget.style.display = 'none';
              const fallbackIcon = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallbackIcon) {
                fallbackIcon.style.display = 'block';
              }
            }}
          />
          {(() => {
            const IconComponent = ICON_MAP[headerIcon as keyof typeof ICON_MAP] || Bot;
            return (
              <IconComponent 
                style={{ 
                  ...iconStyle,
                  display: 'none'
                }} 
              />
            );
          })()}
        </>
      );
    } else {
      const IconComponent = ICON_MAP[headerIcon as keyof typeof ICON_MAP] || Bot;
      return <IconComponent style={iconStyle} />;
    }
  };

  const renderChatIcon = () => {
    // Determine which custom logo to use based on mode
    const customLogoUrl = mode === 'mobile' 
      ? effectiveCustomisation.mobile_custom_logo_url || null
      : effectiveCustomisation.custom_logo_url || null;

    // Dynamically get the correct icon based on current mode settings
    const IconComponent = ICON_MAP[custom.chat_button_icon as keyof typeof ICON_MAP] || MessageCircle;

    return (
      <div
        data-chat-button
        className={cn(
          'flex items-center justify-center cursor-pointer transition-all duration-300 select-none',
          idleAnimationClass
        )}
        style={{
          width: `${chatButtonSizePx}px`,
          height: `${chatButtonSizePx}px`,
          backgroundColor: custom.chat_button_color,
          boxShadow: chatButtonShadowStyle,
          borderRadius: `${custom.chat_button_border_radius}px`,
        }}
        onClick={toggleChat}
        onMouseEnter={(e) => {
          if (custom.chat_button_hover_color) {
            e.currentTarget.style.backgroundColor = custom.chat_button_hover_color;
          }
          // Apply hover effect
          Object.assign(e.currentTarget.style, buttonHoverStyles);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = custom.chat_button_color;
          // Reset hover effect
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = chatButtonShadowStyle;
        }}
      >
        {customLogoUrl ? (
          <img 
            src={customLogoUrl} 
            alt="Chat" 
            style={{
              width: `${custom.icon_size}px`,
              height: `${custom.icon_size}px`,
              objectFit: 'contain'
            }}
          />
        ) : (
          <IconComponent style={iconStyle} color="white" />
        )}
      </div>
    );
  };

  const renderChatPreview = () => (
    <div className="relative">
      {/* Chat Window */}
      <div 
        className={cn(
          'bg-white dark:bg-neutral-800 shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300',
          isChatOpen ? 'opacity-100' : 'opacity-30',
          chatEntranceClass
        )}
        style={chatWindowStyle}
      >
        {renderLoadingAnimation()}
        
        {/* Header */}
        <div 
          className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ 
            backgroundColor: custom.header_background_color,
            height: `${custom.header_height}px`,
            borderTopLeftRadius: `${custom.chat_window_border_radius}px !important`,
            borderTopRightRadius: `${custom.chat_window_border_radius}px !important`
          }}
        >
          <h3 
            className="font-medium m-0 flex items-center gap-2"
            style={{ 
              color: custom.header_text_color,
              fontSize: typography.header_text_size,
              fontWeight: getFontWeightValue(typography.header_font_weight),
              fontFamily: typography.font_family
            }}
          >
            {renderHeaderIcon()}
            {custom.window_title}
          </h3>
          <div className="flex items-center gap-2">
            <button 
              className="transition-colors opacity-80 hover:opacity-100"
              style={{ color: custom.header_text_color }}
            >
              <Minimize2 size={16} />
            </button>
            <button 
              className="transition-colors opacity-80 hover:opacity-100" 
              style={{ color: custom.header_text_color }}
              onClick={toggleChat}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-50/50 dark:bg-neutral-900/50">
          {/* AI Welcome Message - Left Aligned */}
          {showWelcomeMessage && (
            <div className="flex items-start gap-2.5">
              {renderAvatar(false)}
              <div className="flex flex-col" style={{ maxWidth: `${custom.message_max_width}%` }}>
                <div 
                  className={cn(
                    "p-3 rounded-tl-none break-words",
                    messageAnimationClass
                  )}
                  style={{ 
                    backgroundColor: custom.ai_message_background, 
                    color: custom.ai_message_text_color,
                    borderRadius: `${custom.message_border_radius}px`,
                    fontSize: typography.message_text_size,
                    fontWeight: getFontWeightValue(typography.message_font_weight),
                    fontFamily: typography.font_family,
                    boxShadow: messageShadowStyle
                  }}
                >
                  <p className="m-0">{welcomeMessage || 'Hello! How can I help you today?'}</p>
                </div>
                {renderTimestamp(false)}
              </div>
            </div>
          )}
          
          {/* User Message - Right Aligned */}
          {showUserMessage && (
            <div className="flex items-start gap-2.5 justify-end">
              <div className="flex flex-col items-end" style={{ maxWidth: `${custom.message_max_width}%` }}>
                <div 
                  className={cn(
                    "p-3 rounded-tr-none break-words",
                    messageAnimationClass
                  )}
                  style={{ 
                    backgroundColor: custom.user_message_background, 
                    color: custom.user_message_text_color,
                    borderRadius: `${custom.message_border_radius}px`,
                    fontSize: typography.message_text_size,
                    fontWeight: getFontWeightValue(typography.message_font_weight),
                    fontFamily: typography.font_family,
                    boxShadow: messageShadowStyle
                  }}
                >
                  <p className="m-0">What are your opening hours?</p>
                </div>
                {renderTimestamp(true)}
              </div>
              {renderAvatar(true)}
            </div>
          )}

          {/* AI Thinking Indicator - Left Aligned */}
          {showAIThinking && custom.typing_indicator_enabled && (
            <div className="flex items-start gap-2.5">
              {renderAvatar(false)}
              <div 
                className="p-3 rounded-tl-none"
                style={{ 
                  backgroundColor: custom.ai_message_background,
                  borderRadius: `${custom.message_border_radius}px`
                }}
              >
                {renderTypingIndicator()}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div 
          className="p-3 border-t flex-shrink-0"
          style={{ 
            backgroundColor: custom.input_background_color,
            borderBottomLeftRadius: `${custom.chat_window_border_radius}px !important`,
            borderBottomRightRadius: `${custom.chat_window_border_radius}px !important`,
            margin: 0
          }}
        >
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder={custom.input_placeholder_text || "Type your message..."} 
              disabled 
              className="flex-grow px-3 py-2 text-sm border focus:outline-none focus:ring-1 transition-all gt-preview-input"
              style={{ 
                backgroundColor: custom.input_background_color, 
                color: custom.input_text_color,
                borderColor: custom.input_border_color,
                borderRadius: `${custom.input_border_radius}px`,
                fontSize: typography.placeholder_text_size,
                fontFamily: typography.font_family,
                height: `${custom.input_height}px`,
                minHeight: `${custom.input_height}px`,
                boxSizing: 'border-box',
                // @ts-ignore - CSS custom property for placeholder
                '--placeholder-color': custom.placeholder_text_color
              }} 
            />
            <button 
              className="text-white transition-all duration-200 hover:shadow-md disabled:opacity-50"
              style={sendButtonStyle}
              onMouseEnter={(e) => {
                if (custom.send_button_hover_color) {
                  e.currentTarget.style.backgroundColor = custom.send_button_hover_color;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = custom.send_button_color;
              }}
            >
              {custom.send_button_style === 'text' ? (
                <span style={{ color: custom.send_button_icon_color }}>Send</span>
              ) : (
                <SendIconComponent 
                  size={getSendButtonSizeValue(custom.send_button_size)} 
                  color={custom.send_button_icon_color}
                  style={{ color: custom.send_button_icon_color }}
                />
              )}
            </button>
          </div>
          {custom.show_powered_by && (
            <div 
              className="text-center mt-2 pb-0"
              style={{ 
                fontSize: typography.branding_text_size,
                color: '#9CA3AF',
                fontFamily: typography.font_family
              }}
            >
              <a 
                href={custom.brand_url || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:underline transition-all duration-200"
                style={{ 
                  color: '#9CA3AF',
                  fontSize: typography.branding_text_size,
                  fontFamily: typography.font_family,
                  textDecoration: 'none'
                }}
              >
                Powered by {custom.brand_name}
              </a>
            </div>
          )}
        </div>
      </div>
      
      <p 
        className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center"
        style={{
          opacity: isChatOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      >
        Chat Window
      </p>
    </div>
  );

  if (mode === 'mobile') {
    return (
      <div className={cn('flex justify-center', className)}>
        <MobilePreviewFrame>
          <div className="relative w-full h-full">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900" />
            
            {/* Mock mobile app content */}
            <div className="absolute inset-0 p-4 pt-8">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 dark:bg-neutral-600 rounded animate-pulse" />
                  <div className="h-4 bg-gray-100 dark:bg-neutral-600 rounded w-3/4 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-gray-100 dark:bg-neutral-700 rounded-lg animate-pulse" />
                  <div className="h-16 bg-gray-100 dark:bg-neutral-700 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Show chat window when open */}
            {isChatOpen && (
              <div 
                className="absolute pointer-events-auto z-10"
                style={{
                  bottom: `${custom.chat_offset_bottom}px`,
                  [custom.chat_button_position === 'bottom-left' ? 'left' : 'right']: `${custom.chat_offset_side}px`
                }}
              >
                {renderChatPreview()}
              </div>
            )}
            
            {/* Show chat button when closed */}
            {!isChatOpen && (
              <div 
                className="absolute pointer-events-auto z-10"
                style={{
                  bottom: `${custom.chat_button_bottom_offset}px`,
                  [custom.chat_button_position === 'bottom-left' ? 'left' : 'right']: `${custom.chat_button_side_offset}px`
                }}
              >
                <div className="flex flex-col items-center space-y-2">
                  {renderChatIcon()}
                  <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap text-center">Chat Button</p>
                </div>
              </div>
            )}
          </div>
        </MobilePreviewFrame>
      </div>
    );
  }

  // Desktop preview
  return (
    <div className={cn('flex h-[700px] w-full justify-center overflow-hidden md:block', className)}>
      {/* 🆕 Custom placeholder colour support */}
      <style jsx>{`
        :global(.gt-preview-input::placeholder) {
          color: var(--placeholder-color, #6B7280);
          opacity: 1;
        }
        
        :global(.gt-preview-input:-ms-input-placeholder) {
          color: var(--placeholder-color, #6B7280);
        }
        
        :global(.gt-preview-input::-ms-input-placeholder) {
          color: var(--placeholder-color, #6B7280);
        }
      `}</style>
      
      {/* Mock Website Background */}
      <div className="relative h-full w-full max-w-[350px] overflow-hidden rounded-lg bg-white shadow-lg dark:border dark:border-input dark:bg-background md:max-w-none">
        {/* Mock Browser Chrome */}
        <div className="h-8 bg-gray-200 dark:bg-neutral-700 border-b dark:border-neutral-600 flex items-center px-4 gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-400 rounded-full" />
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <div className="w-3 h-3 bg-green-400 rounded-full" />
          </div>
          <div className="flex-1 mx-4">
            <div className="h-4 bg-gray-300 dark:bg-neutral-600 rounded-full max-w-xs" />
          </div>
        </div>
        
        {/* Mock Website Header */}
        <div className="h-16 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-neutral-800 dark:to-neutral-700 border-b dark:border-input flex items-center px-6">
          <div className="w-8 h-8 bg-blue-500 rounded-full mr-3"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 dark:bg-neutral-600 rounded w-32 mb-1"></div>
            <div className="h-2 bg-gray-100 dark:bg-neutral-700 rounded w-24"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-6 bg-gray-200 dark:bg-neutral-600 rounded w-16"></div>
            <div className="h-6 bg-blue-500 rounded w-20"></div>
          </div>
        </div>
        
        {/* Mock Website Content */}
        <div className="p-6 space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-neutral-600 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 dark:bg-neutral-700 rounded"></div>
            <div className="h-3 bg-gray-100 dark:bg-neutral-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-100 dark:bg-neutral-700 rounded w-4/5"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="h-20 bg-gray-50 dark:bg-neutral-800 rounded border dark:border-neutral-600"></div>
            <div className="h-20 bg-gray-50 dark:bg-neutral-800 rounded border dark:border-neutral-600"></div>
          </div>
        </div>

        {/* Chat Preview positioned on mock website */}
        {isChatOpen && (
          <div 
            className="absolute pointer-events-auto z-10"
            style={{
              bottom: `${custom.chat_offset_bottom}px`,
              [custom.chat_button_position === 'bottom-left' ? 'left' : 'right']: `${custom.chat_offset_side}px`
            }}
          >
            {renderChatPreview()}
          </div>
        )}
        
        {/* Chat Button positioned on mock website when closed */}
        {!isChatOpen && (
          <div 
            className="absolute text-center space-y-2 pointer-events-auto z-10"
            style={{
              bottom: `${custom.chat_button_bottom_offset}px`,
              [custom.chat_button_position === 'bottom-left' ? 'left' : 'right']: `${custom.chat_button_side_offset}px`
            }}
          >
            {renderChatIcon()}
            <div className="w-full flex justify-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Chat Button</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedLivePreview; 