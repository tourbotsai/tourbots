"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  BarChart3, 
  Clock, 
  Calendar, 
  CalendarDays, 
  CalendarRange,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Shield,
  Settings,
  ChevronDown,
  ChevronRight,
  Activity
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { HardLimitConfig, HardLimitUsage, HardLimitStatus } from '@/lib/types';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';
import { 
  calculateUsagePercentage, 
  getUsageColor, 
  getUsageLevel,
  getRemainingMessages,
  formatTimeRemaining,
  getTimeUntilNextReset,
  validateHardLimitConfig
} from '@/lib/utils/hard-limit-calculations';

interface HardLimitSettingsProps {
  venueId: string;
  chatbotType: 'tour';
  tourId?: string;
  currentConfig: HardLimitConfig;
  currentUsage?: HardLimitUsage | null;
  onSave: (config: HardLimitConfig) => Promise<void>;
  onReset?: (resetType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all') => Promise<void>;
}

export function HardLimitSettings({ 
  venueId, 
  chatbotType, 
  tourId,
  currentConfig,
  currentUsage,
  onSave,
  onReset
}: HardLimitSettingsProps) {
  const [config, setConfig] = useState<HardLimitConfig>(currentConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [usage, setUsage] = useState<HardLimitUsage | null>(currentUsage || null);
  const { toast } = useToast();
  const { getAuthHeaders } = useAuthHeaders();

  // Section states for collapsible sections
  const [sectionStates, setSectionStates] = useState({
    settings: true, // Default expanded
    currentUsage: false // Default collapsed
  });

  const toggleSection = (section: keyof typeof sectionStates) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateConfigAndClearErrors = (updater: HardLimitConfig | ((prev: HardLimitConfig) => HardLimitConfig)) => {
    setConfig((prev) => (typeof updater === 'function' ? (updater as (prev: HardLimitConfig) => HardLimitConfig)(prev) : updater));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  useEffect(() => {
    setUsage(currentUsage || null);
  }, [currentUsage]);

  // Fetch current usage data
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch(
          `/api/app/chatbots/hard-limits?venueId=${venueId}&chatbotType=${chatbotType}${tourId ? `&tourId=${encodeURIComponent(tourId)}` : ''}`,
          {
          headers: await getAuthHeaders(),
          }
        );
        if (response.ok) {
          const data = await response.json();
          setUsage(data.usage);
        }
      } catch (error) {
        console.error('Failed to fetch usage data:', error);
      }
    };

    if (config.enabled) {
      fetchUsage();
    }
  }, [venueId, chatbotType, tourId, config.enabled, getAuthHeaders]);

  const handleSave = async () => {
    // Validate configuration
    const validation = validateHardLimitConfig(config);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      toast({
        title: "Validation Error",
        description: "Please fix the configuration errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setValidationErrors([]);
    setIsLoading(true);
    try {
      await onSave(config);
      toast({
        title: "Hard Limits Updated",
        description: "Your hard limit configuration has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update hard limit configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (resetType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all') => {
    if (!onReset) return;
    
    setIsLoading(true);
    try {
      await onReset(resetType);
      toast({
        title: "Usage Reset",
        description: `${resetType === 'all' ? 'All' : resetType} usage has been reset successfully.`,
      });
      // Refresh usage data after reset
      if (config.enabled) {
        const response = await fetch(
          `/api/app/chatbots/hard-limits?venueId=${venueId}&chatbotType=${chatbotType}${tourId ? `&tourId=${encodeURIComponent(tourId)}` : ''}`,
          {
          headers: await getAuthHeaders(),
          }
        );
        if (response.ok) {
          const data = await response.json();
          setUsage(data.usage);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset usage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const presetConfigs = {
    starter: {
      enabled: true,
      dailyMessages: 500,
      weeklyMessages: 2000,
      monthlyMessages: 7000,
      yearlyMessages: 50000
    },
    standard: {
      enabled: true,
      dailyMessages: 1000,
      weeklyMessages: 3000,
      monthlyMessages: 10000,
      yearlyMessages: 100000
    },
    professional: {
      enabled: true,
      dailyMessages: 2000,
      weeklyMessages: 8000,
      monthlyMessages: 25000,
      yearlyMessages: 250000
    },
    unlimited: {
      enabled: false,
      dailyMessages: 999999,
      weeklyMessages: 999999,
      monthlyMessages: 999999,
      yearlyMessages: 999999
    }
  };

  const applyPreset = (preset: keyof typeof presetConfigs) => {
    updateConfigAndClearErrors(presetConfigs[preset]);
  };

  const getUsageDisplay = (used: number, limit: number, period: string, icon: React.ReactNode) => {
    const percentage = calculateUsagePercentage(used, limit);
    const color = getUsageColor(percentage);
    
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{period}</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">
            {used.toLocaleString()}/{limit.toLocaleString()}
          </div>
          <Badge 
            variant={color === 'red' ? 'destructive' : color === 'yellow' ? 'secondary' : 'default'}
            className="text-xs"
          >
            {percentage}%
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <div>
          <h2 className="text-lg font-semibold">Hard Limit Settings</h2>
          <p className="text-sm text-muted-foreground">
            Control total usage quotas for your {chatbotType} chatbot. These limits reset automatically and help manage costs.
          </p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-col">
          <Label className="text-sm font-medium">Enable Hard Limits</Label>
          <span className="text-xs text-gray-500 mt-1">Turn on to enforce total usage quotas for this chatbot</span>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(checked) => updateConfigAndClearErrors((prev) => ({ ...prev, enabled: checked }))}
        />
      </div>

      {config.enabled && (
        <>
          {/* Settings Section */}
          <Collapsible open={sectionStates.settings} onOpenChange={() => toggleSection('settings')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-indigo-600" />
                      <div>
                        <CardTitle className="text-base">Settings</CardTitle>
                        <CardDescription>Configure hard limit quotas and presets</CardDescription>
                      </div>
                    </div>
                    {sectionStates.settings ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  
                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="space-y-2 p-3 border border-red-200 bg-red-50 rounded-md">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Configuration Errors</span>
                      </div>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quick Presets */}
                  <div className="space-y-3">
                    <Label>Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset('starter')}
                        className="justify-start h-auto p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <div className="text-left">
                            <div className="font-medium">Starter</div>
                            <div className="text-xs text-muted-foreground">500/day • 2K/week</div>
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset('standard')}
                        className="justify-start h-auto p-3"
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <div className="text-left">
                            <div className="font-medium">Standard</div>
                            <div className="text-xs text-muted-foreground">1K/day • 3K/week</div>
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset('professional')}
                        className="justify-start h-auto p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-purple-600" />
                          <div className="text-left">
                            <div className="font-medium">Professional</div>
                            <div className="text-xs text-muted-foreground">2K/day • 8K/week</div>
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset('unlimited')}
                        className="justify-start h-auto p-3"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <div className="text-left">
                            <div className="font-medium">Unlimited</div>
                            <div className="text-xs text-muted-foreground">No limits</div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Custom Configuration */}
                  <div className="space-y-4">
                    <Label>Custom Limits</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dailyMessages" className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-blue-600" />
                          Daily Messages
                        </Label>
                        <Input
                          id="dailyMessages"
                          type="number"
                          min="1"
                          max="100000"
                          value={config.dailyMessages}
                          onChange={(e) =>
                            updateConfigAndClearErrors((prev) => ({
                              ...prev,
                              dailyMessages: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Resets daily at midnight
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="weeklyMessages" className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-green-600" />
                          Weekly Messages
                        </Label>
                        <Input
                          id="weeklyMessages"
                          type="number"
                          min="1"
                          max="1000000"
                          value={config.weeklyMessages}
                          onChange={(e) =>
                            updateConfigAndClearErrors((prev) => ({
                              ...prev,
                              weeklyMessages: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Resets weekly on Monday
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="monthlyMessages" className="flex items-center gap-2">
                          <CalendarDays className="h-3 w-3 text-orange-600" />
                          Monthly Messages
                        </Label>
                        <Input
                          id="monthlyMessages"
                          type="number"
                          min="1"
                          max="10000000"
                          value={config.monthlyMessages}
                          onChange={(e) =>
                            updateConfigAndClearErrors((prev) => ({
                              ...prev,
                              monthlyMessages: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Resets monthly on the 1st
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="yearlyMessages" className="flex items-center gap-2">
                          <CalendarRange className="h-3 w-3 text-purple-600" />
                          Yearly Messages
                        </Label>
                        <Input
                          id="yearlyMessages"
                          type="number"
                          min="1"
                          max="100000000"
                          value={config.yearlyMessages}
                          onChange={(e) =>
                            updateConfigAndClearErrors((prev) => ({
                              ...prev,
                              yearlyMessages: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Resets yearly on January 1st
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Current Usage Section */}
          <Collapsible open={sectionStates.currentUsage} onOpenChange={() => toggleSection('currentUsage')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-green-600" />
                      <div>
                        <CardTitle className="text-base">Current Usage</CardTitle>
                        <CardDescription>Real-time usage statistics and remaining quotas</CardDescription>
                      </div>
                    </div>
                    {sectionStates.currentUsage ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {usage ? (
                    <>
                      <div className="grid gap-4">
                        {getUsageDisplay(
                          usage.daily_messages_used, 
                          config.dailyMessages, 
                          'Daily Messages',
                          <Clock className="h-4 w-4 text-blue-600" />
                        )}
                        {getUsageDisplay(
                          usage.weekly_messages_used, 
                          config.weeklyMessages, 
                          'Weekly Messages',
                          <Calendar className="h-4 w-4 text-green-600" />
                        )}
                        {getUsageDisplay(
                          usage.monthly_messages_used, 
                          config.monthlyMessages, 
                          'Monthly Messages',
                          <CalendarDays className="h-4 w-4 text-orange-600" />
                        )}
                        {getUsageDisplay(
                          usage.yearly_messages_used, 
                          config.yearlyMessages, 
                          'Yearly Messages',
                          <CalendarRange className="h-4 w-4 text-purple-600" />
                        )}
                      </div>

                      {/* Reset Controls */}
                      {onReset && (
                        <div className="pt-4 border-t">
                          <div className="flex items-center gap-2 mb-3">
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Reset Usage</Label>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReset('daily')}
                              disabled={isLoading}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Reset Daily
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReset('weekly')}
                              disabled={isLoading}
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Reset Weekly
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReset('monthly')}
                              disabled={isLoading}
                            >
                              <CalendarDays className="h-3 w-3 mr-1" />
                              Reset Monthly
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReset('all')}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Reset All
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No usage data available</p>
                      <p className="text-xs">Usage tracking will begin when limits are enabled</p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
} 