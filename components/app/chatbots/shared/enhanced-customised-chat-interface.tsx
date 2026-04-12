"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { ChatbotCustomisation, ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  MessageSquare, 
  Bot, 
  Headphones, 
  HelpCircle, 
  Mail,
  Phone,
  Users,
  Zap,
  Heart,
  Star,
  Settings,
  Info,
  Search,
  Send,
  X,
  Minimize2,
  User,
  UserCheck,
  UserCog,
  Loader2,
  Monitor,
  Smartphone,
  Clock,
  Sparkles,
  Waves,
  Eye,
  Activity,
  Crown,
  Shield,
  Smile,
  Coffee,
  ArrowRight,
  ChevronRight,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getEffectiveCustomisation, getPlaygroundStyles, PlaygroundCustomisation } from "@/lib/utils/playground-customisation";
import { PreviewModeIndicator } from "./playground-utils";

const ICON_MAP = {
  MessageCircle, MessageSquare, Bot, Headphones, HelpCircle,
  Mail, Phone, Users, Zap, Heart, Star, Settings, Info, Search, 
  Eye, Activity, User, UserCheck, UserCog, Crown, Shield, Smile, Coffee
};

const AVATAR_ICON_MAP = {
  User, Bot, Settings, Star, Heart, MessageCircle, MessageSquare, 
  Headphones, HelpCircle, Mail, Phone, Users, Zap, Info, Search, 
  UserCheck, UserCog, Crown, Shield, Smile, Coffee
};

const SEND_BUTTON_ICON_MAP = {
  Send, ArrowRight, ChevronRight, Play, MessageCircle
};

interface EnhancedCustomisedChatInterfaceProps {
  customisation: Partial<ChatbotCustomisation>;
  messages: ChatMessage[];
  inputMessage: string;
  isLoadingMessage: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  emptyStateTitle?: string;
  emptyStateSubtitle?: string;
  className?: string;
  mode?: 'desktop' | 'mobile';
  onModeChange?: (mode: 'desktop' | 'mobile') => void;
  showModeToggle?: boolean;
  showPreviewInfo?: boolean;
  onTestPromptClick?: (prompt: string) => void;
}

