"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminBilling } from "@/hooks/admin/useAdminBilling";
import { RefreshCw, ChevronDown } from "lucide-react";

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
  const [openVenueId, setOpenVenueId] = useState<string | null>(null);

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
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-slate-900">Plan overrides</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBillingRows(search.trim())}
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-slate-500">
          Manually set a plan, add-on counts, or hard limit overrides for an account. Use sparingly — these bypass the
          normal Stripe-driven entitlements.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Search account name, slug, or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
            }}
            className="border-slate-300"
          />
          <Button onClick={handleSearch} className="bg-slate-900 text-white hover:bg-slate-800">
            Search
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-600">
            No accounts found.
          </div>
        ) : (
          rows.map((row) => {
            const draft = drafts[row.venue.id];
            if (!draft) return null;
            const isOpen = openVenueId === row.venue.id;

            return (
              <Collapsible
                key={row.venue.id}
                open={isOpen}
                onOpenChange={(open) => setOpenVenueId(open ? row.venue.id : null)}
              >
                <div className="rounded-lg border border-slate-200 bg-white">
                  <CollapsibleTrigger asChild>
                    <div className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{row.venue.name}</p>
                        <p className="truncate text-xs text-slate-500">{row.venue.slug} · {row.venue.email || "No email"}</p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                          {draft.plan_code.toUpperCase()}
                        </Badge>
                        {draft.billing_override_enabled && (
                          <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                            Override
                          </Badge>
                        )}
                        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-slate-200 p-4">
                      <div className="grid gap-3 lg:grid-cols-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Plan</Label>
                          <Select value={draft.plan_code} onValueChange={(value) => updateDraft(row.venue.id, { plan_code: value })}>
                            <SelectTrigger className="border-slate-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {planCodes.map((code) => (
                                <SelectItem key={code} value={code}>{code.toUpperCase()}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Billing status</Label>
                          <Select
                            value={draft.billing_status}
                            onValueChange={(value) => updateDraft(row.venue.id, { billing_status: value as DraftState[string]["billing_status"] })}
                          >
                            <SelectTrigger className="border-slate-300">
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

                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Extra spaces add-on</Label>
                          <Input
                            type="number"
                            min={0}
                            value={draft.addon_extra_spaces}
                            onChange={(event) => updateDraft(row.venue.id, { addon_extra_spaces: Number(event.target.value || 0) })}
                            className="border-slate-300"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Message blocks add-on</Label>
                          <Input
                            type="number"
                            min={0}
                            value={draft.addon_message_blocks}
                            onChange={(event) => updateDraft(row.venue.id, { addon_message_blocks: Number(event.target.value || 0) })}
                            className="border-slate-300"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Override enabled</Label>
                          <div className="flex h-10 items-center rounded-md border border-slate-300 px-3">
                            <Switch
                              checked={draft.billing_override_enabled}
                              onCheckedChange={(checked) => updateDraft(row.venue.id, { billing_override_enabled: checked })}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Override plan</Label>
                          <Select
                            value={draft.override_plan_code || "none"}
                            onValueChange={(value) => updateDraft(row.venue.id, { override_plan_code: value === "none" ? "" : value })}
                          >
                            <SelectTrigger className="border-slate-300">
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

                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Space limit override</Label>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Auto"
                            value={draft.effective_space_limit}
                            onChange={(event) => updateDraft(row.venue.id, { effective_space_limit: event.target.value })}
                            className="border-slate-300"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Message limit override</Label>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Auto"
                            value={draft.effective_message_limit}
                            onChange={(event) => updateDraft(row.venue.id, { effective_message_limit: event.target.value })}
                            className="border-slate-300"
                          />
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                        <Input
                          placeholder="Internal billing notes..."
                          value={draft.notes}
                          onChange={(event) => updateDraft(row.venue.id, { notes: event.target.value })}
                          className="border-slate-300"
                        />
                        <div className="flex h-10 items-center gap-3 rounded-md border border-slate-300 px-3 text-sm text-slate-700">
                          White-label
                          <Switch
                            checked={draft.addon_white_label}
                            onCheckedChange={(checked) => updateDraft(row.venue.id, { addon_white_label: checked })}
                          />
                        </div>
                        <Button
                          onClick={() => handleSave(row.venue.id)}
                          disabled={savingVenueId === row.venue.id}
                          className="bg-slate-900 text-white hover:bg-slate-800"
                        >
                          {savingVenueId === row.venue.id ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
