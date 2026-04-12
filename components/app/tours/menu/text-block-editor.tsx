"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextBlockEditorProps {
  block: any;
  onUpdate: (updates: any) => void;
}

export function TextBlockEditor({ block, onUpdate }: TextBlockEditorProps) {
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
      {/* Text Type */}
      <div>
        <Label className="text-sm">Text Type</Label>
        <Select
          value={block.content.text_type}
          onValueChange={(value) => updateContent('text_type', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="header">Header</SelectItem>
            <SelectItem value="subheader">Subheader</SelectItem>
            <SelectItem value="paragraph">Paragraph</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Content */}
      <div>
        <Label className="text-sm">Text Content</Label>
        {block.content.text_type === 'paragraph' ? (
          <Textarea
            value={block.content.text}
            onChange={(e) => updateContent('text', e.target.value)}
            placeholder="Enter your text here..."
            rows={3}
            className="mt-1"
          />
        ) : (
          <Input
            value={block.content.text}
            onChange={(e) => updateContent('text', e.target.value)}
            placeholder="Enter your text here..."
            className="mt-1"
          />
        )}
      </div>

      {/* Font Size */}
      <div>
        <Label className="text-sm">Font Size: {block.content.font_size}px</Label>
        <Slider
          value={[block.content.font_size]}
          onValueChange={([value]) => updateContent('font_size', value)}
          min={12}
          max={64}
          step={2}
          className="mt-2"
        />
      </div>

      {/* Font Weight */}
      <div>
        <Label className="text-sm">Font Weight</Label>
        <Select
          value={block.content.font_weight}
          onValueChange={(value) => updateContent('font_weight', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="semibold">Semibold</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Color */}
      <div>
        <Label className="text-sm mb-2 block">Text Colour</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={block.content.color}
            onChange={(e) => updateContent('color', e.target.value)}
            className="w-12 h-10 rounded border cursor-pointer"
          />
          <Input
            value={block.content.color}
            onChange={(e) => updateContent('color', e.target.value)}
            placeholder="#000000"
            className="flex-1 text-xs font-mono uppercase"
          />
        </div>
      </div>

      {/* Alignment */}
      <div>
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

      {/* Spacing */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Margin Top: {block.margin_top}px</Label>
          <Slider
            value={[block.margin_top]}
            onValueChange={([value]) => onUpdate({ margin_top: value })}
            min={0}
            max={64}
            step={4}
            className="mt-2"
          />
        </div>
        <div>
          <Label className="text-sm">Margin Bottom: {block.margin_bottom}px</Label>
          <Slider
            value={[block.margin_bottom]}
            onValueChange={([value]) => onUpdate({ margin_bottom: value })}
            min={0}
            max={64}
            step={4}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

