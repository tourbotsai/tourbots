"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useChatbotTriggers } from "@/hooks/app/useChatbotTriggers";
import {
  ChatbotTrigger,
  ChatbotTriggerActionType,
  ChatbotTriggerConditionType,
  ChatbotTriggerTourModelOption,
  ChatbotTriggerTourPointOption,
} from "@/lib/types";

interface EditableTrigger {
  id?: string;
  name: string;
  display_order: number;
  is_active: boolean;
  condition_type: ChatbotTriggerConditionType;
  condition_keywords: string[];
  condition_keywords_input: string;
  condition_message_count: number | null;
  action_type: ChatbotTriggerActionType;
  action_message: string;
  action_url: string;
  action_tour_point_id: string;
  action_tour_model_id: string;
}

interface ChatbotTriggersProps {
  chatbotConfigId?: string | null;
  initialTriggers?: ChatbotTrigger[];
  initialTourPoints?: ChatbotTriggerTourPointOption[];
  initialTourModels?: ChatbotTriggerTourModelOption[];
  readOnly?: boolean;
  hideHeader?: boolean;
}

function createEmptyTrigger(index: number): EditableTrigger {
  return {
    name: `Trigger ${index + 1}`,
    display_order: index,
    is_active: true,
    condition_type: "keywords",
    condition_keywords: [],
    condition_keywords_input: "",
    condition_message_count: null,
    action_type: "ai_message",
    action_message: "",
    action_url: "",
    action_tour_point_id: "",
    action_tour_model_id: "",
  };
}

