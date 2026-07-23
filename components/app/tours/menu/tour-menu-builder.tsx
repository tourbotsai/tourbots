"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Save,
  Monitor,
  Smartphone,
  Loader2,
  Eye,
  Camera,
  ArrowLeft,
} from "lucide-react";
import { GlobalSettingsPanel } from "./global-settings-panel";
import { BlocksList } from "./blocks-list";
import { TourMenuPreview } from "./tour-menu-preview";
import { useTourMenu } from "@/hooks/app/useTourMenu";
import { useToast } from "@/components/ui/use-toast";
import { TourMenuSettings } from "@/lib/types";
import { DEFAULT_NEW_MENU_SETTINGS } from "@/lib/tour-menu";
import { cn } from "@/lib/utils";

interface TourMenuBuilderProps {
  tourId?: string;
  venueId?: string;
  layoutMode?: "split" | "stacked";
  onSwitchToViewer?: () => void;
}

const DEFAULT_MENU_SETTINGS: Partial<TourMenuSettings> = DEFAULT_NEW_MENU_SETTINGS;

export function TourMenuBuilder({
  tourId,
  venueId,
  layoutMode = "split",
  onSwitchToViewer,
}: TourMenuBuilderProps = {}) {
  const { toast } = useToast();
  const isStackedLayout = layoutMode === "stacked";
  const activeTourId = tourId || "";

  const {
    settings: savedSettings,
    blocks: savedBlocks,
    isLoading,
    saveMenu,
  } = useTourMenu(activeTourId);

  const [settings, setSettings] = useState<Partial<TourMenuSettings>>(DEFAULT_MENU_SETTINGS);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDevice, setActiveDevice] = useState<"desktop" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(true);
  const [contentDefaultOpen, setContentDefaultOpen] = useState(false);
  const hasSetInitialBlocksOpenRef = useRef(false);

  useEffect(() => {
    if (savedSettings) {
      setSettings({ ...DEFAULT_MENU_SETTINGS, ...savedSettings });
    }
  }, [savedSettings]);

  useEffect(() => {
    if (savedBlocks) {
      setBlocks(savedBlocks);
      if (!hasSetInitialBlocksOpenRef.current) {
        hasSetInitialBlocksOpenRef.current = true;
        if (savedBlocks.length > 0) {
          setContentDefaultOpen(true);
        }
      }
    }
  }, [savedBlocks]);

  const handleSave = async () => {
    if (!activeTourId) {
      toast({
        title: "Error",
        description: "No tour selected",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveMenu(settings, blocks);
      toast({
        title: "Tour menu saved",
        description: "Your changes are live on the tour.",
      });
    } catch (error) {
      toast({
        title: "Error saving tour menu",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200/90 bg-white py-16 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Loading menu builder…</p>
        </div>
      </div>
    );
  }

  if (!activeTourId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white px-6 py-16 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-neutral-800">
          <Camera className="h-7 w-7 text-slate-500" />
        </div>
        <h3 className="mb-1.5 text-lg font-semibold text-slate-900 dark:text-slate-100">
          No tour selected
        </h3>
        <p className="mb-5 max-w-sm text-center text-sm text-slate-500">
          Set up your tour first to customise its menu.
        </p>
        <Button
          onClick={() => onSwitchToViewer?.()}
          className="rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go to Tour Setup
        </Button>
      </div>
    );
  }

  const contentSummary =
    blocks.length > 0
      ? `${blocks.length} block${blocks.length === 1 ? "" : "s"}`
      : "Templates & layers";

  const previewPane = showPreview ? (
    <div className={cn(isStackedLayout ? "sticky top-20 z-[5]" : "h-fit xl:sticky xl:top-24")}>
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-slate-400" />
            <h3 className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Live preview
            </h3>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
            {activeDevice === "desktop" ? "Desktop" : "Mobile"}
          </span>
        </div>
        <div className="bg-slate-50/60 p-3 dark:bg-neutral-900/40">
          <TourMenuPreview
            settings={settings}
            blocks={blocks}
            mode={activeDevice}
            isPreviewMode={true}
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      {/* Editor chrome */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-neutral-800 dark:bg-neutral-950 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Menu builder
          </h1>
          <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
            Style on the left · preview updates live on the right
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100/90 p-0.5 dark:bg-neutral-900">
            <button
              type="button"
              onClick={() => setActiveDevice("desktop")}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-all",
                activeDevice === "desktop"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              )}
            >
              <Monitor className="h-3.5 w-3.5" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setActiveDevice("mobile")}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-all",
                activeDevice === "mobile"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              )}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
          </div>

          <div className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 px-2.5 dark:border-neutral-800">
            <Switch
              checked={showPreview}
              onCheckedChange={setShowPreview}
              className="scale-90"
            />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Preview
            </span>
          </div>

          <Button
            onClick={handleSave}
            size="sm"
            disabled={isSaving}
            className="h-8 rounded-lg bg-slate-900 px-3 text-[11px] font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save & publish
              </>
            )}
          </Button>
        </div>
      </div>

      <div
        className={
          showPreview
            ? isStackedLayout
              ? "space-y-4"
              : "grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(480px,560px)]"
            : "space-y-4"
        }
      >
        {showPreview && isStackedLayout ? previewPane : null}

        <div className="min-w-0">
          <GlobalSettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            activeDevice={activeDevice}
            contentSummary={contentSummary}
            contentDefaultOpen={contentDefaultOpen}
            contentBlocksSlot={
              <BlocksList
                blocks={blocks}
                onBlocksChange={setBlocks}
                tourId={activeTourId}
                venueId={venueId}
                activeDevice={activeDevice}
              />
            }
          />
        </div>

        {showPreview && !isStackedLayout ? previewPane : null}
      </div>
    </div>
  );
}
