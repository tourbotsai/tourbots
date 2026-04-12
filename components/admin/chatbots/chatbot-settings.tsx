"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Settings, Bot, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { useChatbotConfig } from "@/hooks/admin/useChatbotConfig";
import { ChatbotConfig } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { RateLimitSettings } from "@/components/app/chatbots/shared/rate-limit-settings";
import { HardLimitSettings } from "@/components/admin/chatbots/hard-limit-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

interface ChatbotSettingsProps {
  forcedVenueId?: string;
  hideHeader?: boolean;
  initiallyExpanded?: boolean;
}

export function ChatbotSettings({
  forcedVenueId,
  hideHeader = false,
  initiallyExpanded = false,
}: ChatbotSettingsProps = {}) {
  const { configs, isLoading, error, fetchConfigs, updateConfig } = useChatbotConfig();
  const { getAuthHeaders } = useAuthHeaders();
  const { toast } = useToast();
  const [selectedVenueId, setSelectedVenueId] = useState<string>(forcedVenueId || "all");
  const [expandedVenues, setExpandedVenues] = useState<Set<string>>(new Set());
  const [editingConfigs, setEditingConfigs] = useState<{ [key: string]: ChatbotConfig }>({});

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  useEffect(() => {
    if (forcedVenueId) {
      setSelectedVenueId(forcedVenueId);
      if (initiallyExpanded) {
        setExpandedVenues(new Set([forcedVenueId]));
      }
    }
  }, [forcedVenueId, initiallyExpanded]);

  const handleSaveConfig = async (config: ChatbotConfig) => {
    try {
      await updateConfig(config.id, {
        chatbot_name: config.chatbot_name,
        welcome_message: config.welcome_message,
        personality_prompt: config.personality_prompt,
        instruction_prompt: config.instruction_prompt,
        guardrails_enabled: config.guardrails_enabled,
        guardrail_prompt: config.guardrail_prompt,
        is_active: config.is_active,
        // Hard limit fields
        hard_limits_enabled: config.hard_limits_enabled,
        hard_limit_daily_messages: config.hard_limit_daily_messages,
        hard_limit_weekly_messages: config.hard_limit_weekly_messages,
        hard_limit_monthly_messages: config.hard_limit_monthly_messages,
        hard_limit_yearly_messages: config.hard_limit_yearly_messages,
      });
      toast({
        title: "Success",
        description: "Chatbot configuration updated successfully",
      });
      // Remove from editing state
      const newEditingConfigs = { ...editingConfigs };
      delete newEditingConfigs[config.id];
      setEditingConfigs(newEditingConfigs);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update chatbot configuration",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = (configId: string) => {
    const newEditingConfigs = { ...editingConfigs };
    delete newEditingConfigs[configId];
    setEditingConfigs(newEditingConfigs);
  };

  const handleStartEdit = (config: ChatbotConfig) => {
    setEditingConfigs({
      ...editingConfigs,
      [config.id]: { ...config }
    });
  };

  const handleUpdateEditingConfig = (configId: string, updates: Partial<ChatbotConfig>) => {
    setEditingConfigs({
      ...editingConfigs,
      [configId]: {
        ...editingConfigs[configId],
        ...updates
      }
    });
  };

  const toggleVenueExpanded = (venueId: string) => {
    const newExpanded = new Set(expandedVenues);
    if (newExpanded.has(venueId)) {
      newExpanded.delete(venueId);
    } else {
      newExpanded.add(venueId);
    }
    setExpandedVenues(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Error loading chatbot configurations: {error}</p>
      </div>
    );
  }

  // Group configs by venue
  const venueGroups = configs.reduce((acc: { [key: string]: any }, config: any) => {
    const venueId = config.venue_id;
    if (!acc[venueId]) {
      acc[venueId] = {
        venue: config.venues,
        tour: null,
      };
    }
    if (config.chatbot_type === 'tour') {
      acc[venueId].tour = config;
    }
    return acc;
  }, {});

  // Unique venues for filter
  const uniqueVenues = Object.values(venueGroups).map((group: any) => ({
    id: group.venue?.id,
    name: group.venue?.name || 'Unknown venue'
  }));

  const filteredVenueGroups = Object.entries(venueGroups).filter(([venueId]: [string, any]) =>
    selectedVenueId === "all" || venueId === selectedVenueId
  );

  const renderChatbotConfig = (config: ChatbotConfig, chatbotType: 'tour', venueId: string) => {
    const isEditing = editingConfigs[config.id];
    const currentConfig = isEditing || config;

    // Current rate limit configuration for this chatbot
    const currentRateLimitConfig = {
      requestsPerMinute: config.rate_limit_requests_per_minute || 30,
      requestsPerHour: config.rate_limit_requests_per_hour || 100,
      requestsPerDay: config.rate_limit_requests_per_day || 500,
      requestsPerWeek: config.rate_limit_requests_per_week || 2000,
      requestsPerMonth: config.rate_limit_requests_per_month || 8000,
      burstLimit: config.rate_limit_burst_limit || 10,
      enabled: config.enable_rate_limiting ?? true
    };

    // Handle rate limit config save
    const handleRateLimitSave = async (rateLimitConfig: any) => {
      await updateConfig(config.id, {
        rate_limit_requests_per_minute: rateLimitConfig.requestsPerMinute,
        rate_limit_requests_per_hour: rateLimitConfig.requestsPerHour,
        rate_limit_requests_per_day: rateLimitConfig.requestsPerDay,
        rate_limit_requests_per_week: rateLimitConfig.requestsPerWeek,
        rate_limit_requests_per_month: rateLimitConfig.requestsPerMonth,
        rate_limit_burst_limit: rateLimitConfig.burstLimit,
        enable_rate_limiting: rateLimitConfig.enabled,
      });

      // Refresh configs to show updated data
      fetchConfigs();
    };

    return (
      <div key={config.id} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium">Tour Assistant</h4>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={() => handleSaveConfig(currentConfig)}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleCancelEdit(config.id)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => handleStartEdit(config)}>
                <Settings className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Tabs for different configuration sections */}
        <Tabs defaultValue="general" className="w-full">
          <div className="overflow-x-auto md:overflow-visible">
            <TabsList className="flex w-max min-w-full gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 md:grid md:w-full md:grid-cols-3">
            <TabsTrigger
              value="general"
              className="shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              General Settings
            </TabsTrigger>
            <TabsTrigger
              value="rate-limits"
              className="shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              <Shield className="w-3 h-3 mr-1" />
              Rate Limits
            </TabsTrigger>
            <TabsTrigger
              value="hard-limits"
              className="shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              <Shield className="w-3 h-3 mr-1" />
              Hard Limits
            </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Chatbot Name</Label>
                <Input
                  value={currentConfig.chatbot_name}
                  onChange={(e) => handleUpdateEditingConfig(config.id, { chatbot_name: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g., Tour Guide"
                  className="h-11 border-slate-200 bg-white text-sm focus-visible:ring-blue-500/70"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  Active Status
                  <Switch
                    checked={currentConfig.is_active}
                    onCheckedChange={(checked) => handleUpdateEditingConfig(config.id, { is_active: checked })}
                    disabled={!isEditing}
                  />
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Welcome Message</Label>
              <Textarea
                value={currentConfig.welcome_message || ''}
                onChange={(e) => handleUpdateEditingConfig(config.id, { welcome_message: e.target.value })}
                disabled={!isEditing}
                placeholder="Hello! I'm your virtual assistant..."
                rows={2}
                className="min-h-[88px] border-slate-200 bg-white text-sm focus-visible:ring-blue-500/70"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Personality</Label>
              <Textarea
                value={currentConfig.personality_prompt || ''}
                onChange={(e) => handleUpdateEditingConfig(config.id, { personality_prompt: e.target.value })}
                disabled={!isEditing}
                placeholder="You are a helpful assistant..."
                rows={3}
                className="min-h-[120px] border-slate-200 bg-white text-sm focus-visible:ring-blue-500/70"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Instructions</Label>
              <Textarea
                value={currentConfig.instruction_prompt || ''}
                onChange={(e) => handleUpdateEditingConfig(config.id, { instruction_prompt: e.target.value })}
                disabled={!isEditing}
                placeholder="Add specific instructions for how this chatbot should respond."
                rows={5}
                className="min-h-[140px] border-slate-200 bg-white text-sm focus-visible:ring-blue-500/70"
              />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-slate-700">Enable Guardrails</Label>
                <Switch
                  checked={currentConfig.guardrails_enabled || false}
                  onCheckedChange={(checked) => handleUpdateEditingConfig(config.id, { guardrails_enabled: checked })}
                  disabled={!isEditing}
                />
              </div>
              
              {currentConfig.guardrails_enabled && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Guardrail Instructions</Label>
                  <Textarea
                    value={currentConfig.guardrail_prompt || ''}
                    onChange={(e) => handleUpdateEditingConfig(config.id, { guardrail_prompt: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Enter guardrail instructions..."
                    rows={4}
                    className="min-h-[120px] border-slate-200 bg-white text-sm focus-visible:ring-blue-500/70"
                  />
                  <p className="text-xs text-gray-500">
                    These instructions help keep the AI focused on venue-appropriate topics and maintain appropriate boundaries.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rate-limits" className="mt-4">
            {/* Rate Limiting Settings */}
            <RateLimitSettings
              venueId={venueId}
              chatbotType={chatbotType}
              currentConfig={currentRateLimitConfig}
              onSave={handleRateLimitSave}
            />
          </TabsContent>

          <TabsContent value="hard-limits" className="mt-4">
            {/* Hard Limit Settings */}
            <HardLimitSettings
              venueId={venueId}
              chatbotType={chatbotType}
              tourId={config.tour_id || undefined}
              currentConfig={{
                enabled: currentConfig.hard_limits_enabled ?? false,
                dailyMessages: currentConfig.hard_limit_daily_messages || 1000,
                weeklyMessages: currentConfig.hard_limit_weekly_messages || 3000,
                monthlyMessages: currentConfig.hard_limit_monthly_messages || 10000,
                yearlyMessages: currentConfig.hard_limit_yearly_messages || 100000
              }}
              onSave={async (hardLimitConfig) => {
                // Update the editing config with hard limit changes
                const updatedConfig = {
                  ...editingConfigs[config.id] || config,
                  hard_limits_enabled: hardLimitConfig.enabled,
                  hard_limit_daily_messages: hardLimitConfig.dailyMessages,
                  hard_limit_weekly_messages: hardLimitConfig.weeklyMessages,
                  hard_limit_monthly_messages: hardLimitConfig.monthlyMessages,
                  hard_limit_yearly_messages: hardLimitConfig.yearlyMessages
                };
                
                // Update local editing state
                setEditingConfigs({
                  ...editingConfigs,
                  [config.id]: updatedConfig
                });
                
                // Save the updated config to database
                await handleSaveConfig(updatedConfig);
              }}
              onReset={async (resetType) => {
                // Call the hard limits API to reset usage
                try {
                  const response = await fetch('/api/app/chatbots/hard-limits', {
                    method: 'POST',
                    headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({
                      venueId,
                      tourId: config.tour_id || undefined,
                      chatbotType,
                      resetType
                    })
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to reset usage');
                  }
                } catch (error) {
                  console.error('Error resetting hard limit usage:', error);
                  throw error;
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Chatbot Settings
            </CardTitle>
            <CardDescription>
              Manage AI chatbot configurations for all venues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Label htmlFor="venue-filter-settings" className="text-sm font-medium whitespace-nowrap">Select venue:</Label>
              <Select value={selectedVenueId} onValueChange={setSelectedVenueId} disabled={!!forcedVenueId}>
                <SelectTrigger id="venue-filter-settings" className="w-full sm:flex-1 max-w-md">
                  <SelectValue placeholder="All venues" />
                </SelectTrigger>
                <SelectContent>
                  {!forcedVenueId && <SelectItem value="all">All venues</SelectItem>}
                  {uniqueVenues.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Venue configurations */}
      <div className="space-y-3">
        {filteredVenueGroups.map(([venueId, group]: [string, any]) => {
          const isExpanded = forcedVenueId ? true : expandedVenues.has(venueId);
          if (!group.tour) return null;

          return (
            <Collapsible key={venueId} open={isExpanded} onOpenChange={() => !forcedVenueId && toggleVenueExpanded(venueId)}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className={`py-4 ${forcedVenueId ? "" : "cursor-pointer hover:bg-muted/50 transition-colors"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {!forcedVenueId && (
                            isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )
                          )}
                          <CardTitle className="text-lg">{group.venue?.name || 'Unknown venue'}</CardTitle>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Tour Assistant
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-6">
                    {renderChatbotConfig(group.tour, 'tour', venueId)}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
} 