export function EnhancedCustomisedChatInterface({
  customisation,
  messages,
  inputMessage,
  isLoadingMessage,
  onInputChange,
  onSendMessage,
  onKeyDown,
  placeholder = "Type your message here...",
  emptyStateTitle = "Start a conversation",
  emptyStateSubtitle = "Try one of the test prompts or type your own message",
  className,
  mode = 'desktop',
  onModeChange,
  showModeToggle = true,
  showPreviewInfo = true,
  onTestPromptClick
}: EnhancedCustomisedChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [isWelcomeMessageShown, setIsWelcomeMessageShown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Get effective customisation using playground utilities
  const effectiveCustomisation: PlaygroundCustomisation = useMemo(() => {
    return getEffectiveCustomisation(customisation, mode);
  }, [customisation, mode]);

  // Get computed styles
  const styles = useMemo(() => {
    return getPlaygroundStyles(effectiveCustomisation);
  }, [effectiveCustomisation]);

  // Get icon components
  const ChatButtonIcon = ICON_MAP[effectiveCustomisation.chat_button_icon as keyof typeof ICON_MAP] || MessageCircle;
  const SendButtonIcon = SEND_BUTTON_ICON_MAP[effectiveCustomisation.send_button_icon as keyof typeof SEND_BUTTON_ICON_MAP] || Send;
  const BotAvatarIcon = AVATAR_ICON_MAP[effectiveCustomisation.bot_avatar_icon as keyof typeof AVATAR_ICON_MAP] || Bot;
  const UserAvatarIcon = AVATAR_ICON_MAP[effectiveCustomisation.user_avatar_icon as keyof typeof AVATAR_ICON_MAP] || User;

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

  // Auto-scroll to bottom - FIXED to only scroll chat container
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Scroll to bottom of the messages container, not the entire page
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  // Show welcome message with delay
  useEffect(() => {
    if (messages.length === 0 && !isWelcomeMessageShown && effectiveCustomisation.welcome_message_delay > 0) {
      const timer = setTimeout(() => {
        setIsWelcomeMessageShown(true);
      }, effectiveCustomisation.welcome_message_delay);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isWelcomeMessageShown, effectiveCustomisation.welcome_message_delay]);

  // Typing indicator effect
  useEffect(() => {
    if (isLoadingMessage) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [isLoadingMessage]);

  // Get avatar style based on avatar_style setting
  const getAvatarStyle = (isUser: boolean) => {
    const baseStyle = "flex items-center justify-center flex-shrink-0";
    const sizeStyle = "w-6 h-6";
    
    let shapeStyle;
    switch (effectiveCustomisation.avatar_style) {
      case 'square':
        shapeStyle = "rounded-none";
        break;
      case 'rounded':
        shapeStyle = "rounded-lg";
        break;
      case 'circle':
      default:
        shapeStyle = "rounded-full";
        break;
    }
    
    return cn(baseStyle, sizeStyle, shapeStyle, "bg-gray-300");
  };

  // Render custom or default avatar
  const renderAvatar = (isUser: boolean) => {
    const customUrl = isUser ? effectiveCustomisation.custom_user_avatar_url : effectiveCustomisation.custom_bot_avatar_url;
    const IconComponent = isUser ? UserAvatarIcon : BotAvatarIcon;
    
    if (customUrl) {
      return (
        <img 
          src={customUrl} 
          alt={isUser ? "User" : "AI"} 
          className="w-4 h-4 object-contain"
          onError={(e) => {
            // Fallback to default icon if custom image fails
            const fallbackIcon = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallbackIcon) {
              e.currentTarget.style.display = 'none';
              fallbackIcon.style.display = 'block';
            }
          }}
        />
      );
    }
    return <IconComponent className="w-3 h-3 text-gray-600" />;
  };

  // Render header icon with custom logo support
  const renderHeaderIcon = () => {
    const iconSize = effectiveCustomisation.header_icon_size;
    const iconColor = effectiveCustomisation.header_text_color;
    const headerIcon = effectiveCustomisation.header_icon || 'Bot';
    const customHeaderIconUrl = effectiveCustomisation.custom_header_icon_url;
    
    const iconStyle = { 
      width: `${iconSize}px`, 
      height: `${iconSize}px`,
      color: iconColor
    };
    
    // Define icon mapping for header icons
    const HEADER_ICON_MAP = {
      Bot, MessageCircle, Headphones, Users, Crown, Shield, User, UserCheck, UserCog, Smile, Coffee
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
            const IconComponent = HEADER_ICON_MAP[headerIcon as keyof typeof HEADER_ICON_MAP] || Bot;
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
      const IconComponent = HEADER_ICON_MAP[headerIcon as keyof typeof HEADER_ICON_MAP] || Bot;
      return <IconComponent style={iconStyle} />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date | string) => {
    const format = effectiveCustomisation.timestamp_format || '12h';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: format === '12h'
    });
  };

  // Get loading animation component
  const renderLoadingAnimation = () => {
    const animationType = effectiveCustomisation.loading_animation || 'spinner';
    const color = effectiveCustomisation.loading_spinner_color || '#1890FF';
    
    switch (animationType) {
      case 'dots':
        return (
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        );
      case 'wave':
        return <Waves className="w-4 h-4 animate-pulse" style={{ color }} />;
      case 'sparkles':
        return <Sparkles className="w-4 h-4 animate-spin" style={{ color }} />;
      case 'spinner':
      default:
        return <Loader2 className="w-4 h-4 animate-spin" style={{ color }} />;
    }
  };

  // Get message animation classes
  const getMessageAnimationClass = (isNew: boolean) => {
    if (!effectiveCustomisation.enable_animations || !isNew) return '';
    
    switch (effectiveCustomisation.message_animation) {
      case 'slide-in':
        return 'animate-in slide-in-from-bottom-2 duration-300';
      case 'fade-in':
        return 'animate-in fade-in duration-300';
      case 'scale-in':
        return 'animate-in zoom-in-95 duration-300';
      case 'bounce-in':
        return 'animate-in zoom-in-95 duration-500';
      default:
        return '';
    }
  };

  // Get shadow classes
  const getShadowClass = (intensity: string) => {
    switch (intensity) {
      case 'light':
        return 'shadow-sm';
      case 'medium':
        return 'shadow-md';
      case 'heavy':
        return 'shadow-lg';
      case 'none':
      default:
        return '';
    }
  };

  // Test prompts for quick testing
  const testPrompts = [
    { category: "Basic", text: "Hello, how are you?", emoji: "👋" },
    { category: "Question", text: "What services do you offer?", emoji: "❓" },
    { category: "Pricing", text: "How much does it cost?", emoji: "💰" },
    { category: "Support", text: "I need help with something", emoji: "🤝" },
  ];

  return (
    <div className={cn("relative", className)}>
      {/* 🆕 Custom placeholder colour support for playground */}
      <style jsx>{`
        :global(.gt-playground-input::placeholder) {
          color: var(--placeholder-color, #6B7280);
          opacity: 1;
        }
        
        :global(.gt-playground-input:-ms-input-placeholder) {
          color: var(--placeholder-color, #6B7280);
        }
        
        :global(.gt-playground-input::-ms-input-placeholder) {
          color: var(--placeholder-color, #6B7280);
        }
      `}</style>
      
      {/* Chat Interface */}
      <div 
        className={cn(
          "rounded-lg border border-input overflow-hidden flex flex-col",
          getShadowClass(effectiveCustomisation.chat_window_shadow_intensity)
        )}
        style={styles.chatWindow}
      >
        {/* Header */}
        <div 
          className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{
            backgroundColor: effectiveCustomisation.header_background_color,
            height: `${effectiveCustomisation.header_height}px`,
            borderTopLeftRadius: `${effectiveCustomisation.chat_window_border_radius}px`,
            borderTopRightRadius: `${effectiveCustomisation.chat_window_border_radius}px`
          }}
        >
          <h3 
            className="font-medium m-0 flex items-center gap-2"
            style={{
              color: effectiveCustomisation.header_text_color,
              fontSize: `${effectiveCustomisation.header_text_size}px`,
              fontWeight: getFontWeightValue(effectiveCustomisation.header_font_weight),
              fontFamily: effectiveCustomisation.font_family
            }}
          >
            {renderHeaderIcon()}
            {effectiveCustomisation.window_title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Minimize2 size={16} style={{ color: effectiveCustomisation.header_text_color }} />
            <X size={16} style={{ color: effectiveCustomisation.header_text_color }} />
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-50/50"
        >
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {effectiveCustomisation.custom_logo_url ? (
                <img 
                  src={effectiveCustomisation.custom_logo_url} 
                  alt="Custom chat icon" 
                  className="w-12 h-12 mx-auto mb-4 object-contain opacity-30"
                />
              ) : (
                <ChatButtonIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              )}
              <p className="font-medium mb-2">{emptyStateTitle}</p>
              <p className="text-sm mb-4">{emptyStateSubtitle}</p>
              
              {/* Test Prompts */}
              {onTestPromptClick && (
                <div className="grid gap-2 mt-4 max-w-xs mx-auto">
                  {testPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="justify-start h-auto p-2 text-left"
                      onClick={() => onTestPromptClick(prompt.text)}
                    >
                      <span className="mr-2">{prompt.emoji}</span>
                      <span className="text-xs">{prompt.text}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                `max-w-[${effectiveCustomisation.message_max_width}%]`,
                message.role === 'assistant' ? "mr-auto" : "ml-auto flex-row-reverse",
                getMessageAnimationClass(index === messages.length - 1)
              )}
            >
              {/* Avatar */}
              {(message.role === 'assistant' ? effectiveCustomisation.show_bot_avatar : effectiveCustomisation.show_user_avatar) && (
                <div className={getAvatarStyle(message.role === 'user')}>
                  {renderAvatar(message.role === 'user')}
                </div>
              )}
              
              {/* Message Bubble */}
              <div className="flex flex-col">
                <div 
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    getShadowClass(effectiveCustomisation.message_shadow_enabled ? 'light' : 'none')
                  )}
                  style={{
                    ...(message.role === 'assistant' ? styles.aiMessage : styles.userMessage),
                    ...styles.message
                  }}
                >
                  {/* Show typing indicator for empty streaming messages */}
                  {message.role === 'assistant' && !message.content && (message as any).isStreaming && (() => {
                    const typingStyle = (effectiveCustomisation.typing_indicator_style as 'dots' | 'wave' | 'pulse' | 'none') || 'dots';
                    const typingColor = effectiveCustomisation.typing_indicator_color || effectiveCustomisation.header_background_color || '#3B82F6';
                    const typingSpeed = (effectiveCustomisation.typing_indicator_speed as 'slow' | 'normal' | 'fast') || 'normal';
                    const chatbotName = effectiveCustomisation.window_title || 'AI Assistant';
                    
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
                  })()}
                  
                  {/* Show content when available */}
                  {message.content && (
                    <div className={cn(
                      "prose prose-sm max-w-none",
                      message.role === 'assistant' 
                        ? "prose-gray" 
                        : "prose-invert"
                    )}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 last:mb-0">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 last:mb-0">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => (
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono overflow-x-auto mb-2 last:mb-0">
                              {children}
                            </pre>
                          ),
                        }}
                      >
                        {message.content.trim()}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                
                {/* Timestamp */}
                {(showTimestamps || effectiveCustomisation.show_timestamps) && (
                  <div className={cn(
                    "text-xs text-gray-500 mt-1",
                    message.role === 'assistant' ? "text-left" : "text-right"
                  )}>
                    {formatTimestamp(message.timestamp || new Date())}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Loading Message */}
          {isLoadingMessage && (
            <div 
              className={cn(
                "flex gap-2 max-w-[85%] mr-auto",
                getMessageAnimationClass(true)
              )}
            >
              {effectiveCustomisation.show_bot_avatar && (
                <div className={getAvatarStyle(false)}>
                  {renderAvatar(false)}
                </div>
              )}
              <div 
                className={cn(
                  "rounded-lg px-3 py-2",
                  getShadowClass(effectiveCustomisation.message_shadow_enabled ? 'light' : 'none')
                )}
                style={{
                  ...styles.aiMessage,
                  ...styles.message
                }}
              >
                <div className="flex items-center gap-2">
                  {renderLoadingAnimation()}
                  {effectiveCustomisation.loading_text_enabled && (
                    <span className="text-sm">Thinking...</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div 
          className="p-3 border-t flex-shrink-0"
          style={{
            backgroundColor: effectiveCustomisation.input_background_color,
            borderBottomLeftRadius: `${effectiveCustomisation.chat_window_border_radius}px`,
            borderBottomRightRadius: `${effectiveCustomisation.chat_window_border_radius}px`,
            margin: 0
          }}
        >
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={effectiveCustomisation.input_placeholder_text || placeholder}
              rows={1}
              className="flex-1 resize-none border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-20 gt-playground-input"
              disabled={isLoadingMessage}
              style={{
                ...styles.input,
                minHeight: `${effectiveCustomisation.input_height}px`,
                fontSize: `${Math.max(16, effectiveCustomisation.placeholder_text_size || 16)}px`
              }}
            />
            <Button
              onClick={onSendMessage}
              disabled={!inputMessage.trim() || isLoadingMessage}
              size="sm"
              className="flex-shrink-0"
              style={{
                ...styles.sendButton,
                color: effectiveCustomisation.send_button_icon_color,
                width: `${effectiveCustomisation.input_height}px`,
                height: `${effectiveCustomisation.input_height}px`
              }}
            >
              {isLoadingMessage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SendButtonIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Powered by branding */}
          {effectiveCustomisation.show_powered_by && (
            <div className="flex items-center justify-center mt-2">
              <div 
                className="px-2 py-1 rounded text-xs"
                style={{ 
                  color: effectiveCustomisation.loading_text_color,
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  fontSize: `${effectiveCustomisation.branding_text_size}px`
                }}
              >
                Powered by {effectiveCustomisation.brand_name}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 