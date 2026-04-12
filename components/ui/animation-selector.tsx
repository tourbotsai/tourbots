import React, { FC, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Zap, RotateCcw, Loader, Play, Pause } from 'lucide-react';
import ResponsiveSlider from './responsive-slider';

interface AnimationSelectorProps {
  values: {
    chat_button_animation?: string;
    animation_interval?: number;
    typing_indicator_enabled?: boolean;
    typing_indicator_animation?: string;
    loading_animation?: string;
    animation_duration?: number;
    animation_easing?: string;
  };
  onChange?: (field: string, value: string | number | boolean) => void;
  className?: string;
  showPreview?: boolean;
}

const BUTTON_ANIMATIONS = [
  { value: 'none', label: 'None', description: 'No animation' },
  { value: 'bounce', label: 'Bounce', description: 'Gentle bounce effect' },
  { value: 'pulse', label: 'Pulse', description: 'Subtle pulsing' },
  { value: 'shake', label: 'Shake', description: 'Attention-grabbing shake' },
  { value: 'glow', label: 'Glow', description: 'Glowing effect' },
  { value: 'float', label: 'Float', description: 'Floating motion' },
  { value: 'wobble', label: 'Wobble', description: 'Playful wobble' },
];

const TYPING_ANIMATIONS = [
  { value: 'dots', label: 'Dots', description: 'Three bouncing dots' },
  { value: 'wave', label: 'Wave', description: 'Wave-like motion' },
  { value: 'pulse', label: 'Pulse', description: 'Pulsing indicator' },
  { value: 'typing', label: 'Typing', description: 'Typewriter effect' },
];

const LOADING_ANIMATIONS = [
  { value: 'spinner', label: 'Spinner', description: 'Rotating spinner' },
  { value: 'dots', label: 'Dots', description: 'Loading dots' },
  { value: 'bars', label: 'Bars', description: 'Loading bars' },
  { value: 'circle', label: 'Circle', description: 'Progress circle' },
];

const ANIMATION_EASINGS = [
  { value: 'ease', label: 'Ease', description: 'Standard easing' },
  { value: 'ease-in', label: 'Ease In', description: 'Slow start' },
  { value: 'ease-out', label: 'Ease Out', description: 'Slow end' },
  { value: 'ease-in-out', label: 'Ease In Out', description: 'Slow start and end' },
  { value: 'linear', label: 'Linear', description: 'Constant speed' },
];

