"use client";

import React, { FC, useState, useEffect } from 'react';
import { ChatbotCustomisation } from '@/lib/types';
import { CustomisationPreset } from '@/lib/types/chatbot-customisation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { 
  ChevronDown,
  ChevronRight,
  Monitor,
  Smartphone,
  Palette,
  Type,
  Layout,
  Sparkles,
  MessageCircle,
  Settings,
  Building2,
  Star,
  Eye,
  Save,
  RotateCcw
} from 'lucide-react';

// Import desktop and mobile customisation components
import DesktopCustomisation from './desktop-customisation';
import MobileCustomisation from './mobile-customisation';

// Import Phase 4 preset components
import PresetSelector from '../presets/preset-selector';

// Import live preview
import EnhancedLivePreview from '../preview/enhanced-live-preview';

interface CustomisationFormProps {
  customisation: ChatbotCustomisation;
  onUpdate: (updates: Partial<Omit<ChatbotCustomisation, 'id' | 'venue_id' | 'tour_id' | 'chatbot_type' | 'created_at' | 'updated_at'>>) => Promise<ChatbotCustomisation>;
  onReset: () => Promise<ChatbotCustomisation>;
  isLoading?: boolean;
  className?: string;
  customBrandingEnabled?: boolean;
  layoutMode?: 'split' | 'stacked';
}

interface SectionConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  defaultOpen?: boolean;
  description?: string;
}

