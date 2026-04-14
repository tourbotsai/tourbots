"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Type, Square, Image, Space, Blocks } from "lucide-react";
import { BlockEditor } from "./block-editor";

interface BlocksListProps {
  blocks: any[];
  onBlocksChange: (blocks: any[]) => void;
  tourId?: string;
  activeDevice?: 'desktop' | 'mobile';
}

export function BlocksList({ blocks, onBlocksChange, tourId, activeDevice = 'desktop' }: BlocksListProps) {
  const addBlock = (blockType: string) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      block_type: blockType,
      display_order: blocks.length,
      alignment: 'center',
      margin_top: 0,
      margin_bottom: 12,
      content: getDefaultContent(blockType),
      styling: {}
    };

    onBlocksChange([...blocks, newBlock]);
  };

  const getDefaultContent = (blockType: string) => {
    switch (blockType) {
      case 'text':
        return {
          text_type: 'header',
          text: 'Welcome to our venue',
          font_size: 28,
          font_weight: 'bold',
          color: '#000000',
          line_height: 1.3
        };
      case 'buttons':
        return {
          buttons: [],
          buttons_per_row: 2,
          mobile_buttons_per_row: 2, // Match desktop default
          button_size: 'medium',
          button_style: 'solid',
          gap: 12
        };
      case 'logo':
        return {
          image_url: '',
          desktop_size: 80,
          mobile_size: 80,
          width: 80,
          height: 80,
          alt_text: 'Logo'
        };
      case 'table':
        return {
          headers: ['Area', 'Description'],
          rows: [
            ['Example Area', 'Description here']
          ],
          header_background: '#F3F4F6',
          border_color: '#E5E7EB',
          text_size: 14
        };
      case 'spacer':
        return {
          height: 24
        };
      default:
        return {};
    }
  };

  const updateBlock = (blockId: string, updates: any) => {
    onBlocksChange(
      blocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    );
  };

  const deleteBlock = (blockId: string) => {
    onBlocksChange(blocks.filter(block => block.id !== blockId));
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    
    const newBlocks = [...blocks];
    if (direction === 'up' && index > 0) {
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    } else if (direction === 'down' && index < blocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }
    
    // Update display_order
    newBlocks.forEach((block, i) => {
      block.display_order = i;
    });
    
    onBlocksChange(newBlocks);
  };

  return (
    <div className="space-y-4">
      {/* Add Block Buttons */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('text')}
          className="h-8 flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
        >
          <Type className="mr-2 h-4 w-4" />
          Add Text
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('buttons')}
          className="h-8 flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
        >
          <Square className="mr-2 h-4 w-4" />
          Add Buttons
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('logo')}
          className="h-8 flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
        >
          <Image className="mr-2 h-4 w-4" />
          Add Logo
        </Button>
        {/* Temporarily hidden - may add back later
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('table')}
          className="flex-1"
        >
          <Table2 className="w-4 h-4 mr-2" />
          Add Table
        </Button>
        */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('spacer')}
          className="h-8 flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
        >
          <Space className="mr-2 h-4 w-4" />
          Add Spacer
        </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blocks List */}
      {blocks.length === 0 ? (
        <Card className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/40">
          <CardContent className="p-12 text-center text-slate-500">
            <Blocks className="mx-auto mb-3 h-12 w-12 text-slate-400" />
            <p className="mb-1 text-sm font-medium">No content blocks yet</p>
            <p className="text-xs">Add text, buttons, logos or spacers to build your menu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
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
              activeDevice={activeDevice}
            />
          ))}
        </div>
      )}
    </div>
  );
}

