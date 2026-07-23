"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AppTitle } from "@/components/shared/app-title";
import { TourChatbotManagement } from "@/components/app/chatbots/tour-chatbot-management";
import { NoTourEmptyState } from "@/components/app/chatbots/no-tour-empty-state";
import { CreateChatbotDialog } from "@/components/app/chatbots/create-chatbot-dialog";
import { useUser } from "@/hooks/useUser";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { useToast } from "@/components/ui/use-toast";
import { Tour } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const CREATE_NEW_VALUE = "__create_new__";

type ChatbotSlot =
  | { kind: "tour"; id: string; title: string }
  | { kind: "website"; id: string; title: string };

function slotValue(slot: ChatbotSlot): string {
  return `${slot.kind}:${slot.id}`;
}

function ChatbotsContent() {
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();
  const { toast } = useToast();
  const [tours, setTours] = useState<Tour[]>([]);
  const [websiteConfigs, setWebsiteConfigs] = useState<{ id: string; chatbot_name: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ChatbotSlot | null>(null);
  const [isCreatingWebsiteChatbot, setIsCreatingWebsiteChatbot] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const loadedVenueRef = useRef<string | null>(null);

  const loadSlots = async (venueId: string) => {
    try {
      const [toursResponse, websiteConfigsResponse] = await Promise.all([
        fetch(`/api/app/tours/venue/${encodeURIComponent(venueId)}/all`, {
          headers: await getAuthHeaders(),
        }),
        fetch(`/api/app/chatbots/config?venueId=${encodeURIComponent(venueId)}&chatbotType=website`, {
          headers: await getAuthHeaders(),
        }),
      ]);

      if (!toursResponse.ok) {
        const payload = await toursResponse.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to load tours");
      }
      const rows = (await toursResponse.json()) as Tour[];
      const locationRows = rows.filter((tour) => tour.tour_type === "primary" || !tour.tour_type);
      setTours(locationRows);

      if (websiteConfigsResponse.ok) {
        const configs = await websiteConfigsResponse.json();
        setWebsiteConfigs(Array.isArray(configs) ? configs : []);
      } else {
        setWebsiteConfigs([]);
      }

      return locationRows;
    } catch (error) {
      console.error("Failed to load chatbot slots", error);
      return [];
    }
  };

  useEffect(() => {
    const venueId = user?.venue?.id || null;

    // When the venue changes (e.g. switching account), clear any slot selected
    // for the previous venue so child fetches never query a foreign tour/config.
    if (loadedVenueRef.current !== venueId) {
      loadedVenueRef.current = venueId;
      setTours([]);
      setWebsiteConfigs([]);
      setSelectedSlot(null);
    }

    if (!venueId) {
      setTours([]);
      setWebsiteConfigs([]);
      setSelectedSlot(null);
      return;
    }

    loadSlots(venueId);
  }, [user?.venue?.id, getAuthHeaders]);

  const handleBack = () => {
    // No-op — kept for management component API compatibility
  };

  const slots: ChatbotSlot[] = useMemo(
    () => [
      ...tours.map((tour) => ({ kind: "tour" as const, id: tour.id, title: tour.title })),
      ...websiteConfigs.map((config) => ({
        kind: "website" as const,
        id: config.id,
        title: config.chatbot_name || "Website Assistant",
      })),
    ],
    [tours, websiteConfigs]
  );

  const selectedSlotTitle = useMemo(
    () => slots.find((slot) => slot.kind === selectedSlot?.kind && slot.id === selectedSlot?.id)?.title || "Select chatbot",
    [selectedSlot, slots]
  );

  useEffect(() => {
    if (slots.length === 0) {
      setSelectedSlot(null);
      return;
    }

    if (!selectedSlot || !slots.some((slot) => slot.kind === selectedSlot.kind && slot.id === selectedSlot.id)) {
      setSelectedSlot(slots[0]);
    }
  }, [slots, selectedSlot]);

  const handleCreateWebsiteChatbot = async () => {
    if (!user?.venue?.id) return;
    setIsCreatingWebsiteChatbot(true);
    try {
      const response = await fetch("/api/app/chatbots/config", {
        method: "POST",
        headers: await getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          venueId: user.venue.id,
          chatbotType: "website",
          config: {},
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to create website chatbot");
      }

      await loadSlots(user.venue.id);
      setSelectedSlot({ kind: "website", id: data.id, title: data.chatbot_name || "Website Assistant" });
      toast({
        title: "Website chatbot created",
        description: "Your new website chatbot is ready to configure.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to create website chatbot",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWebsiteChatbot(false);
    }
  };

  return (
    <div className="space-y-6 dark:rounded-2xl dark:border dark:border-slate-800/70 dark:bg-[#12161f]/88 dark:p-4 dark:[--background:220_18%_8%] dark:[--card:220_15%_11%] dark:[--popover:220_15%_11%] dark:[--muted:220_10%_18%] dark:[--muted-foreground:220_8%_70%] dark:[--border:220_9%_24%] dark:[--input:220_9%_24%] dark:[--ring:220_10%_70%]">
      <AppTitle
        title={
          <>
            <span className="sm:hidden">Chatbot</span>
            <span className="hidden sm:inline">AI Chatbot</span>
          </>
        }
        description="Configure and manage your tour and website AI assistants"
        action={
          <div className="flex items-center gap-2">
            <span className="hidden whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300 sm:inline">
              Chatbot
            </span>
            <div className="w-[200px] sm:min-w-[260px]">
              <Select
                value={selectedSlot ? slotValue(selectedSlot) : undefined}
                onValueChange={(value) => {
                  if (value === CREATE_NEW_VALUE) {
                    setIsCreateDialogOpen(true);
                    return;
                  }
                  const [kind, id] = value.split(":");
                  const slot = slots.find((s) => s.kind === kind && s.id === id);
                  if (slot) setSelectedSlot(slot);
                }}
                disabled={slots.length === 0 || isCreatingWebsiteChatbot}
              >
                <SelectTrigger className="dark:border-input dark:bg-background dark:text-slate-100">
                  <SelectValue placeholder={selectedSlotTitle} />
                </SelectTrigger>
                <SelectContent className="dark:border-input dark:bg-background dark:text-slate-100">
                  {tours.length > 0 ? (
                    <SelectGroup>
                      <SelectLabel>Tour locations</SelectLabel>
                      {tours.map((tour) => (
                        <SelectItem key={`tour:${tour.id}`} value={`tour:${tour.id}`}>
                          {tour.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : null}
                  {websiteConfigs.length > 0 ? (
                    <SelectGroup>
                      <SelectLabel>Website chatbots</SelectLabel>
                      {websiteConfigs.map((config) => (
                        <SelectItem key={`website:${config.id}`} value={`website:${config.id}`}>
                          {config.chatbot_name || "Website Assistant"}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : null}
                  {slots.length > 0 ? (
                    <>
                      <SelectSeparator />
                      <SelectItem value={CREATE_NEW_VALUE} disabled={isCreatingWebsiteChatbot}>
                        <span className="inline-flex items-center gap-1.5">
                          <Plus className="h-3.5 w-3.5" />
                          Add new
                        </span>
                      </SelectItem>
                    </>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      {slots.length === 0 ? (
        <NoTourEmptyState
          description="Upload your Matterport tour, or create a website-only chatbot that doesn't need a virtual tour."
          onCreateWebsiteChatbot={handleCreateWebsiteChatbot}
          isCreatingWebsiteChatbot={isCreatingWebsiteChatbot}
        />
      ) : (
        <TourChatbotManagement
          onBack={handleBack}
          selectedTourId={selectedSlot?.kind === "tour" ? selectedSlot.id : null}
          chatbotConfigId={selectedSlot?.kind === "website" ? selectedSlot.id : null}
          onChatbotDeleted={async () => {
            if (!user?.venue?.id) return;
            await loadSlots(user.venue.id);
          }}
        />
      )}

      <CreateChatbotDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        tours={tours}
        onCreateWebsiteChatbot={handleCreateWebsiteChatbot}
        isCreatingWebsiteChatbot={isCreatingWebsiteChatbot}
        onSelectTour={(tourId) => {
          const slot = slots.find((s) => s.kind === "tour" && s.id === tourId);
          if (slot) setSelectedSlot(slot);
        }}
      />
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
