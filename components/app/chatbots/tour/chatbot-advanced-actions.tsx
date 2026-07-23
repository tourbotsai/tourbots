"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Trash2,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useChatbotIntegrations } from "@/hooks/app/useChatbotIntegrations";
import {
  ChatbotCustomActionConditionType,
  ChatbotCustomActionMode,
} from "@/lib/types";

interface EditableAction {
  localId: string;
  name: string;
  action_key: string;
  mode: ChatbotCustomActionMode;
  is_active: boolean;
  description: string;
  webhook_url: string;
  signing_secret: string;
  can_rotate_secret: boolean;
  condition_type: ChatbotCustomActionConditionType;
  keywordsInput: string;
  condition_intent: string;
  condition_message_count: number;
  rotate_secret: boolean;
}

interface ChatbotAdvancedActionsCardProps {
  chatbotConfigId?: string | null;
}

function createLocalId() {
  return `action_${Math.random().toString(36).slice(2, 10)}`;
}

function slugifyActionKey(name: string, index: number): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return base || `action_${index + 1}`;
}

function blankAction(index = 0): EditableAction {
  return {
    localId: createLocalId(),
    name: index === 0 ? "Get availability" : `Action ${index + 1}`,
    action_key: index === 0 ? "get_availability" : slugifyActionKey(`action_${index + 1}`, index),
    mode: "query",
    is_active: true,
    description:
      index === 0
        ? "Look up free appointment slots from the connected spreadsheet or calendar."
        : "",
    webhook_url: "",
    signing_secret: "",
    can_rotate_secret: false,
    condition_type: "intent",
    keywordsInput: "",
    condition_intent:
      index === 0
        ? "Visitor asks what booking availability you have this week, or whether a specific time is free"
        : "",
    condition_message_count: 3,
    rotate_secret: false,
  };
}

