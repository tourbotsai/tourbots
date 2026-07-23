"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { LogoUpload } from "./logo-upload";
import { useUser } from "@/hooks/useUser";
import { AlignmentToggle, denseFieldClass } from "./menu-editor-primitives";

interface LogoBlockEditorProps {
  block: any;
  onUpdate: (updates: any) => void;
  tourId?: string;
  venueId?: string;
  activeDevice?: "desktop" | "mobile";
}

export function LogoBlockEditor({
  block,
  onUpdate,
  tourId,
  venueId,
  activeDevice = "desktop",
}: LogoBlockEditorProps) {
  const { user } = useUser();
  const resolvedVenueId = venueId || user?.venue?.id;
  const isMobile = activeDevice === "mobile";

  const clampDesktopLogoSize = (size: number) => Math.max(12, Math.min(196, size));
  const clampMobileLogoSize = (size: number) => Math.max(12, Math.min(128, size));

  const getLegacySize = () => {
    const width = Number(block.content.width);
    const height = Number(block.content.height);
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      return clampDesktopLogoSize(Math.round((width + height) / 2));
    }
    if (Number.isFinite(width) && width > 0) return clampDesktopLogoSize(Math.round(width));
    if (Number.isFinite(height) && height > 0) return clampDesktopLogoSize(Math.round(height));
    return 80;
  };

  const getDesktopSize = () => {
    const desktopSize = Number(block.content.desktop_size);
    if (Number.isFinite(desktopSize) && desktopSize > 0) return clampDesktopLogoSize(Math.round(desktopSize));
    return getLegacySize();
  };

  const getMobileSize = () => {
    const mobileSize = Number(block.content.mobile_size);
    if (Number.isFinite(mobileSize) && mobileSize > 0) return clampMobileLogoSize(Math.round(mobileSize));
    return clampMobileLogoSize(getDesktopSize());
  };

  const updateContent = (key: string, value: any) => {
    onUpdate({ content: { ...block.content, [key]: value } });
  };

  const updateDesktopSize = (size: number) => {
    const safeSize = clampDesktopLogoSize(size);
    const currentMobileSize = Number(block.content.mobile_size);
    const hasMobileSize = Number.isFinite(currentMobileSize) && currentMobileSize > 0;
    onUpdate({
      content: {
        ...block.content,
        desktop_size: safeSize,
        mobile_size: hasMobileSize
          ? clampMobileLogoSize(Math.round(currentMobileSize))
          : clampMobileLogoSize(safeSize),
        width: safeSize,
        height: safeSize,
      },
    });
  };

  const updateMobileSize = (size: number) => {
    onUpdate({
      content: { ...block.content, mobile_size: clampMobileLogoSize(size) },
    });
  };

  const sizeValue = isMobile ? getMobileSize() : getDesktopSize();
  const sizeMax = isMobile ? 128 : 196;
  const onSizeChange = isMobile ? updateMobileSize : updateDesktopSize;

  if (!resolvedVenueId || !tourId) {
    return (
      <p className="rounded-md bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        Select a tour to upload a logo.
      </p>
    );
  }

  return (
    <div className="grid w-full grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1">
      <span className="text-[10px] font-medium text-slate-500">Image</span>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-slate-500">
          Size{isMobile ? " · mobile" : ""}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-slate-500">
          {sizeValue}px
        </span>
      </div>
      <span className="text-[10px] font-medium text-slate-500">Alt text</span>
      <span className="text-[10px] font-medium text-slate-500">Align</span>

      <LogoUpload
        compact
        value={block.content.image_url}
        onChange={(imageUrl) => updateContent("image_url", imageUrl || "")}
        venueId={resolvedVenueId}
        tourId={tourId}
      />
      <Slider
        value={[sizeValue]}
        onValueChange={([value]) => onSizeChange(value)}
        min={12}
        max={sizeMax}
        step={2}
        className="w-full"
        aria-label={isMobile ? "Size (mobile)" : "Size"}
      />
      <Input
        value={block.content.alt_text || ""}
        onChange={(e) => updateContent("alt_text", e.target.value)}
        placeholder="Describe the logo"
        aria-label="Alt text"
        className={`${denseFieldClass} w-full`}
      />
      <AlignmentToggle
        value={block.alignment}
        onChange={(alignment) => onUpdate({ alignment })}
      />
    </div>
  );
}
