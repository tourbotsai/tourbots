"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Tour, Venue, ChatbotCustomisation } from '@/lib/types';
import { TourChatWidget } from '@/components/app/tours/tour-chat-widget';
import { MatterportSDKWrapper } from '@/components/matterport/matterport-sdk-wrapper';
import { TourMenuOverlay } from '@/components/embed/tour-menu-overlay';
import { getTourEmbedParentTrackingContext } from '@/lib/tour-embed-parent-context';
import { normaliseMatterportPoseForTracking } from '@/lib/matterport-pose-normalise';

interface TourEmbedClientProps {
  tour: Tour;
  venue: Venue;
  customisation: ChatbotCustomisation | null;
  options: {
    showTitle: boolean;
    showChat: boolean;
    embedId?: string;
    requestedModelId?: string;
  };
  embedToken?: string | null;
}

export function TourEmbedClient({ tour, venue, customisation, options, embedToken }: TourEmbedClientProps) {
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [mpSdk, setMpSdk] = useState<any>(null);
  const [currentPosition, setCurrentPosition] = useState<any>(null);
  const [currentSweep, setCurrentSweep] = useState<any>(null);
  const currentSweepRef = useRef<any>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const [initialHeight, setInitialHeight] = useState<number | null>(null);
  const [tourLoaded, setTourLoaded] = useState(false);

  const [currentModelId, setCurrentModelId] = useState(tour.matterport_tour_id);
  const [currentTourTitle, setCurrentTourTitle] = useState(tour.title);
  const [isModelSwitching, setIsModelSwitching] = useState(false);
  const locationScopeTourId = tour.parent_tour_id || tour.id;

  const poseRef = useRef<any>(null);
  const lastSweepSidForMoveRef = useRef<string | null>(null);
  const moveTrackingGenerationRef = useRef(0);
  /** True after the user focuses the tour iframe; skips autoplay/guided sweep changes before that. */
  const userEngagedWithTourRef = useRef(false);

  // SDK callbacks
  const handleSDKReady = useCallback((sdk: any) => {
    setMpSdk(sdk);
    setTourLoaded(true);
  }, []);

  const handlePositionChange = useCallback((pose: any) => {
    poseRef.current = pose;
    setCurrentPosition(pose);
  }, []);

  const handleSweepChange = useCallback((sweep: any) => {
    currentSweepRef.current = sweep;
    setCurrentSweep(sweep);
  }, []);

  const handleUserEngagedWithTour = useCallback(() => {
    if (userEngagedWithTourRef.current) return;
    userEngagedWithTourRef.current = true;
    const sid = currentSweepRef.current?.sid;
    lastSweepSidForMoveRef.current = typeof sid === "string" ? sid : null;
  }, []);

  // Listen for model switch events from AI chatbot
  useEffect(() => {
    const handleModelSwitch = (event: CustomEvent) => {
      const { modelId, tourName } = event.detail;
      
      // Prevent race conditions
      if (isModelSwitching) {
        return;
      }

      // Prevent switching to same model
      if (modelId === currentModelId) {
        return;
      }
      
      setIsModelSwitching(true);
      
      // Update state to trigger re-render with new model
      setCurrentModelId(modelId);
      setCurrentTourTitle(tourName);
      
      // Update URL without page reload (for back button + sharing)
      const url = new URL(window.location.href);
      url.searchParams.set('model', modelId);
      window.history.pushState({ modelId }, '', url);
      
      // Reset SDK and tour loaded state to force reconnection with new model
      setMpSdk(null);
      setTourLoaded(false);
      
      // Release lock after delay
      setTimeout(() => {
        setIsModelSwitching(false);
      }, 1500);
    };
    
    window.addEventListener('switch_matterport_model', handleModelSwitch as EventListener);
    
    return () => {
      window.removeEventListener('switch_matterport_model', handleModelSwitch as EventListener);
    };
  }, [currentModelId, isModelSwitching]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.modelId) {
        const switchEvent = new CustomEvent('switch_matterport_model', {
          detail: {
            modelId: event.state.modelId,
            tourName: 'Previous location'
          }
        });
        window.dispatchEvent(switchEvent);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Track visual viewport height for Safari mobile toolbar (but NOT keyboard)
  useEffect(() => {
    const updateContainerHeight = () => {
      // Use visualViewport for accurate visible height (Safari 13+)
      const currentHeight = window.visualViewport 
        ? window.visualViewport.height 
        : window.innerHeight;
      
      // Store initial height on first run
      if (initialHeight === null) {
        setInitialHeight(currentHeight);
        setContainerHeight(currentHeight);
        return;
      }
      
      // Calculate the difference from initial height
      const heightDiff = initialHeight - currentHeight;
      
      // Only update if the change is SMALL (< 200px) - this means toolbar, not keyboard
      // Keyboard typically takes 300-400px, toolbar takes 50-100px
      if (Math.abs(heightDiff) < 200) {
        setContainerHeight(currentHeight);
      } else {
        // Large change = keyboard opened, keep initial height to prevent collapse
        setContainerHeight(initialHeight);
      }
    };

    // Initial calculation
    updateContainerHeight();

    // Listen to viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateContainerHeight);
      window.visualViewport.addEventListener('scroll', updateContainerHeight);
    }
    
    window.addEventListener('resize', updateContainerHeight);
    window.addEventListener('orientationchange', () => {
      // Reset initial height on orientation change
      setInitialHeight(null);
      updateContainerHeight();
    });

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateContainerHeight);
        window.visualViewport.removeEventListener('scroll', updateContainerHeight);
      }
      window.removeEventListener('resize', updateContainerHeight);
      window.removeEventListener('orientationchange', updateContainerHeight);
    };
  }, [initialHeight]);

  useEffect(() => {
    moveTrackingGenerationRef.current += 1;
    lastSweepSidForMoveRef.current = null;
    userEngagedWithTourRef.current = false;
  }, [currentModelId]);

  useEffect(() => {
    if (!options.embedId || !currentSweep?.sid) return;

    const ctx = getTourEmbedParentTrackingContext();
    if (!ctx) return;

    const generation = moveTrackingGenerationRef.current;
    const sid = currentSweep.sid as string;

    const timer = window.setTimeout(() => {
      if (generation !== moveTrackingGenerationRef.current) return;

      if (lastSweepSidForMoveRef.current === null) {
        lastSweepSidForMoveRef.current = sid;
        return;
      }
      if (lastSweepSidForMoveRef.current === sid) return;
      lastSweepSidForMoveRef.current = sid;

      if (!userEngagedWithTourRef.current) {
        return;
      }

      const { position, rotation } = normaliseMatterportPoseForTracking(poseRef.current);

      void fetch('/api/public/embed/track-tour-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embedId: options.embedId,
          venueId: venue.id,
          tourId: locationScopeTourId,
          sweepId: sid,
          position,
          rotation,
          domain: ctx.domain,
          pageUrl: ctx.pageUrl,
          matterportModelId: currentModelId,
        }),
      }).catch(() => {
        /* non-blocking analytics */
      });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [currentSweep, options.embedId, venue.id, locationScopeTourId, currentModelId]);

  useEffect(() => {
    if (!options.embedId) return;

    const trackView = async () => {
      try {
        const ctx = getTourEmbedParentTrackingContext();
        if (!ctx) return;

        await fetch('/api/public/embed/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embedId: options.embedId,
            venueId: venue.id,
            type: 'tour',
            domain: ctx.domain,
            pageUrl: ctx.pageUrl,
            modelId: currentModelId,
            tourId: locationScopeTourId,
          }),
        });
      } catch (error) {
        console.error('Error tracking tour view:', error);
      }
    };
    trackView();
  }, [options.embedId, venue.id, currentModelId, locationScopeTourId]);

  return (
    <div className="w-full h-full min-h-screen bg-black relative">
      {options.showTitle && (
        <div className="bg-white p-4 border-b">
          <div className="flex items-center gap-3">
            {venue.logo_url && (
              <img src={venue.logo_url} alt={venue.name} className="w-10 h-10 rounded" />
            )}
            <div>
              <h1 className="text-xl font-bold">{currentTourTitle}</h1>
              <p className="text-sm text-gray-600">{venue.name} - {venue.city}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tour iframe */}
      <div 
        className="relative w-full" 
        style={{ 
          height: containerHeight 
            ? (options.showTitle ? `${containerHeight - 80}px` : `${containerHeight}px`)
            : (options.showTitle ? 'calc(100vh - 80px)' : '100vh') // Fallback
        }}
      >
        {/* Loading overlay during model switch */}
        {isModelSwitching && (
          <div className="absolute inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Loading {currentTourTitle}...</p>
            </div>
          </div>
        )}

        <MatterportSDKWrapper
          key={currentModelId} // KEY PROP: Forces remount when model changes
          modelId={currentModelId} // Dynamic model ID
          onSDKReady={handleSDKReady}
          onPositionChange={handlePositionChange}
          onSweepChange={handleSweepChange}
          onUserEngaged={options.embedId ? handleUserEngagedWithTour : undefined}
          className="w-full h-full"
        />
        
        {/* Use the actual TourChatWidget component if chat is enabled */}
        {options.showChat && (
          <TourChatWidget 
            venueId={venue.id}
            venueName={venue.name}
            tour={{
              ...tour,
              matterport_tour_id: currentModelId,
              title: currentTourTitle
            }}
            scopeTourId={locationScopeTourId}
            customisation={customisation}
            isFullscreen={false}
            isExpanded={isChatExpanded}
            onToggle={setIsChatExpanded}
            embedId={options.embedId}
            embedToken={embedToken || undefined}
          />
        )}

        {/* Tour Menu Overlay - appears on initial load if enabled */}
        <TourMenuOverlay 
          key={locationScopeTourId}
          tourId={locationScopeTourId} 
          isTourReady={tourLoaded}
          onOpenChat={() => setIsChatExpanded(true)}
          isChatAvailable={options.showChat}
          currentModelId={currentModelId}
        />
      </div>
    </div>
  );
}
