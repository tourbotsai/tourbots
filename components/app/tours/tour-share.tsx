"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Code, ExternalLink, Camera, ArrowLeft } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { useToast } from "@/components/ui/use-toast";
import { generateTourEmbed, TourEmbedOptions } from "@/lib/embed-generator";
import { Tour } from "@/lib/types";

interface TourShareProps {
  selectedTourId?: string | null;
  onSwitchToViewer?: () => void;
}

export function TourShare({ selectedTourId, onSwitchToViewer }: TourShareProps) {
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();
  const { toast } = useToast();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<TourEmbedOptions>({
    width: '100%',
    height: '600px',
    showTitle: false,
    showChat: true
  });
  const [embedCodes, setEmbedCodes] = useState<any>(null);

  useEffect(() => {
    async function fetchTour() {
      if (!selectedTourId) {
        setTour(null);
        setEmbedCodes(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`/api/app/tours/${encodeURIComponent(selectedTourId)}`, {
          headers: await getAuthHeaders(),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error((payload as any)?.error || "Failed to load tour");
        }
        const tourData = payload as Tour | null;
        setTour(tourData);
      } catch (error) {
        console.error('Error fetching tour:', error);
        setTour(null);
      } finally {
        setLoading(false);
      }
    }

    fetchTour();
  }, [selectedTourId, getAuthHeaders]);

  useEffect(() => {
    if (tour && user?.venue?.id) {
      generateCodes();
    }
  }, [options, tour, user?.venue?.id]);

  const generateCodes = () => {
    if (!user?.venue?.id || !tour) return;
    const codes = generateTourEmbed(user.venue.id, {
      ...options,
      tourId: tour.id,
    });
    setEmbedCodes(codes);
  };

  const acknowledgePressedShare = async () => {
    const vid = user?.venue?.id;
    if (!vid || user?.venue?.pressed_share) return;
    try {
      const headers = await getAuthHeaders({
        "Content-Type": "application/json",
      });
      const res = await fetch(`/api/venues/${encodeURIComponent(vid)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ pressed_share: true }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        console.warn("pressed_share update failed:", (payload as any)?.error || res.status);
      }
    } catch (e) {
      console.warn("pressed_share update error:", e);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} embed code copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyIframeEmbed = async () => {
    if (!embedCodes?.iframe) return;
    try {
      await navigator.clipboard.writeText(embedCodes.iframe);
      toast({
        title: "Copied!",
        description: "IFrame embed code copied to clipboard",
      });
      void acknowledgePressedShare();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent sm:h-8 sm:w-8" />
      </div>
    );
  }

  if (!tour || !selectedTourId) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 rounded-full bg-slate-100 p-6 dark:border dark:border-input dark:bg-background">
            <Camera className="h-12 w-12 text-slate-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            No tour available to share
          </h3>
          <p className="mb-6 max-w-md text-center text-slate-600 dark:text-slate-400">
            Set up your tour first to generate embed code and publish it on your website.
          </p>
          <Button 
            onClick={() => {
              // Switch to the Tour Viewer tab
              if (onSwitchToViewer) {
                onSwitchToViewer();
              }
            }}
            className="bg-slate-900 text-white hover:bg-slate-800 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Tour Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  const previewUrl = embedCodes
    ? `/embed/tour/${user?.venue?.id}?id=${embedCodes.embedId}&tourId=${tour?.id}&showTitle=${options.showTitle}&showChat=${options.showChat}`
    : "#";

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">Share and Embed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Generate production-ready embed code and configure how the widget appears.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="width" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Width
              </Label>
              <Input
                id="width"
                value={options.width}
                onChange={(e) => setOptions({ ...options, width: e.target.value })}
                placeholder="100%"
                className="mt-1.5 h-10 border-slate-300 bg-white dark:border-input dark:bg-background dark:text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Height
              </Label>
              <Input
                id="height"
                value={options.height}
                onChange={(e) => setOptions({ ...options, height: e.target.value })}
                placeholder="600px"
                className="mt-1.5 h-10 border-slate-300 bg-white dark:border-input dark:bg-background dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 dark:border-input dark:bg-background">
            <div>
              <Label htmlFor="show-chat-widget" className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Show chat widget
              </Label>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Turn the AI chat icon on or off in the embed.
              </p>
            </div>
            <Switch
              id="show-chat-widget"
              checked={options.showChat}
              onCheckedChange={(checked) => setOptions({ ...options, showChat: checked })}
            />
          </div>

          {embedCodes && (
            <>
              <div className="h-px bg-slate-200 dark:bg-slate-800" />

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <Code className="h-4 w-4" />
                  Simple IFrame Embed
                </h3>
                <Textarea
                  value={embedCodes.iframe}
                  readOnly
                  rows={5}
                  className="resize-none border-slate-300 bg-slate-50 font-mono text-xs text-slate-700 dark:border-input dark:bg-background dark:text-slate-300"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void copyIframeEmbed()}
                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Code
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                  >
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview Tour
                    </a>
                  </Button>
                </div>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-800" />

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <Code className="h-4 w-4" />
                  Advanced Script Embed
                </h3>
                <Textarea
                  value={embedCodes.script}
                  readOnly
                  rows={7}
                  className="resize-none border-slate-300 bg-slate-50 font-mono text-xs text-slate-700 dark:border-input dark:bg-background dark:text-slate-300"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(embedCodes.script, "Script")}
                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Code
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 