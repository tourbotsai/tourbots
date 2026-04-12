"use client";

import { useState } from "react";
import { TourDemo, FullscreenOverlay } from "./hero/index";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Rocket } from "lucide-react";
import { useTourFullscreen } from "@/lib/contexts/TourFullscreenContext";

// Demo configuration
const DEMO_VENUE_ID = "b1afe3a3-303f-463c-bbd3-6673be4833b6";
const DEMO_TOUR_ID = "d0ceaccc-e3f4-427f-b798-19d4c5f1d85e";
const DEMO_VENUE_NAME = "Tour Bots";

/** When set with MARKETING_SITE_MOVE_TRACKING_* server env, Hero tour moves are stored like customer embeds. */
const MARKETING_SITE_EMBED_ID = process.env.NEXT_PUBLIC_MARKETING_SITE_EMBED_ID;

export function Hero() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { isFullscreen: isCustomFullscreen, setIsFullscreen: setIsCustomFullscreen } = useTourFullscreen();
  const defaultModelId = process.env.NEXT_PUBLIC_TEST_MODEL_ID || process.env.NEXT_PUBLIC_MATTERPORT_MODEL_ID;
  const [activeModelId, setActiveModelId] = useState(defaultModelId);

  const toggleCustomFullscreen = () => {
    setIsCustomFullscreen(!isCustomFullscreen);
    setIsChatOpen(false);
  };

  return (
    <>
      <section className="container flex flex-col items-center pb-8 pt-8 md:pt-12 md:pb-10 lg:pt-16 lg:pb-12">
        <div className="mx-auto mt-0 flex max-w-4xl flex-col items-center space-y-5 text-center">
          <h1 className="text-balance font-semibold leading-tight tracking-tight text-white text-4xl sm:text-5xl lg:text-6xl lg:whitespace-nowrap">
            Your virtual tour needs
            {" "}
            a
            <span className="text-brand-primary">i</span>
            {" "}
            guide
          </h1>
          <p className="hidden max-w-4xl text-base leading-relaxed text-slate-300 sm:block sm:text-lg">
            TourBots adds an AI assistant to virtual tours, answering visitor questions instantly,
            guiding them through your space, and helping them discover what they would otherwise miss.
          </p>
          <p className="max-w-4xl text-base leading-relaxed text-slate-300 sm:hidden">
            TourBots adds an AI assistant to virtual tours, answering visitor questions, guiding them through your space, and helping them discover hidden areas.
          </p>
        </div>

        <div className="mx-auto mt-12 w-full max-w-6xl">
          <div className="flex justify-center relative">
            <TourDemo 
              modelId={activeModelId}
              demoVenueId={DEMO_VENUE_ID}
              demoTourId={DEMO_TOUR_ID}
              demoVenueName={DEMO_VENUE_NAME}
              marketingSiteEmbedId={MARKETING_SITE_EMBED_ID}
              onModelChange={setActiveModelId}
              onFullscreenToggle={toggleCustomFullscreen}
              onConnectionChange={setIsConnected}
              isConnected={isConnected}
              isChatOpen={isChatOpen && !isCustomFullscreen}
              onChatToggle={setIsChatOpen}
            />
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center text-center">
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-row sm:justify-center sm:gap-4">
            <Link href="/login">
              <Button 
                size="lg" 
                className="group h-11 w-full border border-brand-primary/30 bg-white px-4 text-slate-900 transition-colors duration-200 hover:border-brand-primary/45 hover:bg-slate-200 sm:min-w-[190px] sm:px-8"
              >
                <Rocket className="mr-1 h-4 w-4 transform-gpu transition-transform duration-200 ease-out motion-reduce:transform-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:mr-2" />
                <span className="hidden sm:inline">Start Free</span>
                <span className="inline sm:hidden">Start Free</span>
              </Button>
            </Link>
            <Link href="/demo">
              <Button 
                variant="outline" 
                size="lg"
                className="group h-11 w-full border-white/40 bg-white/[0.03] px-4 text-white transition-colors duration-200 hover:bg-white/10 hover:text-white sm:min-w-[190px] sm:px-8"
              >
                <Calendar className="mr-1 h-4 w-4 transform-gpu transition-transform duration-200 ease-out motion-reduce:transform-none group-hover:-translate-y-0.5 sm:mr-2" />
                <span className="hidden sm:inline">Book a Demo</span>
                <span className="inline sm:hidden">Book Demo</span>
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* Custom Fullscreen Overlay */}
      <FullscreenOverlay 
        isOpen={isCustomFullscreen}
        onClose={toggleCustomFullscreen}
        modelId={activeModelId}
        demoVenueId={DEMO_VENUE_ID}
        demoTourId={DEMO_TOUR_ID}
        demoVenueName={DEMO_VENUE_NAME}
        marketingSiteEmbedId={MARKETING_SITE_EMBED_ID}
        onModelChange={setActiveModelId}
        isConnected={isConnected}
        onConnectionChange={setIsConnected}
        isChatOpen={isChatOpen}
        onChatToggle={setIsChatOpen}
      />
    </>
  );
}