import { ChatbotCustomisation } from './types';

export interface TourEmbedOptions {
  width?: string;
  height?: string;
  showTitle?: boolean;
  showChat?: boolean;
  tourId?: string;
}

export interface ChatbotEmbedOptions {
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  title?: string;
  chatbotType?: 'tour';
  tourId?: string;
  customisation?: ChatbotCustomisation;
  useDirect?: boolean;
}

export interface AgencyPortalEmbedOptions {
  width?: string;
  height?: string;
  title?: string;
  showHeader?: boolean;
}

// Device detection utility
export interface DeviceDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
}

// Complete customisation mapping for embed
export interface EmbedCustomisation {
  // Chat Button
  buttonColor: string;
  buttonHoverColor: string;
  buttonSize: string;
  buttonPosition: string;
  buttonIcon: string;
  buttonShape: string;
  buttonShadow: string;
  iconSize: number;
  
  // Chat Window
  windowWidth: number;
  windowHeight: number;
  windowBorderRadius: number;
  windowShadow: string;
  windowPosition: string;
  
  // Header
  headerBackgroundColor: string;
  headerTextColor: string;
  headerHeight: number;
  headerTextSize: number;
  headerFontWeight: string;
  headerIconSize: number;
  windowTitle: string;
  
  // Messages
  aiMessageBackground: string;
  aiMessageTextColor: string;
  userMessageBackground: string;
  userMessageTextColor: string;
  messageBorderRadius: number;
  messageSpacing: number;
  
  // Typography
  fontFamily: string;
  messageTextSize: number;
  messageFontWeight: string;
  
  // Input Area
  inputBackgroundColor: string;
  inputTextColor: string;
  inputBorderRadius: number;
  inputHeight: number;
  inputPlaceholder: string;
  
  // Send Button
  sendButtonColor: string;
  sendButtonHoverColor: string;
  sendButtonIconColor: string;
  sendButtonSize: string;
  sendButtonIcon: string;
  sendButtonBorderRadius: number;
  
  // Avatars
  showBotAvatar: boolean;
  showUserAvatar: boolean;
  botAvatarIcon: string;
  userAvatarIcon: string;
  customBotAvatarUrl?: string;
  customUserAvatarUrl?: string;
  avatarSize: number;
  
  // Branding
  showPoweredBy: boolean;
  customLogoUrl?: string;
  showBranding: boolean;
  
  // Animations
  chatButtonAnimation: string;
  chatEntranceAnimation: string;
  messageAnimation: string;
  idleAnimation: string;
  idleAnimationInterval: number;
  
  // Timestamps
  showTimestamps: boolean;
  timestampFormat: string;
  
  // Welcome Message
  welcomeMessageDelay: number;
  
  // Advanced Features
  showTypingIndicator: boolean;
  typingIndicatorColor: string;
  enableSounds: boolean;
  enableNotifications: boolean;
  
  // Mobile-specific overrides
  mobileOverrides?: Partial<EmbedCustomisation>;
}

/**
 * Maps ChatbotCustomisation fields to EmbedCustomisation format
 */