function parseKeywordTokens(input: string): string[] {
  return input
    .split(",")
    .map((keyword) => keyword.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

export function ChatbotTriggers({
  chatbotConfigId,
  initialTriggers = [],
  initialTourPoints = [],
  initialTourModels = [],
  readOnly = false,
  hideHeader = false,
}: ChatbotTriggersProps) {
  const { toast } = useToast();
  const useInitialData =
    readOnly && (initialTriggers.length > 0 || initialTourPoints.length > 0 || initialTourModels.length > 0);
  const { triggers, tourPoints, tourModels, isLoading, isSaving, saveTriggers } = useChatbotTriggers(chatbotConfigId, {
    enabled: !useInitialData,
    initialTriggers,
    initialTourPoints,
    initialTourModels,
  });
  const [isExpanded, setIsExpanded] = useState(hideHeader);
  const [draftTriggers, setDraftTriggers] = useState<EditableTrigger[]>([]);

  useEffect(() => {
    const mapped = (triggers || []).map((trigger, index) => ({
      id: trigger.id,
      name: trigger.name,
      display_order: trigger.display_order ?? index,
      is_active: trigger.is_active !== false,
      condition_type: trigger.condition_type || "keywords",
      condition_keywords: trigger.condition_keywords || [],
      condition_keywords_input: "",
      condition_message_count: trigger.condition_message_count || null,
      action_type: trigger.action_type || "ai_message",
      action_message: trigger.action_message || "",
      action_url: trigger.action_url || "",
      action_tour_point_id: trigger.action_tour_point_id || "",
      action_tour_model_id: trigger.action_tour_model_id || "",
    }));
    setDraftTriggers(mapped);
  }, [triggers]);

  const canSave = useMemo(
    () =>
      Boolean(
        !readOnly &&
          chatbotConfigId &&
          draftTriggers.every((trigger) => {
            if (!trigger.name.trim() || !trigger.action_message.trim()) {
              return false;
            }
            if (trigger.action_type === "open_url") {
              return Boolean(trigger.action_url.trim());
            }
            if (trigger.action_type === "navigate_tour_point") {
              return Boolean(trigger.action_tour_point_id);
            }
            if (trigger.action_type === "switch_tour_model") {
              return Boolean(trigger.action_tour_model_id);
            }
            return true;
          })
      ),
    [chatbotConfigId, draftTriggers, readOnly]
  );

  const updateTrigger = (index: number, updates: Partial<EditableTrigger>) => {
    setDraftTriggers((prev) =>
      prev.map((trigger, currentIndex) => (currentIndex === index ? { ...trigger, ...updates } : trigger))
    );
  };

  const addTrigger = () => {
    if (readOnly) return;
    setDraftTriggers((prev) => [createEmptyTrigger(prev.length), ...prev]);
  };

  const deleteTrigger = (index: number) => {
    if (readOnly) return;
    setDraftTriggers((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const addKeywordsFromInput = (index: number) => {
    setDraftTriggers((prev) =>
      prev.map((trigger, currentIndex) => {
        if (currentIndex !== index) return trigger;

        const nextTokens = parseKeywordTokens(trigger.condition_keywords_input);
        if (nextTokens.length === 0) {
          return trigger;
        }

        const existing = new Set(trigger.condition_keywords.map((keyword) => keyword.toLowerCase()));
        const mergedKeywords = [...trigger.condition_keywords];
        for (const token of nextTokens) {
          const normalised = token.toLowerCase();
          if (!existing.has(normalised)) {
            existing.add(normalised);
            mergedKeywords.push(token);
          }
        }

        return {
          ...trigger,
          condition_keywords: mergedKeywords,
          condition_keywords_input: "",
        };
      })
    );
  };

  const removeKeyword = (index: number, keywordIndex: number) => {
    setDraftTriggers((prev) =>
      prev.map((trigger, currentIndex) => {
        if (currentIndex !== index) return trigger;
        return {
          ...trigger,
          condition_keywords: trigger.condition_keywords.filter((_, currentKeywordIndex) => currentKeywordIndex !== keywordIndex),
        };
      })
    );
  };

  const handleSave = async () => {
    if (readOnly) {
      toast({
        title: "Read-only preview",
        description: "Save the share to edit triggers in the portal.",
      });
      return;
    }
    if (!chatbotConfigId) {
      return;
    }

    try {
      await saveTriggers({
        triggers: draftTriggers.map((trigger, index) => ({
          id: trigger.id,
          name: trigger.name.trim() || `Trigger ${index + 1}`,
          display_order: index,
          is_active: trigger.is_active,
          condition_type: trigger.condition_type,
          condition_keywords: trigger.condition_type === "keywords" ? trigger.condition_keywords : [],
          condition_message_count:
            trigger.condition_type === "message_count" ? Number(trigger.condition_message_count || 0) : null,
          action_type: trigger.action_type,
          action_message: trigger.action_message.trim(),
          action_url: trigger.action_type === "open_url" ? trigger.action_url.trim() : "",
          action_tour_point_id: trigger.action_type === "navigate_tour_point" ? trigger.action_tour_point_id : "",
          action_tour_model_id: trigger.action_type === "switch_tour_model" ? trigger.action_tour_model_id : "",
        })),
      });

      toast({
        title: "Saved",
        description: "Chatbot triggers updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save chatbot triggers",
        variant: "destructive",
      });
    }
  };

  if (!chatbotConfigId) {
    return (
      <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span>Chatbot Triggers</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1">
            Save your chatbot configuration first to manage triggers.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const triggerContent = (
    <div className={hideHeader ? "space-y-4" : "space-y-4 border-t border-slate-200/80 bg-slate-50/40 pt-5 sm:space-y-5 dark:border-input dark:bg-background"}>
      {readOnly ? (
        <p className="text-xs text-slate-500">
          Temporary preview mode: triggers are read-only until the share is saved.
        </p>
      ) : null}
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading triggers...</p>
      ) : (
        <>
          {draftTriggers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-6 text-center text-muted-foreground">
              <p className="text-sm">No triggers yet</p>
              <p className="text-xs">Create your first trigger to automate replies or tour navigation</p>
            </div>
          ) : null}

          {draftTriggers.map((trigger, index) => (
            <div key={trigger.id || `trigger-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 dark:border-input dark:bg-background">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)_auto] md:items-end">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Trigger Name</Label>
                  <Input
                    value={trigger.name}
                    onChange={(event) => updateTrigger(index, { name: event.target.value })}
                    placeholder="e.g. Pricing request"
                    className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Trigger Type</Label>
                  <Select
                    value={trigger.action_type}
                    onValueChange={(value) =>
                      updateTrigger(index, {
                        action_type: value as ChatbotTriggerActionType,
                      })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai_message">Hardcoded AI Response</SelectItem>
                      <SelectItem value="open_url">AI Response + URL</SelectItem>
                      <SelectItem value="navigate_tour_point">Navigate to tour point</SelectItem>
                      <SelectItem value="switch_tour_model">Load different tour model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Settings</Label>
                  <div className="flex items-center justify-end gap-4 md:pb-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-slate-700">Active</Label>
                      <Switch
                        checked={trigger.is_active}
                        onCheckedChange={(checked) => updateTrigger(index, { is_active: checked })}
                        disabled={readOnly}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => deleteTrigger(index)} className="text-red-600 hover:bg-red-50 hover:text-red-700" disabled={readOnly}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Condition</Label>
                  <Select
                    value={trigger.condition_type}
                    onValueChange={(value) =>
                      updateTrigger(index, {
                        condition_type: value as ChatbotTriggerConditionType,
                      })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keywords">Keywords</SelectItem>
                      <SelectItem value="message_count">Number of messages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {trigger.condition_type === "keywords" ? (
                  <div className="relative space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Keywords</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={trigger.condition_keywords_input}
                        onChange={(event) => updateTrigger(index, { condition_keywords_input: event.target.value })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addKeywordsFromInput(index);
                          }
                        }}
                        placeholder="Enter keyword, then press + or Enter"
                        className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100"
                        disabled={readOnly}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => addKeywordsFromInput(index)}
                        className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                        disabled={readOnly}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {trigger.condition_keywords.length > 0 ? (
                      <div className="absolute left-0 top-full z-10 mt-1 flex max-w-full items-center gap-2 overflow-x-auto whitespace-nowrap pr-2">
                        {trigger.condition_keywords.map((keyword, keywordIndex) => (
                          <button
                            key={`${keyword}-${keywordIndex}`}
                            type="button"
                            onClick={() => removeKeyword(index, keywordIndex)}
                            className="rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-xs text-slate-700 hover:bg-slate-200/80 disabled:cursor-not-allowed disabled:opacity-60 dark:border-input dark:bg-background dark:text-slate-200 dark:hover:bg-neutral-800"
                            disabled={readOnly}
                            title={readOnly ? keyword : "Click to remove keyword"}
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Message count</Label>
                    <Input
                      type="number"
                      min={1}
                      value={trigger.condition_message_count || ""}
                      onChange={(event) =>
                        updateTrigger(index, {
                          condition_message_count: Number(event.target.value || 0) || null,
                        })
                      }
                      placeholder="3"
                      className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100"
                      disabled={readOnly}
                    />
                  </div>
                )}
              </div>

              {trigger.action_type !== "ai_message" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {trigger.action_type === "open_url" ? (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">URL</Label>
                    <Input
                      value={trigger.action_url}
                      onChange={(event) => updateTrigger(index, { action_url: event.target.value })}
                      placeholder="https://example.com"
                      className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100"
                      disabled={readOnly}
                    />
                  </div>
                  ) : null}

                  {trigger.action_type === "navigate_tour_point" ? (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Tour point</Label>
                      <Select
                        value={trigger.action_tour_point_id || "none"}
                        onValueChange={(value) =>
                          updateTrigger(index, {
                            action_tour_point_id: value === "none" ? "" : value,
                          })
                        }
                        disabled={readOnly}
                      >
                        <SelectTrigger className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100">
                          <SelectValue placeholder="Select a tour point" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select a tour point</SelectItem>
                          {tourPoints.map((point) => (
                            <SelectItem key={point.id} value={point.id}>
                              {point.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {trigger.action_type === "switch_tour_model" ? (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Model</Label>
                      <Select
                        value={trigger.action_tour_model_id || "none"}
                        onValueChange={(value) =>
                          updateTrigger(index, {
                            action_tour_model_id: value === "none" ? "" : value,
                          })
                        }
                        disabled={readOnly}
                      >
                        <SelectTrigger className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select a model</SelectItem>
                          {tourModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Response message</Label>
                <Textarea
                  value={trigger.action_message}
                  onChange={(event) => updateTrigger(index, { action_message: event.target.value })}
                  placeholder="What should the chatbot say when this trigger fires?"
                  className="min-h-[90px] border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100"
                  disabled={readOnly}
                />
              </div>
            </div>
          ))}
        </>
      )}

      {hideHeader ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/80 pt-3 dark:border-input">
          <Button type="button" variant="outline" onClick={addTrigger} className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800" disabled={readOnly}>
            <Plus className="mr-2 h-4 w-4" />
            Add Trigger
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave || isSaving || readOnly}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Triggers"}
          </Button>
        </div>
      ) : null}
    </div>
  );

  if (hideHeader) {
    return triggerContent;
  }

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span>Chatbot Triggers</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Add simple triggers based on keywords or message count.
            </CardDescription>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={addTrigger}
              className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
              disabled={!isExpanded || readOnly}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add Trigger</span>
            </Button>
            <Button type="button" onClick={handleSave} disabled={!canSave || isSaving || readOnly || !isExpanded}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : <><span className="sm:hidden">Save</span><span className="hidden sm:inline">Save Triggers</span></>}
            </Button>
            <Button type="button" variant="outline" className="col-span-2 border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800 sm:col-span-1" onClick={() => setIsExpanded((prev) => !prev)}>
              {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded ? <CardContent>{triggerContent}</CardContent> : null}
    </Card>
  );
}
