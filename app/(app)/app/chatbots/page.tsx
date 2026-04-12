"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AppTitle } from "@/components/shared/app-title";
import { TourChatbotManagement } from "@/components/app/chatbots/tour-chatbot-management";
import { useUser } from "@/hooks/useUser";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { Tour } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const dynamic = "force-dynamic";

function ChatbotsContent() {
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

  useEffect(() => {
    const loadTours = async () => {
      if (!user?.venue?.id) {
        setTours([]);
        setSelectedTourId(null);
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
        const locationRows = rows.filter((tour) => tour.tour_type === "primary" || !tour.tour_type);
        setTours(locationRows);
        setSelectedTourId((prev) => prev || locationRows[0]?.id || null);
      } catch (error) {
        console.error("Failed to load tours for chatbot selector", error);
      }
    };

    loadTours();
  }, [user?.venue?.id, getAuthHeaders]);

  const handleBack = () => {
    // No-op — kept for management component API compatibility
  };

  const selectedTourTitle = useMemo(
    () => tours.find((tour) => tour.id === selectedTourId)?.title || "Select tour",
    [selectedTourId, tours]
  );

  useEffect(() => {
    if (tours.length === 0) {
      setSelectedTourId(null);
      return;
    }

    if (!selectedTourId || !tours.some((tour) => tour.id === selectedTourId)) {
      setSelectedTourId(tours[0].id);
    }
  }, [tours, selectedTourId]);

  return (
    <div className="space-y-6 dark:rounded-2xl dark:border dark:border-slate-800/70 dark:bg-[#12161f]/88 dark:p-4 dark:[--background:220_18%_8%] dark:[--card:220_15%_11%] dark:[--popover:220_15%_11%] dark:[--muted:220_10%_18%] dark:[--muted-foreground:220_8%_70%] dark:[--border:220_9%_24%] dark:[--input:220_9%_24%] dark:[--ring:220_10%_70%]">
      <AppTitle
        title={
          <>
            <span className="sm:hidden">Chatbot</span>
            <span className="hidden sm:inline">Virtual Tour AI Chatbot</span>
          </>
        }
        description="Configure and manage your tour-specific AI assistant"
        action={
          <div className="w-[200px] sm:min-w-[260px]">
            <Select
              value={selectedTourId || undefined}
              onValueChange={(value) => setSelectedTourId(value)}
              disabled={tours.length === 0}
            >
              <SelectTrigger className="dark:border-input dark:bg-background dark:text-slate-100">
                <SelectValue placeholder={selectedTourTitle} />
              </SelectTrigger>
              <SelectContent className="dark:border-input dark:bg-background dark:text-slate-100">
                {tours.map((tour) => (
                  <SelectItem key={tour.id} value={tour.id}>
                    {tour.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <TourChatbotManagement onBack={handleBack} selectedTourId={selectedTourId} />
    </div>
  );
}

export default function ChatbotsPage() {
  return (
    <AuthGuard requireAuth={true} requireVenue={true}>
      <Suspense
        fallback={
          <div className="p-8 text-sm text-muted-foreground">Loading chatbot…</div>
        }
      >
        <ChatbotsContent />
      </Suspense>
    </AuthGuard>
  );
}
