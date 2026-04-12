"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, Activity, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  requestsPerWeek: number;
  requestsPerMonth: number;
  burstLimit: number;
  enabled: boolean;
}

interface RateLimitSettingsProps {
  venueId: string;
  chatbotType: 'tour';
  currentConfig: RateLimitConfig;
  onSave: (config: RateLimitConfig) => Promise<void>;
}

export function RateLimitSettings({ 
  venueId, 
  chatbotType, 
  currentConfig, 
  onSave 
}: RateLimitSettingsProps) {
  const [config, setConfig] = useState<RateLimitConfig>(currentConfig);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(config);
      toast({
        title: "Rate Limits Updated",
        description: "Your rate limiting configuration has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update rate limiting configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const presetConfigs = {
    light: {
      requestsPerMinute: 10,
      requestsPerHour: 50,
      requestsPerDay: 200,
      requestsPerWeek: 1000,
      requestsPerMonth: 4000,
      burstLimit: 3,
      enabled: true
    },
    moderate: {
      requestsPerMinute: 30,
      requestsPerHour: 100,
      requestsPerDay: 500,
      requestsPerWeek: 2000,
      requestsPerMonth: 8000,
      burstLimit: 5,
      enabled: true
    },
    generous: {
      requestsPerMinute: 60,
      requestsPerHour: 300,
      requestsPerDay: 1000,
      requestsPerWeek: 5000,
      requestsPerMonth: 20000,
      burstLimit: 10,
      enabled: true
    },
    unlimited: {
      requestsPerMinute: 999,
      requestsPerHour: 9999,
      requestsPerDay: 99999,
      requestsPerWeek: 999999,
      requestsPerMonth: 9999999,
      burstLimit: 50,
      enabled: false
    }
  };

  const applyPreset = (preset: keyof typeof presetConfigs) => {
    setConfig(presetConfigs[preset]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-brand-blue" />
          <CardTitle>Rate Limiting Settings</CardTitle>
        </div>
        <CardDescription>
          Control how many requests users can make to your {chatbotType} chatbot. 
          This helps prevent abuse and manages API costs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Rate Limiting</Label>
            <p className="text-sm text-muted-foreground">
              Turn on to protect your chatbot from excessive usage
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
          />
        </div>

        {config.enabled && (
          <>
            {/* Quick Presets */}
            <div className="space-y-3">
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('light')}
                  className="justify-start"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Light Usage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('moderate')}
                  className="justify-start"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Moderate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('generous')}
                  className="justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Generous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('unlimited')}
                  className="justify-start"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Unlimited
                </Button>
              </div>
            </div>

            {/* Custom Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestsPerMinute">Requests per Minute</Label>
                <Input
                  id="requestsPerMinute"
                  type="number"
                  min="1"
                  max="300"
                  value={config.requestsPerMinute}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    requestsPerMinute: parseInt(e.target.value) || 0 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum requests per minute per IP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestsPerHour">Requests per Hour</Label>
                <Input
                  id="requestsPerHour"
                  type="number"
                  min="1"
                  max="1000"
                  value={config.requestsPerHour}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    requestsPerHour: parseInt(e.target.value) || 0 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum requests per hour per IP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestsPerDay">Requests per Day</Label>
                <Input
                  id="requestsPerDay"
                  type="number"
                  min="1"
                  max="10000"
                  value={config.requestsPerDay}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    requestsPerDay: parseInt(e.target.value) || 0 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum requests per day per IP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestsPerWeek">Requests per Week</Label>
                <Input
                  id="requestsPerWeek"
                  type="number"
                  min="1"
                  max="50000"
                  value={config.requestsPerWeek}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    requestsPerWeek: parseInt(e.target.value) || 0 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum requests per week per IP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestsPerMonth">Requests per Month</Label>
                <Input
                  id="requestsPerMonth"
                  type="number"
                  min="1"
                  max="200000"
                  value={config.requestsPerMonth}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    requestsPerMonth: parseInt(e.target.value) || 0 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum requests per month per IP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="burstLimit">Burst Limit</Label>
                <Input
                  id="burstLimit"
                  type="number"
                  min="1"
                  max="100"
                  value={config.burstLimit}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    burstLimit: parseInt(e.target.value) || 0 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum rapid-fire requests
                </p>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Current Configuration</p>
                <Badge variant={config.enabled ? "default" : "secondary"}>
                  {config.enabled ? "Active" : "Disabled"}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Per Minute</p>
                  <p className="font-mono">{config.requestsPerMinute}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Per Hour</p>
                  <p className="font-mono">{config.requestsPerHour}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Per Day</p>
                  <p className="font-mono">{config.requestsPerDay}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Per Week</p>
                  <p className="font-mono">{config.requestsPerWeek}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Per Month</p>
                  <p className="font-mono">{config.requestsPerMonth}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Burst</p>
                  <p className="font-mono">{config.burstLimit}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 