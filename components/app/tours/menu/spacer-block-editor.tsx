"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SpacerBlockEditorProps {
  block: any;
  onUpdate: (updates: any) => void;
}

export function SpacerBlockEditor({ block, onUpdate }: SpacerBlockEditorProps) {
  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: { ...block.content, [key]: value }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Spacer Height: {block.content.height}px</Label>
        <Slider
          value={[block.content.height]}
          onValueChange={([value]) => updateContent('height', value)}
          min={8}
          max={128}
          step={8}
          className="mt-2"
        />
        <p className="text-xs text-gray-500 mt-2 dark:text-slate-400">
          Add vertical spacing between blocks
        </p>
      </div>

      {/* Visual representation */}
      <div className="p-4 bg-gray-50 rounded-lg border dark:border-input dark:bg-background">
        <div 
          className="bg-blue-200 border-2 border-dashed border-blue-400 rounded dark:border-slate-600 dark:bg-neutral-800"
          style={{ height: `${block.content.height}px` }}
        />
        <p className="text-xs text-center text-gray-600 mt-2 dark:text-slate-400">
          Preview: {block.content.height}px spacing
        </p>
      </div>
    </div>
  );
}