export function ChatbotAdvancedActionsCard({ chatbotConfigId }: ChatbotAdvancedActionsCardProps) {
  const { toast } = useToast();
  const { actions, isLoading, isSaving, saveActions } = useChatbotIntegrations(chatbotConfigId);

  const [isExpanded, setIsExpanded] = useState(false);
  const [editableActions, setEditableActions] = useState<EditableAction[]>([]);

  useEffect(() => {
    setEditableActions(
      (actions || []).map((action, index) => ({
        localId: action.id || createLocalId(),
        name: action.name,
        action_key: action.action_key || slugifyActionKey(action.name, index),
        mode: action.mode === "query" ? "query" : "write",
        is_active: action.is_active,
        description: action.description || "",
        webhook_url: action.webhook_url || "",
        signing_secret: action.signing_secret || "",
        can_rotate_secret: Boolean(action.can_rotate_secret),
        condition_type: action.condition_type || "intent",
        keywordsInput: (action.condition_keywords || []).join(", "),
        condition_intent: action.condition_intent || "",
        condition_message_count: action.condition_message_count || 3,
        rotate_secret: false,
      }))
    );
  }, [actions]);

  const canSave = useMemo(() => Boolean(chatbotConfigId), [chatbotConfigId]);

  const updateAction = (localId: string, patch: Partial<EditableAction>) => {
    setEditableActions((prev) =>
      prev.map((action) => (action.localId === localId ? { ...action, ...patch } : action))
    );
  };

  const handleSaveActions = async () => {
    for (const action of editableActions) {
      if (!action.name.trim()) {
        toast({ title: "Action name required", variant: "destructive" });
        return;
      }
      if (!/^[a-z][a-z0-9_]{1,63}$/.test(action.action_key.trim())) {
        toast({
          title: "Invalid action key",
          description: "Use lowercase snake_case, e.g. get_availability.",
          variant: "destructive",
        });
        return;
      }
      if (!action.webhook_url.trim()) {
        toast({
          title: "Webhook URL required",
          description: `Paste a Make, Zapier, or n8n HTTPS URL for “${action.name}”.`,
          variant: "destructive",
        });
        return;
      }
      if (action.condition_type === "keywords" && !action.keywordsInput.trim()) {
        toast({
          title: "Keywords required",
          description: `Add keywords for “${action.name}”.`,
          variant: "destructive",
        });
        return;
      }
      if (action.condition_type === "intent" && !action.condition_intent.trim()) {
        toast({
          title: "Intent required",
          description: `Describe when “${action.name}” should fire.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      await saveActions(
        editableActions.map((action, index) => ({
          name: action.name.trim(),
          action_key: action.action_key.trim(),
          mode: action.mode,
          is_active: action.is_active,
          description: action.description.trim() || null,
          webhook_url: action.webhook_url.trim(),
          condition_type: action.condition_type,
          condition_keywords: action.keywordsInput
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          condition_intent: action.condition_intent.trim() || null,
          condition_message_count: action.condition_message_count,
          display_order: index,
          rotate_secret: action.rotate_secret,
        }))
      );
      toast({ title: "Custom actions saved" });
    } catch (err: unknown) {
      toast({
        title: "Could not save actions",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span>Custom Actions</span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              Let the AI call Make, Zapier, or n8n for live lookups (availability) or write
              actions (bookings). Each action has its own webhook.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => void handleSaveActions()}
              disabled={!canSave || isSaving || !isExpanded}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 bg-white dark:border-input dark:bg-background"
              onClick={() => setIsExpanded((value) => !value)}
            >
              {isExpanded ? (
                <ChevronUp className="mr-2 h-4 w-4" />
              ) : (
                <ChevronDown className="mr-2 h-4 w-4" />
              )}
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
          {!chatbotConfigId || isLoading ? (
            <p className="text-sm text-muted-foreground">
              {chatbotConfigId ? "Loading custom actions…" : "Save a chatbot configuration first."}
            </p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Query</span> waits
                  for JSON and answers in the same turn.{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-200">Write</span>{" "}
                  forwards a request without waiting for the full automation.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEditableActions((prev) => [...prev, blankAction(prev.length)])
                  }
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add action
                </Button>
              </div>

              {editableActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No custom actions yet. Add one — for example Get availability with your Make
                  webhook URL.
                </p>
              ) : (
                <div className="space-y-4">
                  {editableActions.map((action) => (
                    <div
                      key={action.localId}
                      className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={action.is_active}
                            onCheckedChange={(checked) =>
                              updateAction(action.localId, { is_active: checked })
                            }
                          />
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setEditableActions((prev) =>
                              prev.filter((row) => row.localId !== action.localId)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Name</Label>
                          <Input
                            className="h-9"
                            value={action.name}
                            onChange={(event) =>
                              updateAction(action.localId, { name: event.target.value })
                            }
                            placeholder="Get availability"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Action key</Label>
                          <Input
                            className="h-9 font-mono text-sm"
                            value={action.action_key}
                            onChange={(event) =>
                              updateAction(action.localId, {
                                action_key: event.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9_]/g, ""),
                              })
                            }
                            placeholder="get_availability"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Mode</Label>
                          <Select
                            value={action.mode}
                            onValueChange={(value: ChatbotCustomActionMode) =>
                              updateAction(action.localId, { mode: value })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="query">Query (wait for JSON)</SelectItem>
                              <SelectItem value="write">Write (fire-and-forget)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">When to run</Label>
                          <Select
                            value={action.condition_type}
                            onValueChange={(value: ChatbotCustomActionConditionType) =>
                              updateAction(action.localId, { condition_type: value })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="intent">Intent</SelectItem>
                              <SelectItem value="keywords">Keywords</SelectItem>
                              <SelectItem value="message_count">Message count</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {action.condition_type === "intent" ? (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Intent</Label>
                          <Textarea
                            value={action.condition_intent}
                            onChange={(event) =>
                              updateAction(action.localId, {
                                condition_intent: event.target.value,
                              })
                            }
                            rows={2}
                            className="text-sm"
                            placeholder="Visitor asks what times are free this week"
                          />
                        </div>
                      ) : null}
                      {action.condition_type === "keywords" ? (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Keywords (comma-separated)</Label>
                          <Input
                            className="h-9"
                            value={action.keywordsInput}
                            onChange={(event) =>
                              updateAction(action.localId, {
                                keywordsInput: event.target.value,
                              })
                            }
                          />
                        </div>
                      ) : null}
                      {action.condition_type === "message_count" ? (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">After message count</Label>
                          <Input
                            className="h-9"
                            type="number"
                            min={1}
                            max={100}
                            value={action.condition_message_count}
                            onChange={(event) =>
                              updateAction(action.localId, {
                                condition_message_count: Number(event.target.value) || 1,
                              })
                            }
                          />
                        </div>
                      ) : null}

                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500">Description for the AI</Label>
                        <Textarea
                          value={action.description}
                          onChange={(event) =>
                            updateAction(action.localId, { description: event.target.value })
                          }
                          rows={2}
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500">Webhook URL</Label>
                        <Input
                          className="h-9 font-mono text-sm"
                          value={action.webhook_url}
                          onChange={(event) =>
                            updateAction(action.localId, { webhook_url: event.target.value })
                          }
                          placeholder="https://hook.eu1.make.com/…"
                        />
                        <p className="text-xs text-muted-foreground">
                          Paste the Make, Zapier, or n8n URL for this action only (HTTPS).
                        </p>
                      </div>

                      {action.can_rotate_secret ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs text-slate-500">Signing secret</Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                updateAction(action.localId, { rotate_secret: true })
                              }
                            >
                              Rotate on next save
                            </Button>
                          </div>
                          <Input
                            readOnly
                            value={
                              action.rotate_secret
                                ? "Will rotate when you save"
                                : action.signing_secret || "Secret configured"
                            }
                            className="h-9 font-mono text-xs"
                            onFocus={(event) => event.target.select()}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}
