"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, RefreshCw, Copy, Check } from "lucide-react";
import { usePaymentManagement } from "@/hooks/admin/usePaymentManagement";
import { useToast } from "@/components/ui/use-toast";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", agency: "Agency" };

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  active: "Active",
  cancelled: "Cancelled",
  past_due: "Past due",
  expired: "Expired",
};

export function PaymentLinksList() {
  const { paymentLinks, isLoading, fetchAllData } = usePaymentManagement();
  const { toast } = useToast();
  const [copiedLinkId, setCopiedLinkId] = useState<string>("");

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const copyPaymentLink = async (linkId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(linkId);
      toast({ title: "Copied", description: "Payment link copied to clipboard." });
      setTimeout(() => setCopiedLinkId(""), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-slate-900">
            <CreditCard className="h-4 w-4 text-slate-500" />
            Payment links ({paymentLinks.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={isLoading}
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ) : paymentLinks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-600">
            No payment links created yet.
          </div>
        ) : (
          <div className="space-y-2">
            {paymentLinks.map((link: any) => {
              const url = link.stripe_url || link.stripe_payment_link_url;
              return (
                <div
                  key={link.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {link.venues?.name || "Unknown account"}
                    </p>
                    <p className="truncate text-xs text-slate-500">{link.customer_email || "No email"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 sm:justify-end">
                    <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                      {PLAN_LABELS[link.plan_name] || (link.plan_name || "").toUpperCase()}
                    </Badge>
                    <span>{link.custom_price ? `${formatCurrency(link.custom_price)} custom` : "Standard pricing"}</span>
                    <span className="capitalize">{STATUS_LABELS[link.status] || link.status}</span>
                    <span>{formatDate(link.created_at)}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPaymentLink(link.id, url)}
                        disabled={!url}
                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      >
                        {copiedLinkId === link.id ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                        {copiedLinkId === link.id ? "Copied" : "Copy"}
                      </Button>
                      {url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            Open
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