const AnimationSelector: FC<AnimationSelectorProps> = ({
  values,
  onChange,
  className,
  showPreview = true
}) => {
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);

  const handleChange = (field: string, value: string | number | boolean) => {
    onChange?.(field, value);
  };

  const playPreview = (animationType: string) => {
    setPreviewPlaying(animationType);
    setTimeout(() => setPreviewPlaying(null), 2000);
  };

  const renderAnimationPreview = () => {
    if (!showPreview) return null;

    const buttonAnimation = values.chat_button_animation || 'none';
    const typingAnimation = values.typing_indicator_animation || 'dots';
    const loadingAnimation = values.loading_animation || 'spinner';

    return (
      <Card className="mb-6 bg-gradient-to-br from-blue-50 to-white border border-blue-200">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Animation Preview</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Chat Button Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">Chat Button</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => playPreview('button')}
                    className="h-6 w-6 p-0"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-center p-4 bg-gray-100 rounded-lg">
                  <div
                    className={cn(
                      "w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg",
                      buttonAnimation !== 'none' && previewPlaying === 'button' && getAnimationClass(buttonAnimation)
                    )}
                  >
                    <span className="text-white text-lg">💬</span>
                  </div>
                </div>
              </div>

              {/* Typing Indicator Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">Typing</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => playPreview('typing')}
                    className="h-6 w-6 p-0"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-center p-4 bg-gray-100 rounded-lg">
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      previewPlaying === 'typing' && getTypingAnimationClass(typingAnimation)
                    )}
                  >
                    {renderTypingIndicator(typingAnimation)}
                  </div>
                </div>
              </div>

              {/* Loading Animation Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">Loading</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => playPreview('loading')}
                    className="h-6 w-6 p-0"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex justify-center p-4 bg-gray-100 rounded-lg">
                  <div
                    className={cn(
                      previewPlaying === 'loading' && getLoadingAnimationClass(loadingAnimation)
                    )}
                  >
                    {renderLoadingIndicator(loadingAnimation)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getAnimationClass = (animation: string) => {
    switch (animation) {
      case 'bounce': return 'animate-bounce';
      case 'pulse': return 'animate-pulse';
      case 'shake': return 'animate-shake';
      case 'glow': return 'animate-glow';
      case 'float': return 'animate-float';
      case 'wobble': return 'animate-wobble';
      default: return '';
    }
  };

  const getTypingAnimationClass = (animation: string) => {
    switch (animation) {
      case 'dots': return 'animate-typing-dots';
      case 'wave': return 'animate-typing-wave';
      case 'pulse': return 'animate-typing-pulse';
      case 'typing': return 'animate-typing';
      default: return '';
    }
  };

  const getLoadingAnimationClass = (animation: string) => {
    switch (animation) {
      case 'spinner': return 'animate-spin';
      case 'dots': return 'animate-loading-dots';
      case 'bars': return 'animate-loading-bars';
      case 'circle': return 'animate-loading-circle';
      default: return '';
    }
  };

  const renderTypingIndicator = (animation: string) => {
    switch (animation) {
      case 'dots':
        return (
          <>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </>
        );
      case 'wave':
        return (
          <>
            <div className="w-1 h-4 bg-gray-400 rounded"></div>
            <div className="w-1 h-6 bg-gray-400 rounded"></div>
            <div className="w-1 h-4 bg-gray-400 rounded"></div>
          </>
        );
      case 'pulse':
        return <div className="w-6 h-2 bg-gray-400 rounded-full"></div>;
      case 'typing':
        return <div className="text-gray-400 text-sm">Typing...</div>;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded"></div>;
    }
  };

  const renderLoadingIndicator = (animation: string) => {
    switch (animation) {
      case 'spinner':
        return <Loader className="h-6 w-6 text-gray-400" />;
      case 'dots':
        return (
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        );
      case 'bars':
        return (
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-gray-400 rounded"></div>
            <div className="w-1 h-6 bg-gray-400 rounded"></div>
            <div className="w-1 h-4 bg-gray-400 rounded"></div>
          </div>
        );
      case 'circle':
        return (
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full"></div>
        );
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded"></div>;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Animation Preview */}
      {renderAnimationPreview()}

      {/* Chat Button Animations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-gray-600" />
          <Label className="text-sm font-medium">Chat Button Animation</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose an animation for your chat button to attract attention
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Animation Type</Label>
            <Select
              value={values.chat_button_animation || 'none'}
              onValueChange={(value) => handleChange('chat_button_animation', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select animation" />
              </SelectTrigger>
              <SelectContent>
                {BUTTON_ANIMATIONS.map((animation) => (
                  <SelectItem key={animation.value} value={animation.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{animation.label}</span>
                      <span className="text-xs text-muted-foreground">{animation.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <ResponsiveSlider
              label="Animation Interval"
              value={values.animation_interval || 5}
              onChange={(value) => handleChange('animation_interval', value)}
              min={1}
              max={30}
              step={1}
              unit="s"
              description="How often the animation repeats"
            />
          </div>
        </div>
      </div>

      {/* Typing Indicator */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Loader className="h-4 w-4 text-gray-600" />
          <Label className="text-sm font-medium">Typing Indicator</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Show when the AI is typing a response
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Enable Typing Indicator</Label>
              <Switch
                checked={values.typing_indicator_enabled || false}
                onCheckedChange={(checked) => handleChange('typing_indicator_enabled', checked)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Animation Style</Label>
            <Select
              value={values.typing_indicator_animation || 'dots'}
              onValueChange={(value) => handleChange('typing_indicator_animation', value)}
              disabled={!values.typing_indicator_enabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {TYPING_ANIMATIONS.map((animation) => (
                  <SelectItem key={animation.value} value={animation.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{animation.label}</span>
                      <span className="text-xs text-muted-foreground">{animation.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading Animation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-gray-600" />
          <Label className="text-sm font-medium">Loading Animation</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Animation shown while loading responses or data
        </p>
        
        <div className="space-y-2">
          <Label className="text-sm">Loading Animation Type</Label>
          <Select
            value={values.loading_animation || 'spinner'}
            onValueChange={(value) => handleChange('loading_animation', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select animation" />
            </SelectTrigger>
            <SelectContent>
              {LOADING_ANIMATIONS.map((animation) => (
                <SelectItem key={animation.value} value={animation.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{animation.label}</span>
                    <span className="text-xs text-muted-foreground">{animation.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Animation Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-gray-600" />
          <Label className="text-sm font-medium">Animation Settings</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Fine-tune animation timing and easing
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResponsiveSlider
            label="Animation Duration"
            value={values.animation_duration || 300}
            onChange={(value) => handleChange('animation_duration', value)}
            min={100}
            max={2000}
            step={100}
            unit="ms"
            description="How long animations take to complete"
          />
          
          <div className="space-y-2">
            <Label className="text-sm">Animation Easing</Label>
            <Select
              value={values.animation_easing || 'ease'}
              onValueChange={(value) => handleChange('animation_easing', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select easing" />
              </SelectTrigger>
              <SelectContent>
                {ANIMATION_EASINGS.map((easing) => (
                  <SelectItem key={easing.value} value={easing.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{easing.label}</span>
                      <span className="text-xs text-muted-foreground">{easing.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimationSelector; 