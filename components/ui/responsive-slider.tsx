import React, { FC, useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ResponsiveSliderProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  label?: string;
  description?: string;
  unit?: string;
  showInput?: boolean;
  showBadge?: boolean;
  showMinMaxText?: boolean;
  marks?: { [key: number]: string };
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  mobileBreakpoint?: number;
  formatValue?: (value: number) => string;
}

const ResponsiveSlider: FC<ResponsiveSliderProps> = ({
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  label,
  description,
  unit = '',
  showInput = true,
  showBadge = true,
  showMinMaxText = true,
  marks,
  disabled = false,
  size = 'medium',
  mobileBreakpoint = 768,
  formatValue = (val: number) => `${val}${unit}`
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [inputValue, setInputValue] = useState(value.toString());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  useEffect(() => {
    setLocalValue(value);
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = (newValue: number[]) => {
    const val = newValue[0];
    setLocalValue(val);
    setInputValue(val.toString());
    onChange?.(val);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    const numValue = parseFloat(val);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      setLocalValue(numValue);
      onChange?.(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      setInputValue(localValue.toString());
    }
  };

  const renderMarks = () => {
    if (!marks || isMobile) return null;
    
    return (
      <div className="relative mt-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          {Object.entries(marks).map(([key, label]) => (
            <span key={key} className="relative">
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const sliderSizeClasses = {
    small: 'h-1',
    medium: 'h-2',
    large: 'h-3'
  };

  const inputSizeClasses = {
    small: 'h-8 text-sm',
    medium: 'h-10 text-base',
    large: 'h-12 text-lg'
  };

  const badgeSizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-1',
    large: 'text-base px-4 py-2'
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      {(label || description) && (
        <div className="space-y-1">
          {label && (
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{label}</Label>
              {showBadge && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "font-mono bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors dark:border-input dark:bg-background dark:text-slate-300 dark:hover:bg-neutral-800",
                    "px-2 py-0.5 rounded-full text-xs font-medium shadow-sm",
                    badgeSizeClasses[size]
                  )}
                >
                  {formatValue(localValue)}
                </Badge>
              )}
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Slider Container */}
      <div className="space-y-2">
        <div className={cn("relative", isMobile ? "px-2" : "px-0")}>
          <Slider
            value={[localValue]}
            onValueChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={cn("w-full", sliderSizeClasses[size])}
          />
        </div>

        {/* Marks */}
        {renderMarks()}

        {/* Input Field */}
        {showInput && (
          <div className="flex items-center gap-2 pt-2">
            <Input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              className={cn(
                "w-24 font-mono text-center",
                inputSizeClasses[size],
                isMobile && "w-20",
                "dark:border-input dark:bg-background dark:text-slate-100"
              )}
            />
            {unit && (
              <span className="text-sm text-muted-foreground font-medium">
                {unit}
              </span>
            )}
            {showMinMaxText && !isMobile && (
              <div className="flex gap-1 text-xs text-muted-foreground">
                <span>Min: {min}</span>
                <span>•</span>
                <span>Max: {max}</span>
              </div>
            )}
          </div>
        )}

        {/* Mobile-specific info */}
        {showMinMaxText && isMobile && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Min: {min}</span>
            <span>Max: {max}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveSlider; 