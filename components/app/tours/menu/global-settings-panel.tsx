"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/app/chatbots/shared/color-picker";
import {
  Layout,
  Palette,
  PanelLeft,
  PanelRight,
  AlignStartVertical,
  AlignEndVertical,
  AlignCenterVertical,
  Layers,
  Menu,
  HelpCircle,
  Info,
} from "lucide-react";
import { MENU_FONT_OPTIONS } from "@/lib/tour-menu";
import {
  InspectorShell,
  InspectorHeader,
  InspectorSection,
  InspectorGroup,
  SegmentedControl,
  ChoiceCardGrid,
  denseFieldClass,
  inspectorGroupLabelClass,
} from "./menu-editor-primitives";

interface GlobalSettingsPanelProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
  contentBlocksSlot?: React.ReactNode;
  contentSummary?: string;
  contentDefaultOpen?: boolean;
  activeDevice?: "desktop" | "mobile";
}

type MenuStyle = "modal" | "drawer";

const MENU_STYLE_OPTIONS: {
  value: MenuStyle;
  label: string;
  hint: string;
  diagram: ReactNode;
}[] = [
  {
    value: "modal",
    label: "Modal",
    hint: "Centred pop-up",
    diagram: (
      <span className="relative flex h-7 w-10 items-center justify-center rounded border border-slate-300 bg-slate-100 dark:border-neutral-600 dark:bg-neutral-800">
        <span className="h-3 w-4 rounded-[2px] border border-slate-500 bg-white shadow-sm dark:border-slate-300 dark:bg-neutral-200" />
      </span>
    ),
  },
  {
    value: "drawer",
    label: "Drawer",
    hint: "Side panel",
    diagram: (
      <span className="relative flex h-7 w-10 items-stretch justify-start overflow-hidden rounded border border-slate-300 bg-slate-100 p-0.5 dark:border-neutral-600 dark:bg-neutral-800">
        <span className="w-2 rounded-[1px] bg-white shadow-sm dark:bg-neutral-200" />
      </span>
    ),
  },
];

const POSITION_OPTIONS = [
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
] as const;

const OPEN_ICON_OPTIONS = [
  { value: "Menu", label: "Hamburger", Icon: Menu },
  { value: "HelpCircle", label: "Help", Icon: HelpCircle },
  { value: "Info", label: "Info", Icon: Info },
] as const;

