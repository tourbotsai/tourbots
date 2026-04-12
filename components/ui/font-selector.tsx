import React, { FC } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Type, Bold, AlignLeft } from 'lucide-react';
import ResponsiveSlider from './responsive-slider';

interface FontSelectorProps {
  values: {
    font_family?: string;
    header_text_size?: number;
    message_text_size?: number;
    placeholder_text_size?: number;
    branding_text_size?: number;
    message_font_weight?: string;
    header_font_weight?: string;
  };
  onChange?: (field: string, value: string | number) => void;
  className?: string;
  showPreview?: boolean;
}

const FontSelector: FC<FontSelectorProps> = ({ 
  values, 
  onChange, 
  className,
  showPreview = true
}) => {
  const fontFamilies = [
    { 
      label: 'System Default', 
      value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      category: 'System'
    },
    { label: 'Arial', value: 'Arial, sans-serif', category: 'Sans Serif' },
    { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif', category: 'Sans Serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif', category: 'Serif' },
    { label: 'Georgia', value: 'Georgia, serif', category: 'Serif' },
    { label: 'Courier New', value: '"Courier New", Courier, monospace', category: 'Monospace' },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif', category: 'Sans Serif' },
    { label: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif', category: 'Sans Serif' },
    { label: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif', category: 'Serif' },
    { label: 'Lucida Sans', value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif', category: 'Sans Serif' },
    { label: 'Impact', value: 'Impact, Charcoal, sans-serif', category: 'Display' },
    { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive', category: 'Cursive' },
  ];

  const fontWeights = [
    { label: 'Light', value: 'light' },
    { label: 'Normal', value: 'normal' },
    { label: 'Medium', value: 'medium' },
    { label: 'Bold', value: 'bold' },
  ];

  const handleChange = (field: string, value: string | number) => {
    onChange?.(field, value);
  };

  const renderFontPreview = () => {
    if (!showPreview) return null;
    
    const currentFont = values.font_family || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const headerSize = values.header_text_size || 16;
    const messageSize = values.message_text_size || 14;
    const placeholderSize = values.placeholder_text_size || 14;
    const brandingSize = values.branding_text_size || 12;
    
    return (
      <Card className="mb-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Type className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Font Preview</span>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Header</Badge>
                <div
                  style={{
                    fontFamily: currentFont,
                    fontSize: `${headerSize}px`,
                    fontWeight: values.header_font_weight === 'light' ? 300 : 
                               values.header_font_weight === 'normal' ? 400 :
                               values.header_font_weight === 'medium' ? 500 : 
                               values.header_font_weight === 'bold' ? 700 : 500,
                    color: '#262626',
                    lineHeight: '1.4'
                  }}
                >
                  Chat with us!
                </div>
              </div>
              
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Message</Badge>
                <div
                  style={{
                    fontFamily: currentFont,
                    fontSize: `${messageSize}px`,
                    fontWeight: values.message_font_weight === 'light' ? 300 : 
                               values.message_font_weight === 'normal' ? 400 :
                               values.message_font_weight === 'medium' ? 500 : 
                               values.message_font_weight === 'bold' ? 700 : 400,
                    color: '#595959',
                    lineHeight: '1.5'
                  }}
                >
                  Hello! How can I help you today? This is a sample message to show how your font will look in conversation.
                </div>
              </div>
              
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Input Placeholder</Badge>
                <div
                  style={{
                    fontFamily: currentFont,
                    fontSize: `${placeholderSize}px`,
                    color: '#8c8c8c',
                    fontStyle: 'italic',
                    lineHeight: '1.4'
                  }}
                >
                  Type your message...
                </div>
              </div>
              
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Branding</Badge>
                <div
                  style={{
                    fontFamily: currentFont,
                    fontSize: `${brandingSize}px`,
                    color: '#a0a0a0',
                    lineHeight: '1.3'
                  }}
                >
                  Powered by TourBots AI
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Font Preview */}
      {renderFontPreview()}

      {/* Font Family */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-gray-600" />
          <Label className="text-sm font-medium">Font Family</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose the primary font for your chatbot interface
        </p>
        <Select
          value={values.font_family}
          onValueChange={(value) => handleChange('font_family', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select font family" />
          </SelectTrigger>
          <SelectContent>
            {fontFamilies.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <div className="flex items-center justify-between w-full">
                  <span style={{ fontFamily: font.value }}>
                    {font.label}
                  </span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {font.category}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Sizes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlignLeft className="h-4 w-4 text-gray-600" />
          <Label className="text-sm font-medium">Font Sizes</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Adjust text sizes for different interface elements
        </p>
        
        <div className="space-y-4">
          <ResponsiveSlider
            label="Header Text"
            value={values.header_text_size || 16}
            onChange={(value) => handleChange('header_text_size', value)}
            min={12}
            max={28}
            step={1}
            unit="px"
            showBadge={true}
          />
          
          <ResponsiveSlider
            label="Message Text"
            value={values.message_text_size || 14}
            onChange={(value) => handleChange('message_text_size', value)}
            min={10}
            max={20}
            step={1}
            unit="px"
            showBadge={true}
          />
          
          <ResponsiveSlider
            label="Input Placeholder"
            value={values.placeholder_text_size || 14}
            onChange={(value) => handleChange('placeholder_text_size', value)}
            min={10}
            max={18}
            step={1}
            unit="px"
            showBadge={true}
          />
          
          <ResponsiveSlider
            label="Branding Text"
            value={values.branding_text_size || 12}
            onChange={(value) => handleChange('branding_text_size', value)}
            min={8}
            max={16}
            step={1}
            unit="px"
            showBadge={true}
          />
        </div>
      </div>

      {/* Font Weights */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bold className="h-4 w-4 text-gray-600" />
          <Label className="text-sm font-medium">Font Weights</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Set font weights for headers and messages
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Header Font Weight</Label>
            <Select
              value={values.header_font_weight || 'medium'}
              onValueChange={(value) => handleChange('header_font_weight', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select header weight" />
              </SelectTrigger>
              <SelectContent>
                {fontWeights.map((weight) => (
                  <SelectItem key={weight.value} value={weight.value}>
                    <span style={{ 
                      fontWeight: weight.value === 'light' ? 300 : 
                                 weight.value === 'normal' ? 400 :
                                 weight.value === 'medium' ? 500 : 
                                 weight.value === 'bold' ? 700 : 400 
                    }}>
                      {weight.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Message Font Weight</Label>
            <Select
              value={values.message_font_weight || 'normal'}
              onValueChange={(value) => handleChange('message_font_weight', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select message weight" />
              </SelectTrigger>
              <SelectContent>
                {fontWeights.map((weight) => (
                  <SelectItem key={weight.value} value={weight.value}>
                    <span style={{ 
                      fontWeight: weight.value === 'light' ? 300 : 
                                 weight.value === 'normal' ? 400 :
                                 weight.value === 'medium' ? 500 : 
                                 weight.value === 'bold' ? 700 : 400 
                    }}>
                      {weight.label}
                    </span>
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

export default FontSelector; 