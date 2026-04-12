"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

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
      <div className="pt-4 border-t space-y-3">
        <Label className="text-sm font-semibold">Table Styling</Label>
        
        <div>
          <Label className="text-xs mb-2 block">Header Background</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={block.content.header_background}
              onChange={(e) => updateContent('header_background', e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <span className="text-xs text-gray-600">{block.content.header_background}</span>
          </div>
        </div>

        <div>
          <Label className="text-xs mb-2 block">Border Colour</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={block.content.border_color}
              onChange={(e) => updateContent('border_color', e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <span className="text-xs text-gray-600">{block.content.border_color}</span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Text Size (px)</Label>
          <Input
            type="number"
            value={block.content.text_size}
            onChange={(e) => updateContent('text_size', parseInt(e.target.value))}
            min={10}
            max={24}
            className="mt-1"
          />
        </div>
      </div>

      {/* Alignment */}
      <div className="pt-4 border-t">
        <Label className="text-sm mb-2 block">Block Alignment</Label>
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