export function GlobalSettingsPanel({
  settings,
  onSettingsChange,
  contentBlocksSlot,
  contentSummary,
  contentDefaultOpen = false,
  activeDevice = "desktop",
}: GlobalSettingsPanelProps) {
  const isMobile = activeDevice === "mobile";
  const menuStyle: MenuStyle = settings.menu_style === "modal" ? "modal" : "drawer";

  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const getDeviceValue = (desktopKey: string, mobileKey: string, fallback: any) => {
    if (isMobile) {
      const mobileVal = settings[mobileKey];
      if (mobileVal !== undefined && mobileVal !== null) return mobileVal;
    }
    const desktopVal = settings[desktopKey];
    return desktopVal !== undefined && desktopVal !== null ? desktopVal : fallback;
  };

  const updateDeviceValue = (desktopKey: string, mobileKey: string, value: any) => {
    updateSetting(isMobile ? mobileKey : desktopKey, value);
  };

  const [sectionStates, setSectionStates] = useState({
    style: false,
    content: contentDefaultOpen,
    appearance: false,
  });
  useEffect(() => {
    if (contentDefaultOpen) {
      setSectionStates((s) => ({ ...s, content: true }));
    }
  }, [contentDefaultOpen]);

  const menuStyleLabel = MENU_STYLE_OPTIONS.find((o) => o.value === menuStyle)?.label || "Modal";
  const anchorSide = settings.anchor_side || "left";
  const drawerWidth = getDeviceValue("drawer_width", "mobile_drawer_width", 360);
  const maxWidth = getDeviceValue("max_width", "mobile_max_width", 600);
  const startsOpen = settings.start_open === true;
  const showClose = settings.show_close_button ?? true;
  const stateLabel = startsOpen ? "Open" : "Closed";
  const styleSummary =
    menuStyle === "modal"
      ? `${menuStyleLabel} · ${settings.position === "top" ? "Top" : settings.position === "bottom" ? "Bottom" : "Centre"} · ${stateLabel}`
      : `${menuStyleLabel} · ${anchorSide === "right" ? "Right" : "Left"} · ${stateLabel}`;

  const paddingValue = getDeviceValue("padding", "mobile_padding", 24);
  const fontLabel =
    MENU_FONT_OPTIONS.find((f) => f.id === (settings.menu_font_family || "system"))?.label ||
    "System";
  const appearanceSummary = `${fontLabel} · ${settings.border_radius ?? 16}px · ${paddingValue}px pad`;

  const widgetPosition = getDeviceValue("widget_position", "mobile_widget_position", "top-left");
  const widgetSize = getDeviceValue("widget_size", "mobile_widget_size", "small");
  const deviceHint = isMobile ? "mobile" : undefined;
  const selectedOpenIcon =
    OPEN_ICON_OPTIONS.find((opt) => opt.value === (settings.widget_icon || "Menu")) ||
    OPEN_ICON_OPTIONS[0];
  const SelectedOpenIcon = selectedOpenIcon.Icon;

  return (
    <InspectorShell>
      <InspectorHeader
        title="Tour menu"
        description="Configure how the menu looks and behaves on the tour"
        action={
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting("enabled", checked)}
          />
        }
      />

      <InspectorSection
        id="style"
        open={sectionStates.style}
        onOpenChange={(open) => setSectionStates((s) => ({ ...s, style: open }))}
        icon={<Layout className="h-3.5 w-3.5" />}
        title="Style & placement"
        summary={styleSummary}
      >
        <InspectorGroup label="Global">
          <ChoiceCardGrid
            options={MENU_STYLE_OPTIONS}
            value={menuStyle}
            onChange={(value) => updateSetting("menu_style", value)}
          />

          {menuStyle === "modal" ? (
            <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.1fr)] items-center gap-x-2.5 gap-y-1">
              <span className="text-[10px] font-medium text-slate-500">On load</span>
              <span className="text-[10px] font-medium text-slate-500">Position</span>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-medium text-slate-500">
                  Max width{deviceHint ? ` · ${deviceHint}` : ""}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-slate-500">
                  {maxWidth}px
                </span>
              </div>

              <SegmentedControl
                value={startsOpen ? "open" : "closed"}
                onChange={(value) => updateSetting("start_open", value === "open")}
                columns={2}
                options={[
                  { value: "open", label: "Open" },
                  { value: "closed", label: "Closed" },
                ]}
              />
              <SegmentedControl
                value={settings.position || "center"}
                onChange={(value) => updateSetting("position", value)}
                options={[
                  { value: "top", label: "Top", icon: <AlignStartVertical className="h-3 w-3" /> },
                  {
                    value: "center",
                    label: "Centre",
                    icon: <AlignCenterVertical className="h-3 w-3" />,
                  },
                  {
                    value: "bottom",
                    label: "Bottom",
                    icon: <AlignEndVertical className="h-3 w-3" />,
                  },
                ]}
              />
              <div className="flex h-8 items-center">
                <Slider
                  value={[maxWidth]}
                  onValueChange={([value]) =>
                    updateDeviceValue("max_width", "mobile_max_width", value)
                  }
                  min={300}
                  max={1000}
                  step={20}
                  className="w-full"
                  aria-label={deviceHint ? "Max width (mobile)" : "Max width"}
                />
              </div>
            </div>
          ) : (
            <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-x-2.5 gap-y-1">
              <span className="text-[10px] font-medium text-slate-500">On load</span>
              <span className="text-[10px] font-medium text-slate-500">Anchor</span>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-medium text-slate-500">
                  Width{deviceHint ? ` · ${deviceHint}` : ""}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-slate-500">
                  {drawerWidth}px
                </span>
              </div>

              <SegmentedControl
                value={startsOpen ? "open" : "closed"}
                onChange={(value) => updateSetting("start_open", value === "open")}
                columns={2}
                options={[
                  { value: "open", label: "Open" },
                  { value: "closed", label: "Closed" },
                ]}
              />
              <SegmentedControl
                value={anchorSide}
                onChange={(value) => updateSetting("anchor_side", value)}
                options={[
                  { value: "left", label: "Left", icon: <PanelLeft className="h-3 w-3" /> },
                  { value: "right", label: "Right", icon: <PanelRight className="h-3 w-3" /> },
                ]}
              />
              <div className="flex h-8 items-center">
                <Slider
                  value={[drawerWidth]}
                  onValueChange={([value]) =>
                    updateDeviceValue("drawer_width", "mobile_drawer_width", value)
                  }
                  min={240}
                  max={560}
                  step={10}
                  className="w-full"
                  aria-label={deviceHint ? "Width (mobile)" : "Width"}
                />
              </div>
            </div>
          )}
        </InspectorGroup>

        {/* Open button — one dense row */}
        <InspectorGroup label="Open button">
          <div className="grid w-full grid-cols-[minmax(0,1.15fr)_2.5rem_minmax(0,1fr)_5.75rem_5.75rem] items-end gap-x-2.5 gap-y-1">
            <span className="text-[10px] font-medium text-slate-500">
              Position{isMobile ? " · mobile" : ""}
            </span>
            <span className="text-[10px] font-medium text-slate-500">Icon</span>
            <span className="text-[10px] font-medium text-slate-500">
              Size{isMobile ? " · mobile" : ""}
            </span>
            <span className="text-[10px] font-medium text-slate-500">Fill</span>
            <span className="text-[10px] font-medium text-slate-500">Icon</span>

            <Select
              value={widgetPosition}
              onValueChange={(value) =>
                updateDeviceValue("widget_position", "mobile_widget_position", value)
              }
            >
              <SelectTrigger className={denseFieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={settings.widget_icon || "Menu"}
              onValueChange={(value) => updateSetting("widget_icon", value)}
            >
              <SelectTrigger className={`${denseFieldClass} w-full px-0 justify-center`}>
                <SelectedOpenIcon className="h-3.5 w-3.5" aria-label={selectedOpenIcon.label} />
              </SelectTrigger>
              <SelectContent>
                {OPEN_ICON_OPTIONS.map(({ value, label, Icon }) => (
                  <SelectItem key={value} value={value}>
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <SegmentedControl
              value={widgetSize}
              onChange={(value) => updateDeviceValue("widget_size", "mobile_widget_size", value)}
              options={[
                { value: "small", label: "S" },
                { value: "medium", label: "M" },
                { value: "large", label: "L" },
              ]}
            />

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
              <ColorPicker
                compact
                label=""
                value={settings.widget_color || "#FFFFFF"}
                onChange={(value) => updateSetting("widget_color", value)}
                showPresets={false}
              />
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
              <ColorPicker
                compact
                label=""
                value={settings.widget_icon_color || "#0F172A"}
                onChange={(value) => updateSetting("widget_icon_color", value)}
                showPresets={false}
              />
            </div>
          </div>

          {/* Open button placement / chrome — always visible */}
          <div className="grid w-full grid-cols-[minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_5.75rem_minmax(0,1.2fr)] items-center gap-x-2.5 gap-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-medium text-slate-500">X offset</span>
              <span className="font-mono text-[10px] tabular-nums text-slate-500">
                {settings.widget_x_offset ?? 16}px
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-medium text-slate-500">Y offset</span>
              <span className="font-mono text-[10px] tabular-nums text-slate-500">
                {settings.widget_y_offset ?? 16}px
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-medium text-slate-500">Radius</span>
              <span className="font-mono text-[10px] tabular-nums text-slate-500">
                {settings.widget_border_radius ?? 12}px
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-500">Shadow</span>
            <span className="text-[10px] font-medium text-slate-500">Tooltip</span>

            <div className="flex h-8 items-center">
              <Slider
                value={[settings.widget_x_offset ?? 16]}
                onValueChange={([value]) => updateSetting("widget_x_offset", value)}
                min={0}
                max={200}
                step={4}
                className="w-full"
                aria-label="X offset"
              />
            </div>
            <div className="flex h-8 items-center">
              <Slider
                value={[settings.widget_y_offset ?? 16]}
                onValueChange={([value]) => updateSetting("widget_y_offset", value)}
                min={0}
                max={200}
                step={4}
                className="w-full"
                aria-label="Y offset"
              />
            </div>
            <div className="flex h-8 items-center">
              <Slider
                value={[settings.widget_border_radius ?? 12]}
                onValueChange={([value]) => updateSetting("widget_border_radius", value)}
                min={0}
                max={100}
                step={2}
                className="w-full"
                aria-label="Corner radius"
              />
            </div>
            <Select
              value={settings.widget_shadow_intensity || "medium"}
              onValueChange={(value) => updateSetting("widget_shadow_intensity", value)}
            >
              <SelectTrigger className={denseFieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="medium">Med</SelectItem>
                <SelectItem value="heavy">Heavy</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              value={settings.widget_tooltip_text || ""}
              onChange={(e) => updateSetting("widget_tooltip_text", e.target.value)}
              placeholder="Open menu"
              maxLength={100}
              className={denseFieldClass}
            />
          </div>

          {/* Close — under open button controls */}
          <div className="space-y-1.5 pt-1">
            <p className={inspectorGroupLabelClass}>Close button</p>
            <div className="grid w-full grid-cols-[2.5rem_minmax(0,1.15fr)_minmax(0,1fr)_5.75rem_5.75rem] items-end gap-x-2.5 gap-y-1">
              <span className="text-[10px] font-medium text-slate-500">Show</span>
              <span className="text-[10px] font-medium text-slate-500">Position</span>
              <span className="text-[10px] font-medium text-slate-500">Size</span>
              <span className="text-[10px] font-medium text-slate-500">Colour</span>
              <span className="text-[10px] font-medium text-slate-500">Hover colour</span>

              <div className="flex h-8 items-center justify-center">
                <Switch
                  id="show-close"
                  checked={showClose}
                  onCheckedChange={(checked) => updateSetting("show_close_button", checked)}
                />
              </div>

              <Select
                value={settings.close_button_position || "top-right"}
                onValueChange={(value) => updateSetting("close_button_position", value)}
                disabled={!showClose}
              >
                <SelectTrigger className={denseFieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Top left</SelectItem>
                  <SelectItem value="top-right">Top right</SelectItem>
                </SelectContent>
              </Select>

              <SegmentedControl
                value={settings.close_button_size || "medium"}
                onChange={(value) => updateSetting("close_button_size", value)}
                options={[
                  { value: "small", label: "S" },
                  { value: "medium", label: "M" },
                  { value: "large", label: "L" },
                ]}
                className={!showClose ? "pointer-events-none opacity-50" : undefined}
              />

              <div
                className={
                  !showClose
                    ? "pointer-events-none opacity-50 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                    : "overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                }
              >
                <ColorPicker
                  compact
                  label=""
                  value={settings.close_button_color || "#64748B"}
                  onChange={(value) => updateSetting("close_button_color", value)}
                  showPresets={false}
                />
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                <ColorPicker
                  compact
                  label=""
                  value={settings.widget_hover_color || "#F0F0F0"}
                  onChange={(value) => updateSetting("widget_hover_color", value)}
                  showPresets={false}
                />
              </div>
            </div>
          </div>
        </InspectorGroup>
      </InspectorSection>

      {contentBlocksSlot ? (
        <InspectorSection
          id="content"
          open={sectionStates.content}
          onOpenChange={(open) => setSectionStates((s) => ({ ...s, content: open }))}
          icon={<Layers className="h-3.5 w-3.5" />}
          title="Content"
          summary={contentSummary || "Add blocks to build the menu"}
        >
          {contentBlocksSlot}
        </InspectorSection>
      ) : null}

      <InspectorSection
        id="appearance"
        open={sectionStates.appearance}
        onOpenChange={(open) => setSectionStates((s) => ({ ...s, appearance: open }))}
        icon={<Palette className="h-3.5 w-3.5" />}
        title="Appearance"
        summary={appearanceSummary}
      >
        <div className="space-y-2">
          {/* Entrance · Background · Blur · Font · Lighting */}
          <div className="grid w-full grid-cols-[minmax(0,1.2fr)_5.75rem_2.75rem_minmax(0,1fr)_minmax(0,0.85fr)] items-center gap-x-2.5 gap-y-1">
            <span className="text-[10px] font-medium text-slate-500">Entrance</span>
            <span className="text-[10px] font-medium text-slate-500">Background</span>
            <span className="text-[10px] font-medium text-slate-500">Blur</span>
            <span className="text-[10px] font-medium text-slate-500">Menu font</span>
            <span className="text-[10px] font-medium text-slate-500">Lighting</span>

            <Select
              value={settings.entrance_animation || "fade-scale"}
              onValueChange={(value) => updateSetting("entrance_animation", value)}
            >
              <SelectTrigger className={denseFieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade-scale">
                  {menuStyle === "drawer" ? "Slide from edge" : "Fade & scale"}
                </SelectItem>
                <SelectItem value="slide-up">Slide up</SelectItem>
                <SelectItem value="slide-down">Slide down</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
              <ColorPicker
                compact
                label=""
                value={settings.menu_background_color || "#FFFFFF"}
                onChange={(value) => updateSetting("menu_background_color", value)}
                showPresets={false}
              />
            </div>
            <div className="flex h-8 items-center justify-center">
              <Switch
                id="backdrop-blur"
                checked={settings.backdrop_blur ?? true}
                onCheckedChange={(checked) => updateSetting("backdrop_blur", checked)}
                aria-label="Backdrop blur"
              />
            </div>
            <Select
              value={settings.menu_font_family || "system"}
              onValueChange={(value) => updateSetting("menu_font_family", value)}
            >
              <SelectTrigger className={denseFieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MENU_FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.id} value={font.id}>
                    <span style={{ fontFamily: font.stack }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={settings.panel_shadow || "medium"}
              onValueChange={(value) => updateSetting("panel_shadow", value)}
            >
              <SelectTrigger className={denseFieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="medium">Med</SelectItem>
                <SelectItem value="heavy">Heavy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pad horizontal · Pad vertical · Radius */}
          <div className="grid w-full grid-cols-3 items-center gap-x-2.5 gap-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-medium text-slate-500">
                Pad horizontal{deviceHint ? ` · ${deviceHint}` : ""}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-slate-500">
                {paddingValue}px
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-medium text-slate-500">
                Pad vertical{deviceHint ? ` · ${deviceHint}` : ""}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-slate-500">
                {getDeviceValue("padding_vertical", "mobile_padding_vertical", 20)}px
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-medium text-slate-500">Radius</span>
              <span className="font-mono text-[10px] tabular-nums text-slate-500">
                {settings.border_radius ?? 16}px
              </span>
            </div>

            <div className="flex h-8 items-center">
              <Slider
                value={[paddingValue]}
                onValueChange={([value]) => updateDeviceValue("padding", "mobile_padding", value)}
                min={12}
                max={48}
                step={4}
                className="w-full"
                aria-label="Pad horizontal"
              />
            </div>
            <div className="flex h-8 items-center">
              <Slider
                value={[getDeviceValue("padding_vertical", "mobile_padding_vertical", 20)]}
                onValueChange={([value]) =>
                  updateDeviceValue("padding_vertical", "mobile_padding_vertical", value)
                }
                min={0}
                max={48}
                step={4}
                className="w-full"
                aria-label="Pad vertical"
              />
            </div>
            <div className="flex h-8 items-center">
              <Slider
                value={[settings.border_radius ?? 16]}
                onValueChange={([value]) => updateSetting("border_radius", value)}
                min={0}
                max={32}
                step={4}
                className="w-full"
                aria-label="Corner radius"
              />
            </div>
          </div>
        </div>
      </InspectorSection>
    </InspectorShell>
  );
}
