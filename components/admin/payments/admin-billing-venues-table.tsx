"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminBilling } from "@/hooks/admin/useAdminBilling";
import { RefreshCw } from "lucide-react";

interface DraftState {
  [venueId: string]: {
    plan_code: string;
    billing_status: 'free' | 'active' | 'past_due' | 'cancelled' | 'trialing';
    billing_override_enabled: boolean;
    override_plan_code: string;
    addon_extra_spaces: number;
    addon_message_blocks: number;
    addon_white_label: boolean;
    effective_space_limit: string;
    effective_message_limit: string;
    notes: string;
  };
}

export function AdminBillingVenuesTable() {
  const { plans, rows, isLoading, fetchBillingRows, updateVenueBilling } = useAdminBilling();
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<DraftState>({});
  const [savingVenueId, setSavingVenueId] = useState<string | null>(null);

  const planCodes = useMemo(() => plans.map((plan) => plan.code), [plans]);

  useEffect(() => {
    fetchBillingRows();
  }, [fetchBillingRows]);

  useEffect(() => {
    const nextDrafts: DraftState = {};
    rows.forEach((row) => {
      const record = row.billingRecord;
      nextDrafts[row.venue.id] = {
        plan_code: record?.plan_code || "free",
        billing_status: (record?.billing_status || "free") as DraftState[string]["billing_status"],
        billing_override_enabled: record?.billing_override_enabled || false,
        override_plan_code: record?.override_plan_code || "",
        addon_extra_spaces: record?.addon_extra_spaces || 0,
        addon_message_blocks: record?.addon_message_blocks || 0,
        addon_white_label: record?.addon_white_label || false,
        effective_space_limit:
          record?.effective_space_limit !== null && record?.effective_space_limit !== undefined
            ? String(record.effective_space_limit)
            : "",
        effective_message_limit:
          record?.effective_message_limit !== null && record?.effective_message_limit !== undefined
            ? String(record.effective_message_limit)
            : "",
        notes: record?.notes || "",
      };
    });
    setDrafts(nextDrafts);
  }, [rows]);

  const handleSearch = async () => {
    await fetchBillingRows(search.trim());
  };

  const updateDraft = (venueId: string, updates: Partial<DraftState[string]>) => {
    setDrafts((prev) => ({
      ...prev,
      [venueId]: {
        ...prev[venueId],
        ...updates,
      },
    }));
  };

  const handleSave = async (venueId: string) => {
    const draft = drafts[venueId];
    if (!draft) return;

    setSavingVenueId(venueId);
    await updateVenueBilling(venueId, {
      plan_code: draft.plan_code,
      billing_status: draft.billing_status,
      billing_override_enabled: draft.billing_override_enabled,
      override_plan_code: draft.override_plan_code || null,
      addon_extra_spaces: draft.addon_extra_spaces,
      addon_message_blocks: draft.addon_message_blocks,
      addon_white_label: draft.addon_white_label,
      effective_space_limit: draft.effective_space_limit === "" ? null : Number(draft.effective_space_limit),
      effective_message_limit: draft.effective_message_limit === "" ? null : Number(draft.effective_message_limit),
      notes: draft.notes || null,
    });
    setSavingVenueId(null);
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>Subscriptions</CardTitle>
          <Button variant="outline" size="sm" onClick={() => fetchBillingRows(search.trim())}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search venue name, slug, or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
            }}
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No venues found.
          </div>
        ) : (
          rows.map((row) => {
            const draft = drafts[row.venue.id];
            if (!draft) return null;

            return (
              <div key={row.venue.id} className="rounded-lg border p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{row.venue.name}</p>
                    <p className="text-sm text-muted-foreground">{row.venue.slug} - {row.venue.email || "No email"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Legacy: {row.venue.subscription_plan || "n/a"}</Badge>
                    <Badge>{draft.plan_code.toUpperCase()}</Badge>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-4">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <Select value={draft.plan_code} onValueChange={(value) => updateDraft(row.venue.id, { plan_code: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {planCodes.map((code) => (
                          <SelectItem key={code} value={code}>{code.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Billing status</p>
                    <Select
                      value={draft.billing_status}
                      onValueChange={(value) => updateDraft(row.venue.id, { billing_status: value as DraftState[string]["billing_status"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trialing">Trialing</SelectItem>
                        <SelectItem value="past_due">Past due</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Extra spaces add-on</p>
                    <Input
                      type="number"
                      min={0}
                      value={draft.addon_extra_spaces}
                      onChange={(event) =>
                        updateDraft(row.venue.id, { addon_extra_spaces: Number(event.target.value || 0) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Message blocks add-on</p>
                    <Input
                      type="number"
                      min={0}
                      value={draft.addon_message_blocks}
                      onChange={(event) =>
                        updateDraft(row.venue.id, { addon_message_blocks: Number(event.target.value || 0) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Override enabled</p>
                    <div className="flex h-10 items-center rounded-md border px-3">
                      <Switch
                        checked={draft.billing_override_enabled}
                        onCheckedChange={(checked) => updateDraft(row.venue.id, { billing_override_enabled: checked })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Override plan</p>
                    <Select
                      value={draft.override_plan_code || "none"}
                      onValueChange={(value) => updateDraft(row.venue.id, { override_plan_code: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {planCodes.map((code) => (
                          <SelectItem key={code} value={code}>{code.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Space limit override</p>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Auto"
                      value={draft.effective_space_limit}
                      onChange={(event) => updateDraft(row.venue.id, { effective_space_limit: event.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Message limit override</p>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Auto"
                      value={draft.effective_message_limit}
                      onChange={(event) => updateDraft(row.venue.id, { effective_message_limit: event.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                  <Input
                    placeholder="Internal billing notes..."
                    value={draft.notes}
                    onChange={(event) => updateDraft(row.venue.id, { notes: event.target.value })}
                  />
                  <div className="flex h-10 items-center rounded-md border px-3 text-sm">
                    White-label
                    <Switch
                      className="ml-3"
                      checked={draft.addon_white_label}
                      onCheckedChange={(checked) => updateDraft(row.venue.id, { addon_white_label: checked })}
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(row.venue.id)}
                    disabled={savingVenueId === row.venue.id}
                  >
                    {savingVenueId === row.venue.id ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
