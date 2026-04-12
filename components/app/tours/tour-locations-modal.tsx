"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/app/shared/theme-provider";
import { Building2, ChevronDown, ChevronUp, Layers, Plus } from "lucide-react";
import { Tour } from "@/lib/types";

interface TourLocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryTour: Tour | null;
  allTours: Tour[];
  activeModelId: string | null;
  onSelectModel: (model: Tour) => void | Promise<void>;
  onAddLocation: () => void;
  spacesUsed: number;
  spacesAllowed: number;
}

export function TourLocationsModal({
  isOpen,
  onClose,
  primaryTour,
  allTours,
  activeModelId,
  onSelectModel,
  onAddLocation,
  spacesUsed,
  spacesAllowed,
}: TourLocationsModalProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [expandedLocationIds, setExpandedLocationIds] = useState<string[]>([]);
  const canAddLocation = spacesUsed < spacesAllowed;

  const locations = useMemo(() => {
    const rows = allTours.length > 0 ? allTours : primaryTour ? [primaryTour] : [];
    const primaryLocations = rows.filter((tour) => tour.tour_type === "primary" || !tour.tour_type);
    return primaryLocations;
  }, [allTours, primaryTour]);

  const locationModels = useMemo(() => {
    const rows = allTours.length > 0 ? allTours : primaryTour ? [primaryTour] : [];
    const shouldFallbackLegacySecondary = locations.length <= 1;
    return locations.map((location) => {
      const modelsForLocation = rows.filter((tour) => {
        if (tour.id === location.id) return true;
        if (tour.tour_type !== "secondary") return false;
        if (tour.parent_tour_id) return tour.parent_tour_id === location.id;
        return shouldFallbackLegacySecondary;
      });

      return { location, models: modelsForLocation };
    });
  }, [allTours, primaryTour, locations]);

  useEffect(() => {
    if (!isOpen) return;
    if (locations.length === 0) return;
    setExpandedLocationIds([locations[0].id]);
  }, [isOpen, locations]);

  const handleSelectModel = async (model: Tour) => {
    if (activeModelId === model.matterport_tour_id) {
      onClose();
      return;
    }

    await onSelectModel(model);
    onClose();
  };

  const handleSelectLocation = async (location: Tour) => {
    const locationModel = location;
    if (!locationModel) return;
    await handleSelectModel(locationModel);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className={isDarkMode ? "sm:max-w-3xl border border-slate-700/80 bg-[#0f1117] text-slate-100" : "sm:max-w-3xl"}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? "flex items-center gap-2 text-slate-100" : "flex items-center gap-2"}>
            <Building2 className={isDarkMode ? "h-5 w-5 text-slate-300" : "h-5 w-5 text-slate-700"} />
            Manage Tour Locations
          </DialogTitle>
          <DialogDescription className={isDarkMode ? "text-slate-400" : undefined}>
            Each tour location can include multiple Matterport models under one shared embed and one shared AI assistant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-input dark:bg-background">
            <div className="space-y-1">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Each location represents one space. Expand a location to manage its linked Matterport models.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Locations used: <span className="font-semibold text-slate-700 dark:text-slate-200">{spacesUsed}/{spacesAllowed}</span>
              </p>
            </div>
            <Button
              className="bg-slate-900 text-white hover:bg-slate-800 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
              disabled={!canAddLocation}
              onClick={() => {
                onClose();
                onAddLocation();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Tour Location
            </Button>
          </div>

          {!canAddLocation && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              You have used all available spaces. Upgrade your plan or purchase extra space add-ons to create another tour location.
            </div>
          )}

          {locationModels.map(({ location, models }) => {
            const isExpanded = expandedLocationIds.includes(location.id);

            return (
              <Card key={location.id} className="border border-slate-200 dark:border-input dark:bg-background">
                <CardContent className="p-0">
                  <div className="flex w-full items-center justify-between p-4">
                    <button
                      type="button"
                      onClick={() => handleSelectLocation(location)}
                      className="min-w-0 text-left"
                    >
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{location.title}</h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {models.length} model{models.length === 1 ? "" : "s"} linked
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLocationIds((prev) =>
                          prev.includes(location.id)
                            ? prev.filter((id) => id !== location.id)
                            : [...prev, location.id],
                        )
                      }
                      className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-neutral-800"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                      <div className="space-y-2">
                        {models.map((model) => (
                          <button
                            type="button"
                            key={model.id}
                            onClick={() => handleSelectModel(model)}
                            className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-input dark:bg-background"
                          >
                            <div className="min-w-0 text-left">
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{model.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Model ID: {model.matterport_tour_id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs dark:border-input dark:bg-background dark:text-slate-300">
                                {activeModelId === model.matterport_tour_id ? "Active model - " : ""}
                                {model.tour_type === "primary" ? "Primary model" : "Additional model"}
                              </Badge>
                              <Layers className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-input dark:bg-background">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Example model: one venue can include separate models for main hall, accommodation, and other spaces while staying inside one tour location.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

