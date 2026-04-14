"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ColorPicker } from "@/components/app/chatbots/shared/color-picker";
import { Layout, Palette, LifeBuoy, ChevronDown, ChevronRight } from "lucide-react";

interface GlobalSettingsPanelProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export function GlobalSettingsPanel({ settings, onSettingsChange }: GlobalSettingsPanelProps) {
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Section collapse states
  const [sectionStates, setSectionStates] = useState({
    layout: false,
    styling: false,
    widget: false
  });

  const toggleSection = (sectionId: string) => {
    setSectionStates(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId as keyof typeof prev]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Enable Tour Menu Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled" className="text-sm font-medium dark:text-white">Enable Tour Menu</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Show this tour menu overlay when visitors load your tour
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSetting('enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Layout Settings */}
      <Card className="overflow-hidden">
        <Collapsible
          open={sectionStates.layout}
          onOpenChange={() => toggleSection('layout')}
        >
          <CollapsibleTrigger asChild>
            <CardContent className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-gray-600 dark:text-gray-400">
                    <Layout className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm dark:text-white">Layout</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Position, size, and spacing</p>
                  </div>
                </div>
                {sectionStates.layout ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator />
            <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-sm dark:text-gray-200">Position</Label>
            <Select
              value={settings.position}
              onValueChange={(value) => updateSetting('position', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Centre</SelectItem>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm dark:text-gray-200">Max Width: {settings.max_width}px</Label>
            <Slider
              value={[settings.max_width]}
              onValueChange={([value]) => updateSetting('max_width', value)}
              min={300}
              max={1000}
              step={50}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm dark:text-gray-200">Padding: {settings.padding}px</Label>
            <Slider
              value={[settings.padding]}
              onValueChange={([value]) => updateSetting('padding', value)}
              min={12}
              max={48}
              step={4}
              className="mt-2"
            />
          </div>

              <div>
                <Label className="text-sm dark:text-gray-200">Border Radius: {settings.border_radius}px</Label>
                <Slider
                  value={[settings.border_radius]}
                  onValueChange={([value]) => updateSetting('border_radius', value)}
                  min={0}
                  max={32}
                  step={4}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Styling Settings */}
      <Card className="overflow-hidden">
        <Collapsible
          open={sectionStates.styling}
          onOpenChange={() => toggleSection('styling')}
        >
          <CollapsibleTrigger asChild>
            <CardContent className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-gray-600 dark:text-gray-400">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm dark:text-white">Styling</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Colours and visual effects</p>
                  </div>
                </div>
                {sectionStates.styling ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator />
            <CardContent className="p-6 space-y-4">
              <div>
                <ColorPicker
                  label="Menu Background Colour"
                  value={settings.menu_background_color || "#FFFFFF"}
                  onChange={(value) => updateSetting('menu_background_color', value)}
                  showPresets={false}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Widget Settings (Reopen Button) */}
      <Card className="overflow-hidden">
        <Collapsible
          open={sectionStates.widget}
          onOpenChange={() => toggleSection('widget')}
        >
          <CollapsibleTrigger asChild>
            <CardContent className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-gray-600 dark:text-gray-400">
                    <LifeBuoy className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm dark:text-white">Reopen Widget</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Floating button to reopen tour menu</p>
                  </div>
                </div>
                {sectionStates.widget ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator />
            <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-widget" className="text-sm dark:text-gray-200">Show Reopen Widget</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Display a button to reopen the tour menu after it is closed
              </p>
            </div>
            <Switch
              id="show-widget"
              checked={settings.show_reopen_widget ?? true}
              onCheckedChange={(checked) => updateSetting('show_reopen_widget', checked)}
            />
          </div>

          {(settings.show_reopen_widget ?? true) && (
            <>
              <div>
                <Label className="text-sm dark:text-gray-200">Position</Label>
                <Select
                  value={settings.widget_position}
                  onValueChange={(value) => updateSetting('widget_position', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm dark:text-gray-200">Icon</Label>
                <Select
                  value={settings.widget_icon}
                  onValueChange={(value) => updateSetting('widget_icon', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HelpCircle">? Help</SelectItem>
                    <SelectItem value="Info">i Info</SelectItem>
                    <SelectItem value="Menu">☰ Menu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm dark:text-gray-200">Size</Label>
                <Select
                  value={settings.widget_size}
                  onValueChange={(value) => updateSetting('widget_size', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (40px)</SelectItem>
                    <SelectItem value="medium">Medium (56px)</SelectItem>
                    <SelectItem value="large">Large (72px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <ColorPicker
                    label="Button Colour"
                    value={settings.widget_color || "#FFFFFF"}
                    onChange={(value) => updateSetting('widget_color', value)}
                    showPresets={false}
                  />
                </div>

                <div>
                  <ColorPicker
                    label="Hover Colour"
                    value={settings.widget_hover_color || "#F0F0F0"}
                    onChange={(value) => updateSetting('widget_hover_color', value)}
                    showPresets={false}
                  />
                </div>
              </div>

              <div>
                <ColorPicker
                  label="Icon Colour"
                  value={settings.widget_icon_color || "#FF0000"}
                  onChange={(value) => updateSetting('widget_icon_color', value)}
                  showPresets={false}
                />
              </div>

              <div>
                <Label className="text-sm dark:text-gray-200">Horizontal Offset: {settings.widget_x_offset}px</Label>
                <Slider
                  value={[settings.widget_x_offset]}
                  onValueChange={([value]) => updateSetting('widget_x_offset', value)}
                  min={0}
                  max={200}
                  step={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm dark:text-gray-200">Vertical Offset: {settings.widget_y_offset}px</Label>
                <Slider
                  value={[settings.widget_y_offset]}
                  onValueChange={([value]) => updateSetting('widget_y_offset', value)}
                  min={0}
                  max={200}
                  step={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm dark:text-gray-200">Tooltip Text</Label>
                <Input
                  type="text"
                  value={settings.widget_tooltip_text}
                  onChange={(e) => updateSetting('widget_tooltip_text', e.target.value)}
                  className="mt-1"
                  placeholder="Reopen Tour Menu"
                  maxLength={100}
                />
              </div>

              <div>
                <Label className="text-sm dark:text-gray-200">Border Radius: {settings.widget_border_radius}px</Label>
                <Slider
                  value={[settings.widget_border_radius]}
                  onValueChange={([value]) => updateSetting('widget_border_radius', value)}
                  min={0}
                  max={100}
                  step={2}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm dark:text-gray-200">Shadow Intensity</Label>
                <Select
                  value={settings.widget_shadow_intensity}
                  onValueChange={(value) => updateSetting('widget_shadow_intensity', value)}
                >
                  <SelectTrigger className="mt-1">
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
            </>
          )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

