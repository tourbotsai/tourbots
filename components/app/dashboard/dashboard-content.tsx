"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppTitle } from "@/components/shared/app-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Eye,
  MessageCircle,
  Users,
  Globe,
  RefreshCw,
  CreditCard,
  Building2,
  MousePointer2,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { useDashboard } from "@/hooks/app/useDashboard";
import { useUser } from "@/hooks/useUser";
import { useTheme } from "@/components/app/shared/theme-provider";
import { cn } from "@/lib/utils";
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ONBOARDING_STORAGE_PREFIX = "tourbots-dashboard-onboarding:";

/** Fixed onboarding order for desktop dashboard (deep-links open the right tab). */
const DASHBOARD_PRIORITY_STEPS = [
  {
    id: "onboard-upload-tour",
    title: "Upload tour",
    description: "Connect your Matterport model and finish Tour Setup.",
    href: "/app/tours?tab=viewer",
    helpText:
      "In Tours → Tour Setup, connect your Matterport model and save so the tour is active. This step ticks automatically once you have at least one active tour on record.",
  },
  {
    id: "onboard-create-chatbot",
    title: "Create chatbot",
    description: "Set global personality and behaviour under Settings.",
    href: "/app/chatbots?tab=settings",
    helpText:
      "In Chatbots → Settings, configure your virtual tour chatbot and set status to Active so visitors get AI assistance in the embed. This step ticks when an active tour chatbot exists.",
  },
  {
    id: "onboard-train",
    title: "Train it",
    description: "Add chatbot information sections with your venue details.",
    href: "/app/chatbots?tab=customisation",
    helpText:
      "In Chatbots → Customisation, add Information Sections and answers about your venue. This step ticks when your training goes beyond the default “General Information” template alone.",
  },
  {
    id: "onboard-share",
    title: "Share",
    description: "Copy the simple iframe embed from Share & Embed.",
    href: "/app/tours?tab=share",
    helpText:
      "In Tours → Share & Embed, use Copy Code on the simple iframe embed and paste it into your site. This step ticks automatically the first time you copy that code (saved on your venue).",
  },
] as const;

/** Matches dashboard API `quickStats.spacesUsed`: count of active tours for the venue (see `/api/app/dashboard`). */
const UPLOAD_TOUR_STEP_ID = DASHBOARD_PRIORITY_STEPS[0].id;
/** Matches tour chatbot Settings “Status: Active” (`chatbot_configs.is_active`). */
const CREATE_CHATBOT_STEP_ID = DASHBOARD_PRIORITY_STEPS[1].id;
/** Customisation: Information Sections differ from the default General Information block (see `lib/chatbot-training-defaults.ts`). */
const TRAIN_STEP_ID = DASHBOARD_PRIORITY_STEPS[2].id;
/** Iframe embed copied once (`venues.pressed_share`). */
const SHARE_STEP_ID = DASHBOARD_PRIORITY_STEPS[3].id;

type OnboardingCompletionFlags = {
  hasActiveTour: boolean;
  hasActiveTourChatbot: boolean;
  hasCustomisedTourTraining: boolean;
  hasPressedShare: boolean;
};

function getOnboardingStepDone(
  item: (typeof DASHBOARD_PRIORITY_STEPS)[number],
  onboardingChecked: Record<string, boolean>,
  flags: OnboardingCompletionFlags
): boolean {
  const isUploadStep = item.id === UPLOAD_TOUR_STEP_ID;
  const isCreateChatbotStep = item.id === CREATE_CHATBOT_STEP_ID;
  const isTrainStep = item.id === TRAIN_STEP_ID;
  const isShareStep = item.id === SHARE_STEP_ID;
  if (isUploadStep) return flags.hasActiveTour || Boolean(onboardingChecked[item.id]);
  if (isCreateChatbotStep) return flags.hasActiveTourChatbot || Boolean(onboardingChecked[item.id]);
  if (isTrainStep) return flags.hasCustomisedTourTraining || Boolean(onboardingChecked[item.id]);
  if (isShareStep) return flags.hasPressedShare || Boolean(onboardingChecked[item.id]);
  return false;
}

