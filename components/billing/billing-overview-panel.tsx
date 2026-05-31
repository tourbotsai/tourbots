"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink, FileText } from "lucide-react";

interface AddonSubscriptionDetail {
  id: string;
  code: string;
  quantity: number;
  amount: number;
  status: "active" | "cancelling";
  startedAt: string | null;
  nextPayment: string | null;
  cancelAtPeriodEnd: boolean;
  accessEndsAt: string | null;
}

interface BillingLimits {
  baseSpaces: number;
  baseMessages: number;
  totalSpaces: number;
  totalMessages: number;
}

export interface BillingOverviewData {
  plans?: any[];
  addons?: any[];
  billingRecord?: any;
  activePlan?: any | null;
  limits?: BillingLimits | null;
  addonSubscriptionList?: AddonSubscriptionDetail[];
  messageUsage?: { used: number; limit: number; resetAt: string } | null;
  subscriptionStatus?: any;
  subscriptionDetails?: any;
  invoices?: any[];
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return parsed.toLocaleDateString("en-GB");
}

function formatGbp(value: number) {
  return `£${Number(value || 0).toFixed(2)}`;
}

function formatInvoiceAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: (currency || "gbp").toUpperCase(),
    }).format(Number(amount || 0));
  } catch {
    return `£${Number(amount || 0).toFixed(2)}`;
  }
}

/**
 * Read-only billing overview, rendered from the shared venue billing service
 * (the same Stripe-aligned data the user billing page consumes). Used by the
 * admin account detail page to show full billing parity for any account.
 */
export function BillingOverviewPanel({ data }: { data: BillingOverviewData }) {
  const [isInvoicesExpanded, setIsInvoicesExpanded] = useState(false);

  const {
    billingRecord,
    activePlan,
    limits,
    addons = [],
    addonSubscriptionList = [],
    messageUsage,
    subscriptionStatus,
    subscriptionDetails,
    invoices = [],
  } = data;

  const currentPlan = billingRecord?.plan_code || "free";
  const effectivePlan =
    billingRecord?.billing_override_enabled && billingRecord?.override_plan_code
      ? billingRecord.override_plan_code
      : currentPlan;
  const isAgencyPlanActive = effectivePlan === "agency";

  const startedAt = subscriptionDetails?.created_at || billingRecord?.created_at || null;
  const nextPaymentDate = subscriptionDetails?.next_billing_date || subscriptionStatus?.nextBillingDate || null;
  const isCancellationScheduled = Boolean(subscriptionDetails?.cancel_at_period_end);
  const cancellationDate = subscriptionDetails?.cancel_at || null;
  const rawStatus = subscriptionDetails?.status || subscriptionStatus?.status || billingRecord?.billing_status || "free";
  const statusText = isCancellationScheduled ? "cancelling" : rawStatus;
  const planAmount = Number(
    subscriptionDetails?.current_price ?? subscriptionStatus?.currentPrice ?? activePlan?.monthly_price_gbp ?? 0
  );

  const addonName = (code: string) => addons.find((addon: any) => addon.code === code)?.name || code;

  const getInvoiceOpenLink = (invoice: { stripe_invoice_id: string; invoice_pdf?: string | null }) => {
    if (invoice.invoice_pdf) return invoice.invoice_pdf;
    return `https://dashboard.stripe.com/invoices/${invoice.stripe_invoice_id}`;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Current plan</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold text-slate-900">{activePlan?.name || "Free"}</span>
              <span className="text-slate-500">Status: {statusText}</span>
              <span className="text-slate-500">Started: {formatDate(startedAt)}</span>
              {isCancellationScheduled ? (
                <>
                  <span className="text-slate-500">Access ends: {formatDate(cancellationDate)}</span>
                  <span className="text-slate-500">Next payment: Cancelled</span>
                </>
              ) : (
                <span className="text-slate-500">Next payment: {formatDate(nextPaymentDate)}</span>
              )}
              <span className="text-slate-500">Amount: {formatGbp(planAmount)}</span>
            </div>
          </div>
          {billingRecord?.billing_override_enabled ? (
            <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
              Override: {billingRecord.override_plan_code || "custom"}
            </Badge>
          ) : null}
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-xs text-slate-500">Current add-ons</p>
          {addonSubscriptionList.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">None</p>
          ) : (
            <div className="mt-2 space-y-2">
              {addonSubscriptionList.map((addon) => (
                <div key={addon.id} className="rounded-md border border-slate-200 bg-slate-50/70 p-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium text-slate-900">
                      {addonName(addon.code)}
                      {addon.quantity > 1 ? ` ×${addon.quantity}` : ""}
                    </span>
                    <span className="text-slate-500">
                      Status: {addon.status === "cancelling" ? "cancelling" : "active"}
                    </span>
                    <span className="text-slate-500">Started: {formatDate(addon.startedAt)}</span>
                    {addon.cancelAtPeriodEnd ? (
                      <span className="text-slate-500">Access ends: {formatDate(addon.accessEndsAt)}</span>
                    ) : (
                      <span className="text-slate-500">Next payment: {formatDate(addon.nextPayment)}</span>
                    )}
                    <span className="text-slate-500">Amount: {formatGbp(addon.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {limits && (
        <div className="space-y-2">
          <div
            className={`grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 ${
              isAgencyPlanActive ? "lg:grid-cols-5" : "md:grid-cols-4"
            }`}
          >
            <div>
              <p className="text-xs text-slate-500">Base spaces</p>
              <p className="text-lg font-semibold text-slate-900">{limits.baseSpaces}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Base messages</p>
              <p className="text-lg font-semibold text-slate-900">{limits.baseMessages.toLocaleString("en-GB")}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total spaces</p>
              <p className="text-lg font-semibold text-slate-900">{limits.totalSpaces}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Message credits (this month)</p>
              <p className="text-lg font-semibold text-slate-900">
                {messageUsage
                  ? `${messageUsage.used.toLocaleString("en-GB")} / ${limits.totalMessages.toLocaleString("en-GB")}`
                  : limits.totalMessages.toLocaleString("en-GB")}
              </p>
            </div>
            {isAgencyPlanActive && (
              <div>
                <p className="text-xs text-slate-500">Agency portal</p>
                <p className="text-lg font-semibold text-slate-900">Enabled</p>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Message credits refresh on the 1st of each month
            {messageUsage?.resetAt ? ` — next reset ${formatDate(messageUsage.resetAt)}` : ""}.
          </p>
        </div>
      )}

      {isCancellationScheduled && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          This {activePlan?.name || "current"} plan is scheduled to cancel on{" "}
          <span className="font-semibold">{formatDate(cancellationDate)}</span>. The account keeps full access until
          then, after which it reverts to the Free plan and any add-ons are removed.
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setIsInvoicesExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-900">Invoices</span>
            <Badge variant="outline" className="border-slate-300 bg-slate-50 text-xs text-slate-600">
              {invoices.length}
            </Badge>
          </div>
          {isInvoicesExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>
        {isInvoicesExpanded ? (
          <div className="border-t border-slate-200 px-4 py-3">
            {invoices.length === 0 ? (
              <p className="text-sm text-slate-500">Currently no invoices for this account.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice: any) => (
                  <div
                    key={invoice.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-slate-900">Invoice {invoice.stripe_invoice_id}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(invoice.created_at).toLocaleDateString("en-GB")} ·{" "}
                        {formatInvoiceAmount(invoice.amount_paid, invoice.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={invoice.status === "paid" ? "default" : "outline"}>{invoice.status}</Badge>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      >
                        <a href={getInvoiceOpenLink(invoice)} target="_blank" rel="noopener noreferrer">
                          Open
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
