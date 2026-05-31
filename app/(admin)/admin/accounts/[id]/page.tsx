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
import { TourAnalytics } from "@/components/app/tours/tour-analytics";
import { ChatbotSettings } from "@/components/admin/chatbots/chatbot-settings";
import { ChatbotCustomisation } from "@/components/admin/chatbots/chatbot-customisation";
import { ChatbotTrainingDocuments } from "@/components/admin/chatbots/chatbot-training-documents";
import { ChatbotInfoSections } from "@/components/app/chatbots/tour/chatbot-info-sections";
import { ChatbotTriggers } from "@/components/app/chatbots/tour/chatbot-triggers";
import { BillingOverviewPanel, type BillingOverviewData } from "@/components/billing/billing-overview-panel";
import { AgencySettings } from "@/components/app/settings/agency-settings";
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
  Layers,
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
  agencyPortal?: {
    settings: any | null;
    shares: Array<{
      id: string;
      tour_id: string | null;
      share_slug: string;
      is_active: boolean;
      tourTitle: string | null;
      clientCount: number;
    }>;
    users: Array<{
      id: string;
      share_id: string;
      email: string;
      display_name: string | null;
      is_active: boolean;
    }>;
  };
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
  const [billingData, setBillingData] = useState<BillingOverviewData | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [agencyPortalOpen, setAgencyPortalOpen] = useState(false);
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

  // Billing is loaded lazily the first time the Billing section is opened, since
  // it makes live Stripe calls. It reuses the same Stripe-aligned overview the
  // user billing page consumes, scoped to this account.
  useEffect(() => {
    if (!billingOpen || !accountId) return;
    if (billingData || billingLoading) return;

    let cancelled = false;
    setBillingLoading(true);
    setBillingError(null);
    (async () => {
      try {
        const response = await fetch(`/api/admin/venues/${accountId}/billing`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to load billing data");
        }
        if (!cancelled) setBillingData(result);
      } catch (error: any) {
        if (!cancelled) setBillingError(error.message || "Failed to load billing data");
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally excludes billingData/billingLoading: including them would
    // re-run this effect the moment we flip billingLoading, cancelling the
    // in-flight request before its result is stored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingOpen, accountId]);

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

  const accountType = useMemo(() => {
    const isPlatformAdmin = (details?.users || []).some((user: any) => user.role === "platform_admin");
    if (isPlatformAdmin) return "platform_admin";
    const record = details?.billing?.record;
    const effective =
      record?.billing_override_enabled && record?.override_plan_code
        ? record.override_plan_code
        : record?.plan_code || "free";
    return effective;
  }, [details?.users, details?.billing?.record]);

  const isAgencyAccount = accountType === "agency";

  const accountTypeLabel = useMemo(() => {
    const labels: Record<string, string> = {
      free: "Free",
      pro: "Pro",
      agency: "Agency",
      platform_admin: "Platform admin",
    };
    return labels[accountType] || (accountType ? accountType.toUpperCase() : "Free");
  }, [accountType]);

  const selectedTour = useMemo(() => {
    if (!details?.tours?.length || !selectedTourId) return null;
    return details.tours.find((tour: any) => tour.id === selectedTourId) || null;
  }, [details?.tours, selectedTourId]);

  // A "location" is a primary tour (its own space, chatbot and embed). Each
  // location can contain multiple secondary "models" (parent_tour_id points at
  // the location) which share that location's chatbot/embed and which the AI
  // switches between. Legacy secondary rows without a parent are attached to the
  // sole location when there is only one.
  const locationTours = useMemo(() => {
    const rows = details?.tours || [];
    return rows.filter((tour: any) => tour.tour_type === "primary" || !tour.tour_type);
  }, [details?.tours]);

  const modelsByLocation = useMemo(() => {
    const rows = details?.tours || [];
    const singleLocation = locationTours.length <= 1;
    const map = new Map<string, any[]>();
    for (const location of locationTours) {
      const models = rows.filter((tour: any) => {
        if (tour.id === location.id) return true;
        if (tour.tour_type !== "secondary") return false;
        if (tour.parent_tour_id) return tour.parent_tour_id === location.id;
        return singleLocation;
      });
      // Show the main (primary) model first, then the secondary models.
      models.sort((a: any, b: any) => {
        const aIsPrimary = a.id === location.id ? 0 : 1;
        const bIsPrimary = b.id === location.id ? 0 : 1;
        return aIsPrimary - bIsPrimary;
      });
      map.set(location.id, models);
    }
    return map;
  }, [details?.tours, locationTours]);

  // For agency accounts, map each tour (location) to its agency-portal client
  // label so the Tours selector can show "Agency clients" with the client name
  // (display name / email) or share slug, rather than the raw tour title.
  const clientLabelByTourId = useMemo(() => {
    const map = new Map<string, string>();
    if (!isAgencyAccount) return map;
    const usersByShare = new Map<string, any[]>();
    for (const client of details?.agencyPortal?.users || []) {
      const list = usersByShare.get(client.share_id) || [];
      list.push(client);
      usersByShare.set(client.share_id, list);
    }
    for (const share of details?.agencyPortal?.shares || []) {
      if (!share.tour_id) continue;
      const clients = usersByShare.get(share.id) || [];
      const primaryClient = clients[0];
      const label =
        primaryClient?.display_name?.trim() ||
        primaryClient?.email ||
        share.share_slug ||
        share.tourTitle ||
        null;
      if (label) map.set(share.tour_id, label);
    }
    return map;
  }, [isAgencyAccount, details?.agencyPortal?.shares, details?.agencyPortal?.users]);

  const activeLocationId = useMemo(() => {
    if (!selectedTour) return null;
    if (selectedTour.tour_type === "secondary") {
      if (selectedTour.parent_tour_id) return selectedTour.parent_tour_id;
      return locationTours.length === 1 ? locationTours[0].id : null;
    }
    return selectedTour.id;
  }, [selectedTour, locationTours]);

  const activeLocationModels = useMemo(() => {
    if (!activeLocationId) return [];
    return modelsByLocation.get(activeLocationId) || [];
  }, [activeLocationId, modelsByLocation]);

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
        title={
          <span className="flex flex-wrap items-center gap-2">
            {editedVenue.name || "Account"}
            <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
              {accountTypeLabel}
            </Badge>
          </span>
        }
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
              {billingLoading && !billingData ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading live billing data from Stripe...
                </div>
              ) : billingError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {billingError}
                </div>
              ) : billingData ? (
                <BillingOverviewPanel data={billingData} />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                  No billing data available for this account yet.
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {isAgencyAccount && (
        <Collapsible open={agencyPortalOpen} onOpenChange={setAgencyPortalOpen}>
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-900">Agency portal</h2>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${agencyPortalOpen ? "rotate-180" : ""}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-5">
                {agencyPortalOpen && <AgencySettings forcedVenueId={accountId} />}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

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
                <div className="space-y-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-700">
                    Viewing detail blocks for: <span className="font-medium text-slate-900">{selectedTour.title || "Untitled tour"}</span>
                  </div>
                  {isAgencyAccount && activeLocationId && clientLabelByTourId.get(activeLocationId) && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600">
                      Client of <span className="font-medium text-slate-900">{editedVenue?.name || "this agency"}</span>. Billing is
                      handled by the agency:{" "}
                      <span className="font-medium text-slate-900">{editedVenue?.name || "this agency"}</span>.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 text-sm text-slate-600">
                  Select a {isAgencyAccount ? "client" : "tour"} below to load the full tour workspace.
                </div>
              )}

              {locationTours.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {isAgencyAccount ? "Agency clients" : "Locations"} ({locationTours.length})
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {locationTours.map((location: any) => {
                        const models = modelsByLocation.get(location.id) || [];
                        const isActiveLocation = activeLocationId === location.id;
                        const clientLabel = clientLabelByTourId.get(location.id);
                        return (
                          <div
                            key={location.id}
                            className="flex min-w-[220px] flex-1 basis-[calc(25%-0.5625rem)] flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3"
                          >
                            <div className="min-w-0">
                              {isAgencyAccount && clientLabel ? (
                                <>
                                  <p className="truncate text-sm font-medium text-slate-900">{clientLabel}</p>
                                  <p className="truncate text-xs text-slate-500">{location.title || "Untitled location"}</p>
                                </>
                              ) : (
                                <>
                                  <p className="truncate text-sm font-medium text-slate-900">{location.title || "Untitled location"}</p>
                                  <p className="truncate text-xs text-slate-500">{location.matterport_tour_id || "No Matterport ID"}</p>
                                </>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                                  {location.is_active ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1 border-slate-300 bg-slate-50 text-slate-600">
                                  <Layers className="h-3 w-3" />
                                  {models.length} {models.length === 1 ? "model" : "models"}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant={isActiveLocation ? "default" : "outline"}
                                className={
                                  isActiveLocation
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                }
                                onClick={() => {
                                  setSelectedTourId(location.id);
                                  setTourWorkspaceTab("setup");
                                }}
                              >
                                {isActiveLocation ? "Viewing" : "View tour"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {activeLocationId && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Models in this location ({activeLocationModels.length})
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {activeLocationModels.map((model: any) => {
                          const isSelected = selectedTourId === model.id;
                          const isPrimary = model.tour_type === "primary" || !model.tour_type;
                          return (
                            <div
                              key={model.id}
                              className="flex min-w-[220px] flex-1 basis-[calc(25%-0.5625rem)] flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="truncate text-sm font-medium text-slate-900">{model.title || "Untitled model"}</p>
                                  {isPrimary && (
                                    <Badge variant="outline" className="border-slate-300 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                                      Main
                                    </Badge>
                                  )}
                                </div>
                                <p className="truncate text-xs text-slate-500">{model.matterport_tour_id || "No Matterport ID"}</p>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                                  {model.is_active ? "Active" : "Inactive"}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  className={
                                    isSelected
                                      ? "bg-slate-900 text-white hover:bg-slate-800"
                                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                  }
                                  onClick={() => {
                                    setSelectedTourId(model.id);
                                    setTourWorkspaceTab("setup");
                                  }}
                                >
                                  {isSelected ? "Viewing" : "View model"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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

                      <TabsContent value="analytics" className="mt-4">
                        <TourAnalytics
                          forcedVenueId={accountId}
                          selectedTourId={selectedTour.id}
                          onSwitchToViewer={() => setTourWorkspaceTab("setup")}
                        />
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
