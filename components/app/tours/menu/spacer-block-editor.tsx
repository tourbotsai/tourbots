"use client";

import { CompactSlider } from "./menu-editor-primitives";

interface SpacerBlockEditorProps {
  block: any;
  onUpdate: (updates: any) => void;
}

export function SpacerBlockEditor({ block, onUpdate }: SpacerBlockEditorProps) {
  const height = block.content?.height ?? 24;

  return (
    <div className="space-y-2">
      <CompactSlider
        label="Height"
        value={height}
        min={8}
        max={128}
        step={8}
        onChange={(value) => onUpdate({ content: { ...block.content, height: value } })}
      />
      <div
        className="rounded border border-dashed border-slate-300 bg-slate-100 dark:border-neutral-600 dark:bg-neutral-800"
        style={{ height: `${Math.min(height, 48)}px` }}
        aria-hidden
      />
    </div>
  );
}
