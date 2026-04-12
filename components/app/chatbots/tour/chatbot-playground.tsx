"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeft, Loader2, Monitor, Smartphone, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useTourChatbotConfig } from "@/hooks/app/useTourChatbotConfig";
import { useChatbotCustomisation } from "@/hooks/app/useChatbotCustomisation";
import { Tour } from "@/lib/types";
import { TourChatWidget } from "@/components/app/tours/tour-chat-widget";
import MobilePreviewFrame from "@/components/app/chatbots/shared/preview/mobile-preview-frame";

interface TourChatbotPlaygroundProps {
  onSwitchToSettings?: () => void;
  selectedTourId?: string | null;
}

export function TourChatbotPlayground({ onSwitchToSettings, selectedTourId }: TourChatbotPlaygroundProps) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [widgetInstanceKey, setWidgetInstanceKey] = useState(0);
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);
  const [isPromptsExpanded, setIsPromptsExpanded] = useState(true);

  const { user } = useUser();
  const { tourConfig, isLoading: configLoading, error: configError } = useTourChatbotConfig(selectedTourId);
  const { customisation, isLoading: customisationLoading, error: customisationError } = useChatbotCustomisation('tour', selectedTourId);

  useEffect(() => {
    setIsWidgetOpen(false);
    setQueuedPrompt(null);
  }, [mode, selectedTourId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches;
    setIsPromptsExpanded(!isMobileViewport);
  }, []);

  const clearChat = () => {
    setWidgetInstanceKey((prev) => prev + 1);
    setQueuedPrompt(null);
  };

  const handlePromptClick = (prompt: string) => {
    setQueuedPrompt(prompt);
    setIsWidgetOpen(true);
  };

  const previewTour: Tour | undefined = selectedTourId && user?.venue?.id
    ? {
        id: selectedTourId,
        venue_id: user.venue.id,
        title: tourConfig?.chatbot_name || "Tour Chatbot",
        description: null,
        matterport_tour_id: "",
        matterport_url: "",
        thumbnail_url: null,
        is_active: true,
        view_count: 0,
        tour_type: "primary",
        display_order: 0,
        navigation_keywords: [],
        created_at: new Date(0).toISOString(),
        updated_at: new Date(0).toISOString(),
      }
    : undefined;

  const previewCustomisation = useMemo(() => {
    if (!customisation) return customisation;

    // Keep the user's visual design, but clamp offsets for preview containers
    // so the widget is always visible inside the mock browser/phone frame.
    const clamp = (value: unknown, fallback: number) => {
      const num = Number(value);
      if (Number.isNaN(num)) return fallback;
      return Math.max(12, Math.min(num, 36));
    };

    return {
      ...customisation,
      chat_offset_bottom: clamp((customisation as any).chat_offset_bottom, 20),
      chat_offset_side: clamp((customisation as any).chat_offset_side, 20),
      chat_button_bottom_offset: clamp((customisation as any).chat_button_bottom_offset, 20),
      chat_button_side_offset: clamp((customisation as any).chat_button_side_offset, 20),
      mobile_chat_offset_bottom: clamp((customisation as any).mobile_chat_offset_bottom, 16),
      mobile_chat_offset_side: clamp((customisation as any).mobile_chat_offset_side, 16),
      mobile_chat_button_bottom_offset: clamp((customisation as any).mobile_chat_button_bottom_offset, 16),
      mobile_chat_button_side_offset: clamp((customisation as any).mobile_chat_button_side_offset, 16),
    } as any;
  }, [customisation]);

  const getTestPrompts = () => [
    {
      category: "Tour Overview",
      text: "Can you give me a quick overview of this venue?",
      emoji: "🏛️"
    },
    {
      category: "Model Navigation",
      text: "Show me the other areas available in this tour.",
      emoji: "🚶"
    },
    {
      category: "Bookings",
      text: "How can visitors enquire or book after viewing?",
      emoji: "💳"
    },
    {
      category: "Availability",
      text: "What dates or time slots are currently available?",
      emoji: "📅"
    },
    {
      category: "Opening Hours",
      text: "What are your opening hours?",
      emoji: "🕐"
    },
    {
      category: "Amenities",
      text: "What amenities and features are included?",
      emoji: "✨"
    },
    {
      category: "Directions",
      text: "Where is this venue located and where can visitors park?",
      emoji: "📍"
    },
    {
      category: "Support",
      text: "How can someone contact the team if they need help?",
      emoji: "💬"
    }
  ];

  // Loading state
  if (configLoading || customisationLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
        <span className="ml-2 text-slate-700">Loading playground...</span>
      </div>
    );
  }

  if (!selectedTourId) {
    return (
      <div className="text-center p-8">
        <p className="mb-4 text-slate-500">Select a tour location to test the chatbot playground</p>
      </div>
    );
  }

  // Error state
  if (configError) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="mb-4 text-red-600">Error loading tour chatbot configuration</p>
          <p className="mb-4 text-sm text-slate-500">{configError}</p>
          <Button onClick={onSwitchToSettings} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!tourConfig) {
    return (
      <div className="text-center p-8">
        <p className="mb-4 text-slate-500">No tour chatbot configuration found</p>
        <p className="text-sm text-slate-400">Set up your chatbot in the Settings tab first.</p>
      </div>
    );
  }

  if (!tourConfig.is_active) {
    return (
      <div className="text-center p-8">
        <p className="mb-4 text-amber-600">Tour chatbot is not active</p>
        <p className="text-sm text-slate-400">Activate your chatbot in the Settings tab to test it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <div className="flex min-h-[72px] flex-col justify-center gap-3 px-4 py-3 sm:min-h-[64px] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Tour Chatbot Playground</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Test how your chatbot appears and responds before publishing it to your live tour.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-1.5 sm:w-auto dark:border-input dark:bg-background">
            <Button
              onClick={clearChat}
              variant="outline"
              size="sm"
              className="h-8 rounded-md border-red-200 bg-white px-3 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear Chat
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode('desktop')}
                className={`h-8 rounded-md border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-100 dark:border-input dark:bg-background dark:hover:bg-neutral-800 ${
                  mode === 'desktop'
                    ? 'text-slate-900 border-slate-400 bg-slate-100 dark:border-slate-600 dark:bg-neutral-800 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Monitor className="h-4 w-4" />
                Desktop
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode('mobile')}
                className={`h-8 rounded-md border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-100 dark:border-input dark:bg-background dark:hover:bg-neutral-800 ${
                  mode === 'mobile'
                    ? 'text-slate-900 border-slate-400 bg-slate-100 dark:border-slate-600 dark:bg-neutral-800 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                Mobile
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden border-0 bg-transparent shadow-none md:rounded-xl md:border md:border-slate-200 md:bg-white md:shadow-sm md:dark:border-input md:dark:bg-background">
          <CardHeader className="px-0 pb-2 pt-0 md:px-6 md:pt-6">
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">Live widget preview</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Starts as a widget, then click to open and test the full conversation flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-2 md:px-6 md:pb-5">
            {mode === 'desktop' ? (
              <div className="overflow-hidden rounded-xl border-0 bg-slate-100/70 md:border md:border-slate-200">
                <div className="hidden h-10 items-center gap-2 border-b border-slate-200 bg-white px-4 md:flex">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <div className="ml-2 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-500">
                    preview.tourbots.ai/venue
                  </div>
                </div>
                <div className="h-[740px] overflow-hidden bg-slate-100 p-0 md:p-5">
                  <div className="flex h-full min-h-0 flex-col rounded-none border-0 bg-white p-3 shadow-none md:rounded-xl md:border md:border-slate-200 md:p-5 md:shadow-sm">
                    <div className="mb-4">
                      <div className="h-5 w-64 rounded-md bg-slate-200" />
                      <div className="mt-2 h-3 w-[420px] max-w-full rounded-md bg-slate-100" />
                    </div>
                    <div
                      className="relative min-h-0 flex-1 overflow-hidden rounded-none border-0 md:rounded-xl md:border md:border-slate-200"
                      style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1400&h=900&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px]" />

                      {user?.venue?.id && previewTour && (
                        <TourChatWidget
                          key={`desktop-${widgetInstanceKey}`}
                          venueId={user.venue.id}
                          venueName={user.venue.name}
                          tour={previewTour}
                          customisation={previewCustomisation as any}
                          className="absolute inset-0 z-20"
                          isFullscreen={false}
                          isExpanded={isWidgetOpen}
                          onToggle={setIsWidgetOpen}
                          externalPrompt={queuedPrompt}
                          onExternalPromptConsumed={() => setQueuedPrompt(null)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center rounded-xl border-0 bg-slate-100/70 p-0 md:border md:border-slate-200 md:p-4">
                <MobilePreviewFrame className="scale-[1.03] origin-center">
                  <div className="h-full w-full overflow-hidden bg-white">
                    <div className="flex h-full min-h-0 flex-col bg-white p-3">
                      <div className="mb-3">
                        <div className="h-3.5 w-32 rounded bg-slate-200" />
                        <div className="mt-1.5 h-2.5 w-44 rounded bg-slate-100" />
                      </div>

                      <div
                        className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200"
                        style={{
                          backgroundImage: "url('https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1000&h=1600&fit=crop')",
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px]" />

                        {user?.venue?.id && previewTour && (
                          <TourChatWidget
                            key={`mobile-${widgetInstanceKey}`}
                            venueId={user.venue.id}
                            venueName={user.venue.name}
                            tour={previewTour}
                            customisation={previewCustomisation as any}
                            className="absolute inset-0 z-20"
                            isFullscreen={false}
                            isExpanded={isWidgetOpen}
                            onToggle={setIsWidgetOpen}
                            forceMobileMode={true}
                            externalPrompt={queuedPrompt}
                            onExternalPromptConsumed={() => setQueuedPrompt(null)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </MobilePreviewFrame>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background ${mode === 'desktop' ? 'xl:flex xl:h-full xl:flex-col' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base text-slate-900 dark:text-slate-100">Tour test prompts</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Click any prompt to test likely visitor questions.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 lg:hidden"
                  onClick={() => setIsPromptsExpanded((prev) => !prev)}
                >
                  {isPromptsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className={`space-y-2.5 ${mode === 'desktop' ? 'xl:flex-1' : ''} ${isPromptsExpanded ? 'block' : 'hidden lg:block'}`}>
              {getTestPrompts().map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto w-full justify-start rounded-lg border-slate-200 bg-slate-50/35 p-2.5 text-left hover:border-slate-300 hover:bg-slate-100/70 dark:border-input dark:bg-background dark:hover:bg-neutral-800"
                  onClick={() => handlePromptClick(prompt.text)}
                >
                  <div className="flex w-full items-start gap-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-white text-sm shadow-sm">
                      {prompt.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{prompt.category}</p>
                      <p className="mt-1 text-xs leading-4 text-slate-700 whitespace-normal dark:text-slate-200">{prompt.text}</p>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {customisationError && (
            <Card className="rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm dark:border-input dark:bg-background">
              <CardContent className="flex items-start gap-2 p-3 text-sm text-amber-700 dark:text-slate-300">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>Some preview styles could not load. Chat testing still works with defaults.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}