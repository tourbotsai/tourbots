"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppTitle } from "@/components/shared/app-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TourMenuBuilder } from "@/components/app/tours/menu/tour-menu-builder";
import { TourViewer } from "@/components/app/tours/tour-viewer";
import { ChatbotSettings } from "@/components/admin/chatbots/chatbot-settings";
import { ChatbotCustomisation } from "@/components/admin/chatbots/chatbot-customisation";
import { ChatbotTrainingDocuments } from "@/components/admin/chatbots/chatbot-training-documents";
import { ChatbotInfoSections } from "@/components/app/chatbots/tour/chatbot-info-sections";
import { ChatbotTriggers } from "@/components/app/chatbots/tour/chatbot-triggers";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Save,
  Building2,
  CreditCard,
  Globe,
  Settings,
  Bot,
  Palette,
  Copy,
  Eye,
  BarChart3,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface VenueDetailsResponse {
  venue: any;
  subscription: any | null;
  billing?: {
    record: any | null;
    activePlan: any | null;
    addons?: any[];
    usage?: {
      messageCreditsUsed?: number;
    };
  };
  tours: any[];
  chatbots: any[];
  chatbotStats?: {
    totalMessages?: number;
  };
  embedStats?: any[];
  conversations?: any[];
  users: any[];
}

interface ShareOptions {
  width: string;
  height: string;
  showTitle: boolean;
  showChat: boolean;
}

