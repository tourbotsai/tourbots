"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoUpload } from "./logo-upload";
import { useUser } from "@/hooks/useUser";

interface LogoBlockEditorProps {
  block: any;
  onUpdate: (updates: any) => void;
  tourId?: string;
  activeDevice?: 'desktop' | 'mobile';
}

export function LogoBlockEditor({ block, onUpdate, tourId, activeDevice = 'desktop' }: LogoBlockEditorProps) {
  const { user } = useUser();

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
    onUpdate({
      content: { ...block.content, [key]: value }
    });
  };

  const updateAlignment = (alignment: string) => {
    onUpdate({ alignment });
  };

  const updateDesktopSize = (size: number) => {
    const safeSize = clampDesktopLogoSize(size);
    const currentMobileSize = Number(block.content.mobile_size);
    const hasMobileSize = Number.isFinite(currentMobileSize) && currentMobileSize > 0;

    onUpdate({
      content: {
        ...block.content,
        desktop_size: safeSize,
        mobile_size: hasMobileSize ? clampMobileLogoSize(Math.round(currentMobileSize)) : clampMobileLogoSize(safeSize),
        // Keep legacy keys in sync for backwards compatibility.
        width: safeSize,
        height: safeSize,
      }
    });
  };

  const updateMobileSize = (size: number) => {
    const safeSize = clampMobileLogoSize(size);
    onUpdate({
      content: {
        ...block.content,
        mobile_size: safeSize,
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Logo Upload */}
      {user?.venue?.id && tourId ? (
        <LogoUpload
          value={block.content.image_url}
          onChange={(imageUrl) => updateContent('image_url', imageUrl || '')}
          venueId={user.venue.id}
          tourId={tourId}
          label="Logo Image"
        />
      ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Please select a tour to upload a logo.
          </p>
        </div>
      )}

      {/* Size control shown for active preview device */}
      {activeDevice === 'mobile' ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-sm">Mobile Logo Size</Label>
            <span className="text-xs text-muted-foreground">{getMobileSize()}px</span>
          </div>
          <Slider
            value={[getMobileSize()]}
            onValueChange={(value) => updateMobileSize(value[0] ?? getDesktopSize())}
            min={12}
            max={128}
            step={2}
            className="mt-1"
          />
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-sm">Desktop Logo Size</Label>
            <span className="text-xs text-muted-foreground">{getDesktopSize()}px</span>
          </div>
          <Slider
            value={[getDesktopSize()]}
            onValueChange={(value) => updateDesktopSize(value[0] ?? 80)}
            min={12}
            max={196}
            step={2}
            className="mt-1"
          />
        </div>
      )}

      {/* Alt Text */}
      <div>
        <Label className="text-sm">Alt Text</Label>
        <Input
          value={block.content.alt_text}
          onChange={(e) => updateContent('alt_text', e.target.value)}
          placeholder="Logo description for accessibility"
          className="mt-1"
        />
      </div>

      {/* Alignment */}
      <div className="pt-4 border-t">
        <Label className="text-sm mb-2 block">Alignment</Label>
        <div className="flex gap-2">
          <Button
            variant={block.alignment === 'left' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateAlignment('left')}
            className="flex-1"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={block.alignment === 'center' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateAlignment('center')}
            className="flex-1"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant={block.alignment === 'right' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateAlignment('right')}
            className="flex-1"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

