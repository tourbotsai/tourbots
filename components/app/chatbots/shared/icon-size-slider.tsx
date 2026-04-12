"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface IconSizeSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function IconSizeSlider({ 
  value, 
  onChange, 
  label = "Icon Size", 
  className,
  min = 16,
  max = 48,
  step = 2,
}: IconSizeSliderProps) {
  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded dark:border dark:border-input dark:bg-background dark:text-slate-300">
          {value}px
        </div>
      </div>
      
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          max={max}
          min={min}
          step={step}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{min}px</span>
          <span>{Math.round((min + max) / 2)}px</span>
          <span>{max}px</span>
        </div>
      </div>
    </div>
  );
} 