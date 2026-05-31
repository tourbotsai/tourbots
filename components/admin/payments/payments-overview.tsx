"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PoundSterling,
  Users,
  Briefcase,
  Building2,
  RefreshCw,
  ExternalLink,
  Search,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AddonRow {
  code: string;
  name: string;
  quantity: number;
  amount: number;
  status: "active" | "cancelling";
  nextPayment: string | null;
  accessEndsAt: string | null;
}

interface AccountRow {
  venueId: string;
  name: string;
  email: string | null;
  slug: string | null;
  planCode: string;
  planAmount: number;
  planStatus: string;
  nextBilling: string | null;
  accessEndsAt: string | null;
  addons: AddonRow[];
  monthlyTotal: number;
  hasStripeSubscription: boolean;
}

interface OverviewData {
  mrrGbp: number;
  kpis: { payingAccounts: number; proAccounts: number; agencyAccounts: number; totalAccounts: number };
  accounts: AccountRow[];
}

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", agency: "Agency" };

type PlanFilter = "all" | "pro" | "agency" | "free";
type StatusFilter = "all" | "active" | "cancelling" | "past_due";
type SortKey = "revenue_desc" | "revenue_asc" | "name_asc" | "next_billing";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB");
}

function planLabel(code: string) {
  return PLAN_LABELS[code] || (code ? code.toUpperCase() : "Free");
}

function statusLabel(status: string) {
  return (status || "free").replace("_", " ");
}

export function PaymentsOverview() {
  const { toast } = useToast();
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("revenue_desc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/payments/overview");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load payments overview");
      setData(result);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load payments overview", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = [
    { label: "Monthly recurring revenue", value: data ? formatGbp(data.mrrGbp) : "—", icon: PoundSterling },
    { label: "Paying accounts", value: data ? String(data.kpis.payingAccounts) : "—", icon: Users },
    { label: "Pro accounts", value: data ? String(data.kpis.proAccounts) : "—", icon: Briefcase },
    { label: "Agency accounts", value: data ? String(data.kpis.agencyAccounts) : "—", icon: Building2 },
  ];

  const accounts = data?.accounts || [];
  const isFiltering = search.trim() !== "" || planFilter !== "all" || statusFilter !== "all";

  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    if (planFilter !== "all") {
      result = result.filter((account) => account.planCode === planFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((account) => {
        if (statusFilter === "cancelling") {
          return account.planStatus === "cancelling" || account.addons.some((a) => a.status === "cancelling");
        }
        return account.planStatus === statusFilter;
      });
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((account) => {
        return (
          account.name.toLowerCase().includes(q) ||
          (account.email || "").toLowerCase().includes(q) ||
          (account.slug || "").toLowerCase().includes(q)
        );
      });
    }

    switch (sortBy) {
      case "revenue_asc":
        result.sort((a, b) => a.monthlyTotal - b.monthlyTotal);
        break;
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "next_billing":
        result.sort((a, b) => (a.nextBilling || "9999").localeCompare(b.nextBilling || "9999"));
        break;
      case "revenue_desc":
      default:
        result.sort((a, b) => b.monthlyTotal - a.monthlyTotal);
        break;
    }

    return result;
  }, [accounts, planFilter, statusFilter, search, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setPlanFilter("all");
    setStatusFilter("all");
  };

  const toggle = (venueId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(venueId)) next.delete(venueId);
      else next.add(venueId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-slate-900">Revenue</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOverview}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-600">{item.label}</p>
                  <item.icon className="h-4 w-4 text-slate-400" />
                </div>
                {isLoading ? (
                  <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
                ) : (
                  <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            All figures are pulled live from Stripe (recurring monthly totals exclude subscriptions scheduled to cancel).
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search / filter / sort controls */}
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by account name, email, or slug…"
                className="h-9 border-slate-300 pl-8 pr-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as PlanFilter)}>
              <SelectTrigger className="h-9 border-slate-300 lg:w-[150px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="agency">Agency</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="h-9 border-slate-300 lg:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelling">Cancelling</SelectItem>
                <SelectItem value="past_due">Past due</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="h-9 border-slate-300 lg:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue_desc">Highest revenue</SelectItem>
                <SelectItem value="revenue_asc">Lowest revenue</SelectItem>
                <SelectItem value="name_asc">Account name (A–Z)</SelectItem>
                <SelectItem value="next_billing">Next billing date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Result count + clear */}
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredAccounts.length} of {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
            </span>
            {isFiltering && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-600">
              No accounts match your filters.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAccounts.map((account) => {
                const isOpen = expanded.has(account.venueId);
                const hasDetail = account.addons.length > 0 || account.hasStripeSubscription;
                return (
                  <div key={account.venueId} className="rounded-lg border border-slate-200 bg-white">
                    <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggle(account.venueId)}
                          className="rounded p-0.5 text-slate-400 hover:text-slate-700"
                          aria-label={isOpen ? "Collapse" : "Expand"}
                          disabled={!hasDetail}
                        >
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{account.name}</p>
                          <p className="truncate text-xs text-slate-500">{account.email || "No email"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 sm:justify-end">
                        <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                          {planLabel(account.planCode)}
                        </Badge>
                        {account.addons.length > 0 && (
                          <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                            {account.addons.length} add-on{account.addons.length === 1 ? "" : "s"}
                          </Badge>
                        )}
                        <span className="font-medium text-slate-900">{formatGbp(account.monthlyTotal)}/mo</span>
                        <span className="capitalize">{statusLabel(account.planStatus)}</span>
                        <span>
                          {account.planStatus === "cancelling"
                            ? `Ends ${formatDate(account.accessEndsAt)}`
                            : `Next ${formatDate(account.nextBilling)}`}
                        </span>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          <Link href={`/admin/accounts/${account.venueId}`}>
                            View account
                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {isOpen && hasDetail && (
                      <div className="border-t border-slate-200 bg-slate-50/50 p-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-600">
                            <span className="font-medium text-slate-900">{planLabel(account.planCode)} plan</span>
                            <span>{formatGbp(account.planAmount)}/mo</span>
                            <span className="capitalize">Status: {statusLabel(account.planStatus)}</span>
                            {account.planStatus === "cancelling" ? (
                              <span>Access ends: {formatDate(account.accessEndsAt)}</span>
                            ) : (
                              <span>Next payment: {formatDate(account.nextBilling)}</span>
                            )}
                          </div>
                          {account.addons.length === 0 ? (
                            <p className="px-1 text-xs text-slate-500">No add-ons on this account.</p>
                          ) : (
                            account.addons.map((addon, index) => (
                              <div
                                key={`${addon.code}-${index}`}
                                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-600"
                              >
                                <span className="font-medium text-slate-900">
                                  {addon.name}
                                  {addon.quantity > 1 ? ` ×${addon.quantity}` : ""}
                                </span>
                                <span>{formatGbp(addon.amount)}/mo</span>
                                <span>Status: {addon.status === "cancelling" ? "cancelling" : "active"}</span>
                                {addon.status === "cancelling" ? (
                                  <span>Access ends: {formatDate(addon.accessEndsAt)}</span>
                                ) : (
                                  <span>Next payment: {formatDate(addon.nextPayment)}</span>
                                )}
                              </div>
                            ))
                          )}
                          <div className="flex justify-end px-1 pt-1 text-xs font-medium text-slate-900">
                            Total recurring: {formatGbp(account.monthlyTotal)}/mo
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
