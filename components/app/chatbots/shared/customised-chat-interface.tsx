"use client";

import { useMemo, useRef, useEffect } from "react";
import { ChatbotCustomisation, ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ICON_MAP = {
  MessageCircle, MessageSquare, Bot, Headphones, HelpCircle,
  Mail, Phone, Users, Zap, Heart, Star, Settings, Info, Search
};

interface CustomisedChatInterfaceProps {
  customisation: ChatbotCustomisation;
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
}

export function CustomisedChatInterface({
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
  className
}: CustomisedChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const IconComponent = ICON_MAP[customisation.chat_button_icon as keyof typeof ICON_MAP] || MessageCircle;

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

  const renderChatIcon = (size: 'header' | 'avatar') => {
    const iconSize = size === 'header' ? customisation.header_icon_size : 16;
    const iconStyle = { width: `${iconSize}px`, height: `${iconSize}px` };
    
    if (customisation.custom_logo_url) {
      return (
        <img 
          src={customisation.custom_logo_url} 
          alt="Custom chat icon" 
          className="object-contain"
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
      );
    }
    return <IconComponent style={iconStyle} />;
  };

  return (
    <div 
      className={cn("rounded-lg shadow-xl border border-input overflow-hidden flex flex-col", className)}
      style={{ 
        width: `${Math.min(customisation.window_width, 500)}px`,
        height: `${Math.min(customisation.window_height, 600)}px`
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b flex-shrink-0"
        style={{ 
          backgroundColor: customisation.header_background_color,
          color: customisation.header_text_color
        }}
      >
        <div className="flex items-center gap-2">
          {customisation.custom_logo_url ? (
            <>
              {renderChatIcon('header')}
              <IconComponent 
                style={{ 
                  display: 'none', 
                  color: customisation.header_text_color,
                  width: `${customisation.header_icon_size}px`,
                  height: `${customisation.header_icon_size}px`
                }}
              />
            </>
          ) : (
            <IconComponent 
              style={{ 
                color: customisation.header_text_color,
                width: `${customisation.header_icon_size}px`,
                height: `${customisation.header_icon_size}px`
              }}
            />
          )}
          <span className="font-medium text-sm">
            {customisation.window_title || 'AI Assistant'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-6 h-6 p-0 hover:bg-white/20"
          >
            <Minimize2 className="w-3 h-3" style={{ color: customisation.header_text_color }} />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-6 h-6 p-0 hover:bg-white/20"
          >
            <X className="w-3 h-3" style={{ color: customisation.header_text_color }} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 p-3 space-y-3 bg-white overflow-y-auto min-h-0"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            {customisation.custom_logo_url ? (
              <img 
                src={customisation.custom_logo_url} 
                alt="Custom chat icon" 
                className="w-12 h-12 mx-auto mb-4 object-contain opacity-30"
              />
            ) : (
              <IconComponent className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            )}
            <p>{emptyStateTitle}</p>
            <p className="text-sm">{emptyStateSubtitle}</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2 max-w-[85%]",
              message.role === 'assistant' ? "mr-auto" : "ml-auto flex-row-reverse"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
              message.role === 'assistant' 
                ? "bg-gray-300" 
                : "bg-gray-300"
            )}>
              {message.role === 'assistant' ? (
                customisation.custom_logo_url ? (
                  <img 
                    src={customisation.custom_logo_url} 
                    alt="AI" 
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  <Bot className="w-3 h-3 text-gray-600" />
                )
              ) : (
                <User className="w-3 h-3 text-gray-600" />
              )}
            </div>
            <div 
              className="rounded-lg px-3 py-2 max-w-xs text-sm"
              style={message.role === 'assistant' ? {
                backgroundColor: customisation.ai_message_background,
                color: customisation.ai_message_text_color
              } : {
                backgroundColor: customisation.user_message_background,
                color: customisation.user_message_text_color
              }}
            >
              {/* Show typing indicator if assistant message is streaming without content yet */}
              {message.role === 'assistant' && !message.content && (message as any).isStreaming && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ 
                            backgroundColor: customisation.header_background_color || '#3B82F6',
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: '1.4s'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs" style={{ opacity: 0.7 }}>
                    typing...
                  </span>
                </div>
              )}
              
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
                      pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono overflow-x-auto mb-2 last:mb-0">{children}</pre>,
                    }}
                  >
                    {message.content.trim()}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div 
        className="p-3 border-t flex-shrink-0"
        style={{ backgroundColor: customisation.input_background_color }}
      >
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={customisation.input_placeholder_text || placeholder}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-20"
            disabled={isLoadingMessage}
            style={{ 
              minHeight: '32px',
              fontSize: `${Math.max(16, customisation.placeholder_text_size || 16)}px`
            }}
          />
          <Button
            onClick={onSendMessage}
            disabled={!inputMessage.trim() || isLoadingMessage}
            size="sm"
            className="w-8 h-8 p-0 flex-shrink-0"
            style={{ 
              backgroundColor: customisation.send_button_color,
              color: customisation.send_button_icon_color
            }}
          >
            {isLoadingMessage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Powered by branding */}
        {customisation.show_powered_by && (
          <div className="flex items-center justify-center mt-2">
            <div className="text-xs text-muted-foreground bg-white/50 px-2 py-1 rounded">
              Powered by TourBots
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 