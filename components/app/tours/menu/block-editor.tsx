"use client";

import { useState } from "react";
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Type,
  Square,
  Image,
  Table2,
  Space,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TextBlockEditor } from "./text-block-editor";
import { ButtonsBlockEditor } from "./buttons-block-editor";
import { LogoBlockEditor } from "./logo-block-editor";
import { TableBlockEditor } from "./table-block-editor";
import { SpacerBlockEditor } from "./spacer-block-editor";
import { NavListBlockEditor } from "./nav-list-block-editor";
import { InspectorGroup, SliderField } from "./menu-editor-primitives";

interface BlockEditorProps {
  block: any;
  index: number;
  totalBlocks: number;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
  tourId?: string;
  venueId?: string;
  activeDevice?: "desktop" | "mobile";
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number) => void;
  onDragEnd?: () => void;
  isDragOver?: boolean;
}

const BLOCK_META: Record<
  string,
  { label: string; icon: typeof Type; accent: string }
> = {
  text: {
    label: "Text",
    icon: Type,
    accent: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  },
  buttons: {
    label: "Buttons",
    icon: Square,
    accent: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  },
  logo: {
    label: "Logo",
    icon: Image,
    accent: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  },
  table: {
    label: "Table",
    icon: Table2,
    accent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  spacer: {
    label: "Spacer",
    icon: Space,
    accent: "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300",
  },
  nav_list: {
    label: "Nav list",
    icon: List,
    accent: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  },
};

function getBlockSummary(block: any): string {
  switch (block.block_type) {
    case "text": {
      const text = String(block.content?.text || "").trim();
      return text ? text.slice(0, 42) + (text.length > 42 ? "…" : "") : "Empty text";
    }
    case "buttons": {
      const count = Array.isArray(block.content?.buttons) ? block.content.buttons.length : 0;
      return count === 0 ? "No buttons" : `${count} button${count === 1 ? "" : "s"}`;
    }
    case "nav_list": {
      const count = Array.isArray(block.content?.items) ? block.content.items.length : 0;
      return count === 0 ? "No items" : `${count} item${count === 1 ? "" : "s"}`;
    }
    case "logo":
      return block.content?.image_url ? "Logo uploaded" : "No image yet";
    case "table": {
      const cols = Array.isArray(block.content?.headers) ? block.content.headers.length : 0;
      return cols ? `${cols}-column table` : "Empty table";
    }
    case "spacer":
      return `${block.content?.height || 24}px gap`;
    default:
      return "Block";
  }
}

export function BlockEditor({
  block,
  index,
  totalBlocks,
  onUpdate,
  onDelete,
  onMove,
  tourId,
  venueId,
  activeDevice = "desktop",
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragOver = false,
}: BlockEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const safeMarginTop = Number.isFinite(block.margin_top) ? block.margin_top : 0;
  const safeMarginBottom = Number.isFinite(block.margin_bottom) ? block.margin_bottom : 12;
  // Nav list owns top/bottom padding in its Global row.
  const showSpacingControls = block.block_type !== "spacer" && block.block_type !== "nav_list";
  const meta = BLOCK_META[block.block_type] || BLOCK_META.text;
  const Icon = meta.icon;
  const summary = getBlockSummary(block);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-all",
        isDragOver
          ? "border-dashed border-slate-400 bg-slate-50 dark:border-slate-500 dark:bg-neutral-900"
          : isExpanded
            ? "border-slate-300 bg-white shadow-sm dark:border-neutral-600 dark:bg-neutral-950"
            : "border-slate-200/90 bg-white hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-950/60 dark:hover:border-neutral-700"
      )}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver?.(index);
      }}
      onDragEnd={() => onDragEnd?.()}
      onDrop={(e) => {
        e.preventDefault();
        onDragEnd?.();
      }}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center text-slate-300 active:cursor-grabbing dark:text-slate-600"
          aria-label="Drag to reorder"
          tabIndex={-1}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1 text-left transition-colors hover:bg-slate-50 dark:hover:bg-neutral-900"
        >
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              meta.accent
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                {meta.label}
              </span>
              <span className="font-mono text-[10px] text-slate-400">#{index + 1}</span>
            </span>
            <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
              {summary}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </button>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={index === 0}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-neutral-800"
            aria-label="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={index === totalBlocks - 1}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-neutral-800"
            aria-label="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            aria-label="Delete block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="space-y-3 border-t border-slate-100 px-3 pb-3 pt-3 dark:border-neutral-800">
          {block.block_type === "text" && (
            <TextBlockEditor block={block} onUpdate={onUpdate} activeDevice={activeDevice} />
          )}
          {block.block_type === "buttons" && (
            <ButtonsBlockEditor block={block} onUpdate={onUpdate} />
          )}
          {block.block_type === "logo" && (
            <LogoBlockEditor
              block={block}
              onUpdate={onUpdate}
              tourId={tourId}
              venueId={venueId}
              activeDevice={activeDevice}
            />
          )}
          {block.block_type === "table" && (
            <TableBlockEditor block={block} onUpdate={onUpdate} />
          )}
          {block.block_type === "spacer" && (
            <SpacerBlockEditor block={block} onUpdate={onUpdate} />
          )}
          {block.block_type === "nav_list" && (
            <NavListBlockEditor block={block} onUpdate={onUpdate} activeDevice={activeDevice} />
          )}

          {showSpacingControls ? (
            <InspectorGroup label="Spacing">
              <div className="grid grid-cols-2 gap-3">
                <SliderField
                  label="Top"
                  value={safeMarginTop}
                  min={0}
                  max={80}
                  step={4}
                  onChange={(value) => onUpdate({ margin_top: value })}
                />
                <SliderField
                  label="Bottom"
                  value={safeMarginBottom}
                  min={0}
                  max={80}
                  step={4}
                  onChange={(value) => onUpdate({ margin_bottom: value })}
                />
              </div>
            </InspectorGroup>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
