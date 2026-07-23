"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TourChatbotSettings } from "./tour/chatbot-settings";
import { TourChatbotActions } from "./tour/chatbot-actions";
import { TourChatbotCustomisation } from "./tour/chatbot-customisation";
import { TourChatbotAnalytics } from "./tour/chatbot-analytics";
import { TourChatbotPlayground } from "./tour/chatbot-playground";
import { TourChatbotShare } from "./tour/chatbot-share";

const CHATBOT_TAB_VALUES = new Set(["settings", "actions", "customisation", "playground", "share", "analytics"]);

interface TourChatbotManagementProps {
  onBack: () => void;
  selectedTourId?: string | null;
  chatbotConfigId?: string | null;
  onChatbotDeleted?: () => void | Promise<void>;
}

export function TourChatbotManagement({ onBack, selectedTourId, chatbotConfigId, onChatbotDeleted }: TourChatbotManagementProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("settings");
  const mobileTabsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && CHATBOT_TAB_VALUES.has(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      mobileTabsScrollRef.current?.scrollTo({ left: 0, behavior: "auto" });
    }
  }, []);

  const switchToSettings = () => {
    setActiveTab("settings");
  };

  return (
    <div className="space-y-8">
      {/* Temporarily commenting out back button and duplicate title - no selection screen needed */}
      {/* <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Selection
        </Button>
        <AppTitle
          title="Virtual Tour AI Chatbot"
          description="Manage your tour-specific AI assistant"
        />
      </div> */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div ref={mobileTabsScrollRef} className="overflow-x-auto md:overflow-visible">
          <TabsList className="flex h-10 w-max min-w-full items-stretch gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-input dark:bg-background md:grid md:w-full md:grid-cols-6">
            <TabsTrigger
              value="settings"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Actions
            </TabsTrigger>
            <TabsTrigger
              value="customisation"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Customisation
            </TabsTrigger>
            <TabsTrigger
              value="playground"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Playground
            </TabsTrigger>
            <TabsTrigger
              value="share"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Share &amp; Embed
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="settings" className="space-y-6">
          <TourChatbotSettings
            selectedTourId={selectedTourId}
            chatbotConfigId={chatbotConfigId}
            onDeleted={onChatbotDeleted}
          />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <TourChatbotActions selectedTourId={selectedTourId} chatbotConfigId={chatbotConfigId} />
        </TabsContent>

        <TabsContent value="customisation" className="space-y-6">
          <TourChatbotCustomisation onSwitchToSettings={switchToSettings} selectedTourId={selectedTourId} chatbotConfigId={chatbotConfigId} />
        </TabsContent>

        <TabsContent value="playground" className="space-y-6">
          <TourChatbotPlayground onSwitchToSettings={switchToSettings} selectedTourId={selectedTourId} chatbotConfigId={chatbotConfigId} />
        </TabsContent>

        <TabsContent value="share" className="space-y-6">
          <TourChatbotShare onSwitchToSettings={switchToSettings} selectedTourId={selectedTourId} chatbotConfigId={chatbotConfigId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <TourChatbotAnalytics onSwitchToSettings={switchToSettings} selectedTourId={selectedTourId} chatbotConfigId={chatbotConfigId} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 