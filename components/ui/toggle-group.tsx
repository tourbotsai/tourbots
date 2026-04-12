import React, { FC, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ToggleGroupOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string;
  preview?: React.ReactNode;
}

interface ToggleGroupProps {
  options: ToggleGroupOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  type?: 'single' | 'multiple';
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'outline' | 'ghost' | 'cards';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  allowDeselect?: boolean;
  columns?: number;
  fullWidth?: boolean;
  showDescriptions?: boolean;
  showPreviews?: boolean;
}

const ToggleGroup: FC<ToggleGroupProps> = ({
  options,
  value,
  onChange,
  type = 'single',
  size = 'medium',
  variant = 'default',
  orientation = 'horizontal',
  className,
  label,
  description,
  disabled = false,
  allowDeselect = false,
  columns,
  fullWidth = false,
  showDescriptions = false,
  showPreviews = false
}) => {
  const [selectedValue, setSelectedValue] = useState<string | string[]>(
    type === 'multiple' ? (Array.isArray(value) ? value : []) : (value || '')
  );

  useEffect(() => {
    if (type === 'multiple') {
      setSelectedValue(Array.isArray(value) ? value : []);
    } else {
      setSelectedValue(value || '');
    }
  }, [value, type]);

  const handleSelect = (optionValue: string) => {
    if (disabled) return;

    let newValue: string | string[];

    if (type === 'multiple') {
      const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
      if (currentValues.includes(optionValue)) {
        newValue = currentValues.filter(v => v !== optionValue);
      } else {
        newValue = [...currentValues, optionValue];
      }
    } else {
      if (selectedValue === optionValue && allowDeselect) {
        newValue = '';
      } else {
        newValue = optionValue;
      }
    }

    setSelectedValue(newValue);
    onChange?.(newValue);
  };

  const isSelected = (optionValue: string) => {
    if (type === 'multiple') {
      return Array.isArray(selectedValue) && selectedValue.includes(optionValue);
    }
    return selectedValue === optionValue;
  };

  const getButtonVariant = (optionValue: string) => {
    if (variant === 'cards') {
      return 'ghost';
    }
    
    if (isSelected(optionValue)) {
      return variant === 'outline' ? 'default' : 'default';
    }
    
    return variant === 'ghost' ? 'ghost' : 'outline';
  };

  const getButtonSize = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small': return 'sm';
      case 'large': return 'lg';
      default: return 'default';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          button: 'h-8 px-3 text-sm',
          icon: 'h-3 w-3',
          badge: 'text-xs'
        };
      case 'large':
        return {
          button: 'h-12 px-6 text-base',
          icon: 'h-5 w-5',
          badge: 'text-sm'
        };
      default:
        return {
          button: 'h-10 px-4 text-sm',
          icon: 'h-4 w-4',
          badge: 'text-xs'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const getGridClasses = () => {
    if (orientation === 'vertical') {
      return 'flex flex-col gap-2';
    }
    
    if (columns) {
      return `grid grid-cols-${columns} gap-2`;
    }
    
    return 'flex flex-wrap gap-2';
  };

  const renderOption = (option: ToggleGroupOption) => {
    const selected = isSelected(option.value);
    
    if (variant === 'cards') {
      return (
        <div
          key={option.value}
          className={cn(
            "relative border rounded-lg p-4 cursor-pointer transition-all duration-200",
            selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            option.disabled && "opacity-50 cursor-not-allowed",
            fullWidth && "w-full"
          )}
          onClick={() => !option.disabled && handleSelect(option.value)}
        >
          {/* Selection indicator */}
          {selected && (
            <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
          
          {/* Preview */}
          {showPreviews && option.preview && (
            <div className="mb-3">
              {option.preview}
            </div>
          )}
          
          {/* Icon and Label */}
          <div className="flex items-center gap-3 mb-2">
            {option.icon && (
              <div className={cn("text-muted-foreground", selected && "text-primary")}>
                {option.icon}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("font-medium", selected && "text-primary")}>
                  {option.label}
                </span>
                {option.badge && (
                  <Badge variant="secondary" className={sizeClasses.badge}>
                    {option.badge}
                  </Badge>
                )}
              </div>
              {(showDescriptions || option.description) && option.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Button
        key={option.value}
        variant={getButtonVariant(option.value)}
        size={getButtonSize(size)}
        className={cn(
          sizeClasses.button,
          "justify-start gap-2",
          selected && variant === 'outline' && "border-primary bg-primary/5",
          selected && variant === 'ghost' && "bg-primary/10",
          fullWidth && "w-full",
          option.disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !option.disabled && handleSelect(option.value)}
        disabled={option.disabled || disabled}
      >
        {option.icon && (
          <span className={sizeClasses.icon}>
            {option.icon}
          </span>
        )}
        <span className="flex-1 text-left">{option.label}</span>
        {option.badge && (
          <Badge variant="secondary" className={sizeClasses.badge}>
            {option.badge}
          </Badge>
        )}
      </Button>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      {(label || description) && (
        <div className="space-y-1">
          {label && (
            <Label className="text-sm font-medium">{label}</Label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Options */}
      <div className={cn(getGridClasses(), fullWidth && "w-full")}>
        {options.map(renderOption)}
      </div>

      {/* Selection Info */}
      {type === 'multiple' && Array.isArray(selectedValue) && selectedValue.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{selectedValue.length} selected</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedValue([]);
              onChange?.([]);
            }}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

export default ToggleGroup; 