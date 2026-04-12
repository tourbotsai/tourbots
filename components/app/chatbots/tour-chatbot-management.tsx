"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
// import { Button } from "@/components/ui/button"; // Temporarily commented out - not needed without back button
// import { ArrowLeft } from "lucide-react"; // Temporarily commented out - not needed without back button
// import { AppTitle } from "@/components/app/shared/app-title"; // Temporarily commented out - title now in parent page
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TourChatbotSettings } from "./tour/chatbot-settings";
import { TourChatbotCustomisation } from "./tour/chatbot-customisation";
import { TourChatbotAnalytics } from "./tour/chatbot-analytics";
import { TourChatbotPlayground } from "./tour/chatbot-playground";

const CHATBOT_TAB_VALUES = new Set(["settings", "customisation", "playground", "analytics"]);

interface TourChatbotManagementProps {
  onBack: () => void;
  selectedTourId?: string | null;
}

export function TourChatbotManagement({ onBack, selectedTourId }: TourChatbotManagementProps) {
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
          <TabsList className="flex h-10 w-max min-w-full items-stretch gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-input dark:bg-background md:grid md:w-full md:grid-cols-4">
            <TabsTrigger
              value="settings"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Settings
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
              value="analytics"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="settings" className="space-y-6">
          <TourChatbotSettings selectedTourId={selectedTourId} />
        </TabsContent>

        <TabsContent value="customisation" className="space-y-6">
          <TourChatbotCustomisation onSwitchToSettings={switchToSettings} selectedTourId={selectedTourId} />
        </TabsContent>

        <TabsContent value="playground" className="space-y-6">
          <TourChatbotPlayground onSwitchToSettings={switchToSettings} selectedTourId={selectedTourId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <TourChatbotAnalytics onSwitchToSettings={switchToSettings} selectedTourId={selectedTourId} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 