function useOnboardingChecklist(venueId: string | undefined) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!venueId || typeof window === "undefined") {
      setChecked({});
      return;
    }
    try {
      const raw = window.localStorage.getItem(`${ONBOARDING_STORAGE_PREFIX}${venueId}`);
      setChecked(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});
    } catch {
      setChecked({});
    }
  }, [venueId]);

  const setStepDone = useCallback(
    (stepId: string, done: boolean) => {
      if (!venueId || typeof window === "undefined") return;
      setChecked((prev) => {
        const next = { ...prev, [stepId]: done };
        try {
          window.localStorage.setItem(
            `${ONBOARDING_STORAGE_PREFIX}${venueId}`,
            JSON.stringify(next)
          );
        } catch {
          /* ignore quota / private mode */
        }
        return next;
      });
    },
    [venueId]
  );

  return { checked, setStepDone };
}

export function DashboardContent() {
  const { data, refreshAll, isLoading, lastRefresh } = useDashboard();
  const { user } = useUser();
  const { theme } = useTheme();
  const venueId = user?.venue?.id;
  const { checked: onboardingChecked, setStepDone } = useOnboardingChecklist(venueId);

  const overview = data.overview;
  const quickStats = data.quickStats;
  const analytics = data.visitorAnalytics;

  /** Same signal as “Available spaces” usage: at least one active tour row for this venue. */
  const hasActiveTour =
    quickStats != null && Number(quickStats.spacesUsed || 0) > 0;
  /** At least one tour chatbot config with is_active true (Virtual Tour Chatbot Configuration block). */
  const hasActiveTourChatbot =
    quickStats != null && Boolean(quickStats.hasActiveTourChatbot);
  /** At least one active chatbot has edited training sections/fields vs factory defaults. */
  const hasCustomisedTourTraining =
    quickStats != null && Boolean(quickStats.hasCustomisedTourTraining);
  const hasPressedShare =
    quickStats != null && Boolean(quickStats.pressedShare);

  const hideOnboardingChecklist = Boolean(user?.venue?.hide_onboarding_checklist);

  const onboardingFlags = useMemo<OnboardingCompletionFlags>(
    () => ({
      hasActiveTour,
      hasActiveTourChatbot,
      hasCustomisedTourTraining,
      hasPressedShare,
    }),
    [hasActiveTour, hasActiveTourChatbot, hasCustomisedTourTraining, hasPressedShare]
  );

  const allOnboardingComplete = useMemo(
    () =>
      DASHBOARD_PRIORITY_STEPS.every((step) =>
        getOnboardingStepDone(step, onboardingChecked, onboardingFlags)
      ),
    [onboardingChecked, onboardingFlags]
  );

  const [onboardingCollapsibleOpen, setOnboardingCollapsibleOpen] = useState(!allOnboardingComplete);

  useEffect(() => {
    if (hideOnboardingChecklist) return;
    setOnboardingCollapsibleOpen(!allOnboardingComplete);
  }, [allOnboardingComplete, hideOnboardingChecklist]);

  const formatLastRefresh = (date: Date | null) => {
    if (!date) return "";
    return `Last updated: ${date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const formatNumber = (value: number) => new Intl.NumberFormat("en-GB").format(value || 0);

  const kpis = [
    {
      label: "Tour views",
      value: formatNumber(overview?.totalTourViews || 0),
      icon: Eye,
    },
    {
      label: "Tour moves",
      value: formatNumber(overview?.totalTourMoves ?? 0),
      icon: MousePointer2,
    },
    {
      label: "Conversations",
      value: formatNumber(overview?.totalTourConversations || 0),
      icon: Users,
    },
    {
      label: "Visitor messages",
      value: formatNumber(quickStats?.tourChatMessages || 0),
      icon: MessageCircle,
    },
    {
      label: "Unique domains",
      value: formatNumber(overview?.uniqueDomains || 0),
      icon: Globe,
    },
    {
      label: "Message credits",
      value: `${formatNumber(quickStats?.messageCreditsUsed || 0)}/${formatNumber(quickStats?.messageCreditsLimit || 0)}`,
      icon: CreditCard,
    },
    {
      label: "Available spaces",
      value: `${formatNumber(quickStats?.spacesUsed || 0)}/${formatNumber(quickStats?.spacesLimit || 0)}`,
      icon: Building2,
    },
  ];

  const trendData = analytics?.dailyData || [];
  const topDomains = analytics?.topDomains || [];
  const isDarkMode = theme === "dark";

  const chartGridStroke = isDarkMode ? "#334155" : "#E2E8F0";
  const chartTickColour = isDarkMode ? "#94A3B8" : "#64748B";
  const chartTooltipStyle = isDarkMode
    ? { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#E2E8F0" }
    : { backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A" };
  const chartPrimaryStroke = isDarkMode ? "#E2E8F0" : "#0F172A";
  const chartSecondaryStroke = isDarkMode ? "#94A3B8" : "#475569";
  const chartTertiaryStroke = isDarkMode ? "#34D399" : "#059669";

  return (
    <div className="space-y-6 dark:rounded-2xl dark:border dark:border-slate-800/70 dark:bg-[#12161f]/88 dark:p-4 dark:[--background:220_18%_8%] dark:[--card:220_15%_11%] dark:[--popover:220_15%_11%] dark:[--muted:220_10%_18%] dark:[--muted-foreground:220_8%_70%] dark:[--border:220_9%_24%] dark:[--input:220_9%_24%] dark:[--ring:220_10%_70%]">
      <AppTitle
        title="Dashboard"
        description="Track views, chats, and visitor engagement across your tours."
        action={
          <Button
            onClick={refreshAll}
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">Platform overview</CardTitle>
            {lastRefresh && (
              <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600 dark:border-input dark:bg-background dark:text-slate-300">
                {formatLastRefresh(lastRefresh)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {kpis.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-input dark:bg-background">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.label}</p>
                  <item.icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800" />

          <div className="w-full space-y-3">
                       <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Views, moves, and messages trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last 7 days of tour activity.</p>
            </div>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                  <XAxis dataKey="date" tick={{ fill: chartTickColour, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartTickColour, fontSize: 12 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="tourViews" stroke={chartPrimaryStroke} fill={chartPrimaryStroke} fillOpacity={0.2} name="Tour views" />
                  <Area type="monotone" dataKey="tourMoves" stroke={chartTertiaryStroke} fill={chartTertiaryStroke} fillOpacity={0.2} name="Tour moves" />
                  <Area type="monotone" dataKey="chatMessages" stroke={chartSecondaryStroke} fill={chartSecondaryStroke} fillOpacity={0.2} name="Chat messages" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 text-sm text-slate-500 dark:border-input dark:bg-background dark:text-slate-400">
                No trend data available yet.
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-600 dark:border-input dark:bg-background dark:text-slate-400">
              {topDomains.length > 0 ? (
                <>
                  Top domain: <span className="font-medium text-slate-900 dark:text-slate-100">{topDomains[0].domain}</span>
                  {" · "}
                  {formatNumber(topDomains[0].views)} views
                  {" · "}
                  {formatNumber(topDomains[0].conversations)} conversations
                </>
              ) : (
                "Top domain data will appear once your tour is embedded on a live site."
              )}
            </div>
          </div>

          {!hideOnboardingChecklist && (
            <>
              <div className="h-px bg-slate-200 dark:bg-slate-800" />

              <Collapsible open={onboardingCollapsibleOpen} onOpenChange={setOnboardingCollapsibleOpen}>
            <div className="space-y-3">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg py-1 text-left outline-none transition-colors",
                    "hover:bg-slate-50 dark:hover:bg-neutral-900/50",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400",
                      onboardingCollapsibleOpen && "rotate-180"
                    )}
                    aria-hidden
                  />
                  <h3 className="min-w-0 flex-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Onboarding checklist
                  </h3>
                  {allOnboardingComplete && (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                    >
                      Complete
                    </Badge>
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Follow these steps in order to go live with your tour and AI assistant.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {DASHBOARD_PRIORITY_STEPS.map((item) => {
                const isUploadStep = item.id === UPLOAD_TOUR_STEP_ID;
                const isCreateChatbotStep = item.id === CREATE_CHATBOT_STEP_ID;
                const isTrainStep = item.id === TRAIN_STEP_ID;
                const isShareStep = item.id === SHARE_STEP_ID;
                const isDone = getOnboardingStepDone(item, onboardingChecked, onboardingFlags);
                const autoLockedByData =
                  (isUploadStep && hasActiveTour) ||
                  (isCreateChatbotStep && hasActiveTourChatbot) ||
                  (isTrainStep && hasCustomisedTourTraining) ||
                  (isShareStep && hasPressedShare);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative flex gap-3 rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-10 transition-colors dark:border-input dark:bg-background",
                      "hover:border-slate-300 dark:hover:border-slate-600",
                      isDone && "border-slate-200/80 bg-slate-50/50 dark:border-input dark:bg-neutral-900/30"
                    )}
                  >
                    <button
                      type="button"
                      className={cn(
                        "group/help absolute right-1.5 top-1.5 z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 outline-none",
                        "hover:bg-slate-100 hover:text-slate-700",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "dark:hover:bg-neutral-800 dark:hover:text-slate-200"
                      )}
                      aria-label={`About “${item.title}”: ${item.helpText}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.preventDefault()}
                    >
                      <HelpCircle className="h-4 w-4" aria-hidden />
                      <span
                        role="tooltip"
                        className={cn(
                          "pointer-events-none absolute right-0 top-full z-20 mt-1 w-[min(16rem,calc(100vw-2rem))] rounded-md border border-slate-200 bg-white px-2.5 py-2 text-left text-xs font-normal leading-snug text-slate-700 shadow-md",
                          "invisible opacity-0 transition-opacity duration-150",
                          "group-hover/help:visible group-hover/help:opacity-100",
                          "group-focus-visible/help:visible group-focus-visible/help:opacity-100",
                          "dark:border-input dark:bg-popover dark:text-slate-100"
                        )}
                      >
                        {item.helpText}
                      </span>
                    </button>
                    <div
                      className="flex shrink-0 items-start pt-0.5"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id={`onboarding-${item.id}`}
                        checked={isDone}
                        disabled={autoLockedByData}
                        onCheckedChange={(v) => {
                          if (autoLockedByData) return;
                          setStepDone(item.id, v === true);
                        }}
                        aria-label={
                          isUploadStep && hasActiveTour
                            ? `“${item.title}” complete — active tour on record`
                            : isCreateChatbotStep && hasActiveTourChatbot
                              ? `“${item.title}” complete — tour chatbot is active`
                              : isTrainStep && hasCustomisedTourTraining
                                ? `“${item.title}” complete — training content customised`
                                : isShareStep && hasPressedShare
                                  ? `“${item.title}” complete — iframe embed code copied`
                                  : `Mark “${item.title}” as done`
                        }
                        className="mt-0.5"
                      />
                    </div>
                    <Link
                      href={item.href}
                      className="group min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                    >
                      <p
                        className={cn(
                          "text-sm font-medium text-slate-900 group-hover:text-slate-950 dark:text-slate-100 dark:group-hover:text-white",
                          isDone && "text-slate-500 line-through decoration-slate-400 dark:text-slate-500"
                        )}
                      >
                        {item.title}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs text-slate-500 dark:text-slate-400",
                          isDone && "text-slate-400 line-through dark:text-slate-500"
                        )}
                      >
                        {item.description}
                      </p>
                    </Link>
                  </div>
                );
              })}
                </div>
              </CollapsibleContent>
            </div>
              </Collapsible>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Default export for consistency
export default DashboardContent; 