export function mapCustomisationToEmbed(
  customisation: ChatbotCustomisation,
  deviceType: 'desktop' | 'mobile'
): EmbedCustomisation {
  const isDesktop = deviceType === 'desktop';
  const prefix = isDesktop ? '' : 'mobile_';
  
  return {
    // Chat Button
    buttonColor: customisation[`${prefix}chat_button_color`] || customisation.chat_button_color || '#1890FF',
    buttonHoverColor: customisation[`${prefix}chat_button_hover_color`] || customisation.chat_button_hover_color || '#0F7AFF',
    buttonSize: customisation[`${prefix}chat_button_size`] || customisation.chat_button_size || 'medium',
    buttonPosition: customisation[`${prefix}chat_button_position`] || customisation.chat_button_position || 'bottom-right',
    buttonIcon: customisation[`${prefix}chat_button_icon`] || customisation.chat_button_icon || 'MessageCircle',
    buttonShape: 'circle',
    buttonShadow: customisation[`${prefix}chat_button_shadow_intensity`] || customisation.chat_button_shadow_intensity || 'medium',
    iconSize: customisation[`${prefix}icon_size`] || customisation.icon_size || 24,
    
    // Chat Window
    windowWidth: isDesktop ? (customisation.window_width || 400) : (customisation.mobile_chat_window_width || 350),
    windowHeight: isDesktop ? (customisation.window_height || 600) : (customisation.mobile_chat_window_height || 500),
    windowBorderRadius: customisation[`${prefix}chat_window_border_radius`] || customisation.chat_window_border_radius || 12,
    windowShadow: customisation[`${prefix}chat_window_shadow_intensity`] || customisation.chat_window_shadow_intensity || 'medium',
    windowPosition: 'bottom-right',
    
    // Header
    headerBackgroundColor: customisation[`${prefix}header_background_color`] || customisation.header_background_color || '#1890FF',
    headerTextColor: customisation[`${prefix}header_text_color`] || customisation.header_text_color || '#FFFFFF',
    headerHeight: customisation[`${prefix}header_height`] || customisation.header_height || 60,
    headerTextSize: customisation[`${prefix}header_text_size`] || customisation.header_text_size || 16,
    headerFontWeight: customisation[`${prefix}header_font_weight`] || customisation.header_font_weight || 'bold',
    headerIconSize: customisation[`${prefix}header_icon_size`] || customisation.header_icon_size || 20,
    windowTitle: customisation[`${prefix}window_title`] || customisation.window_title || 'Chat with us',
    
    // Messages  
    aiMessageBackground: customisation[`${prefix}ai_message_background`] || customisation.ai_message_background || '#F5F5F5',
    aiMessageTextColor: customisation[`${prefix}ai_message_text_color`] || customisation.ai_message_text_color || '#000000',
    userMessageBackground: customisation[`${prefix}user_message_background`] || customisation.user_message_background || '#1890FF',
    userMessageTextColor: customisation[`${prefix}user_message_text_color`] || customisation.user_message_text_color || '#FFFFFF',
    messageBorderRadius: customisation[`${prefix}message_border_radius`] || customisation.message_border_radius || 8,
    messageSpacing: 12,
    
    // Typography
    fontFamily: customisation[`${prefix}font_family`] || customisation.font_family || 'Inter',
    messageTextSize: customisation[`${prefix}message_text_size`] || customisation.message_text_size || 14,
    messageFontWeight: customisation[`${prefix}message_font_weight`] || customisation.message_font_weight || 'normal',
    
    // Input Area
    inputBackgroundColor: customisation[`${prefix}input_background_color`] || customisation.input_background_color || '#FFFFFF',
    inputTextColor: '#000000',
    inputBorderRadius: customisation[`${prefix}input_border_radius`] || customisation.input_border_radius || 8,
    inputHeight: customisation[`${prefix}input_height`] || customisation.input_height || 44,
    inputPlaceholder: customisation[`${prefix}input_placeholder_text`] || customisation.input_placeholder_text || 'Type your message...',
    
    // Send Button
    sendButtonColor: customisation[`${prefix}send_button_color`] || customisation.send_button_color || '#1890FF',
    sendButtonHoverColor: customisation[`${prefix}send_button_hover_color`] || customisation.send_button_hover_color || '#0F7AFF',
    sendButtonIconColor: customisation[`${prefix}send_button_icon_color`] || customisation.send_button_icon_color || '#FFFFFF',
    sendButtonSize: customisation[`${prefix}send_button_size`] || customisation.send_button_size || 'medium',
    sendButtonIcon: customisation[`${prefix}send_button_icon`] || customisation.send_button_icon || 'Send',
    sendButtonBorderRadius: customisation[`${prefix}send_button_border_radius`] || customisation.send_button_border_radius || 8,
    
    // Avatars
    showBotAvatar: customisation[`${prefix}show_bot_avatar`] ?? customisation.show_bot_avatar ?? true,
    showUserAvatar: customisation[`${prefix}show_user_avatar`] ?? customisation.show_user_avatar ?? true,
    botAvatarIcon: customisation[`${prefix}bot_avatar_icon`] || customisation.bot_avatar_icon || 'Bot',
    userAvatarIcon: customisation[`${prefix}user_avatar_icon`] || customisation.user_avatar_icon || 'User',
    customBotAvatarUrl: customisation[`${prefix}custom_bot_avatar_url`] || customisation.custom_bot_avatar_url || undefined,
    customUserAvatarUrl: customisation[`${prefix}custom_user_avatar_url`] || customisation.custom_user_avatar_url || undefined,
    avatarSize: 32,
    
    // Branding
    showPoweredBy: customisation[`${prefix}show_powered_by`] ?? customisation.show_powered_by ?? true,
    customLogoUrl: customisation[`${prefix}custom_logo_url`] || customisation.custom_logo_url || undefined,
    showBranding: true,
    
    // Animations
    chatButtonAnimation: customisation[`${prefix}idle_animation_type`] || customisation.idle_animation_type || 'none',
    chatEntranceAnimation: customisation[`${prefix}chat_entrance_animation`] || customisation.chat_entrance_animation || 'slide-up',
    messageAnimation: customisation[`${prefix}message_animation`] || customisation.message_animation || 'fade-in',
    idleAnimation: customisation[`${prefix}idle_animation_type`] || customisation.idle_animation_type || 'none',
    idleAnimationInterval: customisation[`${prefix}idle_animation_interval`] || customisation.idle_animation_interval || 5000,
    
    // Timestamps
    showTimestamps: customisation[`${prefix}show_timestamps`] ?? customisation.show_timestamps ?? false,
    timestampFormat: customisation[`${prefix}timestamp_format`] || customisation.timestamp_format || '24h',
    
    // Welcome Message
    welcomeMessageDelay: customisation[`${prefix}welcome_message_delay`] || customisation.welcome_message_delay || 1000,
    
    // Advanced Features
    showTypingIndicator: (customisation[`${prefix}typing_indicator_style`] || customisation.typing_indicator_style) !== 'none',
    typingIndicatorColor: customisation[`${prefix}typing_indicator_color`] || customisation.typing_indicator_color || '#1890FF',
    enableSounds: false,
    enableNotifications: false,
  };
}

