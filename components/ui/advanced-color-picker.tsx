import React, { FC, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import ResponsiveSlider from './responsive-slider';

interface AdvancedColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  supportShadow?: boolean;
  supportTransparency?: boolean;
  placeholder?: string;
  size?: 'sm' | 'default' | 'lg';
}

interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

// Enhanced preset colours with professional organisation
const PRESET_CATEGORIES = {
  'Professional': [
    '#1890FF', '#096DD9', '#0050B3', '#003A8C', '#002766',
    '#722ED1', '#531DAB', '#391085', '#10239E', '#0D1A75',
    '#13C2C2', '#08979C', '#006D75', '#00474F', '#002329',
    '#52C41A', '#389E0D', '#237804', '#135200', '#092B00'
  ],
  'Neutrals': [
    '#000000', '#262626', '#434343', '#595959', '#8C8C8C',
    '#BFBFBF', '#D9D9D9', '#F5F5F5', '#FAFAFA', '#FFFFFF',
    '#FA8C16', '#D46B08', '#AD4E00', '#873800', '#612500',
    '#FADB14', '#D4B106', '#AD8B00', '#876800', '#614700'
  ],
  'Brand Colours': [
    '#FF4D4F', '#FF7875', '#FFA39E', '#FFCCC7', '#FFE1E1',
    '#FA541C', '#FF7A45', '#FF9C6E', '#FFBB96', '#FFD8BF',
    '#FAAD14', '#FFC53D', '#FFD666', '#FFE58F', '#FFF1B8',
    '#EB2F96', '#F759AB', '#FF85C0', '#FFADD2', '#FFD6E7'
  ],
  'Modern': [
    '#2F54EB', '#597EF7', '#85A5FF', '#ADC6FF', '#D6E4FF',
    '#722ED1', '#9254DE', '#B37FEB', '#D3ADF7', '#EFDBFF',
    '#13C2C2', '#36CFC9', '#5CDBD3', '#87E8DE', '#B5F5EC',
    '#F5222D', '#FF4D4F', '#FF7875', '#FFA39E', '#FFCCC7'
  ]
};

