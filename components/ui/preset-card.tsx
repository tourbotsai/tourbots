import React, { FC, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Eye, Download, Heart, Star, Sparkles, Building2, Zap, CheckCircle } from 'lucide-react';
import { 
  getIdleAnimationClass, 
  calculateAnimationInterval, 
  generateCustomKeyframes,
  type AnimationSpeed 
} from '@/lib/utils/animation-timing';

interface PresetCardProps {
  preset: {
    id: string;
    name: string;
    description: string;
    category: string;
    popularity?: number;
    isNew?: boolean;
    isPremium?: boolean;
    isFeatured?: boolean;
    preview?: {
      primary_colour: string;
      secondary_colour: string;
      text_colour: string;
      background_colour: string;
      border_radius: number;
      chat_button_animation: string;
      font_family: string;
    };
    config?: {
      chat_button_animation: string;
      idle_animation_enabled: boolean;
      idle_animation_type: string;
      idle_animation_interval: number;
      animation_speed: AnimationSpeed;
      enable_animations: boolean;
    };
    tags?: string[];
  };
  isSelected?: boolean;
  onSelect?: (presetId: string) => void;
  onPreview?: (presetId: string) => void;
  onFavorite?: (presetId: string) => void;
  isFavorite?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showActions?: boolean;
  showPreview?: boolean;
}

const PresetCard: FC<PresetCardProps> = ({
  preset,
  isSelected = false,
  onSelect,
  onPreview,
  onFavorite,
  isFavorite = false,
  className,
  size = 'medium',
  showActions = true,
  showPreview = true
}) => {
  const [animationStylesInjected, setAnimationStylesInjected] = useState(false);
  const idleAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inject animation styles
  useEffect(() => {
    if (!animationStylesInjected) {
      const styleElement = document.createElement('style');
      styleElement.textContent = generateCustomKeyframes();
      document.head.appendChild(styleElement);
      setAnimationStylesInjected(true);
    }
  }, [animationStylesInjected]);

  // Handle interval-based animations
  useEffect(() => {
    if (idleAnimationTimeoutRef.current) {
      clearInterval(idleAnimationTimeoutRef.current);
    }

    const config = preset.config;
    if (config && config.idle_animation_enabled && config.idle_animation_interval > 0 && config.idle_animation_type !== 'none') {
      const interval = calculateAnimationInterval(config.idle_animation_interval, config.animation_speed);
      const idleAnimationClass = getIdleAnimationClass(config.idle_animation_type as any, config.animation_speed);
      
      const triggerAnimation = () => {
        const button = document.querySelector(`[data-preset-button="${preset.id}"]`) as HTMLElement;
        if (button && idleAnimationClass) {
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
  }, [preset.id, preset.config]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleAnimationTimeoutRef.current) {
        clearInterval(idleAnimationTimeoutRef.current);
      }
    };
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'business':
        return <Building2 className="h-4 w-4" />;
      case 'modern':
        return <Sparkles className="h-4 w-4" />;
      case 'playful':
        return <Zap className="h-4 w-4" />;
      case 'minimal':
        return <Star className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getCategoryColour = (category: string) => {
    switch (category.toLowerCase()) {
      case 'business':
        return 'bg-blue-100 text-blue-800';
      case 'modern':
        return 'bg-purple-100 text-purple-800';
      case 'playful':
        return 'bg-green-100 text-green-800';
      case 'minimal':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderPresetPreview = () => {
    if (!showPreview || !preset.preview) return null;

    return (
      <div className="relative mb-4">
        <div className="bg-gray-100 rounded-lg p-4 min-h-[120px] flex items-center justify-center dark:border dark:border-input dark:bg-background">
          {/* Chat Button Preview */}
          <div className="relative">
            <div
              data-preset-button={preset.id}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
              style={{
                backgroundColor: preset.preview.primary_colour,
                borderRadius: `${preset.preview.border_radius}px`
              }}
            >
              <span className="text-white text-lg">💬</span>
            </div>
          </div>
        </div>
        
        {/* Colour Palette */}
        <div className="flex justify-center mt-2 space-x-1">
          <div
            className="w-3 h-3 rounded-full border border-gray-300"
            style={{ backgroundColor: preset.preview.primary_colour }}
            title="Primary Colour"
          />
          <div
            className="w-3 h-3 rounded-full border border-gray-300"
            style={{ backgroundColor: preset.preview.secondary_colour }}
            title="Secondary Colour"
          />
          <div
            className="w-3 h-3 rounded-full border border-gray-300"
            style={{ backgroundColor: preset.preview.text_colour }}
            title="Text Colour"
          />
          <div
            className="w-3 h-3 rounded-full border border-gray-300"
            style={{ backgroundColor: preset.preview.background_colour }}
            title="Background Colour"
          />
        </div>
      </div>
    );
  };

  const cardSizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  const titleSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const descriptionSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <Card
      className={cn(
        "group relative transition-all duration-300 hover:shadow-lg dark:border-input dark:bg-background",
        isSelected && "ring-2 ring-primary border-primary",
        preset.isFeatured && "ring-1 ring-yellow-400 border-yellow-400",
        className
      )}
    >
      {/* Header Badges */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {preset.isNew && (
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:border-input dark:bg-background dark:text-slate-300">
            New
          </Badge>
        )}
        {preset.isPremium && (
          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:border-input dark:bg-background dark:text-slate-300">
            Premium
          </Badge>
        )}
        {preset.isFeatured && (
          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:border-input dark:bg-background dark:text-slate-300">
            Featured
          </Badge>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}

      <CardHeader className="pb-0 px-4 pt-4">
        <CardTitle className={cn("mb-0", titleSizeClasses[size])}>
          {preset.name}
        </CardTitle>
      </CardHeader>

      <CardContent className={cn("pt-2", cardSizeClasses[size])}>
        {/* Preview */}
        {renderPresetPreview()}

        {/* Description */}
        <p className={cn("text-muted-foreground mb-3", descriptionSizeClasses[size])}>
          {preset.description}
        </p>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 px-3"
              title="Preview this preset temporarily"
              onClick={(e) => {
                e.stopPropagation();
                onPreview?.(preset.id);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1 px-3"
              title="Apply this preset to your chatbot"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(preset.id);
              }}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PresetCard; 