/**
 * Device detection from user agent
 */
export function detectDevice(userAgent?: string): DeviceDetection {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const isDesktop = !isMobile && !isTablet;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    userAgent: ua
  };
}

export function generateTourEmbed(venueId: string, options: TourEmbedOptions = {}) {
  const embedId = `tour-${venueId}-${Date.now()}`;
  // Detect current domain for development/production
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://tourbots.ai'; // Fallback for server-side
  const queryParams = new URLSearchParams({
    id: embedId,
    ...(options.tourId ? { tourId: options.tourId } : {}),
    ...(options.showTitle !== undefined ? { showTitle: String(options.showTitle) } : {}),
    ...(options.showChat !== undefined ? { showChat: String(options.showChat) } : {}),
  });
  
  return {
    iframe: `<iframe src="${baseUrl}/embed/tour/${venueId}?${queryParams.toString()}" width="${options.width || '100%'}" height="${options.height || '600px'}" frameborder="0" allowfullscreen></iframe>`,
    
    script: `<script>
(function(w,d,s,o,f,js,fjs){
w['TourBotsObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
}(window,document,'script','gt','${baseUrl}/embed/tour.js'));
gt('init', '${embedId}', '${venueId}', ${JSON.stringify(options)});
</script>`,
    
    embedId,
    options
  };
}

