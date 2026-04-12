"use client";

import { useEffect, useRef, useState } from 'react';

interface MatterportSDKWrapperProps {
  modelId: string;
  onSDKReady: (sdk: any) => void;
  onPositionChange: (position: any) => void;
  onSweepChange: (sweep: any) => void;
  className?: string;
  /**
   * Called once when the user focuses the tour (click/tap/tab into the iframe).
   * Used so analytics can ignore autoplay / guided sweep changes until engagement.
   */
  onUserEngaged?: () => void;
}

// Extend Window interface to include MP_SDK
declare global {
  interface Window {
    MP_SDK: any;
  }
}

export function MatterportSDKWrapper({
  modelId,
  onSDKReady,
  onPositionChange,
  onSweepChange,
  className = "",
  onUserEngaged,
}: MatterportSDKWrapperProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sdk, setSdk] = useState<any>(null);
  const sdkRef = useRef<any>(null);
  const sdkConnectInFlightRef = useRef(false);
  const sdkConnectRetryCountRef = useRef(0);
  const pendingNavigationRef = useRef<{
    sweep_id?: string;
    position?: any;
    rotation?: any;
    area_name?: string;
  } | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const sdkKey = process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY || process.env.NEXT_PUBLIC_MATTERPORT_KEY;

  const executeNavigation = async (currentSdk: any, detail: {
    sweep_id?: string;
    position?: any;
    rotation?: any;
    area_name?: string;
  }) => {
    const { sweep_id, rotation, area_name } = detail;

    if (!sweep_id) {
      console.warn('⚠️ No sweep_id provided in navigation event');
      return;
    }

    const transitionInstant = currentSdk?.Sweep?.Transition?.INSTANT;
    const moveOptions = transitionInstant
      ? {
          transition: transitionInstant,
          rotation: rotation || { x: 0, y: 0 },
        }
      : undefined;

    try {
      await currentSdk.Sweep.moveTo(sweep_id, moveOptions);
    } catch (err: any) {
      console.error('❌ Move with options failed, retrying bare sweep move:', err);
      try {
        await currentSdk.Sweep.moveTo(sweep_id);
      } catch (fallbackErr) {
        console.error('❌ Fallback move failed for sweep:', sweep_id, 'Error:', fallbackErr);
      }
    }
  };

  useEffect(() => {
    const loadSDK = async () => {
      try {
        // Check if SDK is already loaded
        if (window.MP_SDK) {
          setSdk(window.MP_SDK);
          setIsSDKReady(true);
          return;
        }

        // Load Matterport SDK
        const script = document.createElement('script');
        script.src = 'https://static.matterport.com/showcase-sdk/2.0.1-0-g64e7e88/sdk.js';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
          if (window.MP_SDK) {
            setSdk(window.MP_SDK);
            setIsSDKReady(true);
          }
        };

        script.onerror = () => {
          console.error('SDK script failed to load');
          setIsSDKReady(true);
        };
      } catch (error) {
        console.error('SDK load error:', error);
        setIsSDKReady(true);
      }
    };

    loadSDK();
  }, []);

  // Store callbacks in refs to avoid dependency issues
  const onSDKReadyRef = useRef(onSDKReady);
  const onPositionChangeRef = useRef(onPositionChange);
  const onSweepChangeRef = useRef(onSweepChange);

  const onUserEngagedRef = useRef(onUserEngaged);
  useEffect(() => {
    onUserEngagedRef.current = onUserEngaged;
  }, [onUserEngaged]);

  useEffect(() => {
    onSDKReadyRef.current = onSDKReady;
    onPositionChangeRef.current = onPositionChange;
    onSweepChangeRef.current = onSweepChange;
  }, [onSDKReady, onPositionChange, onSweepChange]);

  /** Fire once when the user focuses the embed (click/tap/tab); cross-origin blocks pointer events inside the iframe. */
  useEffect(() => {
    if (!iframeLoaded || !onUserEngaged) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    const firedRef = { current: false };
    const mark = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      onUserEngagedRef.current?.();
    };

    iframe.addEventListener("focus", mark);
    const onWindowBlur = () => {
      // Focus often moves to the iframe when the user clicks inside the tour.
      if (document.activeElement === iframe) {
        mark();
      }
    };
    window.addEventListener("blur", onWindowBlur);

    return () => {
      iframe.removeEventListener("focus", mark);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [iframeLoaded, onUserEngaged]);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isSDKReady && iframeRef.current && modelId && iframeLoaded && !sdkRef.current && !sdkConnectInFlightRef.current) {
      const connectSDK = async () => {
        sdkConnectInFlightRef.current = true;
        try {
          if (!window.MP_SDK) {
            throw new Error('MP_SDK not available on window');
          }

          if (!sdkKey) {
            throw new Error('Matterport SDK key missing (NEXT_PUBLIC_MATTERPORT_SDK_KEY or NEXT_PUBLIC_MATTERPORT_KEY)');
          }
          
          const mpSdk = await window.MP_SDK.connect(iframeRef.current, sdkKey, '2.0');
          sdkConnectRetryCountRef.current = 0;

          mpSdk.Camera.pose.subscribe((pose: any) => {
            onPositionChangeRef.current(pose);
          });

          mpSdk.Sweep.current.subscribe((sweep: any) => {
            onSweepChangeRef.current(sweep);
          });

          setSdk(mpSdk);
          sdkRef.current = mpSdk;
          onSDKReadyRef.current(mpSdk);

          if (pendingNavigationRef.current) {
            const queuedNavigation = pendingNavigationRef.current;
            pendingNavigationRef.current = null;
            await executeNavigation(mpSdk, queuedNavigation);
          }
        } catch (error) {
          console.error('❌ SDK connection failed:', error);
          const maxRetries = 4;
          const nextRetry = sdkConnectRetryCountRef.current + 1;
          if (nextRetry <= maxRetries && !sdkRef.current) {
            sdkConnectRetryCountRef.current = nextRetry;
            const retryDelayMs = 1000 * nextRetry;
            console.warn(`🔁 Retrying SDK connect in ${retryDelayMs}ms (attempt ${nextRetry}/${maxRetries})`);
            setTimeout(() => {
              if (!sdkRef.current && iframeRef.current) {
                void connectSDK();
              }
            }, retryDelayMs);
          } else {
            // Fail silently after retries - tour still renders without SDK controls
            onSDKReadyRef.current(null);
          }
        } finally {
          sdkConnectInFlightRef.current = false;
        }
      };

      const delay = isMobile ? 3000 : 2000;
      setTimeout(connectSDK, delay);
    }
  }, [isSDKReady, modelId, iframeLoaded, sdkKey]);

  // Fallback: if iframe loads but SDK doesn't connect within 5 seconds, still call onSDKReady
  useEffect(() => {
    if (iframeLoaded && !sdkRef.current) {
      const fallbackTimeout = setTimeout(() => {
        if (!sdkRef.current) {
          onSDKReadyRef.current(null);
        }
      }, 5000);

      return () => clearTimeout(fallbackTimeout);
    }
  }, [iframeLoaded]);

  // Listen for navigation commands from chat widget via custom event
  useEffect(() => {
    const handleNavigationEvent = (event: CustomEvent) => {
      const currentSdk = sdkRef.current;
      
      if (!currentSdk) {
        pendingNavigationRef.current = event.detail || null;
        return;
      }

      void executeNavigation(currentSdk, event.detail || {});
    };

    window.addEventListener('matterport_navigate', handleNavigationEvent as EventListener);
    return () => {
      window.removeEventListener('matterport_navigate', handleNavigationEvent as EventListener);
    };
  }, [isSDKReady, iframeLoaded]);

  // Ensure iframe loaded state is set even if onLoad doesn't fire
  useEffect(() => {
    if (iframeRef.current && !iframeLoaded) {
      const checkIframeLoaded = () => {
        if (iframeRef.current?.contentWindow) {
          setIframeLoaded(true);
        }
      };
      
      // Check immediately and after delays
      const timer1 = setTimeout(checkIframeLoaded, 500);
      const timer2 = setTimeout(checkIframeLoaded, 1000);
      const timer3 = setTimeout(checkIframeLoaded, 1500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [iframeLoaded]);

  return (
    <iframe
      ref={iframeRef}
      src={`https://my.matterport.com/show/?m=${modelId}&play=1&qs=1&sr=0.5,0.5&gt=0&hr=0&ts=0&help=0&hl=0&guides=0&mls=0&sdk=1&nozoom=1&vrcoll=0&pin=1&lang=en`}
      className={className}
      frameBorder="0"
      allowFullScreen
      allow="xr-spatial-tracking; gyroscope; accelerometer; autoplay"
      sandbox="allow-same-origin allow-scripts allow-forms allow-presentation"
      referrerPolicy="no-referrer"
      onLoad={() => setIframeLoaded(true)}
    />
  );
}
