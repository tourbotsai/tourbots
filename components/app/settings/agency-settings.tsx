"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { ColorPicker } from "@/components/app/chatbots/shared/color-picker";
import { generateAgencyPortalEmbed } from "@/lib/embed-generator";
import { Building2, Copy, ExternalLink, KeyRound, Loader2, Lock, Save, Share2, Trash2 } from "lucide-react";

interface AgencyPortalSettings {
  id: string;
  venue_id: string;
  is_enabled: boolean;
  agency_name: string | null;
  logo_url: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  allowed_domains: string[];
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
    settings_blocks?: {
      config?: boolean;
      information?: boolean;
      documents?: boolean;
      triggers?: boolean;
    };
  };
  users: ShareUser[];
}

const defaultModules = {
  tour: true,
  settings: true,
  customisation: true,
  analytics: true,
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

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoFileName, setLogoFileName] = useState("");
  const [isSavingShare, setIsSavingShare] = useState(false);
  const [settings, setSettings] = useState<AgencyPortalSettings | null>(null);
  const [entitled, setEntitled] = useState(false);
  const [tours, setTours] = useState<TourRow[]>([]);
  const [shares, setShares] = useState<ShareRow[]>([]);

  const [domainsText, setDomainsText] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<TourRow | null>(null);
  const [selectedShare, setSelectedShare] = useState<ShareRow | null>(null);
  const [shareSlug, setShareSlug] = useState("");
  const [shareActive, setShareActive] = useState(true);
  const [enabledModules, setEnabledModules] = useState(defaultModules);
  const [settingsBlocks, setSettingsBlocks] = useState(defaultSettingsBlocks);
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [regenPassword, setRegenPassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
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
      showHeader: "true",
      tour: String(enabledModules.tour ?? true),
      settings: String(enabledModules.settings ?? true),
      customisation: String(enabledModules.customisation ?? true),
      analytics: String(enabledModules.analytics ?? true),
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
    selectedTour?.title,
    enabledModules.settings,
    enabledModules.tour,
    enabledModules.customisation,
    enabledModules.analytics,
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
      setEntitled(Boolean(settingsJson.entitlement?.addon_agency_portal));
      setDomainsText((settingsJson.settings?.allowed_domains || []).join("\n"));
      setTours(sharesJson.tours || []);
      setShares(sharesJson.shares || []);
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

  const saveSettings = async () => {
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const parsedDomains = domainsText
        .split(/[\n,]/)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);

      const response = await fetch("/api/app/agency-portal/settings", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          is_enabled: settings.is_enabled,
          agency_name: settings.agency_name || null,
          logo_url: settings.logo_url || null,
          primary_colour: settings.primary_colour || null,
          secondary_colour: settings.secondary_colour || null,
          allowed_domains: parsedDomains,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save agency settings");
      }

      setSettings(data);
      setDomainsText((data.allowed_domains || []).join("\n"));
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
        description: "Share the new temporary password with your client.",
      });
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

  const showAgencyPortalContent = settings.is_enabled;

  return (
    <div className="space-y-6">
      <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
        <CardHeader>
          <CardTitle>Agency Portal Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!entitled && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              Agency Portal add-on is not enabled on this account yet. Purchase the add-on in Billing to activate this tab.
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3 dark:border-input dark:bg-background">
            <div>
              <p className="font-medium">Enable agency portal</p>
              <p className="text-xs text-muted-foreground">Turn on branded end-client access for shared tours.</p>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(value) => setSettings((prev) => (prev ? { ...prev, is_enabled: value } : prev))}
              disabled={!entitled}
            />
          </div>

          {!showAgencyPortalContent ? (
            <p className="text-xs text-muted-foreground">
              Turn this on and save to unlock agency branding, domain allowlisting, and per-tour client sharing.
            </p>
          ) : (
            <>
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="allowed-domains">Allowed domains (one per line)</Label>
                <Textarea
                  id="allowed-domains"
                  rows={4}
                  value={domainsText}
                  onChange={(event) => setDomainsText(event.target.value)}
                  placeholder={"vrtour360.co.uk\nwww.vrtour360.co.uk"}
                  disabled={!entitled}
                />
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={!entitled || isSavingSettings}>
              <Save className="mr-2 h-4 w-4" />
              {isSavingSettings ? "Saving..." : "Save agency settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showAgencyPortalContent ? (
        <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
          <CardHeader>
            <CardTitle>Per-tour Client Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tours.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active tours available.</p>
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
                          <span className="sm:hidden">Share</span>
                          <span className="hidden sm:inline">Share chatbot settings</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-[46rem] max-h-[90vh] overflow-visible flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedTour ? `Share Settings - ${selectedTour.title}` : "Share Settings"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto px-1 pb-1">
            <div className="space-y-1.5">
              <Label htmlFor="share-slug">Share slug</Label>
              <Input
                id="share-slug"
                value={shareSlug}
                onChange={(event) => setShareSlug(event.target.value)}
                placeholder="lilybrooke-manor-chatbot"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 dark:border-input dark:bg-background">
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
                <p className="text-sm font-medium">Share active</p>
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
                  {selectedShare.is_active ? "Disable share" : "Enable share"}
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

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    asChild
                  >
                    <a
                      href={canUsePermanentPreview ? embedCodes.previewUrl : temporaryPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {canUsePermanentPreview ? "Open preview" : "Open temporary preview"}
                    </a>
                  </Button>
                </div>
                {!selectedShare ? (
                  <p className="text-xs text-muted-foreground">
                    Temporary preview works before save. Save share to enable permanent preview and embed code.
                  </p>
                ) : null}
                {selectedShare && !settings?.is_enabled ? (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Agency portal is currently disabled in Agency Portal Branding. Enable it and save agency settings to activate permanent preview and embed code.
                  </p>
                ) : null}
              </div>
            )}

            {temporaryPassword && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-900 dark:bg-green-950/30">
                <p className="text-sm font-medium text-green-900 dark:text-green-300">Temporary password</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded bg-white px-2 py-1 text-sm dark:bg-background">{temporaryPassword}</code>
                  <Button size="sm" variant="outline" onClick={() => copyText(temporaryPassword, "Temporary password")}>
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={saveShare} disabled={isSavingShare || !selectedTour}>
                {isSavingShare ? "Saving..." : "Save share"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