export function generateChatbotEmbed(venueId: string, options: ChatbotEmbedOptions = {}) {
  const chatbotType = options.chatbotType || 'tour';
  const embedId = `${chatbotType}-chat-${venueId}-${Date.now()}`;
  // Detect current domain for development/production
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://tourbots.ai'; // Fallback for server-side
  
  const useDirect = options.useDirect ?? false;
  const scriptFile = 'chat.js';
  
  // Create complete configuration object with all customisation fields
  const config = {
    ...options,
    chatbotType,
    venueId,
    embedId,
    useDirect,
    customisation: options.customisation ? {
      // Map desktop customisation
      desktop: mapCustomisationToEmbed(options.customisation, 'desktop'),
      // Map mobile customisation
      mobile: mapCustomisationToEmbed(options.customisation, 'mobile'),
      // Original field mapping for backward compatibility
      ...mapLegacyCustomisation(options.customisation)
    } : undefined
  };
  
  // Simple embed - includes basic customisation with device detection
  const simpleEmbed = `<script src="${baseUrl}/embed/${scriptFile}?v=${Date.now()}" 
    data-venue-id="${venueId}" 
    data-chatbot-type="${chatbotType}" 
    data-embed-id="${embedId}"
    ${options.tourId ? `data-tour-id="${options.tourId}"` : ''}
    ${useDirect ? 'data-embed-type="direct"' : 'data-embed-type="iframe"'}
    ${options.customisation ? `data-customisation='${JSON.stringify(config.customisation)}'` : ''}
  ></script>`;
  
  // Advanced embed - with full customisation options and device detection
  const advancedEmbed = `<script>
(function(w,d,s,o,f,js,fjs){
w['TourBotsChatObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
}(window,document,'script','gc','${baseUrl}/embed/${scriptFile}?v=${Date.now()}'));
gc('init', '${embedId}', '${venueId}', ${JSON.stringify(config)});
</script>`;
  
  return {
    simple: simpleEmbed,
    advanced: advancedEmbed,
    embedId,
    options: config,
    chatbotType,
    embedType: useDirect ? 'direct' : 'iframe'
  };
}

export function generateAgencyPortalEmbed(shareSlug: string, options: AgencyPortalEmbedOptions = {}) {
  const embedId = `agency-portal-${shareSlug}-${Date.now()}`;
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://tourbots.ai';

  const queryParams = new URLSearchParams({
    id: embedId,
    ...(options.title ? { title: options.title } : {}),
    ...(options.showHeader !== undefined ? { showHeader: String(options.showHeader) } : {}),
  });

  const srcUrl = `${baseUrl}/embed/agency/${shareSlug}?${queryParams.toString()}`;

  const iframe = `<iframe src="${srcUrl}" width="${options.width || '100%'}" height="${options.height || '900px'}" frameborder="0" allowfullscreen></iframe>`;

  const script = `<div id="${embedId}"></div>
<script>
(function() {
  var container = document.getElementById('${embedId}');
  if (!container) return;
  var iframe = document.createElement('iframe');
  iframe.src = '${srcUrl}';
  iframe.width = '${options.width || '100%'}';
  iframe.height = '${options.height || '900px'}';
  iframe.frameBorder = '0';
  iframe.allowFullscreen = true;
  iframe.style.width = '${options.width || '100%'}';
  iframe.style.border = '0';
  container.appendChild(iframe);
})();
</script>`;

  return {
    iframe,
    script,
    embedId,
    previewUrl: srcUrl,
    options,
  };
}

/**
 * Maps legacy customisation fields for backward compatibility
 */
function mapLegacyCustomisation(customisation: ChatbotCustomisation) {
  return {
    // Chat button styling
    buttonColor: customisation.chat_button_color,
    buttonSize: customisation.chat_button_size,
    buttonPosition: customisation.chat_button_position,
    buttonIcon: customisation.chat_button_icon,
    iconSize: customisation.icon_size,
    headerIconSize: customisation.header_icon_size,
    
    // Chat window styling
    headerBackgroundColor: customisation.header_background_color,
    headerTextColor: customisation.header_text_color,
    windowTitle: customisation.window_title,
    windowWidth: customisation.window_width,
    windowHeight: customisation.window_height,
    
    // Message styling
    aiMessageBackground: customisation.ai_message_background,
    aiMessageTextColor: customisation.ai_message_text_color,
    userMessageBackground: customisation.user_message_background,
    userMessageTextColor: customisation.user_message_text_color,
    
    // Input area styling
    inputBackgroundColor: customisation.input_background_color,
    sendButtonColor: customisation.send_button_color,
    sendButtonIconColor: customisation.send_button_icon_color,
    
    // Branding
    showPoweredBy: customisation.show_powered_by,
    customLogoUrl: customisation.custom_logo_url,
  };
}

