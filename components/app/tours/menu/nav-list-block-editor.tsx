"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  ChevronDown,
  Heading,
  List,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import {
  MENU_FONT_OPTIONS,
  NAV_ICON_MAP,
  NAV_ICON_OPTIONS,
  getEffectiveNavDensity,
  normaliseNavListEntries,
  withNavListEntries,
} from "@/lib/tour-menu";
import { cn } from "@/lib/utils";
import { ColorPicker } from "@/components/app/chatbots/shared/color-picker";
import { denseFieldClass, inspectorGroupLabelClass } from "./menu-editor-primitives";

interface NavListBlockEditorProps {
  block: any;
  onUpdate: (updates: any) => void;
  activeDevice?: "desktop" | "mobile";
}

const SPACING_OPTIONS = [
  { value: "compact", label: "Small" },
  { value: "comfortable", label: "Medium" },
  { value: "spacious", label: "Large" },
] as const;

const DENSITY_PADDING_Y: Record<string, number> = {
  compact: 8,
  comfortable: 12,
  spacious: 16,
};

function NavIconPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (icon: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const SelectedIcon = value ? NAV_ICON_MAP[value] : null;
  const selectedLabel =
    NAV_ICON_OPTIONS.find((option) => option.name === value)?.label || "None";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            denseFieldClass,
            "inline-flex w-9 shrink-0 items-center justify-center px-0 text-slate-700 dark:text-slate-200"
          )}
          aria-label={`Icon: ${selectedLabel}`}
          title={selectedLabel}
        >
          {SelectedIcon ? (
            <SelectedIcon className="h-3.5 w-3.5" />
          ) : (
            <span className="text-[11px] text-slate-400">—</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[220px] p-2">
        <div className="grid grid-cols-6 gap-1">
          <button
            type="button"
            title="No icon"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={cn(
              "flex h-8 items-center justify-center rounded-md border text-[10px] font-medium transition-colors",
              !value
                ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 dark:border-neutral-700 dark:bg-neutral-900"
            )}
          >
            —
          </button>
          {NAV_ICON_OPTIONS.map(({ name, label, Icon }) => {
            const selected = value === name;
            return (
              <button
                key={name}
                type="button"
                title={label}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md border transition-colors",
                  selected
                    ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-300 dark:hover:bg-neutral-800"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function NavListBlockEditor({
  block,
  onUpdate,
  activeDevice = "desktop",
}: NavListBlockEditorProps) {
  const isMobile = activeDevice === "mobile";
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();
  const [tours, setTours] = useState<any[]>([]);
  const [tourPointsByTourId, setTourPointsByTourId] = useState<Record<string, any[]>>({});
  const [loadingPointsTourId, setLoadingPointsTourId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const loadedTourPointsRef = useRef<Record<string, boolean>>({});

  const items: any[] = block.content?.items || [];
  const densityKey = isMobile ? "mobile_density" : "density";
  const densityValue = isMobile
    ? block.content?.mobile_density || block.content?.density || "comfortable"
    : block.content?.density || "comfortable";

  const fetchTourPointsForTour = useCallback(
    async (tourId: string) => {
      if (!tourId) return;
      if (loadedTourPointsRef.current[tourId]) return;

      try {
        setLoadingPointsTourId(tourId);
        const pointsRes = await fetch(`/api/app/tours/${tourId}/points`, {
          headers: await getAuthHeaders(),
        });
        if (!pointsRes.ok) return;

        const pointsData = await pointsRes.json();
        const points = Array.isArray(pointsData?.points) ? pointsData.points : [];

        setTourPointsByTourId((prev) => ({
          ...prev,
          [tourId]: points,
        }));
        loadedTourPointsRef.current[tourId] = true;
      } catch (error) {
        console.error("Error fetching tour points for nav list:", error);
      } finally {
        setLoadingPointsTourId((current) => (current === tourId ? null : current));
      }
    },
    [getAuthHeaders]
  );

  useEffect(() => {
    async function fetchData() {
      if (!user?.venue?.id) return;

      try {
        const toursRes = await fetch(`/api/app/tours/venue/${user.venue.id}/all`, {
          headers: await getAuthHeaders(),
        });
        if (toursRes.ok) {
          const toursData = await toursRes.json();
          const activeTours = Array.isArray(toursData)
            ? toursData.filter((tour) => tour?.is_active !== false)
            : [];
          setTours(activeTours);

          if (activeTours.length === 1) {
            await fetchTourPointsForTour(activeTours[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching tours/points for nav list:", error);
      }
    }

    fetchData();
  }, [user, getAuthHeaders, fetchTourPointsForTour]);

  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: { ...block.content, [key]: value },
    });
  };

  const updateItems = (newItems: any[]) => updateContent("items", newItems);

  const updateItem = (itemId: string, updates: any) => {
    updateItems(
      items.map((item) => {
        if (item.id !== itemId) return item;
        const next = { ...item, ...updates };
        // Explicit null/undefined clears optional overrides (inherit Global).
        for (const key of Object.keys(updates)) {
          if (updates[key] == null) delete next[key];
        }
        return next;
      })
    );
  };

  const setDensity = (value: string) => {
    const paddingKey = isMobile ? "mobile_item_padding_y" : "item_padding_y";
    onUpdate({
      content: {
        ...block.content,
        [densityKey]: value,
        [paddingKey]: DENSITY_PADDING_Y[value] ?? 12,
      },
    });
  };

  const setItemKind = (itemId: string, kind: "header" | "item") => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item || item.kind === kind) return;

    if (kind === "header") {
      updateItem(itemId, {
        kind: "header",
        description: undefined,
        icon: undefined,
        entries: undefined,
        action_type: undefined,
        target_id: undefined,
        target_tour_id: undefined,
        target_model_id: undefined,
        target_model_name: undefined,
        open_in: undefined,
        chat_prompt: undefined,
        chat_auto_send: undefined,
      });
      return;
    }

    updateItem(
      itemId,
      withNavListEntries(
        { ...item, kind: "item" },
        [
          {
            id: `${itemId}-e0`,
            description: "",
            action_type: "none",
            target_id: "",
          },
        ]
      )
    );
  };

  const setItemEntries = (itemId: string, entries: Array<Record<string, any>>) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;
    updateItem(itemId, withNavListEntries(item, entries));
  };

  const updateEntry = (itemId: string, entryId: string, updates: Record<string, any>) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;
    const entries = normaliseNavListEntries(item).map((entry) =>
      entry.id === entryId ? { ...entry, ...updates } : entry
    );
    setItemEntries(itemId, entries);
  };

  const addEntry = (itemId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;
    const entries = [
      ...normaliseNavListEntries(item),
      {
        id: `${itemId}-e${Date.now()}`,
        description: "",
        action_type: "none",
        target_id: "",
      },
    ];
    setItemEntries(itemId, entries);
  };

  const removeEntry = (itemId: string, entryId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;
    const entries = normaliseNavListEntries(item).filter((entry) => entry.id !== entryId);
    setItemEntries(itemId, entries);
  };

  const addRow = () => {
    const id = `nav-${Date.now()}`;
    updateItems([
      ...items,
      withNavListEntries(
        {
          id,
          kind: "item",
          label: "New item",
        },
        [
          {
            id: `${id}-e0`,
            description: "",
            action_type: "none",
            target_id: "",
          },
        ]
      ),
    ]);
    setExpandedIds((prev) => new Set(prev).add(id));
  };

  const deleteItem = (itemId: string) => {
    updateItems(items.filter((item) => item.id !== itemId));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const moveItem = (itemId: string, direction: "up" | "down") => {
    const index = items.findIndex((item) => item.id === itemId);
    if (index === -1) return;

    const newItems = [...items];
    if (direction === "up" && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    } else if (direction === "down" && index < items.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }

    updateItems(newItems);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const getPointSelectedTourId = (target: any) => {
    if (target?.target_tour_id) return target.target_tour_id as string;
    if (target?.target_model_id) {
      const matchingTour = tours.find((tour) => tour.matterport_tour_id === target.target_model_id);
      if (matchingTour) return matchingTour.id as string;
    }
    if (tours.length === 1) return tours[0].id as string;
    return "";
  };

  const marginTop = Number.isFinite(Number(block.margin_top)) ? Number(block.margin_top) : 0;
  const marginBottom = Number.isFinite(Number(block.margin_bottom))
    ? Number(block.margin_bottom)
    : 12;

  const fontSize = Number(block.content?.font_size ?? block.content?.label_font_size ?? 14);
  const lineHeight = Number(block.content?.line_height ?? 1.35);
  const letterSpacing = Math.round(Number(block.content?.letter_spacing ?? 0) * 100);
  const lineHeightSlider = Math.round(lineHeight * 10);
  const globalHeaderColor = block.content?.header_color || "#64748B";
  const globalLabelColor = block.content?.label_color || "#1E293B";
  const globalDescriptionColor = block.content?.description_color || "#64748B";
  const globalIconColor = block.content?.icon_color || "#64748B";
  const globalItemPaddingY = getEffectiveNavDensity(
    block.content,
    isMobile ? "mobile" : "desktop"
  ).itemPaddingY;

  const colourBoxClass =
    "w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <div className="space-y-2.5">
      <div className="space-y-2">
        <p className={inspectorGroupLabelClass}>Global</p>

        {/* Add · Row spacing · Pad top · Pad bottom */}
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)] items-center gap-x-2.5 gap-y-1">
          <span className="text-[10px] font-medium text-slate-500">Add</span>
          <span className="text-[10px] font-medium text-slate-500">
            Row spacing{isMobile ? " · mobile" : ""}
          </span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-medium text-slate-500">Pad · top</span>
            <span className="font-mono text-[10px] tabular-nums text-slate-500">{marginTop}px</span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-medium text-slate-500">Pad · bottom</span>
            <span className="font-mono text-[10px] tabular-nums text-slate-500">
              {marginBottom}px
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={addRow}
            className="h-8 shrink-0 rounded-lg px-2.5 text-[11px]"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add row
          </Button>
          <Select value={densityValue} onValueChange={setDensity}>
            <SelectTrigger className={denseFieldClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPACING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex h-8 items-center">
            <Slider
              value={[marginTop]}
              onValueChange={([value]) => onUpdate({ margin_top: value })}
              min={0}
              max={80}
              step={4}
              className="w-full"
              aria-label="Pad top"
            />
          </div>
          <div className="flex h-8 items-center">
            <Slider
              value={[marginBottom]}
              onValueChange={([value]) => onUpdate({ margin_bottom: value })}
              min={0}
              max={80}
              step={4}
              className="w-full"
              aria-label="Pad bottom"
            />
          </div>
        </div>

        {/* Font · Weight · Size · Line · Letter spacing */}
        <div className="grid w-full grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.85fr)] items-center gap-x-2.5 gap-y-1">
          <span className="text-[10px] font-medium text-slate-500">Font</span>
          <span className="text-[10px] font-medium text-slate-500">Weight</span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-medium text-slate-500">Size</span>
            <span className="font-mono text-[10px] tabular-nums text-slate-500">{fontSize}px</span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-medium text-slate-500">Line</span>
            <span className="font-mono text-[10px] tabular-nums text-slate-500">
              {(lineHeightSlider / 10).toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-medium text-slate-500">Spacing</span>
            <span className="font-mono text-[10px] tabular-nums text-slate-500">
              {(letterSpacing / 100).toFixed(2)}em
            </span>
          </div>

          <Select
            value={block.content?.font_family || "inherit"}
            onValueChange={(value) => {
              if (value === "inherit") {
                const { font_family: _removed, ...rest } = block.content || {};
                onUpdate({ content: rest });
                return;
              }
              updateContent("font_family", value);
            }}
          >
            <SelectTrigger className={denseFieldClass}>
              <SelectValue placeholder="Use menu font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Use menu font</SelectItem>
              {MENU_FONT_OPTIONS.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  <span style={{ fontFamily: font.stack }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={block.content?.font_weight || "normal"}
            onValueChange={(value) => updateContent("font_weight", value)}
          >
            <SelectTrigger className={denseFieldClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="semibold">Semibold</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex h-8 items-center">
            <Slider
              value={[fontSize]}
              onValueChange={([value]) => updateContent("font_size", value)}
              min={11}
              max={28}
              step={1}
              className="w-full"
              aria-label="Text size"
            />
          </div>
          <div className="flex h-8 items-center">
            <Slider
              value={[lineHeightSlider]}
              onValueChange={([value]) => updateContent("line_height", value / 10)}
              min={10}
              max={25}
              step={1}
              className="w-full"
              aria-label="Line height"
            />
          </div>
          <div className="flex h-8 items-center">
            <Slider
              value={[letterSpacing]}
              onValueChange={([value]) => updateContent("letter_spacing", value / 100)}
              min={-5}
              max={20}
              step={1}
              className="w-full"
              aria-label="Letter spacing"
            />
          </div>
        </div>

        {/* Header · Label · Description · Icon colours */}
        <div className="grid w-full grid-cols-4 items-center gap-x-2.5 gap-y-1">
          <span className="text-[10px] font-medium text-slate-500">Header</span>
          <span className="text-[10px] font-medium text-slate-500">Label</span>
          <span className="text-[10px] font-medium text-slate-500">Description</span>
          <span className="text-[10px] font-medium text-slate-500">Icon</span>

          <div className={colourBoxClass}>
            <ColorPicker
              compact
              label=""
              value={globalHeaderColor}
              onChange={(value) => updateContent("header_color", value)}
              showPresets={false}
            />
          </div>
          <div className={colourBoxClass}>
            <ColorPicker
              compact
              label=""
              value={globalLabelColor}
              onChange={(value) => updateContent("label_color", value)}
              showPresets={false}
            />
          </div>
          <div className={colourBoxClass}>
            <ColorPicker
              compact
              label=""
              value={globalDescriptionColor}
              onChange={(value) => updateContent("description_color", value)}
              showPresets={false}
            />
          </div>
          <div className={colourBoxClass}>
            <ColorPicker
              compact
              label=""
              value={globalIconColor}
              onChange={(value) => updateContent("icon_color", value)}
              showPresets={false}
            />
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-5 text-center text-[11px] text-slate-400 dark:border-neutral-800">
          No rows yet — add a row above, then set its type.
        </p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, index) => {
            const isHeader = item.kind === "header";
            const isExpanded = expandedIds.has(item.id);
            const itemEntries = isHeader ? [] : normaliseNavListEntries(item);
            const ItemIcon = !isHeader && item.icon ? NAV_ICON_MAP[item.icon] : null;
            const TypeIcon = isHeader ? Heading : List;
            const summaryDescription =
              itemEntries.length === 0
                ? ""
                : itemEntries.length === 1
                  ? itemEntries[0].description || ""
                  : `${itemEntries[0].description || "Action"} · ${itemEntries.length} actions`;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200/90 bg-slate-50/60 dark:border-neutral-800 dark:bg-neutral-900/40"
              >
                <div className="flex items-center gap-1 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/80 dark:hover:bg-neutral-800/80"
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                        isHeader
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                      )}
                      title={isHeader ? "Header" : "Item"}
                    >
                      <TypeIcon className="h-3 w-3" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-slate-800 dark:text-slate-100">
                        {item.label || (isHeader ? "Untitled header" : "Untitled item")}
                      </span>
                      {!isHeader && summaryDescription ? (
                        <span className="block truncate text-[10px] text-slate-500">
                          {summaryDescription}
                        </span>
                      ) : null}
                    </span>

                    {ItemIcon ? (
                      <ItemIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    ) : null}

                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>

                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveItem(item.id, "up")}
                      disabled={index === 0}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveItem(item.id, "down")}
                      disabled={index === items.length - 1}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="space-y-2 border-t border-slate-200/80 px-2.5 py-2.5 dark:border-neutral-800">
                    {isHeader ? (
                      <div className="grid w-full grid-cols-[92px_minmax(0,1fr)_5.75rem] items-center gap-x-2 gap-y-1">
                        <span className="text-[10px] font-medium text-slate-500">Type</span>
                        <span className="text-[10px] font-medium text-slate-500">Label</span>
                        <span className="text-[10px] font-medium text-slate-500">Colour</span>

                        <Select
                          value="header"
                          onValueChange={(value) =>
                            setItemKind(item.id, value as "header" | "item")
                          }
                        >
                          <SelectTrigger className={denseFieldClass}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="header">Header</SelectItem>
                            <SelectItem value="item">Item</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={item.label}
                          onChange={(e) => updateItem(item.id, { label: e.target.value })}
                          placeholder="e.g. Explore"
                          className={denseFieldClass}
                        />
                        <div className={colourBoxClass}>
                          <ColorPicker
                            compact
                            label=""
                            value={item.label_color || globalHeaderColor}
                            onChange={(value) => updateItem(item.id, { label_color: value })}
                            showPresets={false}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Type · Icon · Label · V spacing */}
                        <div className="grid w-full grid-cols-[92px_36px_minmax(0,1fr)_minmax(5.5rem,0.9fr)] items-center gap-x-2 gap-y-1">
                          <span className="text-[10px] font-medium text-slate-500">Type</span>
                          <span className="text-[10px] font-medium text-slate-500">Icon</span>
                          <span className="text-[10px] font-medium text-slate-500">Label</span>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-medium text-slate-500">
                              V spacing
                            </span>
                            <span className="font-mono text-[10px] tabular-nums text-slate-500">
                              {item.item_padding_y ?? globalItemPaddingY}px
                              {item.item_padding_y == null ? " · g" : ""}
                            </span>
                          </div>

                          <Select
                            value="item"
                            onValueChange={(value) =>
                              setItemKind(item.id, value as "header" | "item")
                            }
                          >
                            <SelectTrigger className={denseFieldClass}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="header">Header</SelectItem>
                              <SelectItem value="item">Item</SelectItem>
                            </SelectContent>
                          </Select>
                          <NavIconPicker
                            value={item.icon || ""}
                            onChange={(icon) => updateItem(item.id, { icon })}
                          />
                          <Input
                            value={item.label}
                            onChange={(e) => updateItem(item.id, { label: e.target.value })}
                            placeholder="e.g. Key spaces"
                            className={denseFieldClass}
                          />
                          <div className="flex h-8 items-center gap-1">
                            <Slider
                              value={[item.item_padding_y ?? globalItemPaddingY]}
                              onValueChange={([value]) =>
                                updateItem(item.id, { item_padding_y: value })
                              }
                              min={2}
                              max={28}
                              step={1}
                              className="w-full"
                              aria-label="Vertical spacing"
                              title={
                                item.item_padding_y == null
                                  ? `Using global (${globalItemPaddingY}px)`
                                  : `${item.item_padding_y}px`
                              }
                            />
                            <button
                              type="button"
                              onClick={() => updateItem(item.id, { item_padding_y: undefined })}
                              disabled={item.item_padding_y == null}
                              className="shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-neutral-800 dark:hover:text-slate-200"
                              title="Reset to global row spacing"
                            >
                              Aut
                            </button>
                          </div>
                        </div>

                        {/* Description + Action entries */}
                        <div className="space-y-2">
                          {itemEntries.map((entry, entryIndex) => {
                            const pointTourId = getPointSelectedTourId(entry);
                            return (
                              <div
                                key={entry.id}
                                className="space-y-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-neutral-800 dark:bg-neutral-950/40"
                              >
                                <div className="grid w-full grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_auto] items-center gap-x-2 gap-y-1">
                                  <span className="text-[10px] font-medium text-slate-500">
                                    Description
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-500">
                                    Action
                                  </span>
                                  <span className="text-[10px] font-medium text-transparent">
                                    .
                                  </span>

                                  <Input
                                    value={entry.description || ""}
                                    onChange={(e) =>
                                      updateEntry(item.id, entry.id, {
                                        description: e.target.value,
                                      })
                                    }
                                    placeholder="e.g. Dining area"
                                    className={denseFieldClass}
                                  />
                                  <Select
                                    value={entry.action_type || "none"}
                                    onValueChange={(value) =>
                                      updateEntry(item.id, entry.id, {
                                        action_type: value,
                                        target_id: "",
                                        target_tour_id: "",
                                        target_model_id: "",
                                        target_model_name: "",
                                      })
                                    }
                                  >
                                    <SelectTrigger className={denseFieldClass}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="tour_point">
                                        Navigate to tour point
                                      </SelectItem>
                                      <SelectItem value="tour_model">
                                        Switch to other tour
                                      </SelectItem>
                                      <SelectItem value="url">External link</SelectItem>
                                      <SelectItem value="open_chat">Open AI chat</SelectItem>
                                      <SelectItem value="close_menu">Close tour menu</SelectItem>
                                      <SelectItem value="none">— Label only</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="flex items-center gap-0.5">
                                    {entryIndex === itemEntries.length - 1 ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addEntry(item.id)}
                                        className="h-8 w-8 p-0"
                                        aria-label="Add description and action"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </Button>
                                    ) : (
                                      <span className="h-8 w-8" aria-hidden />
                                    )}
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeEntry(item.id, entry.id)}
                                      disabled={itemEntries.length <= 1}
                                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 disabled:opacity-30"
                                      aria-label="Remove description and action"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                {entry.action_type === "tour_point" && (
                                  <div
                                    className={
                                      tours.length > 1
                                        ? "grid grid-cols-2 items-center gap-x-2 gap-y-1"
                                        : "space-y-1"
                                    }
                                  >
                                    {tours.length > 1 ? (
                                      <>
                                        <span className="text-[10px] font-medium text-slate-500">
                                          Tour
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-500">
                                          Point
                                        </span>
                                        <Select
                                          value={pointTourId || undefined}
                                          onValueChange={(value) => {
                                            const selectedTour = tours.find(
                                              (tour) => tour.id === value
                                            );
                                            updateEntry(item.id, entry.id, {
                                              target_tour_id: value,
                                              target_id: "",
                                              target_model_id:
                                                selectedTour?.matterport_tour_id || "",
                                              target_model_name: selectedTour?.title || "",
                                            });
                                            fetchTourPointsForTour(value);
                                          }}
                                        >
                                          <SelectTrigger className={denseFieldClass}>
                                            <SelectValue placeholder="Model…" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {tours.map((tour) => (
                                              <SelectItem key={tour.id} value={tour.id}>
                                                {tour.title}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </>
                                    ) : (
                                      <span className="text-[10px] font-medium text-slate-500">
                                        Point
                                      </span>
                                    )}
                                    <Select
                                      value={entry.target_id || ""}
                                      onValueChange={(value) => {
                                        const selectedTour = tours.find(
                                          (tour) => tour.id === pointTourId
                                        );
                                        updateEntry(item.id, entry.id, {
                                          target_id: value,
                                          target_tour_id: pointTourId || "",
                                          target_model_id:
                                            selectedTour?.matterport_tour_id ||
                                            entry.target_model_id ||
                                            "",
                                          target_model_name:
                                            selectedTour?.title || entry.target_model_name || "",
                                        });
                                      }}
                                      disabled={!pointTourId}
                                    >
                                      <SelectTrigger className={denseFieldClass}>
                                        <SelectValue
                                          placeholder={
                                            !pointTourId ? "Model first…" : "Point…"
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {loadingPointsTourId === pointTourId ? (
                                          <SelectItem value="loading" disabled>
                                            Loading…
                                          </SelectItem>
                                        ) : (
                                          (() => {
                                            const pointsForTour = pointTourId
                                              ? tourPointsByTourId[pointTourId] || []
                                              : [];
                                            if (pointsForTour.length === 0) {
                                              return (
                                                <SelectItem value="none" disabled>
                                                  No points
                                                </SelectItem>
                                              );
                                            }
                                            return pointsForTour.map((point) => (
                                              <SelectItem key={point.id} value={point.id}>
                                                {point.name}
                                              </SelectItem>
                                            ));
                                          })()
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {entry.action_type === "tour_model" && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-medium text-slate-500">
                                      Target tour
                                    </span>
                                    <Select
                                      value={entry.target_id || ""}
                                      onValueChange={(value) => {
                                        const selectedTour = tours.find((t) => t.id === value);
                                        if (selectedTour) {
                                          updateEntry(item.id, entry.id, {
                                            target_id: value,
                                            target_model_id: selectedTour.matterport_tour_id,
                                            target_model_name: selectedTour.title,
                                          });
                                        }
                                      }}
                                    >
                                      <SelectTrigger className={denseFieldClass}>
                                        <SelectValue placeholder="Select tour…" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {tours.length === 0 ? (
                                          <SelectItem value="none" disabled>
                                            No tours available
                                          </SelectItem>
                                        ) : (
                                          tours.map((tour) => (
                                            <SelectItem key={tour.id} value={tour.id}>
                                              {tour.title}
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {entry.action_type === "url" && (
                                  <div className="grid grid-cols-[minmax(0,1fr)_110px] items-center gap-x-2 gap-y-1">
                                    <span className="text-[10px] font-medium text-slate-500">
                                      URL
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-500">
                                      Open
                                    </span>
                                    <Input
                                      value={entry.target_id || ""}
                                      onChange={(e) =>
                                        updateEntry(item.id, entry.id, {
                                          target_id: e.target.value,
                                        })
                                      }
                                      placeholder="https://"
                                      className={denseFieldClass}
                                    />
                                    <Select
                                      value={entry.open_in || "new_tab"}
                                      onValueChange={(value) =>
                                        updateEntry(item.id, entry.id, { open_in: value })
                                      }
                                    >
                                      <SelectTrigger className={denseFieldClass}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="new_tab">New tab</SelectItem>
                                        <SelectItem value="same_tab">Same tab</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {entry.action_type === "open_chat" && (
                                  <div className="space-y-2">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-medium text-slate-500">
                                        Prompt
                                      </span>
                                      <Textarea
                                        value={entry.chat_prompt || ""}
                                        onChange={(e) =>
                                          updateEntry(item.id, entry.id, {
                                            chat_prompt: e.target.value,
                                          })
                                        }
                                        placeholder="Optional prompt"
                                        rows={2}
                                        className="min-h-[48px] text-xs"
                                      />
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-medium text-slate-500">
                                        Auto-send
                                      </span>
                                      <Switch
                                        checked={Boolean(entry.chat_auto_send)}
                                        onCheckedChange={(checked) =>
                                          updateEntry(item.id, entry.id, {
                                            chat_auto_send: checked,
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Icon · Label · Description colours */}
                        <div className="grid w-full grid-cols-3 items-center gap-x-2 gap-y-1">
                          <span className="text-[10px] font-medium text-slate-500">Icon colour</span>
                          <span className="text-[10px] font-medium text-slate-500">Label colour</span>
                          <span className="text-[10px] font-medium text-slate-500">
                            Description colour
                          </span>
                          <div className={colourBoxClass}>
                            <ColorPicker
                              compact
                              label=""
                              value={item.icon_color || globalIconColor}
                              onChange={(value) => updateItem(item.id, { icon_color: value })}
                              showPresets={false}
                            />
                          </div>
                          <div className={colourBoxClass}>
                            <ColorPicker
                              compact
                              label=""
                              value={item.label_color || globalLabelColor}
                              onChange={(value) => updateItem(item.id, { label_color: value })}
                              showPresets={false}
                            />
                          </div>
                          <div className={colourBoxClass}>
                            <ColorPicker
                              compact
                              label=""
                              value={item.description_color || globalDescriptionColor}
                              onChange={(value) =>
                                updateItem(item.id, { description_color: value })
                              }
                              showPresets={false}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
