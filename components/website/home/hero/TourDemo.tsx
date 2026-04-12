"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, Expand } from "lucide-react";
import { MatterportSDKWrapper } from "@/components/matterport/matterport-sdk-wrapper";
import { TourChatWidget } from "@/components/app/tours/tour-chat-widget";
import { TourMenuOverlay } from "@/components/embed/tour-menu-overlay";
import { ChatbotCustomisation, Tour } from "@/lib/types";
import { useMarketingSiteTourMoveTracking } from "@/hooks/useMarketingSiteTourMoveTracking";
import { useMarketingSiteTourViewTracking } from "@/hooks/useMarketingSiteTourViewTracking";

interface TourDemoProps {
  modelId?: string;
  demoVenueId: string;
  demoTourId?: string;
  demoVenueName: string;
  /** When set with server env allowlist, sweep changes post to embed_tour_moves (marketing homepage only). */
  marketingSiteEmbedId?: string;
  onModelChange?: (modelId: string) => void;
  onFullscreenToggle: () => void;
  onConnectionChange: (connected: boolean) => void;
  isConnected: boolean;
  isChatOpen: boolean;
  onChatToggle: (open: boolean) => void;
}

export function TourDemo({
  modelId,
  demoVenueId,
  demoTourId,
  demoVenueName,
  onModelChange,
  onFullscreenToggle,
  onConnectionChange,
  isConnected,
  isChatOpen,
  onChatToggle,
  marketingSiteEmbedId,
}: TourDemoProps) {
  const [customisation, setCustomisation] = useState<ChatbotCustomisation | null>(null);
  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoadingCustomisation, setIsLoadingCustomisation] = useState(true);
  const [mpSdk, setMpSdk] = useState<any>(null);
  const [currentPosition, setCurrentPosition] = useState<any>(null);
  const [currentSweep, setCurrentSweep] = useState<any>(null);
  const [tourLoaded, setTourLoaded] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(modelId || "");
  const [isModelSwitching, setIsModelSwitching] = useState(false);

  useEffect(() => {
    setCurrentModelId(modelId || "");
  }, [modelId]);

  // Fetch customisation and tour data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingCustomisation(true);

        if (demoTourId) {
          const customResponse = await fetch(
            `/api/app/chatbots/customisation?venueId=${demoVenueId}&chatbotType=tour&tourId=${demoTourId}`
          );
          if (customResponse.ok) {
            const customData = await customResponse.json();
            if (customData) {
              setCustomisation(customData);
            }
          }
        }

        const tourResponse = await fetch(
          `/api/public/venues/${demoVenueId}/tour${demoTourId ? `?tourId=${demoTourId}` : ''}`
        );
        if (tourResponse.ok) {
          const tourData = await tourResponse.json();
          if (tourData) {
            setTour(tourData);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoadingCustomisation(false);
      }
    };

    fetchData();
  }, [demoVenueId, demoTourId]);

  // SDK callbacks - stable refs to prevent re-renders
  const handleSDKReady = useCallback((sdk: any) => {
    setMpSdk(sdk);
    setTourLoaded(true);
    if (onConnectionChange) {
      onConnectionChange(!!sdk);
    }
  }, []); // Empty deps - onConnectionChange called directly

  const menuScopeTourId = tour?.parent_tour_id || tour?.id || demoTourId;

  const { onPoseChange: onMarketingMovePose, onUserEngaged: onMarketingTourUserEngaged } =
    useMarketingSiteTourMoveTracking({
      embedId: marketingSiteEmbedId,
      venueId: demoVenueId,
      scopeTourId: menuScopeTourId,
      currentSweep,
      currentModelId,
      enabled: Boolean(marketingSiteEmbedId && menuScopeTourId),
    });

  useMarketingSiteTourViewTracking({
    embedId: marketingSiteEmbedId,
    venueId: demoVenueId,
    scopeTourId: menuScopeTourId,
    currentModelId,
    enabled: Boolean(
      marketingSiteEmbedId && menuScopeTourId && tourLoaded && currentModelId
    ),
  });

  const handlePositionChange = useCallback(
    (pose: any) => {
      onMarketingMovePose(pose);
      setCurrentPosition(pose);
    },
    [onMarketingMovePose]
  );

  const handleSweepChange = useCallback((sweep: any) => {
    setCurrentSweep(sweep);
  }, []);

  useEffect(() => {
    const handleModelSwitch = (event: CustomEvent) => {
      const { modelId: nextModelId } = event.detail || {};
      if (!nextModelId || isModelSwitching || nextModelId === currentModelId) {
        return;
      }

      setIsModelSwitching(true);
      setCurrentModelId(nextModelId);
      setTourLoaded(false);
      onModelChange?.(nextModelId);

      setTimeout(() => {
        setIsModelSwitching(false);
      }, 1500);
    };

    window.addEventListener("switch_matterport_model", handleModelSwitch as EventListener);
    return () => {
      window.removeEventListener("switch_matterport_model", handleModelSwitch as EventListener);
    };
  }, [currentModelId, isModelSwitching, onModelChange]);

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="relative">
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-900/70 shadow-2xl shadow-black/30">
          {isModelSwitching && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
              <div className="text-center text-white">
                <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <p className="text-sm font-medium">Loading tour...</p>
              </div>
            </div>
          )}
          <div className="relative">
            {/* Real Matterport Tour */}
            {currentModelId ? (
              <div className="relative h-[440px] sm:h-[480px] lg:h-[520px]">
                <MatterportSDKWrapper 
                  key={currentModelId}
                  modelId={currentModelId}
                  onSDKReady={handleSDKReady}
                  onPositionChange={handlePositionChange}
                  onSweepChange={handleSweepChange}
                  onUserEngaged={
                    marketingSiteEmbedId && menuScopeTourId
                      ? onMarketingTourUserEngaged
                      : undefined
                  }
                  className="w-full h-full rounded-lg"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative h-[440px] bg-slate-900/70 sm:h-[480px] lg:h-[520px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-8">
                    <div className="relative mx-auto">
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-slate-800/70 shadow-xl">
                        <Eye className="w-12 h-12 text-brand-primary" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-xl font-semibold text-white">
                        360° Immersive Experience
                      </p>
                      <p className="mx-auto max-w-md text-base text-slate-300">
                        High-resolution virtual tour with AI-powered assistance
                      </p>
                      <p className="inline-block rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-300">
                        Configure NEXT_PUBLIC_TEST_MODEL_ID in .env.local
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {menuScopeTourId && (
            <TourMenuOverlay
              key={menuScopeTourId}
              tourId={menuScopeTourId}
              isTourReady={tourLoaded}
              onOpenChat={() => onChatToggle(true)}
              isChatAvailable={true}
              currentModelId={currentModelId}
            />
          )}

          {/* Full-Featured Tour Chat Widget with Real Customisation */}
          {!isLoadingCustomisation && tour && (
            <TourChatWidget 
              venueId={demoVenueId}
              venueName={demoVenueName}
              tour={tour}
              customisation={customisation}
              isExpanded={isChatOpen}
              onToggle={onChatToggle}
              isFullscreen={false}
            />
          )}

          <button
            onClick={onFullscreenToggle}
            className="absolute bottom-4 left-4 z-30 flex h-10 items-center space-x-2 rounded-xl border border-white/20 bg-black/60 px-4 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-black/80"
          >
            <Expand className="w-4 h-4" />
            <span>Fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
} 