// Enhanced functions that include customisation
export function generateTourChatbotEmbed(
  venueId: string,
  customisation?: ChatbotCustomisation,
  options: Omit<ChatbotEmbedOptions, 'chatbotType' | 'customisation'> = {},
  tourId?: string
) {
  return generateChatbotEmbed(venueId, { ...options, chatbotType: 'tour', customisation, tourId });
}

// Generate CSS for customisation (can be used in embed scripts)
export function generateCustomisationCSS(customisation: ChatbotCustomisation, deviceType?: 'desktop' | 'mobile'): string {
  const chatbotType = customisation.chatbot_type;
  const prefix = 'tour-chat';
  
  // Get effective customisation based on device
  const device = deviceType || 'desktop';
  const effectiveCustomisation = mapCustomisationToEmbed(customisation, device);
  
  // Generate comprehensive CSS
  let css = `/* ${chatbotType.charAt(0).toUpperCase() + chatbotType.slice(1)} Chatbot Custom Styles */\n`;
  
  // Chat Button Styles
  css += `
.${prefix}-button {
  background-color: ${effectiveCustomisation.buttonColor} !important;
  width: ${getSizeValue(effectiveCustomisation.buttonSize, 'button')}px !important;
  height: ${getSizeValue(effectiveCustomisation.buttonSize, 'button')}px !important;
  border-radius: ${effectiveCustomisation.buttonShape === 'square' ? '8px' : '50%'} !important;
  box-shadow: ${getShadowValue(effectiveCustomisation.buttonShadow)} !important;
  border: none !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.3s ease !important;
  z-index: 9999 !important;
}

.${prefix}-button:hover {
  background-color: ${effectiveCustomisation.buttonHoverColor} !important;
  transform: ${effectiveCustomisation.chatButtonAnimation === 'pulse' ? 'scale(1.05)' : 'none'} !important;
}

.${prefix}-button .icon {
  width: ${effectiveCustomisation.iconSize}px !important;
  height: ${effectiveCustomisation.iconSize}px !important;
  object-fit: contain !important;
}`;

  // Chat Window Styles
  css += `
.${prefix}-window {
  width: ${effectiveCustomisation.windowWidth}px !important;
  height: ${effectiveCustomisation.windowHeight}px !important;
  border-radius: ${effectiveCustomisation.windowBorderRadius}px !important;
  box-shadow: ${getShadowValue(effectiveCustomisation.windowShadow)} !important;
  background: white !important;
  border: none !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  font-family: ${effectiveCustomisation.fontFamily} !important;
  position: fixed !important;
  z-index: 9998 !important;
}`;

  // Header Styles
  css += `
.${prefix}-header {
  background-color: ${effectiveCustomisation.headerBackgroundColor} !important;
  color: ${effectiveCustomisation.headerTextColor} !important;
  height: ${effectiveCustomisation.headerHeight}px !important;
  padding: 0 20px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  font-size: ${effectiveCustomisation.headerTextSize}px !important;
  font-weight: ${effectiveCustomisation.headerFontWeight} !important;
  font-family: ${effectiveCustomisation.fontFamily} !important;
  flex-shrink: 0 !important;
}

.${prefix}-header .icon {
  width: ${effectiveCustomisation.headerIconSize}px !important;
  height: ${effectiveCustomisation.headerIconSize}px !important;
  object-fit: contain !important;
}

.${prefix}-close-button {
  background: none !important;
  border: none !important;
  color: inherit !important;
  font-size: 24px !important;
  cursor: pointer !important;
  padding: 4px !important;
  width: 32px !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 4px !important;
  transition: background-color 0.2s !important;
}

.${prefix}-close-button:hover {
  background-color: rgba(255, 255, 255, 0.2) !important;
}`;

  // Messages Styles
  css += `
.${prefix}-messages {
  flex: 1 !important;
  overflow-y: auto !important;
  padding: 16px !important;
  background: #f8f9fa !important;
  font-family: ${effectiveCustomisation.fontFamily} !important;
}

.${prefix}-message {
  margin-bottom: ${effectiveCustomisation.messageSpacing}px !important;
  display: flex !important;
  gap: 8px !important;
  max-width: 85% !important;
  border-radius: ${effectiveCustomisation.messageBorderRadius}px !important;
  font-size: ${effectiveCustomisation.messageTextSize}px !important;
  font-weight: ${effectiveCustomisation.messageFontWeight} !important;
  font-family: ${effectiveCustomisation.fontFamily} !important;
}

.${prefix}-message.ai {
  margin-right: auto !important;
}

.${prefix}-message.user {
  margin-left: auto !important;
  flex-direction: row-reverse !important;
}

.${prefix}-message-bubble.ai {
  background-color: ${effectiveCustomisation.aiMessageBackground} !important;
  color: ${effectiveCustomisation.aiMessageTextColor} !important;
  border-radius: ${effectiveCustomisation.messageBorderRadius}px !important;
  padding: 12px 16px !important;
  max-width: calc(100% - 40px) !important;
}

.${prefix}-message-bubble.user {
  background-color: ${effectiveCustomisation.userMessageBackground} !important;
  color: ${effectiveCustomisation.userMessageTextColor} !important;
  border-radius: ${effectiveCustomisation.messageBorderRadius}px !important;
  padding: 12px 16px !important;
  max-width: calc(100% - 40px) !important;
}`;

  // Avatar Styles
  if (effectiveCustomisation.showBotAvatar || effectiveCustomisation.showUserAvatar) {
    css += `
.${prefix}-avatar {
  width: ${effectiveCustomisation.avatarSize}px !important;
  height: ${effectiveCustomisation.avatarSize}px !important;
  border-radius: 50% !important;
  background-color: #e5e7eb !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
  font-size: ${Math.round(effectiveCustomisation.avatarSize * 0.5)}px !important;
  color: #6b7280 !important;
}

.${prefix}-avatar img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  border-radius: inherit !important;
}`;
  }

  // Input Area Styles
  css += `
.${prefix}-input-area {
  background-color: ${effectiveCustomisation.inputBackgroundColor} !important;
  padding: 16px !important;
  border-top: 1px solid #e5e7eb !important;
  display: flex !important;
  gap: 8px !important;
  align-items: flex-end !important;
  flex-shrink: 0 !important;
}

.${prefix}-input {
  flex: 1 !important;
  border: 1px solid #d1d5db !important;
  border-radius: ${effectiveCustomisation.inputBorderRadius}px !important;
  padding: 12px 16px !important;
  font-size: ${effectiveCustomisation.messageTextSize}px !important;
  font-family: ${effectiveCustomisation.fontFamily} !important;
  color: ${effectiveCustomisation.inputTextColor} !important;
  background-color: ${effectiveCustomisation.inputBackgroundColor} !important;
  min-height: ${effectiveCustomisation.inputHeight}px !important;
  resize: none !important;
  outline: none !important;
  transition: border-color 0.2s !important;
}

.${prefix}-input:focus {
  border-color: ${effectiveCustomisation.sendButtonColor} !important;
  box-shadow: 0 0 0 2px ${effectiveCustomisation.sendButtonColor}33 !important;
}

.${prefix}-input::placeholder {
  color: #9ca3af !important;
  font-size: ${effectiveCustomisation.messageTextSize}px !important;
}`;

  // Send Button Styles
  css += `
.${prefix}-send-button {
  background-color: ${effectiveCustomisation.sendButtonColor} !important;
  color: ${effectiveCustomisation.sendButtonIconColor} !important;
  border: none !important;
  border-radius: ${effectiveCustomisation.sendButtonBorderRadius}px !important;
  width: ${getSizeValue(effectiveCustomisation.sendButtonSize, 'send')}px !important;
  height: ${getSizeValue(effectiveCustomisation.sendButtonSize, 'send')}px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  flex-shrink: 0 !important;
}

.${prefix}-send-button:hover {
  background-color: ${effectiveCustomisation.sendButtonHoverColor} !important;
  transform: scale(1.05) !important;
}

.${prefix}-send-button:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
  transform: none !important;
}

.${prefix}-send-button .icon {
  width: 16px !important;
  height: 16px !important;
}`;

  // Typing Indicator Styles
  if (effectiveCustomisation.showTypingIndicator) {
    css += `
.${prefix}-typing-indicator {
  color: ${effectiveCustomisation.typingIndicatorColor} !important;
  font-size: ${effectiveCustomisation.messageTextSize}px !important;
  padding: 12px 16px !important;
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
}

.${prefix}-typing-dots {
  display: flex !important;
  gap: 2px !important;
}

.${prefix}-typing-dot {
  width: 4px !important;
  height: 4px !important;
  border-radius: 50% !important;
  background-color: ${effectiveCustomisation.typingIndicatorColor} !important;
  animation: typing-bounce 1.4s infinite ease-in-out !important;
}

.${prefix}-typing-dot:nth-child(1) { animation-delay: -0.32s !important; }
.${prefix}-typing-dot:nth-child(2) { animation-delay: -0.16s !important; }
.${prefix}-typing-dot:nth-child(3) { animation-delay: 0s !important; }`;
  }

  // Timestamp Styles
  if (effectiveCustomisation.showTimestamps) {
    css += `
.${prefix}-timestamp {
  font-size: ${Math.max(10, effectiveCustomisation.messageTextSize - 2)}px !important;
  color: #6b7280 !important;
  margin-top: 4px !important;
  opacity: 0.7 !important;
  font-family: ${effectiveCustomisation.fontFamily} !important;
}`;
  }

  // Powered by branding
  if (!effectiveCustomisation.showPoweredBy) {
    css += `
.${prefix}-powered-by {
  display: none !important;
}`;
  } else {
    css += `
.${prefix}-powered-by {
  text-align: center !important;
  padding: 8px !important;
  font-size: 11px !important;
  color: #6b7280 !important;
  background-color: rgba(255, 255, 255, 0.5) !important;
  font-family: ${effectiveCustomisation.fontFamily} !important;
}`;
  }

  // Animations
  css += `
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scaleUp {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 20%, 60%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  80% { transform: translateY(-5px); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px ${effectiveCustomisation.buttonColor}80; }
  50% { box-shadow: 0 0 20px ${effectiveCustomisation.buttonColor}cc; }
}`;

  // Mobile responsive adjustments
  if (device === 'mobile') {
    css += `
@media (max-width: 768px) {
  .${prefix}-window {
    width: 100% !important;
    height: 100% !important;
    border-radius: 0 !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
  }
  
  .${prefix}-button {
    width: ${Math.min(getSizeValue(effectiveCustomisation.buttonSize, 'button'), 60)}px !important;
    height: ${Math.min(getSizeValue(effectiveCustomisation.buttonSize, 'button'), 60)}px !important;
  }
}`;
  }

  return css.trim();
}

// Helper function for size values
function getSizeValue(size: string, type: 'button' | 'send'): number {
  if (type === 'button') {
    switch (size) {
      case 'small': return 48;
      case 'large': return 80;
      default: return 64;
    }
  } else {
    switch (size) {
      case 'small': return 32;
      case 'large': return 48;
      default: return 40;
    }
  }
}

// Helper function for shadow values
function getShadowValue(intensity: string): string {
  switch (intensity) {
    case 'none': return 'none';
    case 'light': return '0 2px 8px rgba(0,0,0,0.1)';
    case 'heavy': return '0 8px 32px rgba(0,0,0,0.3)';
    default: return '0 4px 16px rgba(0,0,0,0.15)';
  }
} 