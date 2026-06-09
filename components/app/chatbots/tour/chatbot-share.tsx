"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, ExternalLink, Settings, ArrowLeft, Lock, Navigation } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ui/use-toast";
import { useTourChatbotConfig } from "@/hooks/app/useTourChatbotConfig";
import { useChatbotCustomisation } from "@/hooks/app/useChatbotCustomisation";
import { useBilling } from "@/hooks/app/useBilling";
import { generateTourChatbotEmbed, ChatbotEmbedOptions } from "@/lib/embed-generator";

interface TourChatbotShareProps {
  onSwitchToSettings?: () => void;
  selectedTourId?: string | null;
}

export function TourChatbotShare({ onSwitchToSettings, selectedTourId }: TourChatbotShareProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const { tourConfig, isLoading } = useTourChatbotConfig(selectedTourId);
  const { customisation, fetchCustomisation, isLoading: customisationLoading } = useChatbotCustomisation('tour', selectedTourId);
  const { billingRecord, fetchBilling, isLoading: billingLoading } = useBilling();
  const [options, setOptions] = useState<ChatbotEmbedOptions>({
    position: 'bottom-right',
    primaryColor: '#1E40AF',
    title: 'Tour Assistant',
    navigationEnabled: true,
  });
  const [embedCode, setEmbedCode] = useState<any>(null);
  const [billingReady, setBillingReady] = useState(false);

  useEffect(() => {
    if (user?.venue?.id && selectedTourId) {
      fetchCustomisation();
    }
  }, [user?.venue?.id, selectedTourId, fetchCustomisation]);

  useEffect(() => {
    if (!user?.venue_id) return;
    let cancelled = false;
    (async () => {
      await fetchBilling();
      if (!cancelled) setBillingReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.venue_id, fetchBilling]);

  const currentPlan = billingRecord?.plan_code || "free";
  const effectivePlan =
    billingRecord?.billing_override_enabled && billingRecord?.override_plan_code
      ? billingRecord.override_plan_code
      : currentPlan;
  const isFreePlan = effectivePlan === "free";

  useEffect(() => {
    if (tourConfig && user?.venue?.id) {
      generateCode();
    }
  }, [user?.venue?.id, options, tourConfig, customisation]);

  const generateCode = () => {
    if (!user?.venue?.id || !tourConfig) return;
    const code = generateTourChatbotEmbed(user.venue.id, customisation, options, selectedTourId || undefined);
    setEmbedCode(code);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Tour chatbot embed code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading || customisationLoading || (!billingReady && billingLoading)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (isFreePlan) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 rounded-full bg-slate-100 p-6 dark:border dark:border-input dark:bg-background">
            <Lock className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            Publishing to your website is a Pro feature
          </h3>
          <p className="mb-6 max-w-md text-sm text-slate-600 dark:text-slate-400">
            The Free plan is for building and previewing your chatbot. To generate embed code
            and publish it on your live website, upgrade to Pro.
          </p>
          <Button
            asChild
            className="bg-slate-900 text-white hover:bg-slate-800 dark:border dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
          >
            <a href="/app/settings?tab=billing">Upgrade to Pro</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!selectedTourId) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardContent className="py-10 text-center text-slate-600 dark:text-slate-400">
          Select a tour to generate chatbot embed code.
        </CardContent>
      </Card>
    );
  }

  if (!tourConfig) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 rounded-full bg-slate-100 p-6 dark:border dark:border-input dark:bg-background">
            <Settings className="h-12 w-12 text-slate-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            No tour chatbot configured yet
          </h3>
          <p className="mb-6 max-w-md text-center text-slate-600 dark:text-slate-400">
            Configure your tour chatbot first, then generate embed code for your website.
          </p>
          <Button 
            onClick={onSwitchToSettings}
            className="bg-slate-900 text-white hover:bg-slate-800 dark:border dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  const navParam = options.navigationEnabled === false ? "off" : "on";
  const previewUrl = embedCode
    ? `/embed/chatbot/${user?.venue?.id}?id=${embedCode.embedId}&tourId=${selectedTourId}&nav=${navParam}`
    : "#";

  return (
    <div className="space-y-4">
      {embedCode && (
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">Share and Embed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Add your chatbot widget to any page with one line of code, or use advanced embed options for extra control.
            </p>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 dark:border-input dark:bg-background">
              <div>
                <Label htmlFor="enable-tour-navigation" className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                  <Navigation className="h-4 w-4" />
                  Enable tour navigation
                </Label>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Let the assistant move the virtual tour for visitors. Turn off for a question-and-answer assistant only.
                </p>
              </div>
              <Switch
                id="enable-tour-navigation"
                checked={options.navigationEnabled ?? true}
                onCheckedChange={(checked) => setOptions({ ...options, navigationEnabled: checked })}
              />
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Simple Embed (Recommended)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A self-contained chatbot you can drop onto any web page.
              </p>
              <Textarea
                value={embedCode.simple}
                readOnly
                rows={3}
                className="resize-none border-slate-300 bg-slate-50 font-mono text-xs text-slate-700 dark:border-input dark:bg-background dark:text-slate-200"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(embedCode.simple)}
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
                    Preview Chatbot
                  </a>
                </Button>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Advanced Embed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A floating chat bubble that can drive the virtual tour. Use this when the chatbot sits on the same page as your tour.
              </p>
              <Textarea
                value={embedCode.advanced}
                readOnly
                rows={7}
                className="resize-none border-slate-300 bg-slate-50 font-mono text-xs text-slate-700 dark:border-input dark:bg-background dark:text-slate-200"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(embedCode.advanced)}
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
                    Preview Chatbot
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 