export default function AdminAccountDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const accountId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [details, setDetails] = useState<VenueDetailsResponse | null>(null);
  const [editedVenue, setEditedVenue] = useState<any>(null);
  const [selectedTourId, setSelectedTourId] = useState<string | undefined>(undefined);
  const [tourWorkspaceTab, setTourWorkspaceTab] = useState("setup");
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    width: "100%",
    height: "700px",
    showTitle: false,
    showChat: true,
  });

  const [accountInfoOpen, setAccountInfoOpen] = useState(true);
  const [billingOpen, setBillingOpen] = useState(false);
  const [toursOpen, setToursOpen] = useState(false);
  const [chatbotSetupOpen, setChatbotSetupOpen] = useState(false);
  const [chatbotInformationOpen, setChatbotInformationOpen] = useState(false);
  const [chatbotCustomisationOpen, setChatbotCustomisationOpen] = useState(false);
  const tourWorkspaceTabsScrollRef = useRef<HTMLDivElement>(null);

  const fetchAccountDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/venues/${accountId}/details`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load account details");
      }

      setDetails(result);
      setEditedVenue(result.venue);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load account details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchAccountDetails();
    }
  }, [accountId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!selectedTourId) return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      tourWorkspaceTabsScrollRef.current?.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [selectedTourId]);

  const handleSaveVenue = async () => {
    if (!editedVenue) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/venues/${accountId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editedVenue.name,
          email: editedVenue.email,
          phone: editedVenue.phone,
          address: editedVenue.address,
          city: editedVenue.city,
          postcode: editedVenue.postcode,
          in_setup: editedVenue.in_setup,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save account details");
      }

      toast({
        title: "Saved",
        description: "Account details updated successfully.",
      });

      fetchAccountDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save account details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const primaryContact = useMemo(() => {
    if (!details?.users?.length) return null;
    return details.users[0];
  }, [details?.users]);

  const selectedTour = useMemo(() => {
    if (!details?.tours?.length || !selectedTourId) return null;
    return details.tours.find((tour: any) => tour.id === selectedTourId) || null;
  }, [details?.tours, selectedTourId]);

  const tourChatbotConfigId = useMemo(() => {
    if (!details?.chatbots?.length) return null;
    const selectedTourConfig = details.chatbots.find(
      (chatbot: any) => chatbot.chatbot_type === "tour" && chatbot.tour_id === selectedTourId
    );
    if (selectedTourConfig?.id) return selectedTourConfig.id;
    return details.chatbots.find((chatbot: any) => chatbot.chatbot_type === "tour")?.id || null;
  }, [details?.chatbots, selectedTourId]);

  const handleCopy = async (value: string, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard.`,
      });
    } catch {
      toast({
        title: "Error",
        description: `Could not copy ${label.toLowerCase()}.`,
        variant: "destructive",
      });
    }
  };

  const embedPreviewUrl = selectedTour
    ? `/embed/tour/${accountId}?tourId=${selectedTour.id}&showTitle=${shareOptions.showTitle}&showChat=${shareOptions.showChat}`
    : "";

  const embedCode = selectedTour
    ? `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/tour/${accountId}?tourId=${selectedTour.id}&showTitle=${shareOptions.showTitle}&showChat=${shareOptions.showChat}" width="${shareOptions.width}" height="${shareOptions.height}" frameborder="0" allowfullscreen></iframe>`
    : "";

  const conversationRows = useMemo(() => {
    if (!selectedTourId || !details?.conversations?.length) return [];
    return details.conversations
      .filter((conversation: any) => conversation.chatbot_type === "tour")
      .slice(0, 12);
  }, [details?.conversations, selectedTourId]);

  const deviceSplitRows = useMemo(() => {
    const rows = details?.embedStats || [];
    if (!rows.length) return [];

    const counts = rows
      .filter((row: any) => row.embed_type === "tour")
      .reduce((accumulator: Record<string, number>, row: any) => {
        const userAgent = String(row.user_agent || "").toLowerCase();
        const key = /mobile|android|iphone|ipod/i.test(userAgent)
          ? "Mobile"
          : /ipad|tablet|playbook|silk/i.test(userAgent)
            ? "Tablet"
            : "Desktop";
        accumulator[key] = (accumulator[key] || 0) + Number(row.views_count || 0);
        return accumulator;
      }, {});

    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    return Object.entries(counts)
      .map(([device, views]) => ({
        device,
        views,
        percentage: total > 0 ? Math.round((views / total) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views);
  }, [details?.embedStats]);

  const formatGbp = (value: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!details || !editedVenue) {
    return (
      <div className="space-y-6">
        <Link href="/admin/accounts">
          <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Button>
        </Link>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="py-10 text-center text-slate-600">
            Account not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppTitle
        title={editedVenue.name || "Account"}
        description="Account-level controls, tours, chatbot configuration, customisation, and testing."
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/accounts">
              <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button
              onClick={handleSaveVenue}
              disabled={isSaving}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        }
      />

      <Collapsible open={accountInfoOpen} onOpenChange={setAccountInfoOpen}>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Account information</h2>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${accountInfoOpen ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-5 pt-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company name</Label>
                  <Input
                    value={editedVenue.name || ""}
                    onChange={(event) => setEditedVenue({ ...editedVenue, name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company email</Label>
                  <Input
                    value={editedVenue.email || ""}
                    onChange={(event) => setEditedVenue({ ...editedVenue, email: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company phone</Label>
                  <Input
                    value={editedVenue.phone || ""}
                    onChange={(event) => setEditedVenue({ ...editedVenue, phone: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary contact name</Label>
                  <Input value={primaryContact ? `${primaryContact.first_name || ""} ${primaryContact.last_name || ""}`.trim() : ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={editedVenue.address || ""}
                    onChange={(event) => setEditedVenue({ ...editedVenue, address: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={editedVenue.city || ""}
                    onChange={(event) => setEditedVenue({ ...editedVenue, city: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postcode</Label>
                  <Input
                    value={editedVenue.postcode || ""}
                    onChange={(event) => setEditedVenue({ ...editedVenue, postcode: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Setup mode</Label>
                  <div className="flex h-10 items-center justify-between rounded-md border border-slate-200 px-3">
                    <p className="text-sm text-slate-600">Allow access while setup is in progress</p>
                    <Switch
                      checked={!!editedVenue.in_setup}
                      onCheckedChange={(checked) => setEditedVenue({ ...editedVenue, in_setup: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={billingOpen} onOpenChange={setBillingOpen}>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Billing</h2>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${billingOpen ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-5 pt-5">
              {details.billing?.record ? (
                <>
                  {(() => {
                    const addonsCatalog = details.billing?.addons || [];
                    const extraSpacePrice = Number(
                      addonsCatalog.find((addon: any) => addon.code === "extra_space")?.monthly_price_gbp || 0
                    );
                    const messageBlockPrice = Number(
                      addonsCatalog.find((addon: any) => addon.code === "message_block")?.monthly_price_gbp || 0
                    );
                    const whiteLabelPrice = Number(
                      addonsCatalog.find((addon: any) => addon.code === "white_label")?.monthly_price_gbp || 0
                    );

                    const extraSpaceQty = Number(details.billing.record.addon_extra_spaces || 0);
                    const messageBlockQty = Number(details.billing.record.addon_message_blocks || 0);
                    const whiteLabelQty = details.billing.record.addon_white_label ? 1 : 0;

                    const planMonthly = Number(details.billing.activePlan?.monthly_price_gbp || 0);
                    const baseSpaces = Number(details.billing.activePlan?.included_spaces || 0);
                    const baseMessages = Number(details.billing.activePlan?.included_messages || 0);
                    const extraSpaceTotal = extraSpacePrice * extraSpaceQty;
                    const messageBlockTotal = messageBlockPrice * messageBlockQty;
                    const whiteLabelTotal = whiteLabelPrice * whiteLabelQty;
                    const addonsMonthlyTotal = extraSpaceTotal + messageBlockTotal + whiteLabelTotal;
                    const accountMonthlyTotal = planMonthly + addonsMonthlyTotal;
                    const messageCreditsLimit = Number(
                      details.billing.record.effective_message_limit ??
                        (baseMessages + (extraSpaceQty * 1000) + (messageBlockQty * 1000))
                    );
                    const messageCreditsUsed = Number(
                      details.billing?.usage?.messageCreditsUsed ?? details.chatbotStats?.totalMessages ?? 0
                    );
                    const displayMessageLimit = Math.max(messageCreditsLimit, messageCreditsUsed);
                    const activeSpacesUsed = details.tours.filter(
                      (tour: any) => tour.tour_type === "primary" || !tour.tour_type
                    ).length;
                    const spacesLimit = Number(
                      details.billing.record.effective_space_limit ?? (baseSpaces + extraSpaceQty)
                    );
                    const displaySpacesLimit = Math.max(spacesLimit, activeSpacesUsed);

                    return (
                      <>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">Total monthly revenue</p>
                      <p className="text-sm font-semibold text-slate-900">{formatGbp(accountMonthlyTotal)}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">Message usage</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {messageCreditsUsed.toLocaleString("en-GB")}/{displayMessageLimit.toLocaleString("en-GB")}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">Active spaces</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {activeSpacesUsed.toLocaleString("en-GB")}/{displaySpacesLimit.toLocaleString("en-GB")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Subscription plan</Label>
                      <div className="flex h-10 items-center justify-between rounded-md border border-slate-200 px-3">
                        <p className="text-sm text-slate-700">
                          {(details.billing.activePlan?.name || details.billing.record.plan_code || "Free")} - Monthly {formatGbp(planMonthly)}
                        </p>
                        <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                          {(details.billing.activePlan?.code || details.billing.record.plan_code || "free").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Billing status</Label>
                      <div className="flex h-10 items-center rounded-md border border-slate-200 px-3">
                        <p className="text-sm text-slate-700 capitalize">
                          {details.billing.record.billing_status || "free"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Plan override</Label>
                      <div className="flex h-10 items-center rounded-md border border-slate-200 px-3">
                        <p className="text-sm text-slate-700">
                          {details.billing.record.billing_override_enabled
                            ? `Enabled (${details.billing.record.override_plan_code || "custom"})`
                            : "Disabled"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>White-label add-on</Label>
                      <div className="flex h-10 items-center rounded-md border border-slate-200 px-3">
                        <p className="text-sm text-slate-700">
                          {details.billing.record.addon_white_label ? "Purchased" : "Not purchased"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                    <p className="mb-3 text-sm font-medium text-slate-900">Purchased add-ons</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                        <p className="text-xs text-slate-500">Additional spaces</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {extraSpaceQty.toLocaleString("en-GB")} x {formatGbp(extraSpacePrice)} = {formatGbp(extraSpaceTotal)}
                        </p>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                        <p className="text-xs text-slate-500">Message blocks</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {messageBlockQty.toLocaleString("en-GB")} x {formatGbp(messageBlockPrice)} = {formatGbp(messageBlockTotal)}
                        </p>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                        <p className="text-xs text-slate-500">White-label</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {whiteLabelQty} x {formatGbp(whiteLabelPrice)} = {formatGbp(whiteLabelTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                  No billing record found for this account yet.
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={toursOpen} onOpenChange={setToursOpen}>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Tours</h2>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${toursOpen ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-5">
              {selectedTour ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-700">
                  Viewing detail blocks for: <span className="font-medium text-slate-900">{selectedTour.title || "Untitled tour"}</span>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 text-sm text-slate-600">
                  Select a tour below to load the full tour workspace.
                </div>
              )}

              {details.tours.length > 0 ? (
                <div className="space-y-3">
                  {details.tours.map((tour: any) => (
                    <div key={tour.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tour.title || "Untitled tour"}</p>
                          <p className="text-xs text-slate-500">{tour.matterport_tour_id || "No Matterport ID"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                            {tour.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            size="sm"
                            variant={selectedTourId === tour.id ? "default" : "outline"}
                            className={
                              selectedTourId === tour.id
                                ? "bg-slate-900 text-white hover:bg-slate-800"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                            }
                            onClick={() => {
                              setSelectedTourId(tour.id);
                              setTourWorkspaceTab("setup");
                            }}
                          >
                            {selectedTourId === tour.id ? "Viewing" : "View tour"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                  No tours configured yet.
                </div>
              )}

              {selectedTour && (
                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <Tabs value={tourWorkspaceTab} onValueChange={setTourWorkspaceTab} className="w-full">
                      <div ref={tourWorkspaceTabsScrollRef} className="overflow-x-auto md:overflow-visible">
                        <TabsList className="flex w-max min-w-full gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 md:grid md:w-full md:grid-cols-4">
                        <TabsTrigger value="setup" className="shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                          Tour Setup
                        </TabsTrigger>
                        <TabsTrigger value="menu" className="shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                          Tour Menu
                        </TabsTrigger>
                        <TabsTrigger value="share" className="shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                          Share & Embed
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                          Analytics
                        </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="setup" className="mt-4 space-y-3">
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 text-sm text-slate-600 lg:hidden">
                          Tour viewer is shown below for a full-width mobile preview.
                        </div>
                        <div className="hidden lg:block">
                          <TourViewer
                            forcedVenueId={accountId}
                            forcedVenueName={editedVenue.name || "Venue"}
                            selectedTourIdOverride={selectedTour.id}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="menu" className="mt-4">
                        <TourMenuBuilder tourId={selectedTour.id} />
                      </TabsContent>

                      <TabsContent value="share" className="mt-4 space-y-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700">
                          Embed and share links for <span className="font-medium text-slate-900">{selectedTour.title || "this tour"}</span>.
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Width</Label>
                            <Input
                              value={shareOptions.width}
                              onChange={(event) =>
                                setShareOptions((previous) => ({ ...previous, width: event.target.value }))
                              }
                              className="h-9 bg-white text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Height</Label>
                            <Input
                              value={shareOptions.height}
                              onChange={(event) =>
                                setShareOptions((previous) => ({ ...previous, height: event.target.value }))
                              }
                              className="h-9 bg-white text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={shareOptions.showTitle}
                              onCheckedChange={(checked) =>
                                setShareOptions((previous) => ({ ...previous, showTitle: checked }))
                              }
                            />
                            <Label className="text-sm text-slate-700">Show title</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={shareOptions.showChat}
                              onCheckedChange={(checked) =>
                                setShareOptions((previous) => ({ ...previous, showChat: checked }))
                              }
                            />
                            <Label className="text-sm text-slate-700">Show chat</Label>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Embed preview URL</Label>
                          <div className="flex items-center gap-2">
                            <Input value={embedPreviewUrl} readOnly className="h-9 bg-slate-50 text-xs" />
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                              onClick={() => handleCopy(embedPreviewUrl, "Preview URL")}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                              asChild
                            >
                              <a href={embedPreviewUrl} target="_blank" rel="noopener noreferrer">
                                Preview tour
                              </a>
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Simple iframe embed code</Label>
                          <Textarea value={embedCode} readOnly rows={5} className="bg-slate-50 font-mono text-xs" />
                        </div>
                      </TabsContent>

                      <TabsContent value="analytics" className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-600">
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                              View count
                            </div>
                            <p className="text-2xl font-semibold text-slate-900">{Number(selectedTour.view_count || 0).toLocaleString("en-GB")}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-600">
                              <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                              Status
                            </div>
                            <p className="text-sm font-medium text-slate-900">{selectedTour.is_active ? "Active" : "Inactive"}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-600">
                              <Bot className="h-3.5 w-3.5 text-slate-400" />
                              Tour conversations
                            </div>
                            <p className="text-2xl font-semibold text-slate-900">{conversationRows.length.toLocaleString("en-GB")}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-600">
                              <Globe className="h-3.5 w-3.5 text-slate-400" />
                              Tour ID
                            </div>
                            <p className="truncate text-sm font-medium text-slate-900">{selectedTour.id}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <h4 className="mb-2 text-sm font-semibold text-slate-900">Live device split</h4>
                            {deviceSplitRows.length > 0 ? (
                              <div className="space-y-2">
                                {deviceSplitRows.map((row) => (
                                  <div key={row.device} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
                                    <p className="text-sm font-medium text-slate-900">{row.device}</p>
                                    <p className="text-xs text-slate-600">
                                      {row.views.toLocaleString("en-GB")} views ({row.percentage}%)
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
                                No device split data available yet.
                              </div>
                            )}
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <h4 className="mb-2 text-sm font-semibold text-slate-900">Recent conversations</h4>
                            {conversationRows.length > 0 ? (
                              <div className="space-y-2">
                                {conversationRows.map((conversation: any) => (
                                  <div key={conversation.id} className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                      <p className="truncate text-xs font-medium text-slate-900">
                                        {conversation.visitor_email || conversation.visitor_id || "Anonymous visitor"}
                                      </p>
                                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-600">
                                        {conversation.message_count || 0} messages
                                      </Badge>
                                    </div>
                                    <p className="line-clamp-2 text-xs text-slate-600">
                                      {conversation.last_message || "No message preview"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
                                No conversation data available yet.
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
              {selectedTour && tourWorkspaceTab === "setup" && (
                <div className="-mx-6 mt-1 lg:hidden">
                  <TourViewer
                    forcedVenueId={accountId}
                    forcedVenueName={editedVenue.name || "Venue"}
                    selectedTourIdOverride={selectedTour.id}
                  />
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={chatbotSetupOpen} onOpenChange={setChatbotSetupOpen}>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Chatbot setup</h2>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${chatbotSetupOpen ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-5">
              {selectedTourId ? (
                <ChatbotSettings forcedVenueId={accountId} hideHeader initiallyExpanded />
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
                  Select a tour in the Tours block first to load setup controls.
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={chatbotInformationOpen} onOpenChange={setChatbotInformationOpen}>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Chatbot information</h2>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${chatbotInformationOpen ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-5">
              {selectedTourId ? (
                <div className="space-y-4">
                  <ChatbotInfoSections chatbotConfigId={tourChatbotConfigId} />
                  <ChatbotTrainingDocuments forcedVenueId={accountId} hideHeader />
                  <ChatbotTriggers chatbotConfigId={tourChatbotConfigId} />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
                  Select a tour in the Tours block first to load chatbot information, training documents, and triggers.
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={chatbotCustomisationOpen} onOpenChange={setChatbotCustomisationOpen}>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Chatbot customisation</h2>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${chatbotCustomisationOpen ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-5">
              {selectedTourId ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
                  Chatbot customisation workspace is shown below for a wider editing and preview area.
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
                  Select a tour in the Tours block first to load chatbot customisation.
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {chatbotCustomisationOpen && selectedTourId ? (
        <div className="mt-1">
          <ChatbotCustomisation forcedVenueId={accountId} forcedTourId={selectedTourId} hideHeader />
        </div>
      ) : null}

    </div>
  );
}
