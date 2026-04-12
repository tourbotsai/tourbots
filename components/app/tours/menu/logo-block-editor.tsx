"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoUpload } from "./logo-upload";
import { useUser } from "@/hooks/useUser";

interface LogoBlockEditorProps {
  block: any;
  onUpdate: (updates: any) => void;
  tourId?: string;
}

export function LogoBlockEditor({ block, onUpdate, tourId }: LogoBlockEditorProps) {
  const { user } = useUser();
  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: { ...block.content, [key]: value }
    });
  };

  const updateAlignment = (alignment: string) => {
    onUpdate({ alignment });
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

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Width (px)</Label>
          <Input
            type="number"
            value={block.content.width}
            onChange={(e) => updateContent('width', parseInt(e.target.value))}
            min={50}
            max={800}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Height (px)</Label>
          <Input
            type="number"
            value={block.content.height}
            onChange={(e) => updateContent('height', parseInt(e.target.value))}
            min={50}
            max={400}
            className="mt-1"
          />
        </div>
      </div>

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

