"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Heart, Star, Headphones, Settings, 
  Info, Search, ArrowRight, ChevronRight, Play, MessageSquare, Maximize2, Minimize2,
  Mail, Phone, Users, Zap, HelpCircle, UserCheck, UserCog, Crown, Shield, Smile, Coffee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTourChatbotConfig } from '@/hooks/app/useTourChatbotConfig';
import { useUser } from '@/hooks/useUser';
import { ChatMessage, Tour, ChatbotCustomisation } from '@/lib/types';
import { getDefaultCustomisation, getAdvancedDefaultCustomisation } from '@/lib/chatbot-customisation-service';
import { ChatbotConfigService } from '@/lib/services/chatbot-config-service';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
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

// Icon mapping for customisation
const ICON_MAP = {
  MessageCircle, MessageSquare, Bot, Headphones, HelpCircle,
  Mail, Phone, Users, Zap, Heart, Star, Settings, Info, Search,
  User, UserCheck, UserCog, Crown, Shield, Smile, Coffee
};

// Send button icon mapping
const SEND_ICON_MAP = {
  Send, ArrowRight, ChevronRight, Play, MessageCircle
};

interface TourChatWidgetProps {
  venueId: string;
  venueName?: string;
  tour?: Tour;
  scopeTourId?: string | null;
  className?: string;
  isFullscreen?: boolean;
  customisation?: ChatbotCustomisation | null;
  isExpanded: boolean;
  onToggle: (isExpanded: boolean) => void;
  forceMobileMode?: boolean;
  externalPrompt?: string | null;
  onExternalPromptConsumed?: () => void;
  embedId?: string;
  embedToken?: string;
}

