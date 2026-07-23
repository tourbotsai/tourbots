"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ColorPicker } from "@/components/app/chatbots/shared/color-picker";
import {
  AlignmentToggle,
  denseFieldClass,
  denseLabelClass,
  inspectorGroupLabelClass,
} from "./menu-editor-primitives";

interface TableBlockEditorProps {
  block: any;
  onUpdate: (updates: any) => void;
}

export function TableBlockEditor({ block, onUpdate }: TableBlockEditorProps) {
  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: { ...block.content, [key]: value }
    });
  };

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...block.content.headers];
    newHeaders[index] = value;
    updateContent('headers', newHeaders);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...block.content.rows];
    newRows[rowIndex][colIndex] = value;
    updateContent('rows', newRows);
  };

  const addRow = () => {
    const newRow = block.content.headers.map(() => '');
    updateContent('rows', [...block.content.rows, newRow]);
  };

  const deleteRow = (rowIndex: number) => {
    updateContent('rows', block.content.rows.filter((_: any, i: number) => i !== rowIndex));
  };

  const addColumn = () => {
    updateContent('headers', [...block.content.headers, 'New Column']);
    updateContent('rows', block.content.rows.map((row: string[]) => [...row, '']));
  };

  const deleteColumn = (colIndex: number) => {
    if (block.content.headers.length <= 1) return; // Keep at least one column
    
    updateContent('headers', block.content.headers.filter((_: any, i: number) => i !== colIndex));
    updateContent('rows', block.content.rows.map((row: string[]) => 
      row.filter((_: any, i: number) => i !== colIndex)
    ));
  };

  const updateAlignment = (alignment: string) => {
    onUpdate({ alignment });
  };

  return (
    <div className="space-y-4">
      {/* Headers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold">Table Headers</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={addColumn}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Column
          </Button>
        </div>
        
        <div className="space-y-2">
          {block.content.headers.map((header: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={header}
                onChange={(e) => updateHeader(index, e.target.value)}
                placeholder={`Header ${index + 1}`}
              />
              {block.content.headers.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteColumn(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold">Table Rows ({block.content.rows.length})</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={addRow}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Row
          </Button>
        </div>

        <div className="space-y-3">
          {block.content.rows.map((row: string[], rowIndex: number) => (
            <div key={rowIndex} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Row {rowIndex + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRow(rowIndex)}
                  className="h-6 px-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {row.map((cell: string, colIndex: number) => (
                  <Input
                    key={colIndex}
                    value={cell}
                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                    placeholder={block.content.headers[colIndex]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Styling */}
      <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-neutral-800">
        <p className={inspectorGroupLabelClass}>Styling</p>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className={denseLabelClass}>Header fill</Label>
            <div className="flex h-8 items-center rounded-md border border-input bg-white px-1 dark:border-neutral-700 dark:bg-background">
              <ColorPicker
                compact
                label=""
                value={block.content.header_background}
                onChange={(value) => updateContent('header_background', value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className={denseLabelClass}>Border</Label>
            <div className="flex h-8 items-center rounded-md border border-input bg-white px-1 dark:border-neutral-700 dark:bg-background">
              <ColorPicker
                compact
                label=""
                value={block.content.border_color}
                onChange={(value) => updateContent('border_color', value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label className={denseLabelClass}>Text size (px)</Label>
          <Input
            type="number"
            value={block.content.text_size}
            onChange={(e) => updateContent('text_size', parseInt(e.target.value))}
            min={10}
            max={24}
            className={denseFieldClass}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-neutral-800">
        <Label className={denseLabelClass}>Align</Label>
        <AlignmentToggle
          value={block.alignment}
          onChange={(alignment) => updateAlignment(alignment)}
        />
      </div>
    </div>
  );
}

