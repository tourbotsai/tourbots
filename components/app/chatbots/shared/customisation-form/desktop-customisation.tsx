"use client";

import React, { FC } from 'react';
import { ChatbotCustomisation } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ColorPicker } from '../color-picker';
import { IconSelector } from '../icon-selector';
import { ImageUpload } from '../image-upload';
import { 
  ChevronDown, ChevronRight, MessageCircle, Monitor, Type, 
  Palette, Sparkles, Bot, Settings
} from 'lucide-react';

interface DesktopCustomisationProps {
  values: ChatbotCustomisation;
  onChange: (field: keyof ChatbotCustomisation, value: any) => void;
  isLoading?: boolean;
  onCustomImageChange?: (imageUrl: string | null) => void;
  customBrandingEnabled?: boolean;
}

const DesktopCustomisation: FC<DesktopCustomisationProps> = ({
  values,
  onChange,
  isLoading = false,
  onCustomImageChange,
  customBrandingEnabled = true,
}) => {
  const [sectionStates, setSectionStates] = React.useState({
    chatButton: false,
    chatWindow: false,
    colorsAndBranding: false,
    typography: false,
    messagesAndAvatars: false,
    inputAndSendButton: false,
    advancedSettings: false
  });

  const toggleSection = (section: keyof typeof sectionStates) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCustomImageChange = (imageUrl: string | null) => {
    onChange('custom_logo_url', imageUrl);
    onCustomImageChange?.(imageUrl);
  };

  return (
    <div className="space-y-4">
      {/* 1. Chat Button */}
      <Collapsible open={sectionStates.chatButton} onOpenChange={() => toggleSection('chatButton')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <CardTitle className="text-base">1. Chat Button</CardTitle>
                    <CardDescription>Desktop chat button styling and positioning</CardDescription>
                  </div>
                </div>
                {sectionStates.chatButton ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Button Colour"
                  value={values.chat_button_color || ''}
                  onChange={(value) => onChange('chat_button_color', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="Button Hover Colour"
                  value={values.chat_button_hover_color || ''}
                  onChange={(value) => onChange('chat_button_hover_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Button Size</Label>
                  <Select value={values.chat_button_size} onValueChange={(value) => onChange('chat_button_size', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Button Position</Label>
                  <Select value={values.chat_button_position} onValueChange={(value) => onChange('chat_button_position', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <IconSelector
                label="Button Icon"
                value={values.chat_button_icon}
                onChange={(value) => onChange('chat_button_icon', value)}
                customImageUrl={values.custom_logo_url}
                onCustomImageChange={handleCustomImageChange}
                fieldKey="custom_logo_url"
                iconSize={values.icon_size}
                onIconSizeChange={(value) => onChange('icon_size', value)}
                iconSizeMax={80}
                venueId={values.venue_id}
                chatbotType={values.chatbot_type}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={values.chat_button_border_radius || 0}
                    onChange={(e) => onChange('chat_button_border_radius', parseInt(e.target.value) || 0)}
                    min="0"
                    max="50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Bottom Offset (px)</Label>
                  <Input
                    type="number"
                    value={values.chat_button_bottom_offset ?? 20}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 10 : parseInt(e.target.value);
                      const offset = isNaN(value) ? 10 : Math.max(10, Math.min(20, value));
                      onChange('chat_button_bottom_offset', offset);
                    }}
                    min="10"
                    max="20"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Side Offset (px)</Label>
                  <Input
                    type="number"
                    value={values.chat_button_side_offset ?? 20}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 10 : parseInt(e.target.value);
                      const offset = isNaN(value) ? 10 : Math.max(10, Math.min(20, value));
                      onChange('chat_button_side_offset', offset);
                    }}
                    min="10"
                    max="20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Shadow</Label>
                  <Select 
                    value={values.chat_button_shadow_intensity} 
                    onValueChange={(value) => {
                      onChange('chat_button_shadow_intensity', value);
                      onChange('chat_button_shadow', value !== 'none');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Idle Animation</Label>
                  <Select 
                    value={values.idle_animation_type} 
                    onValueChange={(value) => {
                      onChange('idle_animation_type', value);
                      onChange('idle_animation_enabled', value !== 'none');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="bounce">Bounce</SelectItem>
                      <SelectItem value="pulse">Pulse</SelectItem>
                      <SelectItem value="shake">Shake</SelectItem>
                      <SelectItem value="glow">Glow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Idle Animation Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={values.idle_animation_interval ? Math.round(values.idle_animation_interval / 1000) : 5}
                    onChange={(e) => {
                      const seconds = e.target.value === '' ? 5 : parseInt(e.target.value);
                      const milliseconds = isNaN(seconds) ? 5000 : seconds * 1000;
                      onChange('idle_animation_interval', milliseconds);
                    }}
                    min="1"
                    max="30"
                    step="1"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 2. Chat Window */}
      <Collapsible open={sectionStates.chatWindow} onOpenChange={() => toggleSection('chatWindow')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <CardTitle className="text-base">2. Chat Window</CardTitle>
                    <CardDescription>Desktop chat window layout and dimensions</CardDescription>
                  </div>
                </div>
                {sectionStates.chatWindow ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Window Title</Label>
                  <Input
                    value={values.window_title || ''}
                    onChange={(e) => onChange('window_title', e.target.value)}
                    placeholder="Chat with us!"
                  />
                </div>
              </div>
              
              <IconSelector
                label="Header Icon"
                value={values.header_icon}
                onChange={(value) => onChange('header_icon', value)}
                customImageUrl={values.custom_header_icon_url}
                onCustomImageChange={(imageUrl) => onChange('custom_header_icon_url', imageUrl)}
                fieldKey="custom_header_icon_url"
                iconSize={values.header_icon_size}
                onIconSizeChange={(value) => onChange('header_icon_size', value)}
                venueId={values.venue_id}
                chatbotType={values.chatbot_type}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Window Width (px)</Label>
                  <Input
                    type="number"
                    value={values.window_width}
                    onChange={(e) => onChange('window_width', parseInt(e.target.value) || 400)}
                    min="300"
                    max="600"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Window Height (px)</Label>
                  <Input
                    type="number"
                    value={values.window_height}
                    onChange={(e) => onChange('window_height', parseInt(e.target.value) || 600)}
                    min="400"
                    max="800"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Window Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={values.chat_window_border_radius ?? 12}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const radius = isNaN(value) ? 0 : value;
                      onChange('chat_window_border_radius', radius);
                    }}
                    min="0"
                    max="24"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Window Shadow Intensity</Label>
                  <Select value={values.chat_window_shadow_intensity} onValueChange={(value) => onChange('chat_window_shadow_intensity', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Header Height (px)</Label>
                  <Input
                    type="number"
                    value={values.header_height}
                    onChange={(e) => onChange('header_height', parseInt(e.target.value) || 60)}
                    min="40"
                    max="80"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Chat Bottom Offset (px)</Label>
                  <Input
                    type="number"
                    value={values.chat_offset_bottom ?? 20}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 10 : parseInt(e.target.value);
                      const offset = isNaN(value) ? 10 : Math.max(10, Math.min(20, value));
                      onChange('chat_offset_bottom', offset);
                    }}
                    min="10"
                    max="20"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chat Side Offset (px)</Label>
                  <Input
                    type="number"
                    value={values.chat_offset_side ?? 20}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 10 : parseInt(e.target.value);
                      const offset = isNaN(value) ? 10 : Math.max(10, Math.min(20, value));
                      onChange('chat_offset_side', offset);
                    }}
                    min="10"
                    max="20"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Welcome Message Delay (Secs)</Label>
                  <Input
                    type="number"
                    value={values.welcome_message_delay ? Math.round(values.welcome_message_delay / 1000) : 0}
                    onChange={(e) => {
                      const seconds = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const milliseconds = isNaN(seconds) ? 0 : seconds * 1000;
                      onChange('welcome_message_delay', milliseconds);
                    }}
                    min="0"
                    max="10"
                    step="1"
                  />
                </div>
              </div>
              
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 3. Colours & Branding */}
      <Collapsible open={sectionStates.colorsAndBranding} onOpenChange={() => toggleSection('colorsAndBranding')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <CardTitle className="text-base">3. Colours & Branding</CardTitle>
                    <CardDescription>Desktop colour scheme and branding elements</CardDescription>
                  </div>
                </div>
                {sectionStates.colorsAndBranding ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Header Background"
                  value={values.header_background_color || ''}
                  onChange={(value) => onChange('header_background_color', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="Header Text"
                  value={values.header_text_color || ''}
                  onChange={(value) => onChange('header_text_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="AI Message Background"
                  value={values.ai_message_background || ''}
                  onChange={(value) => onChange('ai_message_background', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="AI Message Text"
                  value={values.ai_message_text_color || ''}
                  onChange={(value) => onChange('ai_message_text_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="User Message Background"
                  value={values.user_message_background || ''}
                  onChange={(value) => onChange('user_message_background', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="User Message Text"
                  value={values.user_message_text_color || ''}
                  onChange={(value) => onChange('user_message_text_color', value)}
                  showPresets={false}
                />
              </div>
              
              <ColorPicker
                label="Input Background"
                value={values.input_background_color || ''}
                onChange={(value) => onChange('input_background_color', value)}
                showPresets={false}
              />
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border dark:border-input dark:bg-background">
                <div className="flex flex-col">
                  <Label className="text-sm font-medium">Show &quot;Powered by TourBots&quot;</Label>
                  <span className="text-xs text-gray-500 mt-1 dark:text-slate-400">
                    {customBrandingEnabled
                      ? "Display branding text at bottom of chat"
                      : "Locked until White-label add-on is active on your billing plan"}
                  </span>
                </div>
                <Switch
                  checked={customBrandingEnabled ? values.show_powered_by : true}
                  onCheckedChange={(checked) => onChange('show_powered_by', checked)}
                  disabled={!customBrandingEnabled}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 4. Typography */}
      <Collapsible open={sectionStates.typography} onOpenChange={() => toggleSection('typography')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Type className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <CardTitle className="text-base">4. Typography</CardTitle>
                    <CardDescription>Desktop font settings and text styling</CardDescription>
                  </div>
                </div>
                {sectionStates.typography ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select value={values.font_family} onValueChange={(value) => onChange('font_family', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select font family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, sans-serif">System UI</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                    <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                    <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Header Text Size (px)</Label>
                  <Input
                    type="number"
                    value={values.header_text_size}
                    onChange={(e) => onChange('header_text_size', parseInt(e.target.value) || 16)}
                    min="10"
                    max="32"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Header Font Weight</Label>
                  <Select value={values.header_font_weight} onValueChange={(value) => onChange('header_font_weight', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Message Text Size (px)</Label>
                  <Input
                    type="number"
                    value={values.message_text_size}
                    onChange={(e) => onChange('message_text_size', parseInt(e.target.value) || 14)}
                    min="8"
                    max="24"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Message Font Weight</Label>
                  <Select value={values.message_font_weight} onValueChange={(value) => onChange('message_font_weight', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Placeholder Text Size (px)</Label>
                  <Input
                    type="number"
                    value={values.placeholder_text_size}
                    onChange={(e) => onChange('placeholder_text_size', parseInt(e.target.value) || 14)}
                    min="8"
                    max="20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Branding Text Size (px)</Label>
                  <Input
                    type="number"
                    value={values.branding_text_size}
                    onChange={(e) => onChange('branding_text_size', parseInt(e.target.value) || 12)}
                    min="8"
                    max="16"
                    disabled={!customBrandingEnabled}
                  />
                  {!customBrandingEnabled && (
                    <p className="text-xs text-muted-foreground">
                      White-label add-on required to edit branding text size.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 5. Messages & Avatars */}
      <Collapsible open={sectionStates.messagesAndAvatars} onOpenChange={() => toggleSection('messagesAndAvatars')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <CardTitle className="text-base">5. Messages & Avatars</CardTitle>
                    <CardDescription>Message styling and avatar configuration</CardDescription>
                  </div>
                </div>
                {sectionStates.messagesAndAvatars ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Message Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={values.message_border_radius ?? 8}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const radius = isNaN(value) ? 0 : value;
                      onChange('message_border_radius', radius);
                    }}
                    min="0"
                    max="24"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Message Max Width (%)</Label>
                  <Input
                    type="number"
                    value={values.message_max_width}
                    onChange={(e) => onChange('message_max_width', parseInt(e.target.value) || 80)}
                    min="60"
                    max="95"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Message Shadows</Label>
                  <Switch
                    checked={values.message_shadow_enabled}
                    onCheckedChange={(checked) => onChange('message_shadow_enabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Show User Avatar</Label>
                  <Switch
                    checked={values.show_user_avatar}
                    onCheckedChange={(checked) => onChange('show_user_avatar', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Show Bot Avatar</Label>
                  <Switch
                    checked={values.show_bot_avatar}
                    onCheckedChange={(checked) => onChange('show_bot_avatar', checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Avatar Style</Label>
                <Select value={values.avatar_style || 'circle'} onValueChange={(value) => onChange('avatar_style', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select avatar style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="rounded">Rounded Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bot Avatar Icon</Label>
                  <Select value={values.bot_avatar_icon || 'Bot'} onValueChange={(value) => onChange('bot_avatar_icon', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bot icon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bot">Bot</SelectItem>
                      <SelectItem value="MessageCircle">Message Circle</SelectItem>
                      <SelectItem value="Headphones">Headphones</SelectItem>
                      <SelectItem value="Users">Users</SelectItem>
                      <SelectItem value="Crown">Crown</SelectItem>
                      <SelectItem value="Shield">Shield</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>User Avatar Icon</Label>
                  <Select value={values.user_avatar_icon || 'User'} onValueChange={(value) => onChange('user_avatar_icon', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user icon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="UserCheck">User Check</SelectItem>
                      <SelectItem value="UserCog">User Cog</SelectItem>
                      <SelectItem value="Smile">Smile</SelectItem>
                      <SelectItem value="Coffee">Coffee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Custom Bot Avatar Upload</Label>
                  <ImageUpload
                    value={values.custom_bot_avatar_url || ''}
                    onChange={(value) => onChange('custom_bot_avatar_url', value || null)}
                    venueId={values.venue_id || ''}
                    chatbotType={values.chatbot_type || 'tour'}
                    fieldKey="custom_bot_avatar_url"
                    label=""
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Custom User Avatar Upload</Label>
                  <ImageUpload
                    value={values.custom_user_avatar_url || ''}
                    onChange={(value) => onChange('custom_user_avatar_url', value || null)}
                    venueId={values.venue_id || ''}
                    chatbotType={values.chatbot_type || 'tour'}
                    fieldKey="custom_user_avatar_url"
                    label=""
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Message Animation</Label>
                  <Select value={values.message_animation} onValueChange={(value) => onChange('message_animation', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade-in">Fade In</SelectItem>
                      <SelectItem value="slide-in">Slide In</SelectItem>
                      <SelectItem value="scale-in">Scale In</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Typing Indicator Style</Label>
                  <Select value={values.typing_indicator_style} onValueChange={(value) => {
                    onChange('typing_indicator_style', value);
                    onChange('typing_indicator_enabled', value !== 'none');
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dots">Dots</SelectItem>
                      <SelectItem value="wave">Wave</SelectItem>
                      <SelectItem value="pulse">Pulse</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Typing Indicator Colour"
                  value={values.typing_indicator_color || '#666666'}
                  onChange={(value) => onChange('typing_indicator_color', value)}
                  showPresets={false}
                />
                
                <div className="space-y-2">
                  <Label>Typing Animation Speed</Label>
                  <Select value={values.typing_indicator_speed} onValueChange={(value) => onChange('typing_indicator_speed', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Show Timestamps</Label>
                  <div className="flex items-center justify-center py-1.5 px-3 bg-gray-50 rounded-lg border dark:border-input dark:bg-background">
                    <Switch
                      checked={values.show_timestamps}
                      onCheckedChange={(checked) => onChange('show_timestamps', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Timestamp Format</Label>
                  <Select value={values.timestamp_format} onValueChange={(value) => onChange('timestamp_format', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 6. Input & Send Button */}
      <Collapsible open={sectionStates.inputAndSendButton} onOpenChange={() => toggleSection('inputAndSendButton')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <CardTitle className="text-base">6. Input & Send Button</CardTitle>
                    <CardDescription>Input field and send button configuration</CardDescription>
                  </div>
                </div>
                {sectionStates.inputAndSendButton ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Input Placeholder Text</Label>
                <Input
                  value={values.input_placeholder_text || ''}
                  onChange={(e) => onChange('input_placeholder_text', e.target.value)}
                  placeholder="Type your message..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Input Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={values.input_border_radius ?? 8}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const radius = isNaN(value) ? 0 : value;
                      onChange('input_border_radius', radius);
                    }}
                    min="0"
                    max="24"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Input Height (px)</Label>
                  <Input
                    type="number"
                    value={values.input_height ?? 45}
                    onChange={(e) => onChange('input_height', parseInt(e.target.value) || 45)}
                    min="30"
                    max="60"
                  />
                </div>
              </div>
              
              {/* 🆕 INPUT TEXT COLOUR CONTROLS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Placeholder Text Colour"
                  value={values.placeholder_text_color || '#6B7280'}
                  onChange={(value) => onChange('placeholder_text_color', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="Input Text Colour"
                  value={values.input_text_color || '#111827'}
                  onChange={(value) => onChange('input_text_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Send Button Colour"
                  value={values.send_button_color || ''}
                  onChange={(value) => onChange('send_button_color', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="Send Button Hover Colour"
                  value={values.send_button_hover_color || ''}
                  onChange={(value) => onChange('send_button_hover_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Send Button Size</Label>
                  <Select value={values.send_button_size} onValueChange={(value) => onChange('send_button_size', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (30px)</SelectItem>
                      <SelectItem value="medium">Medium (36px)</SelectItem>
                      <SelectItem value="large">Large (48px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Send Button Icon</Label>
                  <Select value={values.send_button_icon} onValueChange={(value) => onChange('send_button_icon', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Send">Send</SelectItem>
                      <SelectItem value="ArrowRight">Arrow Right</SelectItem>
                      <SelectItem value="ChevronRight">Chevron Right</SelectItem>
                      <SelectItem value="Play">Play</SelectItem>
                      <SelectItem value="MessageCircle">Message Circle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Send Button Icon Colour"
                  value={values.send_button_icon_color || ''}
                  onChange={(value) => onChange('send_button_icon_color', value)}
                  showPresets={false}
                />
                
                <div className="space-y-2">
                  <Label>Send Button Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={values.send_button_border_radius ?? 8}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const radius = isNaN(value) ? 0 : value;
                      onChange('send_button_border_radius', radius);
                    }}
                    min="0"
                    max="25"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 7. Advanced Settings */}
      <Collapsible open={sectionStates.advancedSettings} onOpenChange={() => toggleSection('advancedSettings')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <CardTitle className="text-base">7. Advanced Settings</CardTitle>
                    <CardDescription>Loading states and advanced options</CardDescription>
                  </div>
                </div>
                {sectionStates.advancedSettings ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loading Animation</Label>
                  <Select value={values.loading_animation} onValueChange={(value) => onChange('loading_animation', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spinner">Spinner</SelectItem>
                      <SelectItem value="dots">Dots</SelectItem>
                      <SelectItem value="bars">Bars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Show Loading Text</Label>
                  <div className="flex items-center justify-center py-1.5 px-3 bg-gray-50 rounded-lg border dark:border-input dark:bg-background">
                    <Switch
                      checked={values.loading_text_enabled}
                      onCheckedChange={(checked) => onChange('loading_text_enabled', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chat Entrance Animation</Label>
                <Select value={values.chat_entrance_animation} onValueChange={(value) => onChange('chat_entrance_animation', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slide-up">Slide Up</SelectItem>
                    <SelectItem value="slide-down">Slide Down</SelectItem>
                    <SelectItem value="fade-in">Fade In</SelectItem>
                    <SelectItem value="scale-up">Scale Up</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Loading Spinner Colour"
                  value={values.loading_spinner_color || '#1890FF'}
                  onChange={(value) => onChange('loading_spinner_color', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="Loading Text Colour"
                  value={values.loading_text_color || ''}
                  onChange={(value) => onChange('loading_text_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Loading Background"
                  value={values.loading_background_color || ''}
                  onChange={(value) => onChange('loading_background_color', value)}
                  showPresets={false}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default DesktopCustomisation; 