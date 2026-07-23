"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTourChatbotConfig } from "@/hooks/app/useTourChatbotConfig";
import { NoTourEmptyState } from "../no-tour-empty-state";
import { ChatbotTriggers } from "./chatbot-triggers";
import { ChatbotLeadFormCard } from "./chatbot-lead-form";
import { ChatbotAdvancedActionsCard } from "./chatbot-advanced-actions";

interface TourChatbotActionsProps {
  selectedTourId?: string | null;
  chatbotConfigId?: string | null;
}

export function TourChatbotActions({ selectedTourId, chatbotConfigId }: TourChatbotActionsProps) {
  const isWebsiteMode = Boolean(chatbotConfigId);
  const { tourConfig, isLoading } = useTourChatbotConfig(
    isWebsiteMode ? null : selectedTourId,
    undefined,
    isWebsiteMode ? chatbotConfigId : undefined
  );

  if (!selectedTourId && !chatbotConfigId) {
    return (
      <NoTourEmptyState description="Upload your Matterport tour first, then return here to manage chatbot actions." />
    );
  }

  if (isLoading) {
    return (
      <Card className="dark:border-input dark:bg-background">
        <CardContent className="flex items-center justify-center py-16">
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-blue dark:text-slate-300" />
            <p className="text-sm text-muted-foreground">Loading chatbot actions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ChatbotTriggers chatbotConfigId={tourConfig?.id} chatbotType={isWebsiteMode ? 'website' : 'tour'} />
      <ChatbotLeadFormCard chatbotConfigId={tourConfig?.id} />
      <ChatbotAdvancedActionsCard chatbotConfigId={tourConfig?.id} />
    </div>
  );
}
