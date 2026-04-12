"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { name: 'Blue', value: '#1E40AF' },
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Green', value: '#059669' },
  { name: 'Orange', value: '#EA580C' },
  { name: 'Red', value: '#DC2626' },
  { name: 'Grey', value: '#374151' },
  { name: 'Light', value: '#F3F4F6' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
  showPresets?: boolean;
}

export function ColorPicker({ 
  value, 
  onChange, 
  label = "Colour", 
  className,
  showPresets = true 
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    // Validate hex color format
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleColorPickerChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  const handlePresetSelect = (color: string) => {
    setInputValue(color);
    onChange(color);
  };

  // Split colors into visible (first 3) and hidden (rest)
  const visibleColors = PRESET_COLORS.slice(0, 3);
  const hiddenColors = PRESET_COLORS.slice(3);
  const displayColors = isExpanded ? PRESET_COLORS : visibleColors;

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      
      {/* Streamlined Color Preview and Hex Input */}
      <div className="flex gap-3 items-center">
        {/* Color Square with Hidden Color Picker */}
        <div className="relative">
          <div 
            className="w-10 h-10 rounded-md border-2 border-input shadow-sm cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: value }}
            onClick={() => document.getElementById(`color-picker-${label}`)?.click()}
          />
          <input
            id={`color-picker-${label}`}
            type="color"
            value={value}
            onChange={(e) => handleColorPickerChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        
        {/* Hex Input */}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="#000000"
          className="h-10 text-sm font-mono flex-1 dark:border-input dark:bg-background dark:text-slate-100"
        />
      </div>

      {/* Quick Colors - Collapsible */}
      {showPresets && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Quick Colours</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronRight className="w-3 h-3 mr-1" />
                  More
                </>
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {displayColors.map((preset) => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 px-3 text-xs gap-2 justify-start",
                  preset.value === value && "ring-2 ring-slate-500 ring-offset-1"
                )}
                onClick={() => handlePresetSelect(preset.value)}
              >
                <div
                  className="w-3 h-3 rounded-sm border border-input flex-shrink-0"
                  style={{ backgroundColor: preset.value }}
                />
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 