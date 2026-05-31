"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { useUser } from "@/hooks/useUser";
import { useBilling } from "@/hooks/app/useBilling";
import { ColorPicker } from "@/components/app/chatbots/shared/color-picker";
import { generateAgencyPortalEmbed, generateUniversalAgencyPortalEmbed } from "@/lib/embed-generator";
import { Building2, ChevronDown, ChevronUp, Code, Copy, ExternalLink, Gauge, Info, KeyRound, Loader2, Lock, Palette, Plus, Share2, SlidersHorizontal, Trash2, UserPlus, X } from "lucide-react";

function extractMatterportId(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    const fromQuery = parsed.searchParams.get("m");
    if (fromQuery) return fromQuery.trim();
  } catch {
    // fall through to regex
  }
  const match = trimmed.match(/[?&]m=([^&\s]+)/);
  return match ? match[1].trim() : "";
}

function parseDomainTokens(input: string): string[] {
  return input
    .split(/[\n,\s]+/)
    .map((entry) =>
      entry
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
        .replace(/:\d+$/, "")
    )
    .filter(Boolean);
}

interface AgencyPortalSettings {
  id: string;
  venue_id: string;
  is_enabled: boolean;
  agency_name: string | null;
  logo_url: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  portal_background_colour: string | null;
  allowed_domains: string[];
  client_usage_mode?: "shared" | "allocated";
}

interface AgencyPool {
  used: number;
  limit: number;
  resetAt: string;
}

interface TourRow {
  id: string;
  title: string;
  tour_type?: "primary" | "secondary" | null;
  updated_at: string;
}

interface ShareUser {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
}

interface ShareRow {
  id: string;
  venue_id: string;
  tour_id: string;
  share_slug: string;
  is_active: boolean;
  enabled_modules: {
    tour?: boolean;
    settings?: boolean;
    customisation?: boolean;
    analytics?: boolean;
    tour_blocks?: {
      setup?: boolean;
      menu?: boolean;
    };
    settings_blocks?: {
      config?: boolean;
      information?: boolean;
      documents?: boolean;
      triggers?: boolean;
    };
  };
  users: ShareUser[];
  message_credit_allocation?: number | null;
  messages_used_this_month?: number;
}

const defaultModules = {
  tour: true,
  settings: true,
  customisation: true,
  analytics: true,
};
const defaultTourBlocks = {
  setup: true,
  menu: true,
};
const defaultSettingsBlocks = {
  config: true,
  information: true,
  documents: true,
  triggers: true,
};

function normaliseShareSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function AgencySettings() {
  const { toast } = useToast();
  const { getAuthHeaders } = useAuthHeaders();
  const { user } = useUser();
  const { limits, fetchBilling } = useBilling();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoFileName, setLogoFileName] = useState("");
  const [isSavingShare, setIsSavingShare] = useState(false);
  const [settings, setSettings] = useState<AgencyPortalSettings | null>(null);
  const [entitled, setEntitled] = useState(false);
  const [tours, setTours] = useState<TourRow[]>([]);
  const [shares, setShares] = useState<ShareRow[]>([]);

  const [domains, setDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");

  const [pool, setPool] = useState<AgencyPool | null>(null);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [isSavingDomains, setIsSavingDomains] = useState(false);
  const [isSavingUsage, setIsSavingUsage] = useState(false);

  const [generalOpen, setGeneralOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);

  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [addClientStep, setAddClientStep] = useState<"form" | "success">("form");
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [acClientName, setAcClientName] = useState("");
  const [acTourName, setAcTourName] = useState("");
  const [acTourNameEdited, setAcTourNameEdited] = useState(false);
  const [acMatterportUrl, setAcMatterportUrl] = useState("");
  const [acDescription, setAcDescription] = useState("");
  const [acSlug, setAcSlug] = useState("");
  const [acSlugEdited, setAcSlugEdited] = useState(false);
  const [acClientEmail, setAcClientEmail] = useState("");
  const [acClientPassword, setAcClientPassword] = useState("");
  const [createdClient, setCreatedClient] = useState<{
    tourId: string;
    tourName: string;
    slug: string;
    email: string;
    password: string | null;
  } | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<TourRow | null>(null);
  const [selectedShare, setSelectedShare] = useState<ShareRow | null>(null);
  const [shareSlug, setShareSlug] = useState("");
  const [shareActive, setShareActive] = useState(true);
  const [enabledModules, setEnabledModules] = useState(defaultModules);
  const [tourBlocks, setTourBlocks] = useState(defaultTourBlocks);
  const [settingsBlocks, setSettingsBlocks] = useState(defaultSettingsBlocks);
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [regenPassword, setRegenPassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const temporaryPasswordRef = useRef<HTMLDivElement | null>(null);
  const [embedWidth, setEmbedWidth] = useState("100%");
  const [embedHeight, setEmbedHeight] = useState("900px");

  const shareByTourId = useMemo(() => {
    return shares.reduce((acc, share) => {
      acc[share.tour_id] = share;
      return acc;
    }, {} as Record<string, ShareRow>);
  }, [shares]);

  const embedCodes = useMemo(() => {
    const persistedSlug = selectedShare?.share_slug || null;
    const workingSlug = persistedSlug || normaliseShareSlug(shareSlug);
    if (!workingSlug) return null;
    return generateAgencyPortalEmbed(workingSlug, {
      width: embedWidth,
      height: embedHeight,
      showHeader: true,
    });
  }, [shareSlug, selectedShare?.share_slug, embedWidth, embedHeight]);

  const universalEmbed = useMemo(() => {
    const venueId = user?.venue?.id;
    if (!venueId) return null;
    return generateUniversalAgencyPortalEmbed(venueId, {
      width: "100%",
      height: "900px",
      showHeader: true,
    });
  }, [user?.venue?.id]);

  const canUsePermanentPreview = useMemo(() => {
    return Boolean(selectedShare && settings?.is_enabled);
  }, [selectedShare, settings?.is_enabled]);

  const temporaryPreviewUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams({
      shareSlug: normaliseShareSlug(shareSlug || "draft-share"),
      ...(selectedTour?.id ? { tourId: selectedTour.id } : {}),
      agencyName: settings?.agency_name || "Agency Portal",
      ...(settings?.logo_url ? { agencyLogoUrl: settings.logo_url } : {}),
      tourTitle: selectedTour?.title || "Tour",
      primaryColour: settings?.primary_colour || "#1E40AF",
      secondaryColour: settings?.secondary_colour || "#0F172A",
      backgroundColour: settings?.portal_background_colour || "#F8FAFC",
      showHeader: "true",
      tour: String(enabledModules.tour ?? true),
      settings: String(enabledModules.settings ?? true),
      customisation: String(enabledModules.customisation ?? true),
      analytics: String(enabledModules.analytics ?? true),
      tourSetup: String(tourBlocks.setup ?? true),
      tourMenu: String(tourBlocks.menu ?? true),
      settingsConfig: String(settingsBlocks.config ?? true),
      settingsInformation: String(settingsBlocks.information ?? true),
      settingsDocuments: String(settingsBlocks.documents ?? true),
      settingsTriggers: String(settingsBlocks.triggers ?? true),
    });

    return `${window.location.protocol}//${window.location.host}/embed/agency/preview?${params.toString()}`;
  }, [
    shareSlug,
    settings?.agency_name,
    settings?.logo_url,
    settings?.primary_colour,
    settings?.secondary_colour,
    settings?.portal_background_colour,
    selectedTour?.title,
    enabledModules.settings,
    enabledModules.tour,
    enabledModules.customisation,
    enabledModules.analytics,
    tourBlocks.setup,
    tourBlocks.menu,
    settingsBlocks.config,
    settingsBlocks.information,
    settingsBlocks.documents,
    settingsBlocks.triggers,
  ]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();

      const [settingsRes, sharesRes] = await Promise.all([
        fetch("/api/app/agency-portal/settings", { headers }),
        fetch("/api/app/agency-portal/shares", { headers }),
      ]);

      const settingsJson = await settingsRes.json();
      const sharesJson = await sharesRes.json();

      if (!settingsRes.ok) {
        throw new Error(settingsJson.error || "Failed to fetch agency settings");
      }
      if (!sharesRes.ok) {
        throw new Error(sharesJson.error || "Failed to fetch agency shares");
      }

      setSettings(settingsJson.settings);
      setEntitled(Boolean(settingsJson.entitlement?.entitled));
      setDomains(settingsJson.settings?.allowed_domains || []);
      setTours(sharesJson.tours || []);
      setShares(sharesJson.shares || []);
      setPool(sharesJson.pool || null);
      setAllocations(
        (sharesJson.shares || []).reduce((acc: Record<string, number>, share: ShareRow) => {
          acc[share.id] = Number(share.message_credit_allocation || 0);
          return acc;
        }, {})
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load agency settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user?.venue_id) {
      void fetchBilling();
    }
  }, [user?.venue_id, fetchBilling]);

  const primarySpacesUsed = useMemo(
    () => tours.filter((tour) => tour.tour_type === "primary" || !tour.tour_type).length,
    [tours]
  );
  const totalSpaces = limits?.totalSpaces ?? null;
  const canAddClient = totalSpaces == null ? true : primarySpacesUsed < totalSpaces;

  const resetAddClientForm = () => {
    setAddClientStep("form");
    setAcClientName("");
    setAcTourName("");
    setAcTourNameEdited(false);
    setAcMatterportUrl("");
    setAcDescription("");
    setAcSlug("");
    setAcSlugEdited(false);
    setAcClientEmail("");
    setAcClientPassword("");
    setCreatedClient(null);
  };

  const openAddClient = () => {
    resetAddClientForm();
    setIsAddClientOpen(true);
  };

  const handleAddClientOpenChange = (open: boolean) => {
    setIsAddClientOpen(open);
    if (!open) resetAddClientForm();
  };

  const createClient = async () => {
    const venueId = user?.venue?.id;
    if (!venueId) {
      toast({ title: "Error", description: "Unable to determine your account.", variant: "destructive" });
      return;
    }

    const clientName = acClientName.trim();
    const tourName = (acTourNameEdited ? acTourName : acTourName || acClientName).trim();
    const matterportUrl = acMatterportUrl.trim();
    const matterportId = extractMatterportId(matterportUrl);
    const email = acClientEmail.trim();

    if (!clientName) {
      toast({ title: "Client name required", description: "Enter the client or business name.", variant: "destructive" });
      return;
    }
    if (!matterportUrl || !matterportId) {
      toast({ title: "Matterport URL required", description: "Enter a valid Matterport tour URL (it should contain ?m=...).", variant: "destructive" });
      return;
    }
    if (!email) {
      toast({ title: "Client login email required", description: "Enter the email your client will use to log in.", variant: "destructive" });
      return;
    }
    if (acClientPassword && acClientPassword.length < 8) {
      toast({ title: "Password too short", description: "The client password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    setIsCreatingClient(true);
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });

      const tourResponse = await fetch("/api/app/tours", {
        method: "POST",
        headers,
        body: JSON.stringify({
          venueId,
          title: tourName || clientName,
          description: acDescription.trim() || null,
          matterportTourId: matterportId,
          matterportUrl,
          tourType: "primary",
        }),
      });
      const tourData = await tourResponse.json();
      if (!tourResponse.ok) {
        throw new Error(tourData.error || "Failed to create the client tour.");
      }

      const newTourId = tourData.id as string;
      const slug = normaliseShareSlug(acSlug || `${tourName || clientName}-chatbot`);

      const shareResponse = await fetch("/api/app/agency-portal/shares", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "upsert_share",
          tourId: newTourId,
          shareSlug: slug,
          isActive: true,
          enabledModules: {
            ...defaultModules,
            tour_blocks: defaultTourBlocks,
            settings_blocks: defaultSettingsBlocks,
          },
          clientEmail: email,
          clientPassword: acClientPassword || undefined,
        }),
      });
      const shareData = await shareResponse.json();

      await fetchData();
      await fetchBilling();

      if (!shareResponse.ok) {
        throw new Error(
          shareData.error ||
            "The tour was created, but the client portal could not be set up. Finish it from the list below."
        );
      }

      setCreatedClient({
        tourId: newTourId,
        tourName: tourName || clientName,
        slug: shareData.share?.share_slug || slug,
        email,
        password: acClientPassword || shareData.temporaryPassword || null,
      });
      setAddClientStep("success");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add the client.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingClient(false);
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({ title: "Copy failed", description: "Unable to copy to clipboard.", variant: "destructive" });
    }
  };

  const goPositionCreatedTour = () => {
    if (!createdClient) return;
    const tourId = createdClient.tourId;
    handleAddClientOpenChange(false);
    router.push(`/app/tours?tab=viewer&tourId=${encodeURIComponent(tourId)}`);
  };

  const addDomainsFromInput = () => {
    const tokens = parseDomainTokens(domainInput);
    if (tokens.length === 0) return;
    setDomains((prev) => {
      const existing = new Set(prev.map((domain) => domain.toLowerCase()));
      const merged = [...prev];
      tokens.forEach((token) => {
        if (!existing.has(token)) {
          existing.add(token);
          merged.push(token);
        }
      });
      return merged;
    });
    setDomainInput("");
  };

  const removeDomain = (domainIndex: number) => {
    setDomains((prev) => prev.filter((_, currentIndex) => currentIndex !== domainIndex));
  };

  const saveSettings = async () => {
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const pendingDomains = parseDomainTokens(domainInput);
      const parsedDomains = Array.from(
        new Set([...domains, ...pendingDomains].map((entry) => entry.trim().toLowerCase()).filter(Boolean))
      );

      const response = await fetch("/api/app/agency-portal/settings", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          is_enabled: settings.is_enabled,
          agency_name: settings.agency_name || null,
          logo_url: settings.logo_url || null,
          primary_colour: settings.primary_colour || null,
          secondary_colour: settings.secondary_colour || null,
          portal_background_colour: settings.portal_background_colour || null,
          allowed_domains: parsedDomains,
          client_usage_mode: settings.client_usage_mode || "shared",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save agency settings");
      }

      setSettings(data);
      setDomains(data.allowed_domains || []);
      setDomainInput("");
      toast({
        title: "Saved",
        description: "Agency settings updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save agency settings.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const usageMode = settings?.client_usage_mode || "shared";
  const totalAllocated = useMemo(
    () => shares.reduce((sum, share) => sum + Number(allocations[share.id] || 0), 0),
    [shares, allocations]
  );
  const poolLimit = pool?.limit ?? 0;
  const overAllocated = usageMode === "allocated" && totalAllocated > poolLimit;
  const formatResetDate = (iso?: string | null) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  };

  const persistSettings = async (headers: HeadersInit) => {
    if (!settings) return null;
    const pendingDomains = parseDomainTokens(domainInput);
    const parsedDomains = Array.from(
      new Set([...domains, ...pendingDomains].map((entry) => entry.trim().toLowerCase()).filter(Boolean))
    );

    const settingsResponse = await fetch("/api/app/agency-portal/settings", {
      method: "PUT",
      headers,
      body: JSON.stringify({
        is_enabled: settings.is_enabled,
        agency_name: settings.agency_name || null,
        logo_url: settings.logo_url || null,
        primary_colour: settings.primary_colour || null,
        secondary_colour: settings.secondary_colour || null,
        portal_background_colour: settings.portal_background_colour || null,
        allowed_domains: parsedDomains,
        client_usage_mode: usageMode,
      }),
    });
    const settingsData = await settingsResponse.json();
    if (!settingsResponse.ok) {
      throw new Error(settingsData.error || "Failed to save settings");
    }
    return settingsData;
  };

  const saveDomains = async () => {
    if (!settings) return;
    setIsSavingDomains(true);
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const settingsData = await persistSettings(headers);
      if (settingsData) {
        setSettings(settingsData);
        setDomains(settingsData.allowed_domains || []);
        setDomainInput("");
      }
      toast({ title: "Saved", description: "Allowed domains updated successfully." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save allowed domains.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDomains(false);
    }
  };

  const saveUsageLimits = async () => {
    if (!settings) return;
    if (usageMode === "allocated" && totalAllocated > poolLimit) {
      toast({
        title: "Allocations exceed your limit",
        description: `Total allocated (${totalAllocated.toLocaleString("en-GB")}) is above your monthly message limit (${poolLimit.toLocaleString("en-GB")}). Reduce the split before saving.`,
        variant: "destructive",
      });
      return;
    }
    setIsSavingUsage(true);
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const settingsData = await persistSettings(headers);

      if (usageMode === "allocated") {
        const allocationsResponse = await fetch("/api/app/agency-portal/shares", {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "save_allocations",
            allocations: shares.map((share) => ({
              shareId: share.id,
              allocation: Number(allocations[share.id] || 0),
            })),
          }),
        });
        const allocationsData = await allocationsResponse.json();
        if (!allocationsResponse.ok) {
          throw new Error(allocationsData.error || "Failed to save client allocations");
        }
      }

      if (settingsData) setSettings(settingsData);
      await fetchData();
      toast({ title: "Saved", description: "Usage limits updated successfully." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save usage limits.",
        variant: "destructive",
      });
    } finally {
      setIsSavingUsage(false);
    }
  };

  const uploadAgencyLogo = async (file: File) => {
    if (!settings) return;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const headers = await getAuthHeaders();
      const response = await fetch("/api/app/agency-portal/upload-logo", {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload logo");
      }

      setSettings((prev) => (prev ? { ...prev, logo_url: data.imageUrl } : prev));
      toast({
        title: "Logo uploaded",
        description: "Agency logo uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeAgencyLogo = async () => {
    if (!settings?.logo_url) return;
    setIsUploadingLogo(true);
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/app/agency-portal/upload-logo", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ imageUrl: settings.logo_url }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove logo");
      }
      setSettings((prev) => (prev ? { ...prev, logo_url: null } : prev));
      toast({
        title: "Logo removed",
        description: "Agency logo removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove logo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const openShareModal = (tour: TourRow, existingShare?: ShareRow) => {
    setSelectedTour(tour);
    setSelectedShare(existingShare || null);
    setShareSlug(existingShare?.share_slug || `${tour.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-chatbot`);
    setShareActive(existingShare?.is_active ?? true);
    setEnabledModules({
      tour: existingShare?.enabled_modules?.tour ?? true,
      settings: existingShare?.enabled_modules?.settings ?? true,
      customisation: existingShare?.enabled_modules?.customisation ?? true,
      analytics: existingShare?.enabled_modules?.analytics ?? true,
    });
    setTourBlocks({
      setup: existingShare?.enabled_modules?.tour_blocks?.setup ?? true,
      menu: existingShare?.enabled_modules?.tour_blocks?.menu ?? true,
    });
    setSettingsBlocks({
      config: existingShare?.enabled_modules?.settings_blocks?.config ?? true,
      information: existingShare?.enabled_modules?.settings_blocks?.information ?? true,
      documents: existingShare?.enabled_modules?.settings_blocks?.documents ?? true,
      triggers: existingShare?.enabled_modules?.settings_blocks?.triggers ?? true,
    });
    const primaryUser = existingShare?.users?.[0];
    setClientEmail(primaryUser?.email || "");
    setClientPassword("");
    setRegenPassword(false);
    setTemporaryPassword(null);
    setEmbedWidth("100%");
    setEmbedHeight("900px");
    setIsShareModalOpen(true);
  };

  const saveShare = async () => {
    if (!selectedTour) return;
    setIsSavingShare(true);
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/app/agency-portal/shares", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "upsert_share",
          shareId: selectedShare?.id,
          tourId: selectedTour.id,
          shareSlug,
          isActive: shareActive,
          enabledModules: {
            ...enabledModules,
            tour_blocks: tourBlocks,
            settings_blocks: settingsBlocks,
          },
          clientEmail: clientEmail || undefined,
          clientPassword: clientPassword || undefined,
          regeneratePassword: regenPassword || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save share");
      }

      if (data.temporaryPassword) {
        setTemporaryPassword(data.temporaryPassword);
      }

      toast({
        title: "Saved",
        description: "Share settings updated successfully.",
      });

      await fetchData();
      setSelectedShare(data.share || null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save share settings.",
        variant: "destructive",
      });
    } finally {
      setIsSavingShare(false);
    }
  };

  const toggleShare = async (shareId: string, isActive: boolean) => {
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/app/agency-portal/shares", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "toggle_share",
          shareId,
          isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update share status");
      }

      setShares((prev) => prev.map((share) => (share.id === shareId ? { ...share, is_active: isActive } : share)));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update share status.",
        variant: "destructive",
      });
    }
  };

  const regenerateCredentials = async () => {
    if (!selectedShare || !clientEmail) return;
    setIsSavingShare(true);
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/app/agency-portal/shares", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "regenerate_credentials",
          shareId: selectedShare.id,
          email: clientEmail,
          password: clientPassword || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to regenerate credentials");
      }
      setTemporaryPassword(data.temporaryPassword || null);
      toast({
        title: "Credentials regenerated",
        description: "Copy the new password below - it is only shown once.",
      });
      if (data.temporaryPassword) {
        requestAnimationFrame(() => {
          temporaryPasswordRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate credentials.",
        variant: "destructive",
      });
    } finally {
      setIsSavingShare(false);
    }
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({ title: "Error", description: `Failed to copy ${label}.`, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-700 dark:border-slate-200" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
        <CardContent className="py-8 text-sm text-muted-foreground">
          Unable to load Agency Settings.
        </CardContent>
      </Card>
    );
  }

  const showAgencyPortalContent = entitled || settings.is_enabled;
  const agencyTabTriggerClass =
    "h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100";

  return (
    <>
      <Tabs defaultValue="settings" className="space-y-6">
        <div className="overflow-x-auto md:overflow-visible">
          <TabsList className="flex h-10 w-max min-w-full items-stretch gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-input dark:bg-background md:grid md:w-full md:grid-cols-2">
            <TabsTrigger value="settings" className={agencyTabTriggerClass}>
              Agency Settings
            </TabsTrigger>
            <TabsTrigger value="client" className={agencyTabTriggerClass}>
              Client Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="settings" className="space-y-6">
          <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
                        <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <span className="text-base sm:text-lg">General settings</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 dark:text-slate-400">
                    Control which domains can embed your client portal.
                  </CardDescription>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                  <Button
                    type="button"
                    onClick={saveDomains}
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    disabled={!entitled || isSavingDomains || !generalOpen}
                  >
                    {isSavingDomains ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                    onClick={() => setGeneralOpen((prev) => !prev)}
                  >
                    {generalOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    {generalOpen ? "Collapse" : "Expand"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {generalOpen && (
            <CardContent className="space-y-5 border-t border-slate-200/80 bg-slate-50/30 pt-5 dark:border-input dark:bg-background">
              {!entitled && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                  Your plan does not include the agency portal. Upgrade to the Agency plan in Billing to activate these settings.
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="allowed-domains">Allowed domains</Label>
                  <span className="group relative inline-flex">
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" aria-label="About allowed domains" />
                    <span className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 hidden w-80 rounded-md border bg-popover px-3 py-2 text-xs font-normal leading-relaxed text-popover-foreground shadow-md group-hover:block dark:border-input">
                      Enter your own agency domain (e.g. vrtour360.co.uk) where you host the portal page. The branded portal can only be embedded on the domains listed here. Your clients visit that page on your site to manage their AI settings, fully white-labelled as your product. If left blank, the portal is blocked on all external sites.
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="allowed-domains"
                    value={domainInput}
                    onChange={(event) => setDomainInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addDomainsFromInput();
                      }
                    }}
                    placeholder="e.g. vrtour360.co.uk - then press + or Enter"
                    disabled={!entitled}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addDomainsFromInput}
                    disabled={!entitled || !domainInput.trim()}
                    aria-label="Add domain"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {domains.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {domains.map((domain, domainIndex) => (
                      <button
                        key={`${domain}-${domainIndex}`}
                        type="button"
                        onClick={() => removeDomain(domainIndex)}
                        className="group inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-xs text-slate-700 hover:bg-slate-200/80 disabled:cursor-not-allowed disabled:opacity-60 dark:border-input dark:bg-background dark:text-slate-200 dark:hover:bg-neutral-800"
                        disabled={!entitled}
                        title="Click to remove domain"
                      >
                        {domain}
                        <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Add your own agency domain where you embed the portal (e.g. vrtour360.co.uk) - not your client&apos;s site. Any &quot;www.&quot; or &quot;https://&quot; is trimmed automatically, and www / subdomains are matched for you.
                  </p>
                )}
              </div>
            </CardContent>
            )}
          </Card>

          <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
                        <Gauge className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <span className="text-base sm:text-lg">Usage limits</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 dark:text-slate-400">
                    See your monthly message usage and choose how credits are shared across your clients.
                  </CardDescription>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                  <Button
                    type="button"
                    onClick={saveUsageLimits}
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    disabled={!entitled || isSavingUsage || overAllocated || !usageOpen}
                  >
                    {isSavingUsage ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                    onClick={() => setUsageOpen((prev) => !prev)}
                  >
                    {usageOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    {usageOpen ? "Collapse" : "Expand"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {usageOpen && (
            <CardContent className="space-y-5 border-t border-slate-200/80 bg-slate-50/30 pt-5 dark:border-input dark:bg-background">
              <div className="rounded-lg border p-3 dark:border-input dark:bg-background">
                <div className="flex items-end justify-between gap-4">
                  <div className="flex items-end gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Active spaces</p>
                      <p className="text-2xl font-semibold">
                        {primarySpacesUsed} / {totalSpaces ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Message credits (this month)</p>
                      <p className="text-2xl font-semibold">
                        {(pool?.used ?? 0).toLocaleString("en-GB")} / {(pool?.limit ?? 0).toLocaleString("en-GB")}
                      </p>
                    </div>
                  </div>
                  {formatResetDate(pool?.resetAt) && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Resets</p>
                      <p className="text-sm font-medium">{formatResetDate(pool?.resetAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Client usage mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!entitled}
                    onClick={() => setSettings((prev) => (prev ? { ...prev, client_usage_mode: "shared" } : prev))}
                    className={`rounded-lg border p-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      usageMode === "shared"
                        ? "border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-neutral-800"
                        : "border-slate-200 hover:bg-slate-50 dark:border-input dark:hover:bg-neutral-800"
                    }`}
                  >
                    <p className="font-medium">Shared pool</p>
                    <p className="text-xs text-muted-foreground">All clients draw from your monthly pool. If it runs out, every client stops.</p>
                  </button>
                  <button
                    type="button"
                    disabled={!entitled}
                    onClick={() => setSettings((prev) => (prev ? { ...prev, client_usage_mode: "allocated" } : prev))}
                    className={`rounded-lg border p-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      usageMode === "allocated"
                        ? "border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-neutral-800"
                        : "border-slate-200 hover:bg-slate-50 dark:border-input dark:hover:bg-neutral-800"
                    }`}
                  >
                    <p className="font-medium">Allocated</p>
                    <p className="text-xs text-muted-foreground">Give each client a fixed monthly slice. When a client hits theirs, only that client stops.</p>
                  </button>
                </div>
              </div>

              {usageMode === "allocated" && (
                <div className="space-y-3 rounded-lg border p-3 dark:border-input dark:bg-background">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Client allocations</p>
                    <p className={`text-xs ${overAllocated ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                      Allocated {totalAllocated.toLocaleString("en-GB")} / {poolLimit.toLocaleString("en-GB")}
                      {" · "}
                      {Math.max(0, poolLimit - totalAllocated).toLocaleString("en-GB")} unallocated
                    </p>
                  </div>
                  {shares.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Add clients below to allocate message credits.</p>
                  ) : (
                    <div className="space-y-2">
                      {shares.map((share) => {
                        const tourTitle = tours.find((tour) => tour.id === share.tour_id)?.title || "Untitled space";
                        const clientLabel = share.users[0]?.display_name || share.users[0]?.email || share.share_slug;
                        const usedThisMonth = Number(share.messages_used_this_month || 0);
                        return (
                          <div
                            key={share.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2 dark:border-input dark:bg-background"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{tourTitle}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {clientLabel} · used {usedThisMonth.toLocaleString("en-GB")} this month
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`alloc-${share.id}`} className="text-xs text-muted-foreground">
                                Allocation
                              </Label>
                              <Input
                                id={`alloc-${share.id}`}
                                type="number"
                                min={0}
                                step={100}
                                className="h-9 w-28"
                                disabled={!entitled}
                                value={String(allocations[share.id] ?? 0)}
                                onChange={(event) => {
                                  const next = Math.max(0, Math.floor(Number(event.target.value) || 0));
                                  setAllocations((prev) => ({ ...prev, [share.id]: next }));
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {overAllocated && (
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      Total allocations exceed your monthly limit. Reduce the split so it is at or below {poolLimit.toLocaleString("en-GB")}.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Clients with a 0 allocation cannot send messages until you give them a slice. Allocations refresh monthly with your pool.
                  </p>
                </div>
              )}
            </CardContent>
            )}
          </Card>

          <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
                    <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="text-base sm:text-lg">Portal Branding</span>
                </div>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 dark:text-slate-400">
                Customise how the branded portal appears to your end clients.
              </CardDescription>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
              <Button
                type="button"
                onClick={saveSettings}
                className="bg-slate-900 text-white hover:bg-slate-800"
                disabled={!entitled || isSavingSettings || !brandingOpen}
              >
                {isSavingSettings ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                type="button"
                className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                onClick={() => setBrandingOpen((prev) => !prev)}
              >
                {brandingOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                {brandingOpen ? "Collapse" : "Expand"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {brandingOpen && (
        <CardContent className="space-y-4 border-t border-slate-200/80 bg-slate-50/30 pt-5 dark:border-input dark:bg-background">
          {!entitled && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              Your plan does not include the agency portal. Upgrade to the Agency plan in Billing to activate these settings.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="agency-name">Agency name</Label>
                  <Input
                    id="agency-name"
                    value={settings.agency_name || ""}
                    onChange={(event) => setSettings((prev) => (prev ? { ...prev, agency_name: event.target.value } : prev))}
                    placeholder="VR Tour 360"
                    disabled={!entitled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="agency-logo-upload">Agency logo</Label>
                  <div className="space-y-1.5">
                    <div className="flex h-10 items-center gap-2 rounded-md border px-2 dark:border-input dark:bg-background">
                      {settings.logo_url ? (
                        <img
                          src={settings.logo_url}
                          alt="Agency logo"
                          className="h-6 w-6 rounded object-contain ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded border border-dashed border-slate-300 dark:border-slate-600" />
                      )}

                      <input
                        id="agency-logo-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                        className="hidden"
                        disabled={!entitled || isUploadingLogo}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          setLogoFileName(file.name);
                          void uploadAgencyLogo(file);
                          event.currentTarget.value = "";
                        }}
                      />

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        disabled={!entitled || isUploadingLogo}
                        onClick={() => document.getElementById("agency-logo-upload")?.click()}
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Choose file"
                        )}
                      </Button>

                      <p className="flex-1 truncate text-xs text-muted-foreground">
                        {isUploadingLogo
                          ? logoFileName || "Uploading..."
                          : settings.logo_url
                          ? "Logo uploaded - PNG, JPEG, SVG, WebP up to 2MB."
                          : "No file chosen"}
                      </p>

                      {settings.logo_url ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={removeAgencyLogo}
                          disabled={!entitled || isUploadingLogo}
                          aria-label="Remove logo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className={entitled ? "" : "pointer-events-none opacity-60"}>
                  <ColorPicker
                    label="Primary colour"
                    value={settings.primary_colour || "#1E40AF"}
                    onChange={(value) => {
                      if (!entitled) return;
                      setSettings((prev) => (prev ? { ...prev, primary_colour: value } : prev));
                    }}
                    showPresets={false}
                  />
                </div>
                <div className={entitled ? "" : "pointer-events-none opacity-60"}>
                  <ColorPicker
                    label="Secondary colour"
                    value={settings.secondary_colour || "#0F172A"}
                    onChange={(value) => {
                      if (!entitled) return;
                      setSettings((prev) => (prev ? { ...prev, secondary_colour: value } : prev));
                    }}
                    showPresets={false}
                  />
                </div>
                <div className={entitled ? "" : "pointer-events-none opacity-60"}>
                  <ColorPicker
                    label="Portal background colour"
                    value={settings.portal_background_colour || "#F8FAFC"}
                    onChange={(value) => {
                      if (!entitled) return;
                      setSettings((prev) => (prev ? { ...prev, portal_background_colour: value } : prev));
                    }}
                    showPresets={false}
                  />
                </div>
              </div>

        </CardContent>
        )}
          </Card>

          <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
                        <Code className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <span className="text-base sm:text-lg">Portal Embed</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 dark:text-slate-400">
                    Embed this once on your site to give every client a single login page. Each client signs in with their own
                    credentials and is taken straight to their own portal.
                  </CardDescription>
                </div>
                <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
                  <Button
                    variant="outline"
                    type="button"
                    className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                    onClick={() => setEmbedOpen((prev) => !prev)}
                  >
                    {embedOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    {embedOpen ? "Collapse" : "Expand"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {embedOpen && (
            <CardContent className="space-y-4 border-t border-slate-200/80 bg-slate-50/30 pt-5 dark:border-input dark:bg-background">
              {universalEmbed && settings?.is_enabled ? (
                <>
                  <div className="h-px bg-slate-200 dark:bg-slate-800" />

                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <Code className="h-4 w-4" />
                      Simple IFrame Embed
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Easiest option. Uses a fixed height - adjust the height value to suit your page.
                    </p>
                    <Textarea
                      value={universalEmbed.iframe}
                      readOnly
                      rows={3}
                      className="resize-none border-slate-300 bg-slate-50 font-mono text-xs text-slate-700 dark:border-input dark:bg-background dark:text-slate-300"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyText(universalEmbed.iframe, "iFrame embed code")}
                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Code
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                      >
                        <a href={universalEmbed.previewUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Preview login page
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200 dark:bg-slate-800" />

                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <Code className="h-4 w-4" />
                      Advanced Script Embed
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Recommended. Automatically resizes to fit the portal - no fixed height or inner scrollbar.
                    </p>
                    <Textarea
                      value={universalEmbed.script}
                      readOnly
                      rows={7}
                      className="resize-none border-slate-300 bg-slate-50 font-mono text-xs text-slate-700 dark:border-input dark:bg-background dark:text-slate-300"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyText(universalEmbed.script, "Script embed code")}
                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Script
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Client emails must be unique across your agency for the login to route each client correctly.
                  </p>
                </>
              ) : (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Enable the agency portal in Portal Branding and save agency settings to generate your embed code.
                </p>
              )}
            </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="client" className="space-y-6">
      {showAgencyPortalContent ? (
        <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Manage client portals</CardTitle>
                {totalSpaces != null ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Spaces used: <span className="font-semibold text-foreground">{primarySpacesUsed}/{totalSpaces}</span>
                  </p>
                ) : null}
              </div>
              <Button onClick={openAddClient} disabled={!entitled || !canAddClient}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add client
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!canAddClient ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                You have used all available spaces. Buy an agency additional space in Billing to add another client.
              </div>
            ) : null}
            {tours.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clients yet. Use &quot;Add client&quot; to set up your first client portal.</p>
            ) : (
              tours.map((tour) => {
                const share = shareByTourId[tour.id];
                return (
                  <div key={tour.id} className="rounded-lg border p-3 dark:border-input dark:bg-background">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{tour.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {tour.tour_type === "secondary" ? "Secondary tour" : "Primary tour"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {share ? (
                          <Badge variant={share.is_active ? "default" : "outline"}>
                            {share.is_active ? "Shared" : "Disabled"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not shared</Badge>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => openShareModal(tour, share)}
                          disabled={!entitled}
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          <span className="sm:hidden">Manage</span>
                          <span className="hidden sm:inline">Manage client</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            The Agency plan is required to share tour chatbots with your clients. Upgrade in Billing to activate client sharing.
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddClientOpen} onOpenChange={handleAddClientOpenChange}>
        <DialogContent className="sm:max-w-[40rem] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {addClientStep === "success" ? "Client added" : "Add new client"}
            </DialogTitle>
          </DialogHeader>

          {addClientStep === "form" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set up a new client tour and their branded portal in one step. After creating, you&apos;ll be taken to the tour viewer to check and position the tour.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ac-client-name">Client / business name</Label>
                  <Input
                    id="ac-client-name"
                    value={acClientName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAcClientName(value);
                      if (!acTourNameEdited) setAcTourName(value);
                    }}
                    placeholder="Shropshire Wedding Venue"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ac-tour-name">Tour name</Label>
                  <Input
                    id="ac-tour-name"
                    value={acTourName}
                    onChange={(event) => {
                      setAcTourName(event.target.value);
                      setAcTourNameEdited(true);
                    }}
                    placeholder="Main Venue Tour"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ac-matterport-url">Matterport tour URL</Label>
                <Input
                  id="ac-matterport-url"
                  value={acMatterportUrl}
                  onChange={(event) => setAcMatterportUrl(event.target.value)}
                  placeholder="https://my.matterport.com/show/?m=XXXXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground">
                  Paste the full share URL - the model ID is detected automatically.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ac-description">Description (optional)</Label>
                <Textarea
                  id="ac-description"
                  rows={2}
                  value={acDescription}
                  onChange={(event) => setAcDescription(event.target.value)}
                  placeholder="A short description of this client's tour."
                />
              </div>

              <div className="space-y-3 rounded-lg border p-3 dark:border-input dark:bg-background">
                <p className="text-sm font-medium">Client portal login</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ac-client-email">Client login email</Label>
                    <Input
                      id="ac-client-email"
                      type="email"
                      value={acClientEmail}
                      onChange={(event) => setAcClientEmail(event.target.value)}
                      placeholder="client@theirbusiness.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ac-client-password">Password (optional)</Label>
                    <Input
                      id="ac-client-password"
                      type="text"
                      value={acClientPassword}
                      onChange={(event) => setAcClientPassword(event.target.value)}
                      placeholder="Leave blank to auto-generate"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ac-slug">Portal slug</Label>
                  <Input
                    id="ac-slug"
                    value={acSlug || normaliseShareSlug(`${(acTourNameEdited ? acTourName : acTourName || acClientName) || ""}-chatbot`)}
                    onChange={(event) => {
                      setAcSlug(event.target.value);
                      setAcSlugEdited(true);
                    }}
                    placeholder="shropshire-wedding-venue-chatbot"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in the portal address. Letters, numbers and dashes only.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleAddClientOpenChange(false)} disabled={isCreatingClient}>
                  Cancel
                </Button>
                <Button onClick={createClient} disabled={isCreatingClient}>
                  {isCreatingClient ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create client"
                  )}
                </Button>
              </div>
            </div>
          ) : createdClient ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                {createdClient.tourName} has been created with its client portal. Share the login details below with your client.
              </div>

              <div className="space-y-2 rounded-lg border p-3 dark:border-input dark:bg-background">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Login email</p>
                    <p className="truncate text-sm font-medium">{createdClient.email}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(createdClient.email, "Email")}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
                {createdClient.password ? (
                  <>
                    <div className="flex items-center justify-between gap-2 border-t pt-2 dark:border-input">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Password</p>
                        <p className="truncate font-mono text-sm font-medium">{createdClient.password}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(createdClient.password || "", "Password")}>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>
                    <p className="border-t pt-2 text-xs font-medium text-amber-600 dark:border-input dark:text-amber-400">
                      Copy this password now - for security it is only shown once and cannot be retrieved later. If lost, regenerate it from &quot;Share chatbot settings&quot;.
                    </p>
                  </>
                ) : (
                  <p className="border-t pt-2 text-xs text-muted-foreground dark:border-input">
                    The existing password for this email was kept. Use &quot;Share chatbot settings&quot; to reset it if needed.
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Next, open the tour to check it. You can fine-tune the portal settings any time via &quot;Client Settings&quot;.
              </p>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleAddClientOpenChange(false)}>
                  Done
                </Button>
                <Button onClick={goPositionCreatedTour}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open tour
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-[46rem] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedTour ? `Client Settings - ${selectedTour.title}` : "Client Settings"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-1 pb-1">
            <div className="space-y-1.5">
              <Label htmlFor="share-slug">Tour slug</Label>
              <Input
                id="share-slug"
                value={shareSlug}
                onChange={(event) => setShareSlug(event.target.value)}
                placeholder="lilybrooke-manor-chatbot"
              />
            </div>

            <div className="space-y-2 rounded-lg border p-3 dark:border-input dark:bg-background">
              <p className="text-sm font-medium">Portal tabs</p>
              <p className="text-xs text-muted-foreground">
                Control which tabs appear in this client&apos;s portal. Disabled tabs are hidden entirely.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(enabledModules).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="capitalize">{key}</Label>
                    <Switch
                      checked={Boolean(value)}
                      onCheckedChange={(checked) => setEnabledModules((prev) => ({ ...prev, [key]: checked }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-3 dark:border-input dark:bg-background">
              <p className="text-sm font-medium">Tour blocks</p>
              <p className="text-xs text-muted-foreground">
                Control which sections appear inside the Tour tab for this share.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(tourBlocks).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="capitalize">{key}</Label>
                    <Switch
                      checked={Boolean(value)}
                      onCheckedChange={(checked) => setTourBlocks((prev) => ({ ...prev, [key]: checked }))}
                      disabled={!enabledModules.tour}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-3 dark:border-input dark:bg-background">
              <p className="text-sm font-medium">Settings blocks</p>
              <p className="text-xs text-muted-foreground">
                Control which sections appear inside the Settings tab for this share.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(settingsBlocks).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="capitalize">{key}</Label>
                    <Switch
                      checked={Boolean(value)}
                      onCheckedChange={(checked) => setSettingsBlocks((prev) => ({ ...prev, [key]: checked }))}
                      disabled={!enabledModules.settings}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="client-email">Client email</Label>
                <Input
                  id="client-email"
                  value={clientEmail}
                  onChange={(event) => setClientEmail(event.target.value)}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-password">Client password</Label>
                <Input
                  id="client-password"
                  type="password"
                  value={clientPassword}
                  onChange={(event) => setClientPassword(event.target.value)}
                  placeholder={selectedShare ? "Leave blank to keep current password" : "Minimum 8 characters"}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 dark:border-input dark:bg-background">
              <div>
                <p className="text-sm font-medium">Portal active</p>
                <p className="text-xs text-muted-foreground">Disable to immediately block portal access.</p>
              </div>
              <Switch checked={shareActive} onCheckedChange={setShareActive} />
            </div>

            {selectedShare && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => toggleShare(selectedShare.id, !selectedShare.is_active)}
                  disabled={isSavingShare}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {selectedShare.is_active ? "Disable portal" : "Enable portal"}
                </Button>
                <Button
                  variant="outline"
                  onClick={regenerateCredentials}
                  disabled={isSavingShare || !clientEmail}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Regenerate password
                </Button>
              </div>
            )}

            {temporaryPassword && (
              <div ref={temporaryPasswordRef} className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-950/40">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                  New password generated. Share the login details below with your client.
                </p>
                <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 dark:border-emerald-800 dark:bg-background">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Login email</p>
                    <p className="truncate text-sm font-medium">{clientEmail}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyText(clientEmail, "Email")}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 dark:border-emerald-800 dark:bg-background">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Password</p>
                    <p className="truncate font-mono text-sm font-medium">{temporaryPassword}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyText(temporaryPassword, "Password")}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Copy this password now - for security it is only shown once and cannot be retrieved later. If lost, regenerate it again from here.
                </p>
              </div>
            )}

            {embedCodes && (
              <div className="rounded-lg border p-3 dark:border-input dark:bg-background space-y-2">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="embed-width">Embed width</Label>
                    <Input
                      id="embed-width"
                      value={embedWidth}
                      onChange={(event) => setEmbedWidth(event.target.value)}
                      placeholder="100%"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="embed-height">Embed height</Label>
                    <Input
                      id="embed-height"
                      value={embedHeight}
                      onChange={(event) => setEmbedHeight(event.target.value)}
                      placeholder="900px"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Simple iFrame embed</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyText(embedCodes.iframe, "iFrame embed code")}
                    disabled={!selectedShare || !settings?.is_enabled}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy iFrame code
                  </Button>
                </div>
                <Textarea
                  readOnly
                  rows={3}
                  value={embedCodes.iframe}
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Advanced script embed</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyText(embedCodes.script, "Script embed code")}
                    disabled={!selectedShare || !settings?.is_enabled}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy script code
                  </Button>
                </div>
                <Textarea
                  readOnly
                  rows={4}
                  value={embedCodes.script}
                />

                {!selectedShare ? (
                  <p className="text-xs text-muted-foreground">
                    Temporary preview works before save. Save share to enable permanent preview and embed code.
                  </p>
                ) : null}
                {selectedShare && !settings?.is_enabled ? (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Agency portal is currently disabled in Portal Branding. Enable it and save agency settings to activate permanent preview and embed code.
                  </p>
                ) : null}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              {embedCodes ? (
                <Button variant="outline" asChild>
                  <a
                    href={canUsePermanentPreview ? embedCodes.previewUrl : temporaryPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {canUsePermanentPreview ? "Open preview" : "Open temporary preview"}
                  </a>
                </Button>
              ) : null}
              <Button onClick={saveShare} disabled={isSavingShare || !selectedTour}>
                {isSavingShare ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

