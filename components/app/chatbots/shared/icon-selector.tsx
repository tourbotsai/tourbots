"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "./image-upload";
import { IconSizeSlider } from "./icon-size-slider";
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
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const AVAILABLE_ICONS = [
  { name: 'MessageCircle', icon: MessageCircle, label: 'Message Circle' },
  { name: 'MessageSquare', icon: MessageSquare, label: 'Message Square' },
  { name: 'Bot', icon: Bot, label: 'Robot' },
  { name: 'Headphones', icon: Headphones, label: 'Headphones' },
  { name: 'HelpCircle', icon: HelpCircle, label: 'Help Circle' },
  { name: 'Mail', icon: Mail, label: 'Mail' },
  { name: 'Phone', icon: Phone, label: 'Phone' },
  { name: 'Users', icon: Users, label: 'Users' },
  { name: 'Zap', icon: Zap, label: 'Lightning' },
  { name: 'Heart', icon: Heart, label: 'Heart' },
  { name: 'Star', icon: Star, label: 'Star' },
  { name: 'Settings', icon: Settings, label: 'Settings' },
  { name: 'Info', icon: Info, label: 'Information' },
  { name: 'Search', icon: Search, label: 'Search' },
];

interface IconSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  customImageUrl?: string | null;
  onCustomImageChange?: (url: string | null) => void;
  fieldKey?: string;
  venueId?: string;
  chatbotType?: 'tour';
  iconSize?: number;
  onIconSizeChange?: (size: number) => void;
  headerIconSize?: number;
  onHeaderIconSizeChange?: (size: number) => void;
  className?: string;
  iconSizeMin?: number;
  iconSizeMax?: number;
  iconSizeStep?: number;
  headerIconSizeMin?: number;
  headerIconSizeMax?: number;
  headerIconSizeStep?: number;
}

export function IconSelector({ 
  label, 
  value, 
  onChange, 
  customImageUrl,
  onCustomImageChange,
  fieldKey,
  iconSize = 24,
  onIconSizeChange,
  venueId,
  chatbotType,
  headerIconSize,
  onHeaderIconSizeChange,
  className,
  iconSizeMin = 16,
  iconSizeMax = 48,
  iconSizeStep = 2,
  headerIconSizeMin = 16,
  headerIconSizeMax = 48,
  headerIconSizeStep = 2,
}: IconSelectorProps) {
  const [activeTab, setActiveTab] = useState(customImageUrl ? "custom" : "icons");
  
  const selectedIcon = AVAILABLE_ICONS.find(icon => icon.name === value) || AVAILABLE_ICONS[0];
  const SelectedIconComponent = selectedIcon.icon;

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    
    // If switching to icons tab and we have a custom image, clear it
    if (newTab === "icons" && customImageUrl && onCustomImageChange) {
      onCustomImageChange(null);
    }
  };

  const handleCustomImageChange = (imageUrl: string | null) => {
    if (onCustomImageChange) {
      onCustomImageChange(imageUrl);
    }
    
    // If we have a custom image, ensure we're on the custom tab
    if (imageUrl) {
      setActiveTab("custom");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      
      {venueId && chatbotType && onCustomImageChange ? (
        <div className="space-y-3">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 dark:border dark:border-input dark:bg-background">
              <TabsTrigger value="icons" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Icons
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Custom
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="icons" className="mt-3">
              <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full dark:border-input dark:bg-background dark:text-slate-100">
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((icon) => {
                    const IconComponent = icon.icon;
                    
                    return (
                      <SelectItem key={icon.name} value={icon.name}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          {icon.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </TabsContent>
            
            <TabsContent value="custom" className="mt-3">
              <ImageUpload
                value={customImageUrl}
                onChange={handleCustomImageChange}
                venueId={venueId}
                chatbotType={chatbotType}
                fieldKey={fieldKey}
                label=""
              />
            </TabsContent>
          </Tabs>
          
          {/* Icon Size Slider - shown for both tabs */}
          {onIconSizeChange && (
            <IconSizeSlider
              value={iconSize}
              onChange={onIconSizeChange}
              label="Icon Size"
              min={iconSizeMin}
              max={iconSizeMax}
              step={iconSizeStep}
            />
          )}

          {/* Header Icon Size Slider */}
          {headerIconSize !== undefined && onHeaderIconSizeChange && (
            <IconSizeSlider
              value={headerIconSize}
              onChange={onHeaderIconSizeChange}
              label="Header Icon Size"
              className="mt-4"
              min={headerIconSizeMin}
              max={headerIconSizeMax}
              step={headerIconSizeStep}
            />
          )}
        </div>
      ) : (
        // Fallback to original icon selector if no custom image support
        <div className="space-y-3">
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full dark:border-input dark:bg-background dark:text-slate-100">
              <SelectValue placeholder="Select an icon" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_ICONS.map((icon) => {
                const IconComponent = icon.icon;
                
                return (
                  <SelectItem key={icon.name} value={icon.name}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      {icon.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {/* Icon Size Slider - shown for fallback mode too */}
          {onIconSizeChange && (
            <IconSizeSlider
              value={iconSize}
              onChange={onIconSizeChange}
              label="Icon Size"
              min={iconSizeMin}
              max={iconSizeMax}
              step={iconSizeStep}
            />
          )}

          {/* Header Icon Size Slider */}
          {headerIconSize !== undefined && onHeaderIconSizeChange && (
            <IconSizeSlider
              value={headerIconSize}
              onChange={onHeaderIconSizeChange}
              label="Header Icon Size"
              className="mt-4"
              min={headerIconSizeMin}
              max={headerIconSizeMax}
              step={headerIconSizeStep}
            />
          )}
        </div>
      )}
    </div>
  );
} 