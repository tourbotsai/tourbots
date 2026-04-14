"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TextBlockEditor } from "./text-block-editor";
import { ButtonsBlockEditor } from "./buttons-block-editor";
import { LogoBlockEditor } from "./logo-block-editor";
import { TableBlockEditor } from "./table-block-editor";
import { SpacerBlockEditor } from "./spacer-block-editor";

interface BlockEditorProps {
  block: any;
  index: number;
  totalBlocks: number;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  tourId?: string;
  activeDevice?: 'desktop' | 'mobile';
}

export function BlockEditor({ block, index, totalBlocks, onUpdate, onDelete, onMove, tourId, activeDevice = 'desktop' }: BlockEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getBlockIcon = (blockType: string) => {
    const icons: Record<string, string> = {
      text: '📝',
      buttons: '🔘',
      logo: '🖼️',
      table: '📊',
      spacer: '↕️'
    };
    return icons[blockType] || '📦';
  };

  const getBlockLabel = (blockType: string) => {
    const labels: Record<string, string> = {
      text: 'Text Block',
      buttons: 'Buttons Block',
      logo: 'Logo Block',
      table: 'Table Block',
      spacer: 'Spacer Block'
    };
    return labels[blockType] || 'Block';
  };

  return (
    <Card className="overflow-hidden border-2 transition-colors hover:border-brand-blue/50 dark:border-neutral-700 dark:bg-neutral-800/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-move" />
            <span className="text-lg">{getBlockIcon(block.block_type)}</span>
            <span className="truncate text-sm font-semibold dark:text-white">{getBlockLabel(block.block_type)}</span>
            <Badge variant="outline" className="text-xs dark:border-neutral-600 dark:text-gray-300">#{index + 1}</Badge>
          </div>
          
          <div className="flex w-full items-center justify-end gap-1 sm:w-auto">
            {/* Move Up/Down */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove('up')}
              disabled={index === 0}
              className="h-8 w-8 p-0"
            >
              <ArrowUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove('down')}
              disabled={index === totalBlocks - 1}
              className="h-8 w-8 p-0"
            >
              <ArrowDown className="w-3 h-3" />
            </Button>
            
            {/* Expand/Collapse */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Render appropriate editor based on block type */}
          {block.block_type === 'text' && (
            <TextBlockEditor block={block} onUpdate={onUpdate} />
          )}
          {block.block_type === 'buttons' && (
            <ButtonsBlockEditor block={block} onUpdate={onUpdate} />
          )}
          {block.block_type === 'logo' && (
            <LogoBlockEditor block={block} onUpdate={onUpdate} tourId={tourId} activeDevice={activeDevice} />
          )}
          {block.block_type === 'table' && (
            <TableBlockEditor block={block} onUpdate={onUpdate} />
          )}
          {block.block_type === 'spacer' && (
            <SpacerBlockEditor block={block} onUpdate={onUpdate} />
          )}
        </CardContent>
      )}
    </Card>
  );
}

