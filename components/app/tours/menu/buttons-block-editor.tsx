"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

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
      console.error("Error fetching tour points for model:", error);
    } finally {
      setLoadingPointsTourId((current) => (current === tourId ? null : current));
    }
  }, [getAuthHeaders]);

  // Fetch tours and tour points when component mounts
  useEffect(() => {
    async function fetchData() {
      if (!user?.venue?.id) return;

      try {
        // Fetch all tours for the venue
        const toursRes = await fetch(`/api/app/tours/venue/${user.venue.id}/all`, {
          headers: await getAuthHeaders(),
        });
        if (toursRes.ok) {
          const toursData = await toursRes.json();
          const activeTours = Array.isArray(toursData)
            ? toursData.filter((tour) => tour?.is_active !== false)
            : [];
          setTours(activeTours);

          // Preload points when there is only one model.
          if (activeTours.length === 1) {
            await fetchTourPointsForTour(activeTours[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching tours/points:', error);
      }
    }

    fetchData();
  }, [user, getAuthHeaders, fetchTourPointsForTour]);

  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: { ...block.content, [key]: value }
    });
  };

  const updateButton = (buttonId: string, updates: any) => {
    const updatedButtons = block.content.buttons.map((btn: any) =>
      btn.id === buttonId ? { ...btn, ...updates } : btn
    );
    updateContent('buttons', updatedButtons);
  };

  const addButton = () => {
    const newButton = {
      id: `btn-${Date.now()}`,
      label: 'New Button',
      action_type: 'close_menu',
      target_id: '',
      button_color: '#3B82F6',
      text_color: '#FFFFFF',
      icon: ''
    };
    updateContent('buttons', [...block.content.buttons, newButton]);
  };

  const deleteButton = (buttonId: string) => {
    updateContent('buttons', block.content.buttons.filter((btn: any) => btn.id !== buttonId));
  };

  const updateAlignment = (alignment: string) => {
    onUpdate({ alignment });
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

  return (
    <div className="space-y-4">
      {/* Buttons Per Row - Desktop & Mobile */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm dark:text-gray-200">Desktop Buttons Per Row</Label>
          <Select
            value={block.content.buttons_per_row.toString()}
            onValueChange={(value) => updateContent('buttons_per_row', parseInt(value))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 per row</SelectItem>
              <SelectItem value="2">2 per row</SelectItem>
              <SelectItem value="3">3 per row</SelectItem>
              <SelectItem value="4">4 per row</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm dark:text-gray-200">Mobile Buttons Per Row</Label>
          <Select
            value={(block.content.mobile_buttons_per_row || block.content.buttons_per_row).toString()}
            onValueChange={(value) => updateContent('mobile_buttons_per_row', parseInt(value))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 per row</SelectItem>
              <SelectItem value="2">2 per row</SelectItem>
              <SelectItem value="3">3 per row</SelectItem>
              <SelectItem value="4">4 per row</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Button Size & Style */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm dark:text-gray-200">Button Size</Label>
          <Select
            value={block.content.button_size}
            onValueChange={(value) => updateContent('button_size', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm dark:text-gray-200">Button Style</Label>
          <Select
            value={block.content.button_style}
            onValueChange={(value) => updateContent('button_style', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="ghost">Ghost</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm">Gap Between Buttons: {block.content.gap}px</Label>
        <Slider
          value={[block.content.gap]}
          onValueChange={([value]) => updateContent('gap', value)}
          min={4}
          max={32}
          step={4}
          className="mt-2"
        />
      </div>

      {/* Individual Buttons */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Buttons ({block.content.buttons.length})</Label>
          <Button
            size="sm"
            onClick={addButton}
            variant="outline"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Button
          </Button>
        </div>

        {block.content.buttons.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-500 text-sm">
            No buttons yet. Click "Add Button" above.
          </div>
        ) : (
          <div className="space-y-3">
            {block.content.buttons.map((button: any, index: number) => (
              <Card key={button.id} className="bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="dark:border-neutral-600 dark:text-gray-300">Button {index + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteButton(button.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Button Label */}
                  <div>
                    <Label className="text-xs dark:text-gray-200">Button Label</Label>
                    <Input
                      value={button.label}
                      onChange={(e) => updateButton(button.id, { label: e.target.value })}
                      placeholder="e.g., Start Tour, View area 1"
                      className="mt-1"
                    />
                  </div>

                  {/* Action Type */}
                  <div>
                    <Label className="text-xs dark:text-gray-200">Action</Label>
                    <Select
                      value={button.action_type}
                      onValueChange={(value) => updateButton(button.id, {
                        action_type: value,
                        target_id: '',
                        target_tour_id: '',
                        target_model_id: '',
                        target_model_name: '',
                      })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tour_point">📍 Navigate to Tour Point</SelectItem>
                        <SelectItem value="tour_model">🏢 Switch to Other Tour</SelectItem>
                        <SelectItem value="url">🔗 External Link</SelectItem>
                        <SelectItem value="open_chat">💬 Open AI Chat</SelectItem>
                        <SelectItem value="close_menu">✖️ Close Tour Menu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conditional Target Fields */}
                  {button.action_type === 'tour_point' && (
                    <div>
                      {tours.length > 1 && (
                        <div className="mb-3">
                          <Label className="text-xs dark:text-gray-200">Select Tour Model First</Label>
                          <Select
                            value={getPointButtonSelectedTourId(button) || undefined}
                            onValueChange={(value) => {
                              const selectedTour = tours.find((tour) => tour.id === value);
                              updateButton(button.id, {
                                target_tour_id: value,
                                target_id: '',
                                target_model_id: selectedTour?.matterport_tour_id || '',
                                target_model_name: selectedTour?.title || '',
                              });
                              fetchTourPointsForTour(value);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select model..." />
                            </SelectTrigger>
                            <SelectContent>
                              {tours.map((tour) => (
                                <SelectItem key={tour.id} value={tour.id}>
                                  🏢 {tour.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Label className="text-xs dark:text-gray-200">Target Tour Point</Label>
                      <Select
                        value={button.target_id}
                        onValueChange={(value) => {
                          const selectedTourId = getPointButtonSelectedTourId(button);
                          const selectedTour = tours.find((tour) => tour.id === selectedTourId);
                          updateButton(button.id, {
                            target_id: value,
                            target_tour_id: selectedTourId || '',
                            target_model_id: selectedTour?.matterport_tour_id || button.target_model_id || '',
                            target_model_name: selectedTour?.title || button.target_model_name || '',
                          });
                        }}
                        disabled={!getPointButtonSelectedTourId(button)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue
                            placeholder={
                              !getPointButtonSelectedTourId(button)
                                ? "Select a model first..."
                                : "Select saved position..."
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingPointsTourId === getPointButtonSelectedTourId(button) ? (
                            <SelectItem value="loading" disabled>Loading points...</SelectItem>
                          ) : (
                            (() => {
                              const selectedTourId = getPointButtonSelectedTourId(button);
                              const pointsForTour = selectedTourId ? (tourPointsByTourId[selectedTourId] || []) : [];
                              if (pointsForTour.length === 0) {
                                return <SelectItem value="none" disabled>No saved positions yet</SelectItem>;
                              }
                              return pointsForTour.map((point) => (
                                <SelectItem key={point.id} value={point.id}>
                                  📍 {point.name}
                                </SelectItem>
                              ));
                            })()
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Will navigate camera to this saved position.
                      </p>
                    </div>
                  )}

                  {button.action_type === 'tour_model' && (
                    <div>
                      <Label className="text-xs dark:text-gray-200">Target Tour Model</Label>
                      <Select
                        value={button.target_id}
                        onValueChange={(value) => {
                          // Find the selected tour to get its matterport_tour_id and title
                          const selectedTour = tours.find(t => t.id === value);
                          if (selectedTour) {
                            updateButton(button.id, { 
                              target_id: value,
                              target_model_id: selectedTour.matterport_tour_id,
                              target_model_name: selectedTour.title
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select tour location..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tours.length === 0 ? (
                            <SelectItem value="none" disabled>No tours available</SelectItem>
                          ) : (
                            tours.map((tour) => (
                              <SelectItem key={tour.id} value={tour.id}>
                                🏢 {tour.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Will switch to different Matterport model
                      </p>
                    </div>
                  )}

                  {button.action_type === 'url' && (
                    <div>
                      <Label className="text-xs dark:text-gray-200">URL</Label>
                      <Input
                        value={button.target_id}
                        onChange={(e) => updateButton(button.id, { target_id: e.target.value })}
                        placeholder="https://example.com/book"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Opens in new tab
                      </p>
                    </div>
                  )}

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-2 block dark:text-gray-200">Button Colour</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={button.button_color}
                          onChange={(e) => updateButton(button.id, { button_color: e.target.value })}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={button.button_color}
                          onChange={(e) => updateButton(button.id, { button_color: e.target.value })}
                          placeholder="#3B82F6"
                          className="flex-1 text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-2 block dark:text-gray-200">Text Colour</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={button.text_color}
                          onChange={(e) => updateButton(button.id, { text_color: e.target.value })}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={button.text_color}
                          onChange={(e) => updateButton(button.id, { text_color: e.target.value })}
                          placeholder="#FFFFFF"
                          className="flex-1 text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Block Alignment */}
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