const AdvancedColorPicker: FC<AdvancedColorPickerProps> = ({ 
  value = '#1890FF', 
  onChange, 
  className, 
  supportShadow = false,
  supportTransparency = false,
  placeholder = '#1890FF',
  size = 'default'
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [hsv, setHsv] = useState<HSV>({ h: 210, s: 91, v: 100 });
  const [opacity, setOpacity] = useState(1);
  const [isDragging, setIsDragging] = useState<'saturation' | 'hue' | null>(null);

  // Colour conversion functions
  const hexToRgb = (hex: string): RGB => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 24, g: 144, b: 255 };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const rgbToHsv = (r: number, g: number, b: number): HSV => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
      switch (max) {
        case r: h = ((g - b) / diff + (g < b ? 6 : 0)) * 60; break;
        case g: h = ((b - r) / diff + 2) * 60; break;
        case b: h = ((r - g) / diff + 4) * 60; break;
      }
    }
    
    const s = max === 0 ? 0 : (diff / max) * 100;
    const v = max * 100;
    
    return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
  };

  const hsvToRgb = (h: number, s: number, v: number): RGB => {
    const hNorm = h / 360;
    const sNorm = s / 100;
    const vNorm = v / 100;
    
    const i = Math.floor(hNorm * 6);
    const f = hNorm * 6 - i;
    const p = vNorm * (1 - sNorm);
    const q = vNorm * (1 - f * sNorm);
    const t = vNorm * (1 - (1 - f) * sNorm);
    
    let r = 0, g = 0, b = 0;
    
    switch (i % 6) {
      case 0: r = vNorm; g = t; b = p; break;
      case 1: r = q; g = vNorm; b = p; break;
      case 2: r = p; g = vNorm; b = t; break;
      case 3: r = p; g = q; b = vNorm; break;
      case 4: r = t; g = p; b = vNorm; break;
      case 5: r = vNorm; g = p; b = q; break;
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  // Initialise HSV from hex value
  useEffect(() => {
    if (value && value.startsWith('#')) {
      const rgb = hexToRgb(value);
      const hsvColor = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv(hsvColor);
    }
    setInputValue(value);
  }, [value]);

  const updateColor = (newHsv: HSV, newOpacity?: number) => {
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b);
    const finalOpacity = newOpacity !== undefined ? newOpacity : opacity;
    
    setHsv(newHsv);
    if (newOpacity !== undefined) setOpacity(newOpacity);
    
    let colorValue = hexColor;
    if (supportTransparency && finalOpacity < 1) {
      colorValue = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalOpacity})`;
    }
    
    setInputValue(colorValue);
    onChange?.(colorValue);
  };

  // Handle mouse events for dragging
  const handleMouseDown = (type: 'saturation' | 'hue') => (e: React.MouseEvent) => {
    setIsDragging(type);
    handleMouseMove(type)(e);
  };

  const handleMouseMove = (type: 'saturation' | 'hue') => (e: React.MouseEvent) => {
    if (isDragging !== type && isDragging !== null && isDragging !== type) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    if (type === 'saturation') {
      const s = Math.round((x / rect.width) * 100);
      const v = Math.round(100 - (y / rect.height) * 100);
      updateColor({ ...hsv, s, v });
    } else if (type === 'hue') {
      const h = Math.round((x / rect.width) * 360);
      updateColor({ ...hsv, h });
    }
  };

  // Global mouse up handler
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(null);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const target = isDragging === 'saturation' 
        ? document.querySelector('.saturation-picker') 
        : document.querySelector('.hue-picker');
      
      if (!target) return;
      
      const rect = target.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      if (isDragging === 'saturation') {
        const s = Math.round((x / rect.width) * 100);
        const v = Math.round(100 - (y / rect.height) * 100);
        updateColor({ ...hsv, s, v });
      } else if (isDragging === 'hue') {
        const h = Math.round((x / rect.width) * 360);
        updateColor({ ...hsv, h });
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, hsv]);

  const handlePresetClick = (color: string) => {
    setInputValue(color);
    onChange?.(color);
    if (color.startsWith('#')) {
      const rgb = hexToRgb(color);
      const hsvColor = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv(hsvColor);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue) || 
        /^rgba?\(/.test(newValue) || 
        /^\d+px\s+\d+px\s+\d+px/.test(newValue)) {
      onChange?.(newValue);
      
      // Update HSV when hex is entered
      if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue)) {
        const rgb = hexToRgb(newValue);
        const hsvColor = rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHsv(hsvColor);
      }
    }
  };

  const ColorSpectrum = () => {
    const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);
    const baseHue = hsvToRgb(hsv.h, 100, 100);
    const baseHueHex = rgbToHex(baseHue.r, baseHue.g, baseHue.b);

    return (
      <div className="space-y-4">
        {/* Saturation/Value Picker */}
        <div 
          className="saturation-picker relative w-64 h-40 rounded-lg overflow-hidden cursor-crosshair select-none shadow-inner"
          style={{
            background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${baseHueHex})`
          }}
          onMouseDown={handleMouseDown('saturation')}
          onMouseMove={isDragging === 'saturation' ? handleMouseMove('saturation') : undefined}
        >
          <div 
            className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${hsv.s}%`,
              top: `${100 - hsv.v}%`,
              backgroundColor: currentHex,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
        </div>

        {/* Hue Slider */}
        <div>
          <div 
            className="hue-picker relative w-64 h-4 rounded cursor-pointer select-none shadow-inner"
            style={{
              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
            }}
            onMouseDown={handleMouseDown('hue')}
            onMouseMove={isDragging === 'hue' ? handleMouseMove('hue') : undefined}
          >
            <div 
              className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-0 pointer-events-none"
              style={{
                left: `${(hsv.h / 360) * 100}%`,
                backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
              }}
            />
          </div>
        </div>

        {/* Transparency Slider */}
        {supportTransparency && (
          <div>
            <p className="text-sm font-medium mb-2">Opacity: {Math.round(opacity * 100)}%</p>
            <ResponsiveSlider
              value={opacity}
              onChange={(value) => updateColor(hsv, value)}
              min={0}
              max={1}
              step={0.01}
              showInput={false}
              showBadge={false}
              className="w-64"
            />
          </div>
        )}

        {/* Current Colour Display */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div 
            className="w-12 h-12 rounded-lg border border-gray-300 shadow-sm"
            style={{ backgroundColor: currentHex }}
          />
          <div>
            <p className="text-sm font-medium">Current Colour</p>
            <p className="text-xs text-gray-500 font-mono">{currentHex}</p>
          </div>
        </div>
      </div>
    );
  };

  const PresetColors = () => (
    <div className="w-80 space-y-4">
      {Object.entries(PRESET_CATEGORIES).map(([categoryName, colors]) => (
        <div key={categoryName}>
          <p className="text-sm font-medium text-gray-700 mb-2">{categoryName}</p>
          <div className="grid grid-cols-10 gap-1.5">
            {colors.map(color => (
              <Button
                key={color}
                variant="outline"
                className="w-6 h-6 p-0 border border-gray-200 rounded transition-all duration-200 hover:scale-110 hover:shadow-md"
                style={{ 
                  backgroundColor: color,
                  border: inputValue === color ? '2px solid #1890FF' : '1px solid #d9d9d9'
                }}
                onClick={() => handlePresetClick(color)}
                title={color}
              />
            ))}
          </div>
          {categoryName !== 'Modern' && <Separator className="my-3" />}
        </div>
      ))}
    </div>
  );

  const displayColor = (() => {
    if (inputValue) {
      if (inputValue.startsWith('#')) return inputValue;
      if (inputValue.startsWith('rgba')) return inputValue;
    }
    return '#1890FF';
  })();

  const buttonSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(buttonSize, "p-0 border rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md")}
            style={{ backgroundColor: displayColor }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <Tabs defaultValue="spectrum" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="spectrum">Colour Spectrum</TabsTrigger>
              <TabsTrigger value="presets">Colour Presets</TabsTrigger>
            </TabsList>
            <TabsContent value="spectrum" className="mt-4">
              <ColorSpectrum />
            </TabsContent>
            <TabsContent value="presets" className="mt-4">
              <PresetColors />
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={supportShadow ? "Colour or shadow" : placeholder}
        onBlur={() => setInputValue(value)}
        className="font-mono text-sm transition-all duration-200"
      />
    </div>
  );
};

export default AdvancedColorPicker; 