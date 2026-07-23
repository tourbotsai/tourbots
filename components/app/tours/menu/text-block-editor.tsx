"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/app/chatbots/shared/color-picker";
import { MENU_FONT_OPTIONS } from "@/lib/tour-menu";
import { AlignmentToggle, denseFieldClass } from "./menu-editor-primitives";

interface TextBlockEditorProps {
  block: any;
  onUpdate: (updates: any) => void;
  activeDevice?: "desktop" | "mobile";
}

export function TextBlockEditor({
  block,
  onUpdate,
  activeDevice = "desktop",
}: TextBlockEditorProps) {
  const isMobile = activeDevice === "mobile";

  const updateContent = (key: string, value: any) => {
    onUpdate({ content: { ...block.content, [key]: value } });
  };

  const getDeviceValue = (desktopKey: string, mobileKey: string, fallback: any) => {
    if (isMobile) {
      const mobileVal = block.content?.[mobileKey];
      if (mobileVal !== undefined && mobileVal !== null) return mobileVal;
    }
    const desktopVal = block.content?.[desktopKey];
    return desktopVal !== undefined && desktopVal !== null ? desktopVal : fallback;
  };

  const updateDeviceValue = (desktopKey: string, mobileKey: string, value: any) => {
    updateContent(isMobile ? mobileKey : desktopKey, value);
  };

  const fontSize = getDeviceValue("font_size", "mobile_font_size", 16);
  const lineHeight = getDeviceValue("line_height", "mobile_line_height", 1.5);
  const textColour = getDeviceValue("color", "mobile_color", "#000000");
  const letterSpacing = Math.round(Number(block.content.letter_spacing ?? 0) * 100);
  const lineHeightSlider = Math.round(Number(lineHeight) * 10);

  return (
    <div className="space-y-2.5">
      {/* Type + Align — same label-above pattern as logo */}
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1">
        <span className="text-[10px] font-medium text-slate-500">Type</span>
        <span className="text-[10px] font-medium text-slate-500">Align</span>

        <Select
          value={block.content.text_type}
          onValueChange={(value) => updateContent("text_type", value)}
        >
          <SelectTrigger className={denseFieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="header">Header</SelectItem>
            <SelectItem value="subheader">Subheader</SelectItem>
            <SelectItem value="paragraph">Paragraph</SelectItem>
          </SelectContent>
        </Select>
        <AlignmentToggle
          value={block.alignment}
          onChange={(alignment) => onUpdate({ alignment })}
        />
      </div>

      {/* Content */}
      <div className="space-y-1">
        <span className="text-[10px] font-medium text-slate-500">Content</span>
        {block.content.text_type === "paragraph" ? (
          <Textarea
            value={block.content.text}
            onChange={(e) => updateContent("text", e.target.value)}
            placeholder="Enter text…"
            rows={2}
            className="min-h-[48px] rounded-lg border-slate-200 text-xs shadow-none focus-visible:ring-slate-300 dark:border-neutral-700"
          />
        ) : (
          <Input
            value={block.content.text}
            onChange={(e) => updateContent("text", e.target.value)}
            placeholder="Enter text…"
            className={denseFieldClass}
          />
        )}
      </div>

      {/* Font · Weight · Colour */}
      <div className="grid w-full grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_auto] items-center gap-x-2.5 gap-y-1">
        <span className="text-[10px] font-medium text-slate-500">Font</span>
        <span className="text-[10px] font-medium text-slate-500">Weight</span>
        <span className="text-[10px] font-medium text-slate-500">
          Colour{isMobile ? " · mobile" : ""}
        </span>

        <Select
          value={block.content.font_family || "inherit"}
          onValueChange={(value) => {
            if (value === "inherit") {
              const { font_family: _removed, ...rest } = block.content || {};
              onUpdate({ content: rest });
              return;
            }
            updateContent("font_family", value);
          }}
        >
          <SelectTrigger className={denseFieldClass}>
            <SelectValue placeholder="Use menu font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inherit">Use menu font</SelectItem>
            {MENU_FONT_OPTIONS.map((font) => (
              <SelectItem key={font.id} value={font.id}>
                <span style={{ fontFamily: font.stack }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={block.content.font_weight}
          onValueChange={(value) => updateContent("font_weight", value)}
        >
          <SelectTrigger className={denseFieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="semibold">Semibold</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-[96px] overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
          <ColorPicker
            compact
            label=""
            value={textColour}
            onChange={(value) => updateDeviceValue("color", "mobile_color", value)}
            showPresets={false}
          />
        </div>
      </div>

      {/* Size · Line height · Letter spacing — one row, like logo density */}
      <div className="grid w-full grid-cols-3 items-center gap-x-2.5 gap-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-medium text-slate-500">
            Size{isMobile ? " · m" : ""}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-slate-500">{fontSize}px</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-medium text-slate-500">
            Line{isMobile ? " · m" : ""}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-slate-500">
            {(lineHeightSlider / 10).toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-medium text-slate-500">Spacing</span>
          <span className="font-mono text-[10px] tabular-nums text-slate-500">
            {(letterSpacing / 100).toFixed(2)}em
          </span>
        </div>

        <Slider
          value={[fontSize]}
          onValueChange={([value]) => updateDeviceValue("font_size", "mobile_font_size", value)}
          min={12}
          max={64}
          step={2}
          aria-label={isMobile ? "Size (mobile)" : "Size"}
        />
        <Slider
          value={[lineHeightSlider]}
          onValueChange={([value]) =>
            updateDeviceValue("line_height", "mobile_line_height", value / 10)
          }
          min={10}
          max={25}
          step={1}
          aria-label={isMobile ? "Line height (mobile)" : "Line height"}
        />
        <Slider
          value={[letterSpacing]}
          onValueChange={([value]) => updateContent("letter_spacing", value / 100)}
          min={-5}
          max={20}
          step={1}
          aria-label="Letter spacing"
        />
      </div>
    </div>
  );
}
