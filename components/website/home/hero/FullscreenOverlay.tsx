"use client";

import { useEffect, useState, useCallback } from "react";
import { Eye, Minimize } from "lucide-react";
import { MatterportSDKWrapper } from "@/components/matterport/matterport-sdk-wrapper";
import { TourChatWidget } from "@/components/app/tours/tour-chat-widget";
import { TourMenuOverlay } from "@/components/embed/tour-menu-overlay";
import { ChatbotCustomisation, Tour } from "@/lib/types";
import { useMarketingSiteTourMoveTracking } from "@/hooks/useMarketingSiteTourMoveTracking";
import { useMarketingSiteTourViewTracking } from "@/hooks/useMarketingSiteTourViewTracking";

interface FullscreenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  modelId?: string;
  demoVenueId: string;
  demoTourId?: string;
  demoVenueName: string;
  marketingSiteEmbedId?: string;
  onModelChange?: (modelId: string) => void;
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  isChatOpen: boolean;
  onChatToggle: (open: boolean) => void;
}

export function FullscreenOverlay({
  isOpen,
  onClose,
  modelId,
  demoVenueId,
  demoTourId,
  demoVenueName,
  onModelChange,
  isConnected,
  onConnectionChange,
  isChatOpen,
  onChatToggle,
  marketingSiteEmbedId,
}: FullscreenOverlayProps) {
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

  const menuScopeTourId = tour?.parent_tour_id || tour?.id || demoTourId;

  const { onPoseChange: onMarketingMovePose, onUserEngaged: onMarketingTourUserEngaged } =
    useMarketingSiteTourMoveTracking({
      embedId: marketingSiteEmbedId,
      venueId: demoVenueId,
      scopeTourId: menuScopeTourId,
      currentSweep,
      currentModelId,
      enabled: Boolean(isOpen && marketingSiteEmbedId && menuScopeTourId),
    });

  useMarketingSiteTourViewTracking({
    embedId: marketingSiteEmbedId,
    venueId: demoVenueId,
    scopeTourId: menuScopeTourId,
    currentModelId,
    enabled: Boolean(
      isOpen && marketingSiteEmbedId && menuScopeTourId && tourLoaded && currentModelId
    ),
  });

  // Handle keyboard shortcuts in custom fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onChatToggle(true);
      }
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        if (isChatOpen) {
          onChatToggle(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isChatOpen, onChatToggle, onClose]);

  // Prevent body scroll when in custom fullscreen
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // SDK callbacks - stable refs to prevent re-renders
  const handleSDKReady = useCallback((sdk: any) => {
    setMpSdk(sdk);
    setTourLoaded(true);
    if (onConnectionChange) {
      onConnectionChange(!!sdk);
    }
  }, []); // Empty deps - onConnectionChange called directly

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
    if (!isOpen) {
      return;
    }

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
  }, [currentModelId, isModelSwitching, isOpen, onModelChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Fullscreen Tour Viewer */}
      <div className="w-full h-full relative">
        {isModelSwitching && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
            <div className="text-center text-white">
              <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p className="text-base font-medium">Loading tour...</p>
            </div>
          </div>
        )}

        {currentModelId ? (
          <MatterportSDKWrapper 
            key={currentModelId}
            modelId={currentModelId}
            onSDKReady={handleSDKReady}
            onPositionChange={handlePositionChange}
            onSweepChange={handleSweepChange}
            onUserEngaged={
              isOpen && marketingSiteEmbedId && menuScopeTourId
                ? onMarketingTourUserEngaged
                : undefined
            }
            className="w-full h-full"
          />
        ) : (
          /* Fullscreen Fallback */
          <div className="relative bg-gradient-to-br from-indigo-500/5 via-cyan-500/5 to-sky-500/10 backdrop-blur-sm w-full h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="relative mx-auto">
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-indigo-500/20 shadow-xl">
                    <Eye className="w-16 h-16 text-brand-primary" />
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-3xl font-bold text-white">
                    360° Immersive Experience
                  </p>
                  <p className="text-lg text-gray-300 max-w-md mx-auto">
                    High-resolution virtual tour with AI-powered assistance
                  </p>
                  <p className="text-sm text-gray-400 bg-indigo-500/10 rounded-full px-4 py-2 inline-block">
                    Configure NEXT_PUBLIC_TEST_MODEL_ID in .env.local
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Fullscreen Controls */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-end z-10">
          <button
            onClick={onClose}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full p-3 border border-white/20 transition-all duration-200"
          >
            <Minimize className="w-5 h-5" />
          </button>
        </div>

        {/* Fullscreen Chat Widget */}
        {!isLoadingCustomisation && tour && (
          <TourChatWidget 
            venueId={demoVenueId}
            venueName={demoVenueName}
            tour={tour}
            customisation={customisation}
            isExpanded={isChatOpen}
            onToggle={onChatToggle}
            isFullscreen={true}
          />
        )}

        {/* Keyboard Shortcuts */}
        <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
          <div className="text-white text-xs space-y-1">
            <div><kbd className="bg-white/20 px-1 rounded">Esc</kbd> Exit fullscreen</div>
            <div><kbd className="bg-white/20 px-1 rounded">Ctrl+C</kbd> Open chat</div>
          </div>
        </div>
      </div>
    </div>
  );
} 