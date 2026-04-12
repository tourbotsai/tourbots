"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Monitor, Smartphone, Loader2, Eye } from "lucide-react";
import { GlobalSettingsPanel } from "./global-settings-panel";
import { BlocksList } from "./blocks-list";
import { TourMenuPreview } from "./tour-menu-preview";
import { useTourMenu } from "@/hooks/app/useTourMenu";
import { useToast } from "@/components/ui/use-toast";
import { TourMenuSettings } from "@/lib/types";

interface TourMenuBuilderProps {
  tourId?: string;
  layoutMode?: 'split' | 'stacked';
}

export function TourMenuBuilder({ tourId, layoutMode = 'split' }: TourMenuBuilderProps = {}) {
  const { toast } = useToast();
  const isStackedLayout = layoutMode === 'stacked';
  
  // Tour ID is currently provided by parent pages (app/admin); keep fallback for defensive rendering.
  const activeTourId = tourId || '';
  
  const {
    settings: savedSettings,
    blocks: savedBlocks,
    isLoading,
    error,
    saveMenu
  } = useTourMenu(activeTourId);

  // Local state for editing
  const [settings, setSettings] = useState<Partial<TourMenuSettings>>({
    enabled: false,
    position: 'center',
    max_width: 600,
    padding: 24,
    border_radius: 16,
    menu_background_color: '#FFFFFF',
    backdrop_blur: true,
    entrance_animation: 'fade-scale',
  });

  const [blocks, setBlocks] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(true);
  const [workspaceTab, setWorkspaceTab] = useState<'content' | 'settings'>('settings');

  // Sync saved data to local state
  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, [savedSettings]);

  useEffect(() => {
    if (savedBlocks) {
      setBlocks(savedBlocks);
    }
  }, [savedBlocks]);

  const handleSave = async () => {
    if (!activeTourId) {
      toast({
        title: "Error",
        description: "No tour selected",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveMenu(settings, blocks);
      toast({
        title: "Tour menu saved!",
        description: "Your tour menu has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error saving tour menu",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <div className="p-12 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-blue" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading menu...</p>
          </div>
        </div>
      </Card>
    );
  }

  // Show friendly message if no tour selected
  if (!activeTourId) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <div className="p-12 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto dark:border dark:border-input dark:bg-background">
              <Monitor className="w-8 h-8 text-slate-700" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                No Tour Selected
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Go to the "Tour Setup" tab and select a tour to customise its menu.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tour Menu Builder</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Create a customisable welcome menu for your virtual tour.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-1.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center dark:border-input dark:bg-background">
              <div className="col-span-2 grid grid-cols-2 gap-1 sm:col-span-1 sm:flex sm:items-center sm:gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveDevice('desktop')}
                  className={`h-8 rounded-md border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-100 dark:border-input dark:bg-background dark:hover:bg-neutral-800 ${
                    activeDevice === 'desktop' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Monitor className="mr-1.5 h-3.5 w-3.5" />
                  Desktop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveDevice('mobile')}
                  className={`h-8 rounded-md border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-100 dark:border-input dark:bg-background dark:hover:bg-neutral-800 ${
                    activeDevice === 'mobile' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Smartphone className="mr-1.5 h-3.5 w-3.5" />
                  Mobile
                </Button>
              </div>

              <div className="col-span-2 hidden h-4 w-px bg-slate-200 dark:bg-neutral-700 sm:block" />

              <div className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 dark:border-input dark:bg-background sm:h-auto sm:gap-2 sm:border-0 sm:bg-transparent sm:px-2">
                <Switch
                  checked={showPreview}
                  onCheckedChange={setShowPreview}
                  className="scale-90 sm:scale-100"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="sm:hidden">Preview</span>
                  <span className="hidden sm:inline">Show Preview</span>
                </span>
              </div>

              <div className="col-span-2 hidden h-4 w-px bg-slate-200 dark:bg-neutral-700 sm:block" />

              <Button
                onClick={handleSave}
                size="sm"
                disabled={isSaving}
                className="h-8 w-full rounded-md bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 sm:w-auto dark:border dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save & Publish
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Layout */}
      <div
        className={
          showPreview
            ? isStackedLayout
              ? "space-y-5"
              : "grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(500px,620px)]"
            : "space-y-5"
        }
      >
        {showPreview && isStackedLayout ? (
          <div className="sticky top-20 z-[5]">
            <Card className="border-0 bg-transparent shadow-none md:rounded-xl md:border md:border-slate-200 md:bg-white md:shadow-sm md:dark:border-input md:dark:bg-background">
              <CardContent className="p-0 md:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Preview</h3>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-input dark:bg-background dark:text-slate-300">
                    {activeDevice === "desktop" ? "Desktop view" : "Mobile view"}
                  </span>
                </div>
                <div className="rounded-none border-0 bg-transparent p-0 md:rounded-lg md:border md:border-slate-200 md:bg-slate-50/50 md:p-3 md:dark:border-input md:dark:bg-background">
                  <TourMenuPreview
                    settings={settings}
                    blocks={blocks}
                    mode={activeDevice}
                    isPreviewMode={true}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Left - Editor Sections */}
        <div className="space-y-5">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
            <CardContent className="p-4">
              <Tabs
                value={workspaceTab}
                onValueChange={(value) => setWorkspaceTab(value as 'content' | 'settings')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-input dark:bg-background">
                  <TabsTrigger
                    value="settings"
                    className="rounded-md text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
                  >
                    Menu Settings
                  </TabsTrigger>
                  <TabsTrigger
                    value="content"
                    className="rounded-md text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
                  >
                    Content Blocks
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-4">
                  <GlobalSettingsPanel
                    settings={settings}
                    onSettingsChange={setSettings}
                  />
                </TabsContent>

                <TabsContent value="content" className="mt-4">
                  <BlocksList
                    blocks={blocks}
                    onBlocksChange={setBlocks}
                    tourId={activeTourId}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right - Live Preview */}
        {showPreview && !isStackedLayout && (
          <div className="h-fit xl:sticky xl:top-24">
            <Card className="border-0 bg-transparent shadow-none md:rounded-xl md:border md:border-slate-200 md:bg-white md:shadow-sm md:dark:border-input md:dark:bg-background">
              <CardContent className="p-0 md:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Preview</h3>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-input dark:bg-background dark:text-slate-300">
                    {activeDevice === "desktop" ? "Desktop view" : "Mobile view"}
                  </span>
                </div>
                <div className="rounded-none border-0 bg-transparent p-0 md:rounded-lg md:border md:border-slate-200 md:bg-slate-50/50 md:p-3 md:dark:border-input md:dark:bg-background">
                  <TourMenuPreview 
                  settings={settings}
                  blocks={blocks}
                  mode={activeDevice}
                  isPreviewMode={true}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