export function TourChatWidget({ 
  venueId, 
  venueName, 
  tour, 
  scopeTourId,
  className = "", 
  isFullscreen = false, 
  customisation,
  isExpanded,
  onToggle,
  forceMobileMode = false,
  externalPrompt = null,
  onExternalPromptConsumed,
  embedId,
  embedToken
}: TourChatWidgetProps) {
  const { user } = useUser();
  const { tourConfig: authTourConfig, isLoading: authConfigLoading } = useTourChatbotConfig(scopeTourId || tour?.id);
  const [publicConfig, setPublicConfig] = useState<any>(null);
  const [isPublicConfigLoading, setIsPublicConfigLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStreamedContent, setHasStreamedContent] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Determine if this is a public/demo usage (no logged-in user)
  const isPublicDemo = !user;

  // Load config for public demos WITHOUT storing messages
  useEffect(() => {
    if (isPublicDemo) {
      const fetchPublicConfig = async () => {
        try {
          setIsPublicConfigLoading(true);
          const configData = await ChatbotConfigService.getPublicConfig(
            venueId,
            'tour',
            scopeTourId || tour?.id,
            {
              embedId: embedId || `tour-widget-${venueId}`,
              embedToken,
            }
          );
            setPublicConfig({
            chatbot_name: configData.chatbot_name,
            welcome_message: configData.welcome_message,
              is_active: true // Always active for demos
            });
        } catch (error) {
          // Set fallback config for demos
          setPublicConfig({
            chatbot_name: 'Tour Assistant',
            welcome_message: `Hello! I'm your virtual tour guide${venueName ? ` for ${venueName}` : ''}. How can I help you explore this space?`,
            is_active: true
          });
        } finally {
          setIsPublicConfigLoading(false);
        }
      };

      fetchPublicConfig();
    }
    
    // Initialize session and conversation IDs
    if (!sessionId) {
      setSessionId(`tour-${venueId}-${Date.now()}`);
    }
    if (!conversationId) {
      setConversationId(`tour-conv-${venueId}-${Date.now()}`);
    }
  }, [isPublicDemo, venueId, venueName, sessionId, conversationId]);

  // Detect client-only viewport/device state
  useEffect(() => {
    const checkViewportState = () => {
      setIsMobile(window.innerWidth < 768); // 768px is the 'md' breakpoint
      setIsIPad(/iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
    };
    
    checkViewportState();
    window.addEventListener('resize', checkViewportState);
    return () => window.removeEventListener('resize', checkViewportState);
  }, []);

  // Use appropriate config based on context
  const config = isPublicDemo ? publicConfig : authTourConfig;
  const configLoading = isPublicDemo ? isPublicConfigLoading : authConfigLoading;

  // Get final customisation with defaults
  const finalCustomisation = customisation || {
    ...getAdvancedDefaultCustomisation('tour'),
    id: '',
    venue_id: venueId,
    chatbot_type: 'tour' as const,
    created_at: '',
    updated_at: '',
  } as ChatbotCustomisation;

  // Get responsive customisation values
  const isMobileView = forceMobileMode || isMobile;

  const getCustomisationValue = (desktopKey: string, mobileKey: string) => {
    if (isMobileView && finalCustomisation.hasOwnProperty(mobileKey)) {
      return finalCustomisation[mobileKey as keyof ChatbotCustomisation];
    }
    return finalCustomisation[desktopKey as keyof ChatbotCustomisation];
  };

  // Get button size in pixels
  const buttonSize = getCustomisationValue('chat_button_size', 'mobile_chat_button_size') as 'small' | 'medium' | 'large';
  const buttonSizePx = isMobileView
    ? {
        small: 48,
        medium: 60,
        large: 80
      }[buttonSize]
    : {
        small: 64,
        medium: 80,
        large: 104
      }[buttonSize];

  // Get position and offsets
  const buttonPosition = getCustomisationValue('chat_button_position', 'mobile_chat_button_position') as 'bottom-left' | 'bottom-right';
  const isLeftPosition = buttonPosition === 'bottom-left';
  const bottomOffset = getCustomisationValue('chat_button_bottom_offset', 'mobile_chat_button_bottom_offset') as number || 0;
  const sideOffset = getCustomisationValue('chat_button_side_offset', 'mobile_chat_button_side_offset') as number || 0;

  // Get shadow intensity
  const shadowIntensity = getCustomisationValue('chat_button_shadow_intensity', 'mobile_chat_button_shadow_intensity') as 'none' | 'light' | 'medium' | 'heavy';
  const getShadowStyle = () => {
    switch (shadowIntensity) {
      case 'none': return 'none';
      case 'light': return '0 2px 8px rgba(0,0,0,0.1)';
      case 'medium': return '0 4px 16px rgba(0,0,0,0.15)';
      case 'heavy': return '0 8px 32px rgba(0,0,0,0.3)';
      default: return `0 8px 32px ${getCustomisationValue('chat_button_color', 'mobile_chat_button_color')}50`;
    }
  };

  // Get chat window shadow intensity
  const chatWindowShadowIntensity = getCustomisationValue('chat_window_shadow_intensity', 'mobile_chat_window_shadow_intensity') as 'none' | 'light' | 'medium' | 'heavy';
  const getChatWindowShadowStyle = () => {
    switch (chatWindowShadowIntensity) {
      case 'none': return 'none';
      case 'light': return '0 4px 12px rgba(0,0,0,0.1)';
      case 'medium': return '0 8px 24px rgba(0,0,0,0.15)';
      case 'heavy': return '0 16px 48px rgba(0,0,0,0.3)';
      default: return '0 8px 24px rgba(0,0,0,0.15)';
    }
  };

  // Get animation settings
  const animationType = getCustomisationValue('idle_animation_type', 'mobile_idle_animation_type') as 'none' | 'bounce' | 'pulse' | 'shake' | 'glow';
  const animationInterval = getCustomisationValue('idle_animation_interval', 'mobile_idle_animation_interval') as number || 3;

  // Get chat entrance animation class
  const getChatEntranceAnimationClass = () => {
    const entranceAnimation = getCustomisationValue('chat_entrance_animation', 'mobile_chat_entrance_animation') as 'slide-up' | 'slide-down' | 'fade-in' | 'scale-up' | 'none';
    
    switch (entranceAnimation) {
      case 'slide-up':
        return 'animate-in slide-in-from-bottom-4 fade-in-0 duration-500';
      case 'slide-down':
        return 'animate-in slide-in-from-top-4 fade-in-0 duration-500';
      case 'fade-in':
        return 'animate-in fade-in-0 duration-500';
      case 'scale-up':
        return 'animate-in zoom-in-95 fade-in-0 duration-500';
      case 'none':
        return '';
      default:
        return 'animate-in slide-in-from-bottom-4 fade-in-0 duration-500'; // Default to slide-up
    }
  };

  // Get message animation class
  const getMessageAnimationClass = () => {
    const messageAnimation = getCustomisationValue('message_animation', 'mobile_message_animation') as 'fade-in' | 'slide-in' | 'scale-in' | 'none';
    
    switch (messageAnimation) {
      case 'fade-in':
        return 'animate-in fade-in-0 duration-300';
      case 'slide-in':
        return 'animate-in slide-in-from-bottom-2 fade-in-0 duration-300';
      case 'scale-in':
        return 'animate-in zoom-in-95 fade-in-0 duration-300';
      case 'none':
        return '';
      default:
        return 'animate-in fade-in-0 duration-300'; // Default to fade-in
    }
  };

  // Initialize with welcome message when chat opens and config is available
  useEffect(() => {
    if (isExpanded && config?.welcome_message && messages.length === 0) {
      const welcomeDelay = getCustomisationValue('welcome_message_delay', 'mobile_welcome_message_delay') as number || 0;
      
      if (welcomeDelay === 0) {
        // Show immediately for 0 delay
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: config.welcome_message as string,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        // Use the defined delay (already in milliseconds)
        const welcomeTimeout = setTimeout(() => {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: config.welcome_message as string,
            timestamp: new Date().toISOString(),
          }]);
        }, welcomeDelay);

        return () => clearTimeout(welcomeTimeout);
      }
    }
  }, [isExpanded, config?.welcome_message, messages.length]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        e.preventDefault();
        onToggle(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isExpanded, onToggle]);

  // Auto-scroll to bottom when new messages arrive - FIXED to only scroll chat container
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Scroll to bottom of the messages container, not the entire page
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Prevent page scrolling when chat is expanded on mobile
  useEffect(() => {
    if (isExpanded && isMobileView && !forceMobileMode) {
      // Store original scroll position
      const originalScrollY = window.scrollY;
      
      // Prevent body scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${originalScrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore body scrolling
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        // Restore scroll position
        window.scrollTo(0, originalScrollY);
      };
    }
  }, [isExpanded, isMobileView, forceMobileMode]);

  useEffect(() => {
    const prompt = externalPrompt?.trim();
    if (!prompt) return;

    if (!isExpanded) {
      onToggle(true);
    }

    setInputMessage(prompt);
    setTimeout(() => textareaRef.current?.focus(), 0);
    onExternalPromptConsumed?.();
  }, [externalPrompt, isExpanded, onExternalPromptConsumed, onToggle]);

  // Handle idle animation interval - Updated to match enhanced-live-preview.tsx
  const idleAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [animationStylesInjected, setAnimationStylesInjected] = useState(false);
  
  // Get idle animation settings
  const idleAnimationEnabled = getCustomisationValue('idle_animation_enabled', 'mobile_idle_animation_enabled') as boolean;
  const idleAnimationType = getCustomisationValue('idle_animation_type', 'mobile_idle_animation_type') as IdleAnimationType;
  const idleAnimationInterval = getCustomisationValue('idle_animation_interval', 'mobile_idle_animation_interval') as number;
  const animationSpeed = getCustomisationValue('animation_speed', 'mobile_animation_speed') as AnimationSpeed || 'normal';
  const enableAnimations = getCustomisationValue('enable_animations', 'mobile_enable_animations') as boolean;

  // Calculate idle animation class
  const idleAnimationClass = useMemo(() => {
    if (!idleAnimationEnabled || !enableAnimations) {
      return '';
    }
    const animationClass = getIdleAnimationClass(idleAnimationType, animationSpeed);
    return animationClass;
  }, [idleAnimationEnabled, idleAnimationType, animationSpeed, enableAnimations]);

  // Inject animation styles
  useEffect(() => {
    if (!animationStylesInjected && enableAnimations) {
      const styleElement = document.createElement('style');
      styleElement.textContent = generateCustomKeyframes();
      document.head.appendChild(styleElement);
      setAnimationStylesInjected(true);
    }
  }, [enableAnimations, animationStylesInjected]);

  // Handle idle animation timing - Updated to match enhanced-live-preview.tsx
  useEffect(() => {
    if (idleAnimationTimeoutRef.current) {
      clearInterval(idleAnimationTimeoutRef.current);
    }

    if (idleAnimationEnabled && idleAnimationInterval > 0 && !isExpanded && enableAnimations) {
      const interval = calculateAnimationInterval(idleAnimationInterval, animationSpeed);
      
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
  }, [idleAnimationEnabled, idleAnimationInterval, animationSpeed, idleAnimationClass, isExpanded, enableAnimations]);

  const handlePromptClick = (prompt: string) => {
    setInputMessage(prompt);
    // Auto-focus the input after setting the prompt
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !venueId || isLoading || !config?.is_active) return;

    // Initialize IDs if not set
    let currentSessionId = sessionId;
    let currentConversationId = conversationId;
    
    if (!currentSessionId) {
      currentSessionId = `tour-${venueId}-${Date.now()}`;
      setSessionId(currentSessionId);
    }
    
    if (!currentConversationId) {
      currentConversationId = `tour-conv-${venueId}-${Date.now()}`;
      setConversationId(currentConversationId);
      setPreviousResponseId(null);
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setHasStreamedContent(false);

    // Reset textarea height after sending
    if (textareaRef.current) {
      const configuredInputHeight = Number(
        getCustomisationValue('input_height', 'mobile_input_height')
      ) || 36;
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(24, configuredInputHeight)}px`;
    }

    const assistantMessageId = (Date.now() + 1).toString();
    let accumulatedContent = '';

    const appendStreamChunk = (existing: string, chunk: string) => {
      if (!existing) return chunk;
      if (!chunk) return existing;

      const prevChar = existing.slice(-1);
      const nextChar = chunk.charAt(0);

      // Preserve intentional spacing/newlines, but add one space when two text
      // segments are joined directly (e.g. "there." + "Here" => "there. Here").
      const needsBoundarySpace =
        !/\s/.test(prevChar) &&
        !/\s/.test(nextChar) &&
        /[A-Za-z0-9.!?,;:)]/.test(prevChar) &&
        /[A-Za-z0-9(]/.test(nextChar);

      return needsBoundarySpace ? `${existing} ${chunk}` : `${existing}${chunk}`;
    };

    try {
      const response = await fetch(`/api/public/tour-chatbot/${venueId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          previousResponseId,
          tourId: scopeTourId || tour?.id,
          sessionId: currentSessionId,
          conversationId: currentConversationId,
          embedId: embedId || `tour-widget-${venueId}`,
          embedToken,
          domain: window.location.hostname,
          pageUrl: window.location.href,
          tourContext: tour ? {
            title: tour.title,
            description: tour.description,
            currentModelId: tour.matterport_tour_id,
            isViewingTour: true,
            message: "The user is currently viewing the virtual tour of the venue."
          } : undefined
        }),
      });

      if (!response.ok) {
        let userFacingError = 'Sorry, I encountered an error. Please try again.';

        try {
          const errorData = await response.json();
          const apiError = String(errorData?.error || '').toLowerCase();

          if (response.status === 402 && apiError.includes('message credit limit')) {
            userFacingError = 'Sorry, I have run out of message credits. If you are my owner, please top me up!';
          } else if (response.status === 429 || apiError.includes('rate limit')) {
            userFacingError = 'Too many messages sent too quickly. Please wait a moment and try again.';
          }
        } catch {
          // Keep the default fallback message when response body is not JSON.
        }

        throw new Error(userFacingError);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'content' && typeof data.content === 'string') {
              accumulatedContent = appendStreamChunk(accumulatedContent, data.content);
              setHasStreamedContent(true);
              setMessages(prev =>
                prev.some(msg => msg.id === assistantMessageId)
                  ? prev.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  : [...prev, {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: accumulatedContent,
                      timestamp: new Date().toISOString(),
                    }]
              );
            } else if (data.type === 'navigate_to_area') {
              const navigationEvent = new CustomEvent('matterport_navigate', {
                detail: {
                  sweep_id: data.sweep_id,
                  position: data.position,
                  rotation: data.rotation,
                  area_name: data.area_name,
                },
              });
              window.dispatchEvent(navigationEvent);
            } else if (data.type === 'switch_tour_model') {
              const switchEvent = new CustomEvent('switch_matterport_model', {
                detail: { modelId: data.model_id },
              });
              window.dispatchEvent(switchEvent);
            } else if (data.type === 'trigger_action') {
              if (data.action_type === 'navigate_tour_point') {
                const navigationEvent = new CustomEvent('matterport_navigate', {
                  detail: {
                    sweep_id: data.sweep_id,
                    position: data.position,
                    rotation: data.rotation,
                    area_name: data.area_name,
                  },
                });
                window.dispatchEvent(navigationEvent);
              } else if (data.action_type === 'open_url' && data.url) {
                const urlEvent = new CustomEvent('tour_chatbot_open_url', {
                  detail: { url: data.url },
                });
                window.dispatchEvent(urlEvent);
              } else if (data.action_type === 'switch_tour_model' && data.model_id) {
                const switchEvent = new CustomEvent('switch_matterport_model', {
                  detail: { modelId: data.model_id },
                });
                window.dispatchEvent(switchEvent);
              }
            } else if (data.type === 'done') {
              if (typeof data.responseId === 'string' && data.responseId.length > 0) {
                setPreviousResponseId(data.responseId);
              }
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Streaming error');
            }
          } catch (parseError) {
            console.error('Error parsing tour chatbot SSE event:', parseError);
          }
        }
      }

      setMessages(prev =>
        prev.some(msg => msg.id === assistantMessageId)
          ? prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent || 'Done.' }
                : msg
            )
          : [...prev, {
              id: assistantMessageId,
              role: 'assistant',
              content: accumulatedContent || 'Done.',
              timestamp: new Date().toISOString(),
            }]
      );
    } catch (error) {
      console.error('Error sending message:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Sorry, I encountered an error. Please try again.';
      setMessages(prev =>
        prev.some(msg => msg.id === assistantMessageId)
          ? prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: message }
                : msg
            )
          : [...prev, {
              id: assistantMessageId,
              role: 'assistant',
              content: message,
              timestamp: new Date().toISOString(),
            }]
      );
    } finally {
      setIsLoading(false);
      setHasStreamedContent(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const maxHeight = 120; // Max height in pixels
      const configuredInputHeight = Number(
        getCustomisationValue('input_height', 'mobile_input_height')
      ) || 36;
      const minHeight = Math.max(24, configuredInputHeight);
      
      // Reset height to calculate new height
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      
      // Set height based on content, with min/max constraints
      if (scrollHeight <= maxHeight) {
        textarea.style.height = Math.max(scrollHeight, minHeight) + 'px';
      } else {
        textarea.style.height = maxHeight + 'px';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight();
  };

  // Auto-resize textarea on mount and when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  // Get smart prompts based on venue context
  const getSmartPrompts = () => {
    const basePrompts = [
      {
        emoji: "🏛️",
        text: "Venue Overview",
        prompt: `Can you give me a quick overview${venueName ? ` of ${venueName}` : ' of this venue'}?`
      },
      {
        emoji: "🕐", 
        text: "Opening Hours",
        prompt: `What are your opening hours and location details?`
      },
      {
        emoji: "✨",
        text: "Amenities & Features", 
        prompt: "What amenities and key features are included?"
      },
      {
        emoji: "📅",
        text: "Bookings & Availability",
        prompt: "How can visitors enquire, book, or check availability?"
      }
    ];

    // Add tour-specific prompt if tour is available
    if (tour) {
      basePrompts.unshift({
        emoji: "🎯",
        text: "About This Tour",
        prompt: "Can you guide me through what I'm seeing in this virtual tour?"
      });
    }

    return basePrompts;
  };

  // Format timestamp based on customisation settings
  const formatTimestamp = (timestamp: string) => {
    const showTimestamps = getCustomisationValue('show_timestamps', 'mobile_show_timestamps') as boolean;
    if (!showTimestamps) return null;

    const timestampFormat = getCustomisationValue('timestamp_format', 'mobile_timestamp_format') as '12h' | '24h' | 'relative';
    const messageTime = new Date(timestamp);
    const now = new Date();
    
    switch (timestampFormat) {
      case '12h':
        return messageTime.toLocaleTimeString('en-GB', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
      
      case '24h':
        return messageTime.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      
      case 'relative':
        const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / 60000);
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      
      default:
        return messageTime.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
    }
  };

  // Render avatar with custom image support
  const renderAvatar = (isUser: boolean) => {
    const show = isUser 
      ? getCustomisationValue('show_user_avatar', 'mobile_show_user_avatar') as boolean
      : getCustomisationValue('show_bot_avatar', 'mobile_show_bot_avatar') as boolean;
    
    if (!show) return null;
    
    // Get avatar style for border radius
    const avatarStyle = getCustomisationValue('avatar_style', 'mobile_avatar_style') as 'circle' | 'square' | 'rounded';
    
    // Get the correct custom URL and icon based on mode
    const customUrl = isUser 
      ? getCustomisationValue('custom_user_avatar_url', 'mobile_custom_user_avatar_url') as string
      : getCustomisationValue('custom_bot_avatar_url', 'mobile_custom_bot_avatar_url') as string;
      
    const iconName = isUser 
      ? getCustomisationValue('user_avatar_icon', 'mobile_user_avatar_icon') as string || 'User'
      : getCustomisationValue('bot_avatar_icon', 'mobile_bot_avatar_icon') as string || 'Bot';
    
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || (isUser ? User : Bot);
    
    const bgColor = isUser 
      ? getCustomisationValue('user_message_background', 'mobile_user_message_background') as string
      : getCustomisationValue('ai_message_background', 'mobile_ai_message_background') as string;
    const textColor = isUser 
      ? getCustomisationValue('user_message_text_color', 'mobile_user_message_text_color') as string
      : getCustomisationValue('ai_message_text_color', 'mobile_ai_message_text_color') as string;
    
    const avatarSize = isMobileView ? 24 : 32;
    const iconSize = isMobileView ? 14 : 16;
    
    // Calculate border radius based on avatar style
    const getBorderRadius = () => {
      switch (avatarStyle) {
        case 'square': return '0px';
        case 'rounded': return '8px';
        case 'circle':
        default: return '50%';
      }
    };
    
    const containerStyle = {
      width: avatarSize,
      height: avatarSize,
      borderRadius: getBorderRadius(),
      backgroundColor: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    };
    
    return (
      <div style={containerStyle}>
        {customUrl ? (
          <>
            <img 
              src={customUrl} 
              alt="Avatar" 
              style={{
                width: `${avatarSize}px`,
                height: `${avatarSize}px`,
                objectFit: 'cover',
                borderRadius: getBorderRadius(),
              }}
              onError={(e) => {
                // Fallback to icon if custom image fails to load
                e.currentTarget.style.display = 'none';
                const fallbackIcon = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallbackIcon) {
                  fallbackIcon.style.display = 'block';
                }
              }}
            />
            <IconComponent 
              size={iconSize} 
              style={{ 
                color: textColor,
                display: 'none' // Hidden by default, shown if image fails
              }} 
            />
          </>
        ) : (
          <IconComponent 
            size={iconSize} 
            style={{ color: textColor }} 
          />
        )}
      </div>
    );
  };

  // Render chat icon with custom image support
  const renderChatIcon = (className: string = "") => {
    const iconSize = getCustomisationValue('icon_size', 'mobile_icon_size') as number;
    
    // Handle custom logo URL with proper mobile/desktop separation
    const customLogoUrl = isMobileView 
      ? finalCustomisation.mobile_custom_logo_url as string
      : finalCustomisation.custom_logo_url as string;
    
    const buttonIcon = getCustomisationValue('chat_button_icon', 'mobile_chat_button_icon') as string;
    
    const iconStyle = {
      width: `${iconSize}px`,
      height: `${iconSize}px`
    };

    if (customLogoUrl) {
      return (
        <>
          <img 
            src={customLogoUrl} 
            alt="Custom chat icon" 
            className={cn(className, "object-contain")}
            style={iconStyle}
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
            const IconComponent = ICON_MAP[buttonIcon as keyof typeof ICON_MAP] || MessageSquare;
            return (
              <IconComponent 
                className={cn(className, "text-white drop-shadow-sm relative z-10")} 
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
      const IconComponent = ICON_MAP[buttonIcon as keyof typeof ICON_MAP] || MessageSquare;
      return (
        <IconComponent 
          className={cn(className, "text-white drop-shadow-sm relative z-10")} 
          style={iconStyle} 
        />
      );
    }
  };

  // Render header icon with custom image support
  const renderHeaderIcon = (className: string = "") => {
    const iconSize = getCustomisationValue('header_icon_size', 'mobile_header_icon_size') as number;
    const iconColor = getCustomisationValue('header_text_color', 'mobile_header_text_color') as string;
    
    // Handle custom header icon URL with proper mobile/desktop separation
    const customHeaderIconUrl = isMobileView 
      ? finalCustomisation.mobile_custom_header_icon_url as string
      : finalCustomisation.custom_header_icon_url as string;
    
    const headerIcon = getCustomisationValue('header_icon', 'mobile_header_icon') as string || 'Bot';
    
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
            className={cn(className, "object-contain")}
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
                className={cn(className)} 
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
      return (
        <IconComponent 
          className={cn(className)} 
          style={iconStyle} 
        />
      );
    }
  };

  if (configLoading) {
    // Show loading animation while config is loading
    const loadingAnimation = getCustomisationValue('loading_animation', 'mobile_loading_animation') as 'spinner' | 'dots' | 'bars';
    const loadingTextEnabled = getCustomisationValue('loading_text_enabled', 'mobile_loading_text_enabled') as boolean;
    const loadingSpinnerColor = getCustomisationValue('loading_spinner_color', 'mobile_loading_spinner_color') as string || '#1890FF';
    const loadingBackgroundColor = getCustomisationValue('loading_background_color', 'mobile_loading_background_color') as string || 'white';
    const loadingTextColor = getCustomisationValue('loading_text_color', 'mobile_loading_text_color') as string || '#666';

    return (
      <div className={cn("relative", className)}>
        {!isExpanded ? (
          /* Chat Button - Show loading state */
          <div
            className={cn(
              "group pointer-events-auto transition-all duration-300 opacity-50",
              isFullscreen && "absolute bottom-6 right-6 z-50",
              !isFullscreen && "absolute z-50"
            )}
            style={{
              [isLeftPosition ? 'left' : 'right']: `${isFullscreen ? 24 : getCustomisationValue('chat_offset_side', 'mobile_chat_offset_side')}px`,
              bottom: `${isFullscreen ? (isIPad ? 80 : 24) : getCustomisationValue('chat_offset_bottom', 'mobile_chat_offset_bottom')}px`
            }}
          >
            <div 
              className="relative transition-all duration-300 flex items-center justify-center"
              style={{ 
                width: `${buttonSizePx}px`,
                height: `${buttonSizePx}px`,
                backgroundColor: getCustomisationValue('chat_button_color', 'mobile_chat_button_color') as string,
                borderRadius: `${getCustomisationValue('chat_button_border_radius', 'mobile_chat_button_border_radius')}px`,
                boxShadow: getShadowStyle()
              }}
            >
              {renderChatIcon("text-white drop-shadow-sm relative z-10")}
            </div>
          </div>
        ) : (
          /* Loading Chat Window */
          <div 
            className={cn(
              "backdrop-blur-xl border border-white/20 dark:border-gray-700/50 flex flex-col overflow-hidden pointer-events-auto absolute z-50",
              getChatEntranceAnimationClass()
            )}
            style={{
              backgroundColor: loadingBackgroundColor,
              borderRadius: `${getCustomisationValue('chat_window_border_radius', 'mobile_chat_window_border_radius')}px`,
              boxShadow: getChatWindowShadowStyle(),
              fontFamily: getCustomisationValue('font_family', 'mobile_font_family') as string,
              // Use only inline styles for dimensions - no hardcoded Tailwind classes
              width: isMobileView 
                ? `min(90vw, ${getCustomisationValue('window_width', 'mobile_chat_window_width')}px)`
                : `${getCustomisationValue('window_width', 'mobile_chat_window_width')}px`,
              height: isMobileView 
                ? `min(50vh, ${getCustomisationValue('window_height', 'mobile_chat_window_height')}px)`
                : `${getCustomisationValue('window_height', 'mobile_chat_window_height')}px`,
              maxWidth: `${getCustomisationValue('window_width', 'mobile_chat_window_width')}px`,
              maxHeight: `${getCustomisationValue('window_height', 'mobile_chat_window_height')}px`,
              ...(isFullscreen 
                ? {
                    bottom: '24px',
                    right: '24px'
                  }
                : {
                    bottom: `${getCustomisationValue('chat_offset_bottom', 'mobile_chat_offset_bottom')}px`,
                    [isLeftPosition ? 'left' : 'right']: `${getCustomisationValue('chat_offset_side', 'mobile_chat_offset_side')}px`
                  }
              )
            }}
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-3">
                {loadingAnimation === 'spinner' && (
                  <div 
                    className="animate-spin rounded-full border-2 border-t-transparent w-8 h-8" 
                    style={{ 
                      borderColor: loadingSpinnerColor,
                      borderTopColor: 'transparent' 
                    }}
                  />
                )}
                
                {loadingAnimation === 'dots' && (
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ 
                          backgroundColor: loadingSpinnerColor,
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {loadingAnimation === 'bars' && (
                  <div className="flex space-x-1 items-end">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-current animate-bounce"
                        style={{ 
                          backgroundColor: loadingSpinnerColor,
                          height: `${12 + (i % 2) * 4}px`,
                          animationDelay: `${i * 0.15}s`
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {loadingTextEnabled && (
                  <div className="text-sm" style={{ color: loadingTextColor }}>
                    Loading...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const chatbotName = config?.chatbot_name || 'AI Assistant';
  const isOnline = config?.is_active;

  return (
    <div className={cn("relative", className)}>
      {/* Custom animations handled by animation utility system */}
      <style jsx>{`
        /* Legacy shake animation - now handled by animation utility */
      `}</style>
      
      {!isExpanded ? (
        /* Chat Button */
        <button
          onClick={() => onToggle(true)}
          data-chat-button
          className={cn(
            "group pointer-events-auto transition-all duration-300 hover:scale-105",
            // Fullscreen mode: always bottom-right
            isFullscreen && "absolute bottom-6 right-6 z-50",
            // Normal mode: apply customisation positioning
            !isFullscreen && [
              "absolute z-50"
            ]
          )}
          style={{
            // Apply custom positioning with offsets
            [isLeftPosition ? 'left' : 'right']: `${isFullscreen ? 24 : getCustomisationValue('chat_offset_side', 'mobile_chat_offset_side')}px`,
            bottom: `${isFullscreen ? (isIPad ? 80 : 24) : getCustomisationValue('chat_offset_bottom', 'mobile_chat_offset_bottom')}px`
          }}
          onMouseEnter={(e) => {
            // Apply hover color if defined
            const hoverColor = getCustomisationValue('chat_button_hover_color', 'mobile_chat_button_hover_color') as string;
            if (hoverColor) {
              const buttonDiv = e.currentTarget.querySelector('div') as HTMLElement;
              if (buttonDiv) {
                buttonDiv.style.backgroundColor = hoverColor;
              }
            }
          }}
          onMouseLeave={(e) => {
            // Reset to original color
            const buttonDiv = e.currentTarget.querySelector('div') as HTMLElement;
            if (buttonDiv) {
              const originalColor = getCustomisationValue('chat_button_color', 'mobile_chat_button_color') as string;
              buttonDiv.style.backgroundColor = originalColor;
            }
          }}
        >
          {/* Main button */}
          <div 
            className="relative transition-all duration-300 group-hover:shadow-lg flex items-center justify-center"
            style={{ 
              width: `${buttonSizePx}px`,
              height: `${buttonSizePx}px`,
              backgroundColor: getCustomisationValue('chat_button_color', 'mobile_chat_button_color') as string,
              borderRadius: `${getCustomisationValue('chat_button_border_radius', 'mobile_chat_button_border_radius')}px`,
              boxShadow: getShadowStyle()
            }}
          >
            {/* Glass effect overlay */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
              style={{ borderRadius: `${getCustomisationValue('chat_button_border_radius', 'mobile_chat_button_border_radius')}px` }}
            ></div>
            
            {/* Chat icon */}
            {renderChatIcon("text-white drop-shadow-sm relative z-10")}
          </div>

          {/* Tooltip */}
          <div className={cn(
            "absolute mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none",
            isLeftPosition ? "bottom-full left-0" : "bottom-full right-0"
          )}>
            <div className="bg-gray-900/95 text-white text-xs sm:text-sm px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm whitespace-nowrap">
              {getCustomisationValue('window_title', 'mobile_window_title') as string || 'Chat with AI Assistant'}
            </div>
            <div className={cn(
              "absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95",
              isLeftPosition ? "left-4" : "right-4"
            )}></div>
          </div>
        </button>
      ) : (
        /* Expanded Chat Window */
        <div 
          className={cn(
            "backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/50 flex flex-col overflow-hidden pointer-events-auto absolute z-50",
            getChatEntranceAnimationClass()
          )}
          style={{
            borderRadius: `${getCustomisationValue('chat_window_border_radius', 'mobile_chat_window_border_radius')}px`,
            boxShadow: getChatWindowShadowStyle(),
            fontFamily: getCustomisationValue('font_family', 'mobile_font_family') as string,
            // Use only inline styles for dimensions - no hardcoded Tailwind classes
            width: isMobileView 
              ? `min(90vw, ${getCustomisationValue('window_width', 'mobile_chat_window_width')}px)`
              : `${getCustomisationValue('window_width', 'mobile_chat_window_width')}px`,
            height: isMobileView 
              ? `min(50vh, ${getCustomisationValue('window_height', 'mobile_chat_window_height')}px)`
              : `${getCustomisationValue('window_height', 'mobile_chat_window_height')}px`,
            maxWidth: `${getCustomisationValue('window_width', 'mobile_chat_window_width')}px`,
            maxHeight: `${getCustomisationValue('window_height', 'mobile_chat_window_height')}px`,
            // Dynamic positioning for both fullscreen and normal modes
            ...(isFullscreen 
              ? {
                  bottom: isIPad? '80px': '24px',
                  right: '24px'
                }
              : {
                  bottom: `${getCustomisationValue('chat_offset_bottom', 'mobile_chat_offset_bottom')}px`,
                  [isLeftPosition ? 'left' : 'right']: `${getCustomisationValue('chat_offset_side', 'mobile_chat_offset_side')}px`
                }
            )
          }}
        >
          {/* Glass morphism background effects */}
          <div 
            className="absolute inset-0 opacity-50" 
            style={{ 
              background: `linear-gradient(135deg, ${getCustomisationValue('chat_button_color', 'mobile_chat_button_color')}05 0%, transparent 50%, ${getCustomisationValue('chat_button_color', 'mobile_chat_button_color')}05 100%)`,
              borderRadius: `${getCustomisationValue('chat_window_border_radius', 'mobile_chat_window_border_radius')}px`
            }}
          ></div>
          
          {/* Subtle pattern overlay */}
          <div 
            className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent)]"
            style={{
              borderRadius: `${getCustomisationValue('chat_window_border_radius', 'mobile_chat_window_border_radius')}px`
            }}
          ></div>

          {/* Header */}
          <div 
            className="relative z-10 flex items-center justify-between px-4 border-b border-gray-200/50 dark:border-gray-700/50"
            style={{ 
              backgroundColor: getCustomisationValue('header_background_color', 'mobile_header_background_color') as string,
              color: getCustomisationValue('header_text_color', 'mobile_header_text_color') as string,
              height: `${getCustomisationValue('header_height', 'mobile_header_height')}px`
            }}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: (getCustomisationValue('header_text_color', 'mobile_header_text_color') as string) + '20' }}
              >
                {renderHeaderIcon("drop-shadow-sm relative z-10")}
              </div>
              <div>
                <h3 
                  style={{ 
                    color: getCustomisationValue('header_text_color', 'mobile_header_text_color') as string,
                    fontSize: `${getCustomisationValue('header_text_size', 'mobile_header_text_size')}px`,
                    fontWeight: (() => {
                      const weight = getCustomisationValue('header_font_weight', 'mobile_header_font_weight') as string;
                      switch (weight) {
                        case 'light': return '300';
                        case 'normal': return '400';
                        case 'medium': return '500';
                        case 'bold': return '700';
                        default: return '500';
                      }
                    })()
                  }}
                >
                  {(getCustomisationValue('window_title', 'mobile_window_title') as string) || chatbotName}
                </h3>
                <p 
                  style={{ 
                    color: (getCustomisationValue('header_text_color', 'mobile_header_text_color') as string) + '80',
                    fontSize: `${(getCustomisationValue('header_text_size', 'mobile_header_text_size') as number) * 0.75}px`
                  }}
                >
                  {isOnline ? 'Online now' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'transparent',
                  color: getCustomisationValue('header_text_color', 'mobile_header_text_color') as string
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = (getCustomisationValue('header_text_color', 'mobile_header_text_color') as string) + '20'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => onToggle(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'transparent',
                  color: getCustomisationValue('header_text_color', 'mobile_header_text_color') as string
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = (getCustomisationValue('header_text_color', 'mobile_header_text_color') as string) + '20'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-gray-900/30"
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-2.5",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* Bot avatar - left side for AI messages */}
                    {message.role === 'assistant' && renderAvatar(false)}
                    
                    <div
                      className="flex min-w-0 flex-col gap-1"
                      style={{
                        maxWidth: `${getCustomisationValue('message_max_width', 'mobile_message_max_width')}%`,
                      }}
                    >
                      <div className={cn(
                        "min-w-0 w-fit max-w-full break-words p-3",
                        getMessageAnimationClass(),
                        message.role === 'user'
                          ? (getCustomisationValue('message_shadow_enabled', 'mobile_message_shadow_enabled') as boolean ? "shadow-lg" : "")
                          : (getCustomisationValue('message_shadow_enabled', 'mobile_message_shadow_enabled') as boolean ? "shadow-sm" : "") + " border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                      )}
                      style={{
                        borderRadius: `${getCustomisationValue('message_border_radius', 'mobile_message_border_radius')}px`,
                        ...(message.role === 'user' 
                          ? { 
                              backgroundColor: getCustomisationValue('user_message_background', 'mobile_user_message_background') as string,
                              color: getCustomisationValue('user_message_text_color', 'mobile_user_message_text_color') as string
                            }
                          : { 
                              backgroundColor: getCustomisationValue('ai_message_background', 'mobile_ai_message_background') as string,
                              color: getCustomisationValue('ai_message_text_color', 'mobile_ai_message_text_color') as string
                            }
                        )
                      }}>
                        <div 
                          className="leading-relaxed"
                          style={{
                            fontSize: `${getCustomisationValue('message_text_size', 'mobile_message_text_size')}px`,
                            fontWeight: (() => {
                              const weight = getCustomisationValue('message_font_weight', 'mobile_message_font_weight') as string;
                              switch (weight) {
                                case 'light': return '300';
                                case 'normal': return '400';
                                case 'medium': return '500';
                                case 'bold': return '700';
                                default: return '400';
                              }
                            })()
                          }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                              li: ({ children }) => <li>{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => (
                                <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                                  {children}
                                </pre>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      
                      {/* Timestamp */}
                      {(() => {
                        const timestamp = formatTimestamp(message.timestamp);
                        if (!timestamp) return null;
                        
                        // Use fixed styling since timestamp color/size fields don't exist in database
                        const timestampColor = '#999';
                        const timestampSize = 11;
                        
                        return (
                          <div 
                            className={cn(
                              "text-xs",
                              message.role === 'user' ? "text-right" : "text-left"
                            )}
                            style={{
                              color: timestampColor,
                              fontSize: `${timestampSize}px`,
                              marginLeft: message.role === 'user' ? '0' : '8px',
                              marginRight: message.role === 'user' ? '8px' : '0'
                            }}
                          >
                            {timestamp}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* User avatar - right side for user messages */}
                    {message.role === 'user' && renderAvatar(true)}
                  </div>
                ))}
                
                {isLoading && !hasStreamedContent && (
                  <div className="flex items-start gap-2.5 justify-start">
                    {renderAvatar(false)}
                    <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                      {(() => {
                        const typingStyle = (getCustomisationValue('typing_indicator_style', 'mobile_typing_indicator_style') as 'dots' | 'wave' | 'pulse' | 'none') || 'dots';
                        const typingColor = (getCustomisationValue('typing_indicator_color', 'mobile_typing_indicator_color') as string) || (getCustomisationValue('header_background_color', 'mobile_header_background_color') as string) || '#3B82F6';
                        const typingSpeed = (getCustomisationValue('typing_indicator_speed', 'mobile_typing_indicator_speed') as 'slow' | 'normal' | 'fast') || 'normal';
                        
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
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div 
                className="relative z-10 p-3 border-t border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                style={{ 
                  backgroundColor: getCustomisationValue('input_background_color', 'mobile_input_background_color') as string
                }}
              >
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        // Focus is now handled by the body scroll lock above
                        // Just ensure the input gets focus naturally
                      }}
                      onBlur={() => {
                        // Blur is now handled by the body scroll lock above
                        // No additional scroll prevention needed
                      }}
                      placeholder={getCustomisationValue('input_placeholder_text', 'mobile_input_placeholder_text') as string || 'Ask about this space, availability, or key details...'}
                      className="w-full resize-none border border-gray-200 dark:border-gray-700 px-2.5 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-red-500 backdrop-blur-sm transition-all duration-200"
                      rows={1}
                      style={{ 
                        maxHeight: '120px',
                        backgroundColor: getCustomisationValue('input_background_color', 'mobile_input_background_color') as string,
                        fontSize: `${Math.max(16, getCustomisationValue('placeholder_text_size', 'mobile_placeholder_text_size') as number || 16)}px`,
                        borderRadius: `${getCustomisationValue('input_border_radius', 'mobile_input_border_radius')}px`,
                        height: `${getCustomisationValue('input_height', 'mobile_input_height')}px`,
                        minHeight: `${getCustomisationValue('input_height', 'mobile_input_height')}px`,
                        boxSizing: 'border-box'
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className={cn(
                      "rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg",
                      (() => {
                        const size = getCustomisationValue('send_button_size', 'mobile_send_button_size') as 'small' | 'medium' | 'large';
                        switch (size) {
                          case 'small': return 'h-[30px] w-[30px]';
                          case 'large': return 'h-12 w-12';
                          case 'medium':
                          default: return 'h-9 w-9';
                        }
                      })()
                    )}
                    style={{
                      backgroundColor: getCustomisationValue('send_button_color', 'mobile_send_button_color') as string,
                      borderRadius: `${getCustomisationValue('send_button_border_radius', 'mobile_send_button_border_radius')}px`,
                      boxShadow: `0 4px 14px ${getCustomisationValue('send_button_color', 'mobile_send_button_color')}25`
                    }}
                    onMouseEnter={(e) => {
                      const hoverColor = getCustomisationValue('send_button_hover_color', 'mobile_send_button_hover_color') as string;
                      if (hoverColor) {
                        e.currentTarget.style.backgroundColor = hoverColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = getCustomisationValue('send_button_color', 'mobile_send_button_color') as string;
                    }}
                  >
                    {(() => {
                      const iconName = getCustomisationValue('send_button_icon', 'mobile_send_button_icon') as string || 'Send';
                      const SendIconComponent = SEND_ICON_MAP[iconName as keyof typeof SEND_ICON_MAP] || Send;
                      const size = getCustomisationValue('send_button_size', 'mobile_send_button_size') as 'small' | 'medium' | 'large';
                      const iconSize = (() => {
                        switch (size) {
                          case 'small': return 14;
                          case 'large': return 20;
                          case 'medium':
                          default: return 16;
                        }
                      })();
                      
                      return (
                        <SendIconComponent 
                          size={iconSize}
                          style={{ color: getCustomisationValue('send_button_icon_color', 'mobile_send_button_icon_color') as string }}
                        />
                      );
                    })()}
                  </button>
                </div>
                {(getCustomisationValue('show_powered_by', 'mobile_show_powered_by') as boolean) && (
                  <div className="text-center mt-2 pb-0">
                    <a 
                      href="https://www.tourbots.ai" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:underline transition-all duration-200"
                      style={{ 
                        color: '#9CA3AF',
                        textDecoration: 'none',
                        fontSize: `${getCustomisationValue('branding_text_size', 'mobile_branding_text_size')}px`
                      }}
                    >
                      Powered by TourBots AI
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 