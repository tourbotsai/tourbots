"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useUser as useFirebaseUser } from "reactfire";
import { useBilling } from "@/hooks/app/useBilling";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, MessageSquare, Camera, RefreshCw, Expand, Minimize, Edit, Plus, MapPin } from "lucide-react";
import { FeedbackFormModal } from "./feedback-form-modal";
import { TourChatWidget } from "./tour-chat-widget";
import { TourManagementModal } from "./tour-management-modal";
import { SavePositionModal } from "./save-position-modal";
import { ManagePositionsModal } from "./manage-positions-modal";
import { SecondaryToursModal } from "./secondary-tours-modal";
import { TourLocationsModal } from "./tour-locations-modal";
import { MatterportSDKWrapper } from "@/components/matterport/matterport-sdk-wrapper";
import { TourMenuOverlay } from "@/components/embed/tour-menu-overlay";
import { incrementTourViews } from "@/lib/tour-service";
import { useTourManagement } from "@/hooks/app/useTourManagement";
import { Tour, ChatbotCustomisation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

interface TourViewerProps {
  onTourChange?: (tourId: string | null) => void;
  onToursUpdated?: (tours: Tour[]) => void;
  selectedTourIdOverride?: string | null;
  switchTourSignal?: number;
  openTourLocationsManagerSignal?: number;
  forcedVenueId?: string;
  forcedVenueName?: string;
}

function isAgencyPortalPath(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/embed/agency/");
}

function getCookieValue(name: string): string {
  if (typeof document === "undefined") return "";
  const escapedName = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function TourViewer({
  onTourChange,
  onToursUpdated,
  selectedTourIdOverride,
  switchTourSignal,
  openTourLocationsManagerSignal,
  forcedVenueId,
  forcedVenueName,
}: TourViewerProps = {}) {
  const router = useRouter();
  const { user } = useUser();
  const { data: authUser } = useFirebaseUser();
  const { getAuthHeaders } = useAuthHeaders();
  const { limits, fetchBilling } = useBilling();
  const { saveTour, isLoading: isSaving } = useTourManagement();
  const [tour, setTour] = useState<Tour | null>(null);
  const [allTours, setAllTours] = useState<Tour[]>([]); // NEW: All tours (primary + secondary)
  const [customisation, setCustomisation] = useState<ChatbotCustomisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTourManagement, setShowTourManagement] = useState(false);
  const [createLocationMode, setCreateLocationMode] = useState(false);
  const [showSecondaryTours, setShowSecondaryTours] = useState(false); // NEW: Secondary tours modal
  const [showTourLocations, setShowTourLocations] = useState(false);
  const [tourLoaded, setTourLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  
  // Matterport SDK state
  const [mpSdk, setMpSdk] = useState<any>(null);
  const [currentPosition, setCurrentPosition] = useState<any>(null);
  const [currentSweep, setCurrentSweep] = useState<any>(null);
  const [showSavePositionModal, setShowSavePositionModal] = useState(false);
  const [showManagePositionsModal, setShowManagePositionsModal] = useState(false);
  const [isSavingPosition, setIsSavingPosition] = useState(false);
  const [tourPoints, setTourPoints] = useState<any[]>([]);
  const [currentViewingModelId, setCurrentViewingModelId] = useState<string | null>(null);
  const lastTourLocationsSignalRef = useRef<number | undefined>(openTourLocationsManagerSignal);
  const activeVenueId = forcedVenueId || user?.venue?.id;
  const activeVenueName = forcedVenueName || user?.venue?.name || "Venue";
  const isAgencyPortal = isAgencyPortalPath();

  const locationTours = useMemo(
    () => allTours.filter((t) => t.tour_type === "primary" || !t.tour_type),
    [allTours]
  );
  const spacesUsed = locationTours.length;
  const spacesAllowed = Math.max(spacesUsed, Number(limits?.totalSpaces || 0));

  const resolveLocationTourId = useCallback(
    (tourRow: Tour | null): string | null => {
      if (!tourRow) return null;
      if (tourRow.tour_type === "primary" || !tourRow.tour_type) return tourRow.id;
      if (tourRow.parent_tour_id) return tourRow.parent_tour_id;
      if (locationTours.length === 1) return locationTours[0].id;
      return tourRow.id;
    },
    [locationTours]
  );

  const currentLocationTourId = useMemo(
    () => resolveLocationTourId(tour),
    [tour, resolveLocationTourId]
  );

  const modelsForCurrentLocation = useMemo(() => {
    if (!currentLocationTourId) return [];
    const shouldFallbackLegacySecondary = locationTours.length <= 1;
    return allTours.filter((row) => {
      if (row.id === currentLocationTourId) return true;
      if (row.tour_type !== "secondary") return false;
      if (row.parent_tour_id) return row.parent_tour_id === currentLocationTourId;
      return shouldFallbackLegacySecondary;
    });
  }, [allTours, currentLocationTourId, locationTours.length]);

  const menuScopeTourId = currentLocationTourId || tour?.id || "";

  const resolveLocationIdFromList = useCallback((tourRow: Tour | null, rows: Tour[]) => {
    if (!tourRow) return null;
    if (tourRow.tour_type === "primary" || !tourRow.tour_type) return tourRow.id;
    if (tourRow.parent_tour_id) return tourRow.parent_tour_id;
    const locationRows = rows.filter((row) => row.tour_type === "primary" || !row.tour_type);
    if (locationRows.length === 1) return locationRows[0].id;
    return tourRow.id;
  }, []);

  const fetchTourCustomisation = useCallback(async (venueId: string, locationTourId: string) => {
    if (!authUser) return null;
    const token = await authUser.getIdToken();
    const response = await fetch(
      `/api/app/chatbots/customisation?venueId=${encodeURIComponent(venueId)}&chatbotType=tour&tourId=${encodeURIComponent(locationTourId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) return null;
    return (await response.json()) as ChatbotCustomisation | null;
  }, [authUser]);

  // Handle keyboard shortcuts in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen && e.key === 'Escape') {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Prevent body scroll when in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const fetchTour = async () => {
    if (!activeVenueId) return;

    try {
      setLoading(true);
      setError(null);
      
      let tourData: Tour | null = null;
      let allToursData: Tour[] = [];

      if (isAgencyPortalPath()) {
        const response = await fetch(`/api/public/tours/${encodeURIComponent(activeVenueId)}`, {
          credentials: "include",
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load tour");
        }
        tourData = payload?.tour || null;
        allToursData = tourData ? [tourData] : [];
      } else {
        const response = await fetch(`/api/app/tours/venue/${encodeURIComponent(activeVenueId)}/all`, {
          headers: await getAuthHeaders(),
        });
        const payload = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load tours");
        }
        allToursData = Array.isArray(payload) ? (payload as Tour[]) : [];
        tourData =
          allToursData.find((row) => row.tour_type === "primary" || !row.tour_type) ||
          allToursData[0] ||
          null;
      }

      const resolvedLocationId = resolveLocationIdFromList(tourData, allToursData || []);
      const customisationData = resolvedLocationId
        ? await fetchTourCustomisation(activeVenueId, resolvedLocationId).catch(() => null)
        : null;
      
      setTour(tourData);
      setAllTours(allToursData || []);
      onToursUpdated?.(allToursData || []);
      setCustomisation(customisationData);
      
      // Notify parent of tour change
      if (tourData && onTourChange) {
        onTourChange(resolvedLocationId);
      }
      
      // Set initial viewing model to primary tour
      if (tourData) {
        setCurrentViewingModelId(tourData.matterport_tour_id);
      }

    } catch (err: any) {
      console.error('Error fetching tour:', err);
      setError(err.message || 'Failed to load tour');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTour();
  }, [activeVenueId, resolveLocationIdFromList, fetchTourCustomisation, getAuthHeaders]);

  useEffect(() => {
    // Embedded agency sessions are cookie-authenticated and do not use app billing endpoints.
    if (isAgencyPortal) return;
    if (!activeVenueId) return;
    fetchBilling();
  }, [activeVenueId, fetchBilling, isAgencyPortal]);

  const handleTourLoad = async () => {
    setTourLoaded(true);
    
    // No tracking for internal dashboard views - only embed pages should track
  };

  // Handle SDK ready
  const handleSDKReady = useCallback((sdk: any) => {
    setMpSdk(sdk);
    setTourLoaded(true);
  }, []);

  // Handle position changes
  const handlePositionChange = useCallback((pose: any) => {
    setCurrentPosition(pose);
  }, []);

  // Handle sweep changes
  const handleSweepChange = useCallback((sweep: any) => {
    setCurrentSweep(sweep);
  }, []);

  // Handle save position
  const handleSavePosition = async (name: string, position: any, sweep: any) => {
    if (!tour?.id || !sweep?.sid) return;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const credentials = isAgencyPortal ? 'include' : undefined;
    if (isAgencyPortal) {
      headers['x-csrf-token'] = getCookieValue('tb_agency_csrf');
    } else {
      if (!user || !authUser) return;
      headers['Authorization'] = `Bearer ${await authUser.getIdToken()}`;
    }

    setIsSavingPosition(true);
    try {
      const response = await fetch(`/api/app/tours/${tour.id}/points`, {
        method: 'POST',
        headers,
        credentials,
        body: JSON.stringify({ 
          name, 
          sweep_id: sweep.sid,
          position: position.position,
          rotation: position.rotation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save position');
      }

      // Close modal and refresh points
      setShowSavePositionModal(false);
      fetchTourPoints(); // Refresh points (don't await to avoid blocking)
    } catch (error) {
      console.error('Error saving position:', error);
      alert('Failed to save position. Please try again.');
    } finally {
      setIsSavingPosition(false);
    }
  };

  // Fetch tour points for current tour
  const fetchTourPoints = async () => {
    if (!tour?.id) return;

    const headers: HeadersInit = {};
    const credentials = isAgencyPortal ? 'include' : undefined;
    if (isAgencyPortal) {
      // No additional headers required for read operations in agency portal mode.
    } else {
      if (!authUser) return;
      headers['Authorization'] = `Bearer ${await authUser.getIdToken()}`;
    }
    
    try {
      const response = await fetch(`/api/app/tours/${tour.id}/points`, {
        headers,
        credentials,
      });

      if (response.ok) {
        const data = await response.json();
        setTourPoints(data.points || []);
      }
    } catch (error) {
      console.error('Error fetching tour points:', error);
    }
  };

  // Delete tour point
  const handleDeletePoint = async (pointId: string) => {
    if (!tour?.id) return;

    const headers: HeadersInit = {};
    const credentials = isAgencyPortal ? 'include' : undefined;
    if (isAgencyPortal) {
      headers['x-csrf-token'] = getCookieValue('tb_agency_csrf');
    } else {
      if (!authUser) return;
      headers['Authorization'] = `Bearer ${await authUser.getIdToken()}`;
    }
    
    try {
      const response = await fetch(`/api/app/tours/${tour.id}/points?pointId=${pointId}`, {
        method: 'DELETE',
        headers,
        credentials,
      });

      if (!response.ok) {
        throw new Error('Failed to delete point');
      }
    } catch (error) {
      console.error('Error deleting point:', error);
      throw error;
    }
  };

  // Test navigation to a point
  const handleTestPoint = (point: any) => {
    const navigationEvent = new CustomEvent('matterport_navigate', {
      detail: {
        sweep_id: point.sweep_id,
        position: point.position,
        rotation: point.rotation,
        area_name: point.name
      }
    });
    window.dispatchEvent(navigationEvent);
    setShowManagePositionsModal(false);
  };

  // Fetch points when tour/model changes
  useEffect(() => {
    if (tour?.id) {
      fetchTourPoints();
    }
  }, [tour?.id, currentViewingModelId]);

  // Only open when the parent signal increments, not on initial mount.
  useEffect(() => {
    const previousSignal = lastTourLocationsSignalRef.current;
    const hasSignalIncremented =
      typeof openTourLocationsManagerSignal === "number" &&
      typeof previousSignal === "number" &&
      openTourLocationsManagerSignal > previousSignal;

    if (hasSignalIncremented && tour) {
      setShowTourLocations(true);
    }
    lastTourLocationsSignalRef.current = openTourLocationsManagerSignal;
  }, [openTourLocationsManagerSignal, tour]);

  const handleSaveTour = async (tourData: {
    title: string;
    description?: string;
    matterport_tour_id: string;
    matterport_url: string;
  }) => {
    if (!activeVenueId) return false;
    
    const success = await saveTour(activeVenueId, tourData, {
      createNewLocation: createLocationMode,
    });
    if (success) {
      setCreateLocationMode(false);
      await fetchTour(); // Refresh tour data
    }
    return success;
  };

  const openCreateLocationModal = () => {
    setCreateLocationMode(true);
    setShowTourManagement(true);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Switch between models
  const handleSwitchModel = useCallback(async (newTour: Tour) => {
    if (currentViewingModelId === newTour.matterport_tour_id) {
      return;
    }
    
    setCurrentViewingModelId(newTour.matterport_tour_id);
    setTour(newTour);
    const resolvedLocationId = resolveLocationTourId(newTour);
    onTourChange?.(resolvedLocationId);
    setTourLoaded(false);
    setMpSdk(null); // Reset SDK for new model

    if (activeVenueId && resolvedLocationId) {
      const scopedCustomisation = await fetchTourCustomisation(activeVenueId, resolvedLocationId).catch(() => null);
      setCustomisation(scopedCustomisation);
    }
    
    // Refresh tour points for the new model
    if (newTour.id && authUser) {
      try {
        const response = await fetch(`/api/app/tours/${newTour.id}/points`, {
          headers: {
            'Authorization': `Bearer ${await authUser.getIdToken()}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTourPoints(data.points || []);
        }
      } catch (error) {
        console.error('Error fetching tour points for new model:', error);
      }
    }
  }, [currentViewingModelId, authUser, activeVenueId, onTourChange, resolveLocationTourId, fetchTourCustomisation]);

  useEffect(() => {
    if (!selectedTourIdOverride || allTours.length === 0) return;
    const selectedTour = allTours.find((t) => t.id === selectedTourIdOverride);
    if (!selectedTour) return;
    if (selectedTour.matterport_tour_id === currentViewingModelId) return;
    handleSwitchModel(selectedTour);
  }, [selectedTourIdOverride, switchTourSignal, allTours, currentViewingModelId, handleSwitchModel]);

  // Listen for AI-triggered model switches from chat widget
  useEffect(() => {
    const handleModelSwitchEvent = (event: CustomEvent) => {
      const { modelId } = event.detail;
      
      // Find the tour that matches this model ID
      const targetTour = allTours.find(t => t.matterport_tour_id === modelId);
      
      if (targetTour) {
        handleSwitchModel(targetTour);
      } else {
        console.error('Could not find tour with model ID:', modelId);
      }
    };
    
    window.addEventListener('switch_matterport_model', handleModelSwitchEvent as EventListener);
    
    return () => {
      window.removeEventListener('switch_matterport_model', handleModelSwitchEvent as EventListener);
    };
  }, [allTours, handleSwitchModel]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Loading your tour...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-red-50 dark:bg-red-950/20 p-6 mb-6">
            <Camera className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-text-primary-light dark:text-text-primary-dark">
            Error Loading Tour
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-center max-w-md mb-6">
            {error}
          </p>
          <Button onClick={fetchTour} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!tour) {
    return (
      <>
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 rounded-full border border-slate-200 bg-slate-50 p-6 dark:border-input dark:bg-background">
              <Camera className="h-12 w-12 text-slate-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Get your tour live with AI guidance
            </h3>
            <p className="mb-6 max-w-xl text-center text-slate-600 dark:text-slate-400">
              Start by uploading your existing Matterport tour, then configure AI answers, navigation,
              and lead capture for your visitors.
            </p>
            <Button 
              variant="outline" 
              onClick={openCreateLocationModal}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Matterport Tour
            </Button>
          </CardContent>
        </Card>

        <TourManagementModal
          isOpen={showTourManagement}
          onClose={() => {
            setShowTourManagement(false);
            setCreateLocationMode(false);
          }}
          tour={null}
          onSave={handleSaveTour}
          isLoading={isSaving}
        />
      </>
    );
  }

  return (
    <>
      {/* Normal View */}
      {!isFullscreen && (
        <div className="space-y-6">
          {/* Tour Information */}
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
            <div className="flex min-h-[72px] flex-col justify-center gap-3 px-4 py-3 sm:min-h-[64px] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">{tour.title}</h3>
                  {tour.description && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {tour.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-2">
                  {/* Action Buttons - Redesigned Layout */}
                  <div className="grid w-full grid-cols-2 gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-1.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center dark:border-input dark:bg-background">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowSecondaryTours(true)}
                      className="h-8 rounded-md border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                    >
                      <Camera className="mr-1.5 h-3.5 w-3.5" />
                      {modelsForCurrentLocation.length} model{modelsForCurrentLocation.length === 1 ? "" : "s"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/app/chatbots")}
                      disabled={isAgencyPortal}
                      className="h-8 rounded-md border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                    >
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                      Chatbot
                    </Button>
                    
                    <div className="col-span-2 hidden h-4 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowSavePositionModal(true)}
                      disabled={!mpSdk || !currentSweep}
                      className="h-8 rounded-md border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                    >
                      <MapPin className="mr-1.5 h-3.5 w-3.5" />
                      <span className="sm:hidden">Save Pos</span>
                      <span className="hidden sm:inline">Save Position</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowManagePositionsModal(true)}
                      className="h-8 rounded-md border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      <span className="sm:hidden">Positions</span>
                      <span className="hidden sm:inline">Manage Positions</span>
                    </Button>
                    
                  </div>
                </div>
            </div>
          </Card>

          {/* Tour Viewer */}
          <Card>
            <CardContent className="p-0">
              <div className={cn(
                "relative w-full bg-bg-secondary-light dark:bg-bg-secondary-dark rounded-lg overflow-hidden transition-[height] duration-500 ease-in-out",
                isChatExpanded ? 'h-[520px]' : 'h-[300px]',
                'sm:h-[400px]',
                'lg:h-[600px]'
              )}>
                {!tourLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm sm:text-base text-text-secondary-light dark:text-text-secondary-dark">
                        Loading 3D tour...
                      </p>
                    </div>
                  </div>
                )}
                <div className="w-full h-full rounded-lg relative">
                  <MatterportSDKWrapper
                    key={currentViewingModelId} // Force remount when switching models
                    modelId={currentViewingModelId || tour.matterport_tour_id}
                    onSDKReady={handleSDKReady}
                    onPositionChange={handlePositionChange}
                    onSweepChange={handleSweepChange}
                    className="w-full h-full rounded-lg"
                  />
                  
                  {/* Tour Menu Overlay - Preview */}
                  {tour && (
                    <TourMenuOverlay 
                      key={menuScopeTourId}
                      tourId={menuScopeTourId} 
                      isPreviewMode={true} 
                      isTourReady={tourLoaded}
                      onOpenChat={() => setIsChatExpanded(true)}
                      isChatAvailable={true}
                      currentModelId={currentViewingModelId || tour.matterport_tour_id}
                    />
                  )}
                </div>
                
                {/* Fullscreen Button - Now visible on all devices */}
                {tourLoaded && (
                  <button
                    onClick={toggleFullscreen}
                    className="flex absolute bottom-4 left-4 items-center space-x-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-2 sm:px-3 sm:py-2 rounded-lg border border-white/20 transition-all duration-200 font-medium z-10 min-h-[36px] sm:min-h-[32px]"
                  >
                    <Expand className="w-3 h-3 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">Full Screen</span>
                    <span className="sm:hidden">Full</span>
                  </button>
                )}
                
                {/* AI Chat Widget Overlay */}
                {activeVenueId && tourLoaded && (
                  <TourChatWidget 
                    venueId={activeVenueId}
                    venueName={activeVenueName}
                    tour={tour}
                    scopeTourId={currentLocationTourId}
                    customisation={customisation}
                    isFullscreen={false}
                    isExpanded={isChatExpanded}
                    onToggle={setIsChatExpanded}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <FeedbackFormModal 
            isOpen={showFeedback}
            onClose={() => setShowFeedback(false)}
            tourId={tour.id}
          />

          <TourManagementModal
            isOpen={showTourManagement}
            onClose={() => {
              setShowTourManagement(false);
              setCreateLocationMode(false);
            }}
            tour={createLocationMode ? null : tour}
            onSave={handleSaveTour}
            isLoading={isSaving}
          />

          <SavePositionModal
            isOpen={showSavePositionModal}
            onClose={() => setShowSavePositionModal(false)}
            onSave={handleSavePosition}
            currentPosition={currentPosition}
            currentSweep={currentSweep}
            isLoading={isSavingPosition}
          />

          <ManagePositionsModal
            isOpen={showManagePositionsModal}
            onClose={() => setShowManagePositionsModal(false)}
            tourId={tour.id}
            points={tourPoints}
            onDelete={handleDeletePoint}
            onTest={handleTestPoint}
            onRefresh={fetchTourPoints}
          />

          <SecondaryToursModal
            isOpen={showSecondaryTours}
            onClose={() => setShowSecondaryTours(false)}
            venueId={user?.venue?.id || ''}
            primaryTour={tour}
            allTours={allTours}
            onRefresh={fetchTour}
          />

          <TourLocationsModal
            isOpen={showTourLocations}
            onClose={() => setShowTourLocations(false)}
            primaryTour={tour}
            allTours={allTours}
            activeModelId={currentViewingModelId || tour.matterport_tour_id}
            onSelectModel={handleSwitchModel}
            onAddLocation={openCreateLocationModal}
            spacesUsed={spacesUsed}
            spacesAllowed={spacesAllowed}
          />
        </div>
      )}

      {/* Fullscreen View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black">
          {/* Fullscreen Tour Viewer */}
          <div className="w-full h-full relative">
            <MatterportSDKWrapper
              key={currentViewingModelId} // Force remount when switching models
              modelId={currentViewingModelId || tour.matterport_tour_id}
              onSDKReady={handleSDKReady}
              onPositionChange={handlePositionChange}
              onSweepChange={handleSweepChange}
              className="w-full h-full"
            />

            {/* Tour Menu Overlay - Preview (Fullscreen) */}
            {tour && (
              <TourMenuOverlay 
                key={menuScopeTourId}
                tourId={menuScopeTourId} 
                isPreviewMode={true} 
                isTourReady={tourLoaded}
                onOpenChat={() => setIsChatExpanded(true)}
                isChatAvailable={true}
                currentModelId={currentViewingModelId || tour.matterport_tour_id}
              />
            )}

            {/* Fullscreen Controls */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-white text-sm font-medium">Live</span>
                </div>
                <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  <span className="text-white text-sm font-medium">{tour.title} - Virtual Experience</span>
                </div>
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full p-3 border border-white/20 transition-all duration-200"
              >
                <Minimize className="w-5 h-5" />
              </button>
            </div>

            {/* Fullscreen Chat Widget */}
            {activeVenueId && (
              <TourChatWidget 
                venueId={activeVenueId}
                venueName={activeVenueName}
                tour={tour}
                scopeTourId={currentLocationTourId}
                customisation={customisation}
                isFullscreen={true}
                isExpanded={isChatExpanded}
                onToggle={setIsChatExpanded}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
} 