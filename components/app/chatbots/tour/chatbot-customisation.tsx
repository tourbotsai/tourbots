"use client";

import { useChatbotCustomisation } from "@/hooks/app/useChatbotCustomisation";
import { CustomisationForm } from "../shared/customisation-form/index";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/hooks/app/useBilling";
import { Loader2, ArrowLeft, Bot, AlertCircle } from "lucide-react";
import { useEffect } from "react";

interface TourChatbotCustomisationProps {
  onSwitchToSettings?: () => void;
  selectedTourId?: string | null;
}

export function TourChatbotCustomisation({ onSwitchToSettings, selectedTourId }: TourChatbotCustomisationProps) {
  const { 
    customisation, 
    isLoading, 
    error, 
    updateCustomisation, 
    resetToDefaults
  } = useChatbotCustomisation('tour', selectedTourId);
  const { billingRecord, fetchBilling } = useBilling();

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  if (isLoading) {
    return (
      <Card className="dark:border-input dark:bg-background">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-blue dark:text-slate-300" />
            <p className="text-sm text-muted-foreground">Loading tour chatbot customisation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedTourId) {
    return (
      <Card className="dark:border-input dark:bg-background">
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Select a tour to manage chatbot customisation.</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="dark:border-input dark:bg-background">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-red-50 p-6 mb-6 dark:border dark:border-input dark:bg-background">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-slate-100">
            Error Loading Customisation
          </h3>
          <p className="text-gray-600 text-center max-w-md mb-6 dark:text-slate-400">
            {error}
          </p>
          {onSwitchToSettings && (
            <Button 
              onClick={onSwitchToSettings}
              className="bg-brand-blue hover:bg-brand-blue/90 dark:border dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Settings
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!customisation) {
    return (
      <Card className="dark:border-input dark:bg-background">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-blue-50 p-6 mb-6 dark:border dark:border-input dark:bg-background">
            <Bot className="h-12 w-12 text-blue-500 dark:text-slate-300" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-slate-100">
            No Customisation Found
          </h3>
          <p className="text-gray-600 text-center max-w-md mb-6 dark:text-slate-400">
            Unable to load your tour chatbot customisation. Please try again or contact support.
          </p>
          {onSwitchToSettings && (
            <Button 
              onClick={onSwitchToSettings}
              className="bg-brand-blue hover:bg-brand-blue/90 dark:border dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Settings
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Let the CustomisationForm show its full comprehensive interface
  const customBrandingEnabled = Boolean(billingRecord?.addon_white_label);

  return (
    <CustomisationForm
      customisation={customisation}
      onUpdate={updateCustomisation}
      onReset={resetToDefaults}
      isLoading={isLoading}
      customBrandingEnabled={customBrandingEnabled}
    />
  );
} 