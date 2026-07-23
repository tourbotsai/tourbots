"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2 } from "lucide-react";
import { ColorPicker } from "@/components/app/chatbots/shared/color-picker";
import { useUser } from "@/hooks/useUser";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { AlignmentToggle, denseFieldClass, inspectorGroupLabelClass } from "./menu-editor-primitives";

interface ButtonsBlockEditorProps {
  block: any;
  onUpdate: (updates: any) => void;
}

export function ButtonsBlockEditor({ block, onUpdate }: ButtonsBlockEditorProps) {
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();
  const [tours, setTours] = useState<any[]>([]);
  const [tourPointsByTourId, setTourPointsByTourId] = useState<Record<string, any[]>>({});
  const [loadingPointsTourId, setLoadingPointsTourId] = useState<string | null>(null);
  const loadedTourPointsRef = useRef<Record<string, boolean>>({});

  const fetchTourPointsForTour = useCallback(async (tourId: string) => {
    if (!tourId || loadedTourPointsRef.current[tourId]) return;
    try {
      setLoadingPointsTourId(tourId);
      const pointsRes = await fetch(`/api/app/tours/${tourId}/points`, {
        headers: await getAuthHeaders(),
      });
      if (!pointsRes.ok) return;
      const pointsData = await pointsRes.json();
      const points = Array.isArray(pointsData?.points) ? pointsData.points : [];
      setTourPointsByTourId((prev) => ({ ...prev, [tourId]: points }));
      loadedTourPointsRef.current[tourId] = true;
    } catch (error) {
      console.error("Error fetching tour points for model:", error);
    } finally {
      setLoadingPointsTourId((current) => (current === tourId ? null : current));
    }
  }, [getAuthHeaders]);

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
        console.error("Error fetching tours/points:", error);
      }
    }
    fetchData();
  }, [user, getAuthHeaders, fetchTourPointsForTour]);

  const updateContent = (key: string, value: any) => {
    onUpdate({ content: { ...block.content, [key]: value } });
  };

  const updateButton = (buttonId: string, updates: any) => {
    updateContent(
      "buttons",
      block.content.buttons.map((btn: any) => (btn.id === buttonId ? { ...btn, ...updates } : btn))
    );
  };

  const addButton = () => {
    updateContent("buttons", [
      ...block.content.buttons,
      {
        id: `btn-${Date.now()}`,
        label: "New Button",
        action_type: "close_menu",
        target_id: "",
        button_color: "#0F172A",
        text_color: "#FFFFFF",
        icon: "",
      },
    ]);
  };

  const deleteButton = (buttonId: string) => {
    updateContent(
      "buttons",
      block.content.buttons.filter((btn: any) => btn.id !== buttonId)
    );
  };

  const getPointButtonSelectedTourId = (button: any) => {
    if (button.target_tour_id) return button.target_tour_id as string;
    if (button.target_model_id) {
      const matchingTour = tours.find((tour) => tour.matterport_tour_id === button.target_model_id);
      if (matchingTour) return matchingTour.id as string;
    }
    if (tours.length === 1) return tours[0].id as string;
    return "";
  };

  const gapValue = block.content.gap ?? 12;
  const buttons = Array.isArray(block.content.buttons) ? block.content.buttons : [];

  return (
    <div className="space-y-2.5">
      {/* Per row · Mobile · Style · Align */}
      <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto] items-center gap-x-2.5 gap-y-1">
        <span className="text-[10px] font-medium text-slate-500">Per row</span>
        <span className="text-[10px] font-medium text-slate-500">Mobile</span>
        <span className="text-[10px] font-medium text-slate-500">Style</span>
        <span className="text-[10px] font-medium text-slate-500">Align</span>

        <Select
          value={block.content.buttons_per_row?.toString()}
          onValueChange={(value) => updateContent("buttons_per_row", parseInt(value))}
        >
          <SelectTrigger className={denseFieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={(block.content.mobile_buttons_per_row || block.content.buttons_per_row)?.toString()}
          onValueChange={(value) => updateContent("mobile_buttons_per_row", parseInt(value))}
        >
          <SelectTrigger className={denseFieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={block.content.button_style}
          onValueChange={(value) => updateContent("button_style", value)}
        >
          <SelectTrigger className={denseFieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="ghost">Ghost</SelectItem>
          </SelectContent>
        </Select>

        <AlignmentToggle
          value={block.alignment}
          onChange={(alignment) => onUpdate({ alignment })}
        />
      </div>

      {/* Size · Mobile size · Gap */}
      <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-x-2.5 gap-y-1">
        <span className="text-[10px] font-medium text-slate-500">Size</span>
        <span className="text-[10px] font-medium text-slate-500">Mobile size</span>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-medium text-slate-500">Gap</span>
          <span className="font-mono text-[10px] tabular-nums text-slate-500">{gapValue}px</span>
        </div>

        <Select
          value={block.content.button_size}
          onValueChange={(value) => updateContent("button_size", value)}
        >
          <SelectTrigger className={denseFieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={block.content.mobile_button_size || block.content.button_size}
          onValueChange={(value) => updateContent("mobile_button_size", value)}
        >
          <SelectTrigger className={denseFieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>

        <Slider
          value={[gapValue]}
          onValueChange={([value]) => updateContent("gap", value)}
          min={4}
          max={32}
          step={4}
          aria-label="Gap"
        />
      </div>

      {/* Buttons list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={inspectorGroupLabelClass}>Buttons · {buttons.length}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={addButton}
            className="h-7 rounded-lg px-2 text-[11px]"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>

        {buttons.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 py-5 text-center text-[11px] text-slate-400 dark:border-neutral-800">
            No buttons yet
          </p>
        ) : (
          <div className="space-y-2">
            {buttons.map((button: any, index: number) => (
              <div
                key={button.id}
                className="space-y-2 rounded-xl border border-slate-200/90 bg-slate-50/60 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={inspectorGroupLabelClass}>Button {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => deleteButton(button.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete button ${index + 1}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Label · Action · Fill · Text */}
                <div className="grid w-full grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_auto_auto] items-center gap-x-2 gap-y-1">
                  <span className="text-[10px] font-medium text-slate-500">Label</span>
                  <span className="text-[10px] font-medium text-slate-500">Action</span>
                  <span className="text-[10px] font-medium text-slate-500">Fill</span>
                  <span className="text-[10px] font-medium text-slate-500">Text</span>

                  <Input
                    value={button.label}
                    onChange={(e) => updateButton(button.id, { label: e.target.value })}
                    className={denseFieldClass}
                    placeholder="Start Tour"
                  />
                  <Select
                    value={button.action_type}
                    onValueChange={(value) =>
                      updateButton(button.id, {
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
                      <SelectItem value="tour_point">Tour point</SelectItem>
                      <SelectItem value="tour_model">Other tour</SelectItem>
                      <SelectItem value="url">External link</SelectItem>
                      <SelectItem value="open_chat">Open AI chat</SelectItem>
                      <SelectItem value="close_menu">Close menu</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-[84px] overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                    <ColorPicker
                      compact
                      label=""
                      value={button.button_color}
                      onChange={(value) => updateButton(button.id, { button_color: value })}
                      showPresets={false}
                    />
                  </div>
                  <div className="w-[84px] overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                    <ColorPicker
                      compact
                      label=""
                      value={button.text_color}
                      onChange={(value) => updateButton(button.id, { text_color: value })}
                      showPresets={false}
                    />
                  </div>
                </div>

                {button.action_type === "tour_point" && (
                  <div
                    className={
                      tours.length > 1
                        ? "grid grid-cols-2 items-center gap-x-2 gap-y-1"
                        : "space-y-1"
                    }
                  >
                    {tours.length > 1 ? (
                      <>
                        <span className="text-[10px] font-medium text-slate-500">Tour</span>
                        <span className="text-[10px] font-medium text-slate-500">Point</span>
                        <Select
                          value={getPointButtonSelectedTourId(button) || undefined}
                          onValueChange={(value) => {
                            const selectedTour = tours.find((tour) => tour.id === value);
                            updateButton(button.id, {
                              target_tour_id: value,
                              target_id: "",
                              target_model_id: selectedTour?.matterport_tour_id || "",
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
                      <span className="text-[10px] font-medium text-slate-500">Point</span>
                    )}
                    <Select
                      value={button.target_id}
                      onValueChange={(value) => {
                        const selectedTourId = getPointButtonSelectedTourId(button);
                        const selectedTour = tours.find((tour) => tour.id === selectedTourId);
                        updateButton(button.id, {
                          target_id: value,
                          target_tour_id: selectedTourId || "",
                          target_model_id:
                            selectedTour?.matterport_tour_id || button.target_model_id || "",
                          target_model_name:
                            selectedTour?.title || button.target_model_name || "",
                        });
                      }}
                      disabled={!getPointButtonSelectedTourId(button)}
                    >
                      <SelectTrigger className={denseFieldClass}>
                        <SelectValue placeholder="Point…" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingPointsTourId === getPointButtonSelectedTourId(button) ? (
                          <SelectItem value="loading" disabled>
                            Loading…
                          </SelectItem>
                        ) : (
                          (() => {
                            const selectedTourId = getPointButtonSelectedTourId(button);
                            const pointsForTour = selectedTourId
                              ? tourPointsByTourId[selectedTourId] || []
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

                {button.action_type === "tour_model" && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-slate-500">Tour</span>
                    <Select
                      value={button.target_id}
                      onValueChange={(value) => {
                        const selectedTour = tours.find((t) => t.id === value);
                        if (selectedTour) {
                          updateButton(button.id, {
                            target_id: value,
                            target_model_id: selectedTour.matterport_tour_id,
                            target_model_name: selectedTour.title,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className={denseFieldClass}>
                        <SelectValue placeholder="Tour…" />
                      </SelectTrigger>
                      <SelectContent>
                        {tours.map((tour) => (
                          <SelectItem key={tour.id} value={tour.id}>
                            {tour.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {button.action_type === "url" && (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
                    <span className="text-[10px] font-medium text-slate-500">URL</span>
                    <span className="text-[10px] font-medium text-slate-500">Open</span>
                    <Input
                      value={button.target_id}
                      onChange={(e) => updateButton(button.id, { target_id: e.target.value })}
                      placeholder="https://"
                      className={denseFieldClass}
                    />
                    <Select
                      value={button.open_in || "new_tab"}
                      onValueChange={(value) => updateButton(button.id, { open_in: value })}
                    >
                      <SelectTrigger className={`${denseFieldClass} w-[110px]`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new_tab">New tab</SelectItem>
                        <SelectItem value="same_tab">Same tab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {button.action_type === "open_chat" && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-medium text-slate-500">Prompt</span>
                    <Textarea
                      value={button.chat_prompt || ""}
                      onChange={(e) => updateButton(button.id, { chat_prompt: e.target.value })}
                      placeholder="Optional prompt"
                      rows={2}
                      className="min-h-[48px] rounded-lg border-slate-200 text-xs shadow-none focus-visible:ring-slate-300 dark:border-neutral-700"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-500">Auto-send</span>
                      <Switch
                        checked={Boolean(button.chat_auto_send)}
                        onCheckedChange={(checked) =>
                          updateButton(button.id, { chat_auto_send: checked })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
