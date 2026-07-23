"use client";

import { useState } from "react";
import {
  Type,
  Square,
  Image,
  Space,
  Table2,
  List,
  Sparkles,
  PanelLeft,
  LayoutTemplate,
  MousePointerClick,
} from "lucide-react";
import { BlockEditor } from "./block-editor";
import {
  createDefaultNavListContent,
  MENU_STARTER_TEMPLATES,
  MenuStarterId,
} from "@/lib/tour-menu";
import { inspectorGroupLabelClass } from "./menu-editor-primitives";
interface BlocksListProps {
  blocks: any[];
  onBlocksChange: (blocks: any[]) => void;
  tourId?: string;
  venueId?: string;
  activeDevice?: "desktop" | "mobile";
}

const ADD_ACTIONS = [
  { type: "nav_list", label: "Nav", icon: List },
  { type: "text", label: "Text", icon: Type },
  { type: "buttons", label: "Buttons", icon: Square },
  { type: "logo", label: "Logo", icon: Image },
  { type: "table", label: "Table", icon: Table2 },
  { type: "spacer", label: "Spacer", icon: Space },
] as const;

const STARTER_ICONS: Record<MenuStarterId, typeof Sparkles> = {
  navigation: PanelLeft,
  welcome: LayoutTemplate,
  "simple-cta": MousePointerClick,
};

export function BlocksList({
  blocks,
  onBlocksChange,
  tourId,
  venueId,
  activeDevice = "desktop",
}: BlocksListProps) {
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addBlock = (blockType: string) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      block_type: blockType,
      display_order: blocks.length,
      alignment: blockType === "nav_list" || blockType === "text" ? "left" : "center",
      margin_top: 0,
      margin_bottom: 12,
      content: getDefaultContent(blockType),
      styling: {},
    };

    onBlocksChange([...blocks, newBlock]);
  };

  const applyStarter = (starterId: MenuStarterId) => {
    const template = MENU_STARTER_TEMPLATES.find((t) => t.id === starterId);
    if (!template) return;

    const stamp = Date.now();
    const nextBlocks = template.blocks.map((block, index) => {
      let content: Record<string, unknown>;
      if (block.block_type === "nav_list") {
        content = createDefaultNavListContent();
      } else if (block.block_type === "buttons") {
        const buttonsContent = block.content as { buttons?: Array<Record<string, unknown>> };
        content = {
          ...block.content,
          buttons: Array.isArray(buttonsContent.buttons)
            ? buttonsContent.buttons.map((button, buttonIndex) => ({
                ...button,
                id: `btn-${starterId}-${stamp}-${index}-${buttonIndex}`,
              }))
            : [],
        };
      } else {
        content = { ...block.content };
      }

      return {
        id: `block-${starterId}-${stamp}-${index}`,
        block_type: block.block_type,
        display_order: index,
        alignment: block.alignment,
        margin_top: block.margin_top,
        margin_bottom: block.margin_bottom,
        content,
        styling: { ...block.styling },
      };
    });

    onBlocksChange(nextBlocks);
  };

  const getDefaultContent = (blockType: string) => {
    switch (blockType) {
      case "text":
        return {
          text_type: "header",
          text: "Welcome",
          font_size: 22,
          font_weight: "semibold",
          color: "#0F172A",
          line_height: 1.3,
        };
      case "buttons":
        return {
          buttons: [
            {
              id: `btn-${Date.now()}`,
              label: "Get started",
              action_type: "close_menu",
              target_id: "",
              button_color: "#0F172A",
              text_color: "#FFFFFF",
            },
          ],
          buttons_per_row: 1,
          mobile_buttons_per_row: 1,
          button_size: "medium",
          button_style: "solid",
          gap: 12,
        };
      case "logo":
        return {
          image_url: "",
          width: 120,
          height: 120,
          desktop_size: 120,
          mobile_size: 80,
          alt_text: "Logo",
        };
      case "table":
        return {
          headers: ["Column 1", "Column 2"],
          rows: [["", ""]],
          header_background: "#F8FAFC",
          header_text_color: "#0F172A",
          text_size: 14,
          border_color: "#E2E8F0",
        };
      case "nav_list":
        return createDefaultNavListContent();
      case "spacer":
        return { height: 24 };
      default:
        return {};
    }
  };

  const updateBlock = (blockId: string, updates: any) => {
    onBlocksChange(blocks.map((block) => (block.id === blockId ? { ...block, ...updates } : block)));
  };

  const deleteBlock = (blockId: string) => {
    onBlocksChange(blocks.filter((block) => block.id !== blockId));
  };

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    const newBlocks = [...blocks];
    if (direction === "up" && index > 0) {
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    } else if (direction === "down" && index < newBlocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }

    newBlocks.forEach((block, i) => {
      block.display_order = i;
    });

    onBlocksChange(newBlocks);
  };

  const reorderBlocks = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= blocks.length || toIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);
    newBlocks.forEach((block, i) => {
      block.display_order = i;
    });
    onBlocksChange(newBlocks);
  };

  const handleDragEnd = () => {
    if (dragFromIndex !== null && dragOverIndex !== null && dragFromIndex !== dragOverIndex) {
      reorderBlocks(dragFromIndex, dragOverIndex);
    }
    setDragFromIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {ADD_ACTIONS.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="flex flex-col items-center gap-1 rounded-xl border border-slate-200/90 bg-slate-50/70 px-1.5 py-2.5 text-slate-600 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-slate-300 dark:hover:bg-neutral-900 dark:hover:text-white"
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>

      {blocks.length === 0 ? (
        <div className="space-y-2.5">
          <div className="rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-4 py-5 text-center dark:border-neutral-800 dark:from-neutral-900/40 dark:to-neutral-950">
            <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
              Start with a polished layout
            </p>
            <p className="mx-auto mt-1 max-w-[240px] text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Templates give you a ready structure — swap labels, wire actions, and you&apos;re live.
            </p>
          </div>

          <div className="space-y-1.5">
            {MENU_STARTER_TEMPLATES.map((starter) => {
              const Icon = STARTER_ICONS[starter.id] || Sparkles;
              return (
                <button
                  key={starter.id}
                  type="button"
                  onClick={() => applyStarter(starter.id)}
                  className="flex w-full items-start gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-left transition-all hover:border-slate-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold text-slate-900 dark:text-slate-100">
                      {starter.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                      {starter.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="pt-0.5 text-center text-[10px] text-slate-400">
            Or add individual blocks with the grid above
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <p className={inspectorGroupLabelClass}>Layers</p>
            <p className="text-[10px] text-slate-400">
              {blocks.length} block{blocks.length === 1 ? "" : "s"}
            </p>
          </div>
          {blocks.map((block, index) => (
            <BlockEditor
              key={block.id}
              block={block}
              index={index}
              totalBlocks={blocks.length}
              onUpdate={(updates) => updateBlock(block.id, updates)}
              onDelete={() => deleteBlock(block.id)}
              onMove={(direction) => moveBlock(block.id, direction)}
              tourId={tourId}
              venueId={venueId}
              activeDevice={activeDevice}
              onDragStart={setDragFromIndex}
              onDragOver={setDragOverIndex}
              onDragEnd={handleDragEnd}
              isDragOver={
                dragOverIndex === index && dragFromIndex !== null && dragFromIndex !== index
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
