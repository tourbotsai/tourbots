"use client";

import React from 'react';
import { ChatbotCustomisation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Smartphone, Palette, Type, Layout, Sparkles, Zap, Users, MessageCircle, Mouse, Award, Monitor } from 'lucide-react';
import { ColorPicker } from '../color-picker';
import { IconSelector } from '../icon-selector';
import { ImageUpload } from '../image-upload';
import ResponsiveSlider from '@/components/ui/responsive-slider';
import ToggleGroup from '@/components/ui/toggle-group';

interface MobileCustomisationProps {
  values: ChatbotCustomisation;
  onChange: (field: keyof ChatbotCustomisation, value: any) => void;
  customBrandingEnabled?: boolean;
}

const MobileCustomisation: React.FC<MobileCustomisationProps> = ({ values, onChange, customBrandingEnabled = true }) => {
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    chatButton: false,
    chatWindow: false,
    colorsAndBranding: false,
    typography: false,
    messagesAndAvatars: false,
    inputAndSendButton: false,
    advancedSettings: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCustomImageChange = (imageUrl: string | null) => {
    onChange('mobile_custom_logo_url', imageUrl);
  };

  return (
    <div className="space-y-4">
      {/* 1. Chat Button */}
      <Collapsible open={openSections.chatButton} onOpenChange={() => toggleSection('chatButton')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                  <div>
                    <CardTitle className="text-base">1. Chat Button</CardTitle>
                    <CardDescription>Mobile chat button styling and positioning</CardDescription>
                  </div>
                </div>
                {openSections.chatButton ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Button Colour"
                  value={values.mobile_chat_button_color || ''}
                  onChange={(value) => onChange('mobile_chat_button_color', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="Button Hover Colour"
                  value={values.mobile_chat_button_hover_color || ''}
                  onChange={(value) => onChange('mobile_chat_button_hover_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Button Size</Label>
                  <Select value={values.mobile_chat_button_size} onValueChange={(value) => onChange('mobile_chat_button_size', value)}>
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
                  <Select value={values.mobile_chat_button_position} onValueChange={(value) => onChange('mobile_chat_button_position', value)}>
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
              
              <div className="space-y-2">
                <IconSelector
                  label="Button Icon"
                  value={values.mobile_chat_button_icon || 'MessageCircle'}
                  onChange={(value) => onChange('mobile_chat_button_icon', value)}
                  customImageUrl={values.mobile_custom_logo_url}
                  onCustomImageChange={handleCustomImageChange}
                fieldKey="mobile_custom_logo_url"
                  iconSize={values.mobile_icon_size || 24}
                  onIconSizeChange={(value) => onChange('mobile_icon_size', value)}
                  venueId={values.venue_id}
                  chatbotType={values.chatbot_type}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_chat_button_border_radius || 0}
                    onChange={(e) => onChange('mobile_chat_button_border_radius', parseInt(e.target.value) || 0)}
                    min="0"
                    max="50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Bottom Offset (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_chat_button_bottom_offset ?? 15}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 5 : parseInt(e.target.value);
                      const offset = isNaN(value) ? 5 : Math.max(5, Math.min(50, value));
                      onChange('mobile_chat_button_bottom_offset', offset);
                    }}
                    min="5"
                    max="50"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Side Offset (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_chat_button_side_offset ?? 15}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 5 : parseInt(e.target.value);
                      const offset = isNaN(value) ? 5 : Math.max(5, Math.min(50, value));
                      onChange('mobile_chat_button_side_offset', offset);
                    }}
                    min="5"
                    max="50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Shadow</Label>
                  <Select 
                    value={values.mobile_chat_button_shadow_intensity} 
                    onValueChange={(value) => {
                      onChange('mobile_chat_button_shadow_intensity', value);
                      onChange('mobile_chat_button_shadow', value !== 'none');
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
                    value={values.mobile_idle_animation_type} 
                    onValueChange={(value) => {
                      onChange('mobile_idle_animation_type', value);
                      onChange('mobile_idle_animation_enabled', value !== 'none');
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
                    value={values.mobile_idle_animation_interval ? Math.round(values.mobile_idle_animation_interval / 1000) : 5}
                    onChange={(e) => {
                      const seconds = e.target.value === '' ? 5 : parseInt(e.target.value);
                      const milliseconds = isNaN(seconds) ? 5000 : seconds * 1000;
                      onChange('mobile_idle_animation_interval', milliseconds);
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
      <Collapsible open={openSections.chatWindow} onOpenChange={() => toggleSection('chatWindow')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-slate-500" />
                  <div>
                    <CardTitle className="text-base">2. Chat Window</CardTitle>
                    <CardDescription>Mobile chat window layout and dimensions</CardDescription>
                  </div>
                </div>
                {openSections.chatWindow ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Window Title</Label>
                  <Input
                    value={values.mobile_window_title || ''}
                    onChange={(e) => onChange('mobile_window_title', e.target.value)}
                    placeholder="Chat with us!"
                  />
                </div>
              </div>
              
              <IconSelector
                label="Header Icon"
                value={values.mobile_header_icon}
                onChange={(value) => onChange('mobile_header_icon', value)}
                customImageUrl={values.mobile_custom_header_icon_url}
                onCustomImageChange={(imageUrl) => onChange('mobile_custom_header_icon_url', imageUrl)}
                fieldKey="mobile_custom_header_icon_url"
                iconSize={values.mobile_header_icon_size}
                onIconSizeChange={(value) => onChange('mobile_header_icon_size', value)}
                venueId={values.venue_id}
                chatbotType={values.chatbot_type}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Window Width (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_chat_window_width}
                    onChange={(e) => onChange('mobile_chat_window_width', parseInt(e.target.value) || 350)}
                    min="280"
                    max="400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Window Height (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_chat_window_height}
                    onChange={(e) => onChange('mobile_chat_window_height', parseInt(e.target.value) || 500)}
                    min="300"
                    max="600"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Window Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_chat_window_border_radius ?? 8}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const radius = isNaN(value) ? 0 : value;
                      onChange('mobile_chat_window_border_radius', radius);
                    }}
                    min="0"
                    max="20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Window Shadow Intensity</Label>
                  <Select value={values.mobile_chat_window_shadow_intensity} onValueChange={(value) => onChange('mobile_chat_window_shadow_intensity', value)}>
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
                    value={values.mobile_header_height}
                    onChange={(e) => onChange('mobile_header_height', parseInt(e.target.value) || 50)}
                    min="30"
                    max="60"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Chat Bottom Offset (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_chat_offset_bottom ?? 15}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 5 : parseInt(e.target.value);
                      const offset = isNaN(value) ? 5 : Math.max(5, Math.min(20, value));
                      onChange('mobile_chat_offset_bottom', offset);
                    }}
                    min="5"
                    max="20"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chat Side Offset (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_chat_offset_side ?? 15}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 5 : parseInt(e.target.value);
                      const offset = isNaN(value) ? 5 : Math.max(5, Math.min(20, value));
                      onChange('mobile_chat_offset_side', offset);
                    }}
                    min="5"
                    max="20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Welcome Message Delay (Secs)</Label>
                  <Input
                    type="number"
                    value={values.mobile_welcome_message_delay ? Math.round(values.mobile_welcome_message_delay / 1000) : 0}
                    onChange={(e) => {
                      const seconds = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const milliseconds = isNaN(seconds) ? 0 : seconds * 1000;
                      onChange('mobile_welcome_message_delay', milliseconds);
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
      <Collapsible open={openSections.colorsAndBranding} onOpenChange={() => toggleSection('colorsAndBranding')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-slate-500" />
                  <div>
                    <CardTitle className="text-base">3. Colours & Branding</CardTitle>
                    <CardDescription>Mobile colour scheme and branding elements</CardDescription>
                  </div>
                </div>
                {openSections.colorsAndBranding ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Header Background Colour"
                  value={values.mobile_header_background_color || ''}
                  onChange={(value) => onChange('mobile_header_background_color', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="Header Text Colour"
                  value={values.mobile_header_text_color || ''}
                  onChange={(value) => onChange('mobile_header_text_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="AI Message Background Colour"
                  value={values.mobile_ai_message_background || ''}
                  onChange={(value) => onChange('mobile_ai_message_background', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="AI Message Text Colour"
                  value={values.mobile_ai_message_text_color || ''}
                  onChange={(value) => onChange('mobile_ai_message_text_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="User Message Background"
                  value={values.mobile_user_message_background || ''}
                  onChange={(value) => onChange('mobile_user_message_background', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="User Message Text Colour"
                  value={values.mobile_user_message_text_color || ''}
                  onChange={(value) => onChange('mobile_user_message_text_color', value)}
                  showPresets={false}
                />
              </div>
              
              <ColorPicker
                label="Input Background Colour"
                value={values.mobile_input_background_color || ''}
                onChange={(value) => onChange('mobile_input_background_color', value)}
                showPresets={false}
              />
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg dark:border dark:border-input dark:bg-background">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Show Powered By</Label>
                  <p className="text-sm text-muted-foreground">
                    {customBrandingEnabled
                      ? 'Display "Powered by TourBots" branding'
                      : "Locked until White-label add-on is active on your billing plan"}
                  </p>
                </div>
                <Switch
                  checked={customBrandingEnabled ? values.mobile_show_powered_by : true}
                  onCheckedChange={(checked) => onChange('mobile_show_powered_by', checked)}
                  disabled={!customBrandingEnabled}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 4. Typography */}
      <Collapsible open={openSections.typography} onOpenChange={() => toggleSection('typography')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Type className="w-4 h-4 text-slate-500" />
                  <div>
                    <CardTitle className="text-base">4. Typography</CardTitle>
                    <CardDescription>Mobile font settings and text styling</CardDescription>
                  </div>
                </div>
                {openSections.typography ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select value={values.mobile_font_family || ''} onValueChange={(value) => onChange('mobile_font_family', value)}>
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
                    value={values.mobile_header_text_size}
                    onChange={(e) => onChange('mobile_header_text_size', parseInt(e.target.value) || 14)}
                    min="10"
                    max="24"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Header Font Weight</Label>
                  <Select value={values.mobile_header_font_weight} onValueChange={(value) => onChange('mobile_header_font_weight', value)}>
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
                    value={values.mobile_message_text_size}
                    onChange={(e) => onChange('mobile_message_text_size', parseInt(e.target.value) || 12)}
                    min="8"
                    max="20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Message Font Weight</Label>
                  <Select value={values.mobile_message_font_weight} onValueChange={(value) => onChange('mobile_message_font_weight', value)}>
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
                    value={values.mobile_placeholder_text_size}
                    onChange={(e) => onChange('mobile_placeholder_text_size', parseInt(e.target.value) || 12)}
                    min="8"
                    max="18"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Branding Text Size (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_branding_text_size}
                    onChange={(e) => onChange('mobile_branding_text_size', parseInt(e.target.value) || 10)}
                    min="6"
                    max="14"
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
      <Collapsible open={openSections.messagesAndAvatars} onOpenChange={() => toggleSection('messagesAndAvatars')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-slate-500" />
                  <div>
                    <CardTitle className="text-base">5. Messages & Avatars</CardTitle>
                    <CardDescription>Message styling and avatar configuration</CardDescription>
                  </div>
                </div>
                {openSections.messagesAndAvatars ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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
                    value={values.mobile_message_border_radius ?? 12}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const radius = isNaN(value) ? 0 : value;
                      onChange('mobile_message_border_radius', radius);
                    }}
                    min="0"
                    max="20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Message Max Width (%)</Label>
                  <Input
                    type="number"
                    value={values.mobile_message_max_width}
                    onChange={(e) => onChange('mobile_message_max_width', parseInt(e.target.value) || 85)}
                    min="70"
                    max="95"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Message Shadows</Label>
                  <Switch
                    checked={values.mobile_message_shadow_enabled}
                    onCheckedChange={(checked) => onChange('mobile_message_shadow_enabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Show User Avatar</Label>
                  <Switch
                    checked={values.mobile_show_user_avatar}
                    onCheckedChange={(checked) => onChange('mobile_show_user_avatar', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Show Bot Avatar</Label>
                  <Switch
                    checked={values.mobile_show_bot_avatar}
                    onCheckedChange={(checked) => onChange('mobile_show_bot_avatar', checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Avatar Style</Label>
                <Select value={values.mobile_avatar_style || 'circle'} onValueChange={(value) => onChange('mobile_avatar_style', value)}>
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
                  <Select value={values.mobile_bot_avatar_icon || 'Bot'} onValueChange={(value) => onChange('mobile_bot_avatar_icon', value)}>
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
                  <Select value={values.mobile_user_avatar_icon || 'User'} onValueChange={(value) => onChange('mobile_user_avatar_icon', value)}>
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
                    value={values.mobile_custom_bot_avatar_url || ''}
                    onChange={(value) => onChange('mobile_custom_bot_avatar_url', value || null)}
                    venueId={values.venue_id || ''}
                    chatbotType={values.chatbot_type || 'tour'}
                    fieldKey="mobile_custom_bot_avatar_url"
                    label=""
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Custom User Avatar Upload</Label>
                  <ImageUpload
                    value={values.mobile_custom_user_avatar_url || ''}
                    onChange={(value) => onChange('mobile_custom_user_avatar_url', value || null)}
                    venueId={values.venue_id || ''}
                    chatbotType={values.chatbot_type || 'tour'}
                    fieldKey="mobile_custom_user_avatar_url"
                    label=""
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Message Animation</Label>
                  <Select value={values.mobile_message_animation} onValueChange={(value) => onChange('mobile_message_animation', value)}>
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
                  <Select value={values.mobile_typing_indicator_style} onValueChange={(value) => {
                    onChange('mobile_typing_indicator_style', value);
                    onChange('mobile_typing_indicator_enabled', value !== 'none');
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
                  value={values.mobile_typing_indicator_color || '#666666'}
                  onChange={(value) => onChange('mobile_typing_indicator_color', value)}
                  showPresets={false}
                />
                
                <div className="space-y-2">
                  <Label>Typing Animation Speed</Label>
                  <Select value={values.mobile_typing_indicator_speed} onValueChange={(value) => onChange('mobile_typing_indicator_speed', value)}>
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
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 6. Input & Send Button */}
      <Collapsible open={openSections.inputAndSendButton} onOpenChange={() => toggleSection('inputAndSendButton')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                  <div>
                    <CardTitle className="text-base">6. Input & Send Button</CardTitle>
                    <CardDescription>Input field and send button configuration</CardDescription>
                  </div>
                </div>
                {openSections.inputAndSendButton ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Input Placeholder Text</Label>
                <Input
                  value={values.mobile_input_placeholder_text || ''}
                  onChange={(e) => onChange('mobile_input_placeholder_text', e.target.value)}
                  placeholder="Ask me anything..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Input Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_input_border_radius ?? 8}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const radius = isNaN(value) ? 0 : value;
                      onChange('mobile_input_border_radius', radius);
                    }}
                    min="0"
                    max="20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Input Height (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_input_height}
                    onChange={(e) => onChange('mobile_input_height', parseInt(e.target.value) || 45)}
                    min="30"
                    max="50"
                  />
                </div>
              </div>
              
              {/* 🆕 MOBILE INPUT TEXT COLOUR CONTROLS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Placeholder Text Colour"
                  value={values.mobile_placeholder_text_color || '#9CA3AF'}
                  onChange={(value) => onChange('mobile_placeholder_text_color', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="Input Text Colour"
                  value={values.mobile_input_text_color || '#111827'}
                  onChange={(value) => onChange('mobile_input_text_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Send Button Colour"
                  value={values.mobile_send_button_color || ''}
                  onChange={(value) => onChange('mobile_send_button_color', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="Send Button Hover Colour"
                  value={values.mobile_send_button_hover_color || ''}
                  onChange={(value) => onChange('mobile_send_button_hover_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Send Button Size</Label>
                  <Select value={values.mobile_send_button_size} onValueChange={(value) => onChange('mobile_send_button_size', value)}>
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
                  <Select value={values.mobile_send_button_icon} onValueChange={(value) => onChange('mobile_send_button_icon', value)}>
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
                  value={values.mobile_send_button_icon_color || ''}
                  onChange={(value) => onChange('mobile_send_button_icon_color', value)}
                  showPresets={false}
                />
                
                <div className="space-y-2">
                  <Label>Send Button Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={values.mobile_send_button_border_radius ?? 8}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const radius = isNaN(value) ? 0 : value;
                      onChange('mobile_send_button_border_radius', radius);
                    }}
                    min="0"
                    max="20"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 7. Advanced Settings */}
      <Collapsible open={openSections.advancedSettings} onOpenChange={() => toggleSection('advancedSettings')}>
        <Card className="dark:border-input dark:bg-background">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-slate-500" />
                  <div>
                    <CardTitle className="text-base">7. Advanced Settings</CardTitle>
                    <CardDescription>Loading states and advanced options</CardDescription>
                  </div>
                </div>
                {openSections.advancedSettings ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loading Animation</Label>
                  <Select value={values.mobile_loading_animation} onValueChange={(value) => onChange('mobile_loading_animation', value)}>
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
                      checked={values.mobile_loading_text_enabled}
                      onCheckedChange={(checked) => onChange('mobile_loading_text_enabled', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chat Entrance Animation</Label>
                <Select value={values.mobile_chat_entrance_animation} onValueChange={(value) => onChange('mobile_chat_entrance_animation', value)}>
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
                  value={values.mobile_loading_spinner_color || '#1890FF'}
                  onChange={(value) => onChange('mobile_loading_spinner_color', value)}
                  showPresets={false}
                />
                
                <ColorPicker
                  label="Loading Text Colour"
                  value={values.mobile_loading_text_color || ''}
                  onChange={(value) => onChange('mobile_loading_text_color', value)}
                  showPresets={false}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Loading Background"
                  value={values.mobile_loading_background_color || ''}
                  onChange={(value) => onChange('mobile_loading_background_color', value)}
                  showPresets={false}
                />
                
                <div className="space-y-2">
                  <Label>Show Timestamps</Label>
                  <div className="flex items-center justify-center py-1.5 px-3 bg-gray-50 rounded-lg border dark:border-input dark:bg-background">
                    <Switch
                      checked={values.mobile_show_timestamps}
                      onCheckedChange={(checked) => onChange('mobile_show_timestamps', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Timestamp Format</Label>
                <Select value={values.mobile_timestamp_format} onValueChange={(value) => onChange('mobile_timestamp_format', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 Hour</SelectItem>
                    <SelectItem value="24h">24 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default MobileCustomisation; 