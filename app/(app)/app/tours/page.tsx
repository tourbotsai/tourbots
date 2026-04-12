"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { AppTitle } from "@/components/shared/app-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TourViewer } from "@/components/app/tours/tour-viewer";
import { TourShare } from "@/components/app/tours/tour-share";
import { TourAnalytics } from "@/components/app/tours/tour-analytics";
import { TourMenuBuilder } from "@/components/app/tours/menu/tour-menu-builder";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { Tour } from "@/lib/types";

export const dynamic = 'force-dynamic';

function ToursContent() {
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("viewer");
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [openTourLocationsManagerSignal, setOpenTourLocationsManagerSignal] = useState(0);
  const [switchTourSignal, setSwitchTourSignal] = useState(0);
  const mobileTabsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "viewer" || tab === "menu" || tab === "share" || tab === "analytics") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      mobileTabsScrollRef.current?.scrollTo({ left: 0, behavior: "auto" });
    }
  }, []);

  useEffect(() => {
    const loadTours = async () => {
      if (!user?.venue?.id) {
        setTours([]);
        return;
      }

      try {
        const response = await fetch(`/api/app/tours/venue/${encodeURIComponent(user.venue.id)}/all`, {
          headers: await getAuthHeaders(),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "Failed to load tours");
        }
        const rows = (await response.json()) as Tour[];
        setTours(rows);
      } catch (error) {
        console.error("Failed to load tours for tours selector", error);
      }
    };

    loadTours();
  }, [user?.venue?.id, getAuthHeaders]);

  const handleOpenTourLocationsManager = () => {
    setActiveTab("viewer");
    setOpenTourLocationsManagerSignal((prev) => prev + 1);
  };

  const selectedTourTitle = useMemo(
    () => tours.find((tour) => tour.id === selectedTourId)?.title || "Select tour location",
    [selectedTourId, tours]
  );
  const locationTours = useMemo(
    () => tours.filter((tour) => tour.tour_type === "primary" || !tour.tour_type),
    [tours]
  );

  useEffect(() => {
    if (locationTours.length === 0) {
      setSelectedTourId(null);
      return;
    }

    const isSelectedStillValid = selectedTourId
      ? locationTours.some((tour) => tour.id === selectedTourId)
      : false;

    if (!isSelectedStillValid) {
      setSelectedTourId(locationTours[0].id);
    }
  }, [locationTours, selectedTourId]);

  const handleHeaderSelect = (value: string) => {
    if (value === "__manage_locations__") {
      handleOpenTourLocationsManager();
      return;
    }
    setActiveTab("viewer");
    setSelectedTourId(value);
    setSwitchTourSignal((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 dark:rounded-2xl dark:border dark:border-slate-800/70 dark:bg-[#12161f]/88 dark:p-4 dark:[--background:220_18%_8%] dark:[--card:220_15%_11%] dark:[--popover:220_15%_11%] dark:[--muted:220_10%_18%] dark:[--muted-foreground:220_8%_70%] dark:[--border:220_9%_24%] dark:[--input:220_9%_24%] dark:[--ring:220_10%_70%]">
      <AppTitle 
        title={
          <>
            <span className="sm:hidden">Tours</span>
            <span className="hidden sm:inline">Virtual Tours</span>
          </>
        }
        description="Connect your Matterport tours, configure tour navigation points, create a tour menu and publish with a simple embed code."
        action={
          <div className="w-[200px] sm:min-w-[260px]">
            <Select
              value={selectedTourId || undefined}
              onValueChange={handleHeaderSelect}
              disabled={locationTours.length === 0}
            >
              <SelectTrigger className="border-slate-200 bg-white text-slate-700 dark:border-input dark:bg-background dark:text-slate-100">
                <SelectValue placeholder={selectedTourTitle} />
              </SelectTrigger>
              <SelectContent>
                {locationTours.map((tour) => (
                  <SelectItem key={tour.id} value={tour.id}>
                    {tour.title}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value="__manage_locations__">Manage Tour Locations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div ref={mobileTabsScrollRef} className="overflow-x-auto md:overflow-visible">
          <TabsList className="flex h-10 w-max min-w-full items-stretch gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-input dark:bg-background md:grid md:w-full md:grid-cols-4">
            <TabsTrigger
              value="viewer"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Tour Setup
            </TabsTrigger>
            <TabsTrigger
              value="menu"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Tour Menu
            </TabsTrigger>
            <TabsTrigger
              value="share"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Share & Embed
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
            >
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="viewer" className="mt-6">
          <TourViewer
            onTourChange={setSelectedTourId}
            onToursUpdated={setTours}
            selectedTourIdOverride={selectedTourId}
            switchTourSignal={switchTourSignal}
            openTourLocationsManagerSignal={openTourLocationsManagerSignal}
          />
        </TabsContent>

        <TabsContent value="menu" className="mt-6">
          <TourMenuBuilder tourId={selectedTourId || undefined} />
        </TabsContent>

        <TabsContent value="share" className="mt-6">
          <TourShare
            selectedTourId={selectedTourId}
            onSwitchToViewer={() => setActiveTab("viewer")}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <TourAnalytics
            selectedTourId={selectedTourId}
            onSwitchToViewer={() => setActiveTab("viewer")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ToursPage() {
  return (
    <AuthGuard requireAuth={true} requireVenue={true}>
      <Suspense
        fallback={
          <div className="p-8 text-sm text-muted-foreground">Loading tours…</div>
        }
      >
        <ToursContent />
      </Suspense>
    </AuthGuard>
  );
} 