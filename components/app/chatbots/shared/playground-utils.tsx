"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Smartphone, Play, Trash2, Bot, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDesktopToggleProps {
  value: 'desktop' | 'mobile';
  onChange: (value: 'desktop' | 'mobile') => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MobileDesktopToggle: React.FC<MobileDesktopToggleProps> = ({
  value,
  onChange,
  className,
  size = 'md'
}) => {
  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default';
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={value === 'desktop' ? 'default' : 'outline'}
        size={buttonSize}
        onClick={() => onChange('desktop')}
        className="flex items-center gap-2"
      >
        <Monitor className="h-4 w-4" />
        Desktop
      </Button>
      <Button
        variant={value === 'mobile' ? 'default' : 'outline'}
        size={buttonSize}
        onClick={() => onChange('mobile')}
        className="flex items-center gap-2"
      >
        <Smartphone className="h-4 w-4" />
        Mobile
      </Button>
    </div>
  );
};

interface PreviewModeIndicatorProps {
  mode: 'desktop' | 'mobile';
  showPreview?: boolean;
  onTogglePreview?: () => void;
  className?: string;
}

export const PreviewModeIndicator: React.FC<PreviewModeIndicatorProps> = ({
  mode,
  showPreview = true,
  onTogglePreview,
  className
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="outline" className="flex items-center gap-1">
        {mode === 'desktop' ? <Monitor className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
        {mode === 'desktop' ? 'Desktop' : 'Mobile'} Mode
      </Badge>
      {onTogglePreview && (
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePreview}
          className="flex items-center gap-2"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Hide' : 'Show'} Preview
        </Button>
      )}
    </div>
  );
};

interface PlaygroundHeaderProps {
  title: string;
  description?: string;
  mode: 'desktop' | 'mobile';
  onModeChange: (mode: 'desktop' | 'mobile') => void;
  showPreview?: boolean;
  onTogglePreview?: () => void;
  onStartNewSession?: () => void;
  onClearChat?: () => void;
  messageCount?: number;
  className?: string;
  badge?: string;
}

export const PlaygroundHeader: React.FC<PlaygroundHeaderProps> = ({
  title,
  description,
  mode,
  onModeChange,
  showPreview = true,
  onTogglePreview,
  onStartNewSession,
  onClearChat,
  messageCount = 0,
  className,
  badge
}) => {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left side - Title and Description */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              {badge && (
                <Badge variant="secondary">{badge}</Badge>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>

          {/* Right side - Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <MobileDesktopToggle
                value={mode}
                onChange={onModeChange}
                size="sm"
              />
            </div>

            {/* Preview Toggle */}
            {onTogglePreview && (
              <PreviewModeIndicator
                mode={mode}
                showPreview={showPreview}
                onTogglePreview={onTogglePreview}
              />
            )}

            {/* Chat Controls */}
            <div className="flex items-center gap-2">
              {onStartNewSession && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStartNewSession}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start New Session
                </Button>
              )}
              
              {onClearChat && messageCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearChat}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Chat
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Message Count Indicator */}
        {messageCount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Badge variant="outline" className="text-xs">
              {messageCount} message{messageCount !== 1 ? 's' : ''} in conversation
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface PlaygroundStatsProps {
  mode: 'desktop' | 'mobile';
  customisationCount: number;
  activeFields: number;
  totalFields: number;
  className?: string;
}

export const PlaygroundStats: React.FC<PlaygroundStatsProps> = ({
  mode,
  customisationCount,
  activeFields,
  totalFields,
  className
}) => {
  const completionPercentage = Math.round((activeFields / totalFields) * 100);
  
  return (
    <Card className={cn("bg-gradient-to-r from-blue-50 to-purple-50", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Customisation Status</h3>
            <p className="text-sm text-gray-600">
              {activeFields} of {totalFields} {mode} fields configured
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface TestPromptsProps {
  prompts: Array<{
    category: string;
    text: string;
    emoji: string;
  }>;
  onPromptClick: (prompt: string) => void;
  className?: string;
}

export const TestPrompts: React.FC<TestPromptsProps> = ({
  prompts,
  onPromptClick,
  className
}) => {
  return (
    <Card className={cn("bg-gradient-to-br from-gray-50 to-white", className)}>
      <CardContent className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">Test Prompts</h3>
        <p className="text-sm text-gray-600 mb-4">
          Click any prompt to quickly test different scenarios
        </p>
        
        <div className="grid gap-2">
          {prompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start h-auto p-3 text-left"
              onClick={() => onPromptClick(prompt.text)}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{prompt.emoji}</span>
                <div>
                  <div className="font-medium text-sm">{prompt.category}</div>
                  <div className="text-xs text-gray-600 mt-1">{prompt.text}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default {
  MobileDesktopToggle,
  PreviewModeIndicator,
  PlaygroundHeader,
  PlaygroundStats,
  TestPrompts,
}; 