const CustomisationForm: FC<CustomisationFormProps> = ({
  customisation,
  onUpdate,
  onReset,
  isLoading = false,
  className,
  customBrandingEnabled = true,
  layoutMode = 'split',
}) => {
  const { toast } = useToast();
  const [localCustomisation, setLocalCustomisation] = useState(customisation);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingFactory, setIsResettingFactory] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [favouritePresets, setFavouritePresets] = useState<string[]>([]);
  
  // NEW: Preview state management
  const [previewMode, setPreviewMode] = useState(false);
  const [previewCustomisation, setPreviewCustomisation] = useState<ChatbotCustomisation | null>(null);
  const [previewPresetName, setPreviewPresetName] = useState<string>('');
  
  // Layout state
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(true);
  
  // Section collapse states (default collapsed for compact view)
  const [sectionStates, setSectionStates] = useState({
    presets: false,    // Default collapsed
    customisation: true // Default open
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches;
    setSectionStates(prev => ({
      ...prev,
      customisation: !isMobileViewport,
    }));
  }, []);

  // All sections - simplified to just presets and device-specific customisation
  const sections: SectionConfig[] = [
    {
      id: 'presets',
      label: 'Quick Presets',
      icon: <Star className="h-4 w-4" />,
      component: PresetSelector,
      defaultOpen: false,
      description: 'Choose from professional presets'
    },
    {
      id: 'customisation',
      label: `${activeDevice === 'desktop' ? 'Desktop' : 'Mobile'} Customisation${previewMode ? ` (Previewing ${previewPresetName})` : ''}`,
      icon: activeDevice === 'desktop' ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />,
      component: activeDevice === 'desktop' ? DesktopCustomisation : MobileCustomisation,
      defaultOpen: true,
      description: `Customise ${activeDevice} appearance${previewMode ? ' - preview active on both devices' : ''}`
    }
  ];

  // Update local state when customisation prop changes
  useEffect(() => {
    setLocalCustomisation(customisation);
    setHasChanges(false);
  }, [customisation]);

  const handleFieldChange = (field: keyof ChatbotCustomisation, value: any) => {
    const updates = { [field]: value };
    setLocalCustomisation(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.keys(localCustomisation).reduce((acc, key) => {
        if (
          key !== 'id' &&
          key !== 'venue_id' &&
          key !== 'tour_id' &&
          key !== 'chatbot_type' &&
          key !== 'created_at' &&
          key !== 'updated_at'
        ) {
          acc[key] = localCustomisation[key as keyof ChatbotCustomisation];
        }
        return acc;
      }, {} as any);
      
      await onUpdate(updates);
      setHasChanges(false);
      toast({
        title: "Customisation saved",
        description: "Your chatbot customisation has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving customisation",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardTemporaryChanges = () => {
    setLocalCustomisation(customisation);
    setHasChanges(false);
    setPreviewMode(false);
    setPreviewCustomisation(null);
    setPreviewPresetName('');
    setShowResetDialog(false);
    toast({
      title: "Temporary changes discarded",
      description: "Restored to your last saved customisation.",
    });
  };

  const handleResetFactorySettings = async () => {
    setIsResettingFactory(true);
    try {
      const resetCustomisation = await onReset();
      setLocalCustomisation(resetCustomisation);
      setHasChanges(false);
      setPreviewMode(false);
      setPreviewCustomisation(null);
      setPreviewPresetName('');
      setShowResetDialog(false);
      toast({
        title: "Customisation reset",
        description: "All settings have been reset to factory defaults.",
      });
    } catch (error) {
      toast({
        title: "Error resetting customisation",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingFactory(false);
    }
  };

  const handlePresetSelect = (preset: CustomisationPreset) => {
    const updates = { ...localCustomisation, ...preset.customisation };
    setLocalCustomisation(updates);
    setHasChanges(true);
    // Exit preview mode when applying
    setPreviewMode(false);
    setPreviewCustomisation(null);
    setPreviewPresetName('');
    toast({
      title: "Preset applied",
      description: `Applied ${preset.name} preset successfully.`,
    });
  };

  // NEW: Handle temporary preset preview
  const handlePresetPreview = (preset: CustomisationPreset) => {
    const previewData = { ...localCustomisation, ...preset.customisation };
    setPreviewCustomisation(previewData);
    setPreviewMode(true);
    setPreviewPresetName(preset.name);
    toast({
      title: "Previewing preset",
      description: `Previewing ${preset.name}. Click "Apply" to use it or "Exit Preview" to return.`,
    });
  };

  // NEW: Exit preview mode
  const handleExitPreview = () => {
    setPreviewMode(false);
    setPreviewCustomisation(null);
    setPreviewPresetName('');
    toast({
      title: "Preview ended",
      description: "Returned to your current settings.",
    });
  };

  const handleToggleFavourite = (presetName: string) => {
    setFavouritePresets(prev => 
      prev.includes(presetName) 
        ? prev.filter(p => p !== presetName)
        : [...prev, presetName]
    );
  };

  const toggleSection = (sectionId: string) => {
    setSectionStates(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId as keyof typeof prev]
    }));
  };

  const isStackedLayout = layoutMode === 'stacked';

  return (
    <div className={cn(isStackedLayout ? "min-h-0 dark:text-slate-100" : "min-h-screen dark:text-slate-100", className)}>
      {/* Header Action Bar */}
      <div className="px-4 pt-0 lg:sticky lg:top-0 lg:z-10 lg:px-6 lg:pt-4">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-input dark:bg-background">
          <div className="flex min-h-[72px] flex-col justify-center gap-3 lg:min-h-[64px] lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Chatbot Customisation
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {previewMode
                  ? `Previewing ${previewPresetName} preset (not saved).`
                  : "Personalise your chatbot's appearance"}
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-1.5 dark:border-input dark:bg-background lg:flex lg:w-auto lg:flex-wrap lg:items-center">
              {previewMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExitPreview}
                  className="col-span-2 h-8 rounded-md border-orange-200 bg-white px-3 text-xs font-medium text-orange-600 hover:bg-orange-50 lg:col-span-1 dark:border-slate-600 dark:bg-background dark:text-slate-200 dark:hover:bg-neutral-800"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Exit Preview
                </Button>
              )}

              {previewMode && <div className="col-span-2 hidden h-4 w-px bg-slate-200 lg:block dark:bg-neutral-700" />}

              <div className="col-span-2 grid grid-cols-2 gap-1 lg:col-span-1 lg:flex lg:items-center lg:gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveDevice('desktop')}
                  className={`h-8 rounded-md border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-100 dark:border-input dark:bg-background dark:hover:bg-neutral-800 ${
                    activeDevice === 'desktop' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5 mr-1.5" />
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
                  <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                  Mobile
                </Button>
              </div>

              <div className="col-span-2 hidden h-4 w-px bg-slate-200 lg:block dark:bg-neutral-700" />

              <div className="col-span-2 grid grid-cols-2 gap-1 lg:col-span-1 lg:flex lg:items-center lg:gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetDialog(true)}
                  disabled={isLoading}
                  className="h-8 rounded-md border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>

                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={!hasChanges || isLoading || isSaving}
                  className="h-8 rounded-md bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 dark:border dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span className="lg:hidden">Save</span>
                      <span className="hidden lg:inline">Save Changes</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="col-span-2 hidden h-4 w-px bg-slate-200 lg:block dark:bg-neutral-700" />

              <div className="col-span-2 flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 dark:border-input dark:bg-background lg:h-auto lg:border-0 lg:bg-transparent lg:px-2">
                <Switch
                  checked={showPreview}
                  onCheckedChange={setShowPreview}
                  className="scale-90 lg:scale-100"
                />
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="lg:hidden">Preview</span>
                  <span className="hidden lg:inline">Show Preview</span>
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="dark:border-input dark:bg-background">
          <DialogHeader>
            <DialogTitle>Reset customisation?</DialogTitle>
            <DialogDescription>
              Choose whether to discard only temporary unsaved changes, or reset everything to factory defaults.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscardTemporaryChanges}
              disabled={isResettingFactory}
              className="dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
            >
              Discard temporary changes
            </Button>
            <Button
              type="button"
              onClick={handleResetFactorySettings}
              disabled={isResettingFactory}
              className="bg-slate-900 text-white hover:bg-slate-800 dark:border dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
            >
              {isResettingFactory ? "Resetting..." : "Reset factory settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Layout - 2 Columns on desktop, stacked on mobile */}
      <div
        className={cn(
          isStackedLayout
            ? "space-y-4 p-4"
            : "flex flex-col gap-4 p-4 lg:flex-row lg:gap-6 lg:p-6"
        )}
      >
        {showPreview && isStackedLayout ? (
          <div className="sticky top-20 z-[5]">
            <Card className="dark:border-input dark:bg-background">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium">Live Preview</span>
                    {previewMode && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200 dark:border-input dark:bg-background dark:text-slate-300">
                        Previewing: {previewPresetName}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activeDevice}
                  </Badge>
                </div>
                <EnhancedLivePreview
                  customisation={previewMode ? previewCustomisation! : localCustomisation}
                  mode={activeDevice}
                  className="min-h-[460px]"
                />
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Left - Customisation Sections (Wider) */}
        <div className={cn(isStackedLayout ? "space-y-4" : "w-full min-w-0 flex-1 space-y-4")}>
          {/* Collapsible Sections */}
          {sections.map((section) => (
            <Card key={section.id} className="overflow-hidden dark:border-input dark:bg-background">
              <Collapsible
                open={sectionStates[section.id as keyof typeof sectionStates]}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-gray-600 dark:text-gray-400">
                          {section.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-sm dark:text-slate-100">{section.label}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{section.description}</p>
                        </div>
                      </div>
                      {sectionStates[section.id as keyof typeof sectionStates] ? (
                        <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Separator />
                  <CardContent className="p-6">
                    {section.id === 'presets' ? (
                      <PresetSelector
                        currentCustomisation={localCustomisation}
                        onPresetSelect={handlePresetSelect}
                        onPresetPreview={handlePresetPreview}
                        favouritePresets={favouritePresets}
                        onToggleFavourite={handleToggleFavourite}
                        compactMode={true}
                      />
                    ) : section.id === 'customisation' ? (
                      activeDevice === 'desktop' ? (
                        <DesktopCustomisation
                          values={localCustomisation}
                          onChange={handleFieldChange}
                          isLoading={isLoading}
                          onCustomImageChange={(imageUrl) => handleFieldChange('custom_logo_url', imageUrl)}
                          customBrandingEnabled={customBrandingEnabled}
                        />
                      ) : (
                        <MobileCustomisation
                          values={localCustomisation}
                          onChange={handleFieldChange}
                          customBrandingEnabled={customBrandingEnabled}
                        />
                      )
                    ) : null}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Right - Live Preview */}
        {showPreview && !isStackedLayout && (
          <div className="w-full flex-shrink-0 lg:w-[500px] xl:w-[600px]">
            <div className="sticky top-24">
              <Card className="border-0 bg-transparent shadow-none lg:border lg:bg-background lg:shadow-sm dark:border-input dark:bg-background">
                <CardContent className="p-0 lg:p-4">
                  <div className="mb-3 flex items-center justify-between px-1 lg:mb-4 lg:px-0">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium">Live Preview</span>
                      {previewMode && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200 dark:border-input dark:bg-background dark:text-slate-300">
                          Previewing: {previewPresetName}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activeDevice}
                    </Badge>
                  </div>
                  <EnhancedLivePreview 
                    customisation={previewMode ? previewCustomisation! : localCustomisation}
                    mode={activeDevice}
                    className="min-h-[560px] lg:min-h-[600px]"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { CustomisationForm };
export default CustomisationForm; 