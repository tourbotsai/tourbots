"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ExternalLink,
  FileText,
  RefreshCw
} from "lucide-react";
import { useBilling } from "@/hooks/app/useBilling";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

export function SubscriptionStatus() {
  const { user } = useUser();
  const {
    plans,
    addons,
    billingRecord,
    activePlan,
    invoices,
    subscriptionDetails,
    subscriptionStatus,
    limits,
    isLoading,
    fetchBilling,
    selectPlan,
    startPlanCheckout,
    purchaseAddon,
    startCustomerPortalSession,
  } = useBilling();
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<"free" | "pro" | null>(null);
  const [isProcessingAddon, setIsProcessingAddon] = useState<string | null>(null);
  const [isInvoicesExpanded, setIsInvoicesExpanded] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [showPortalConfirmDialog, setShowPortalConfirmDialog] = useState(false);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({
    extra_space: 1,
    message_block: 1,
    white_label: 1,
    agency_portal: 1,
  });

  useEffect(() => {
    if (user?.venue_id) {
      fetchBilling();
    }
  }, [user?.venue_id, fetchBilling]);

  if (isLoading) {
    return (
      <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 dark:border-slate-200"></div>
        </CardContent>
      </Card>
    );
  }

  const handleSelectPlan = async (planCode: "free" | "pro") => {
    setIsUpdatingPlan(planCode);
    await selectPlan(planCode);
    setIsUpdatingPlan(null);
  };

  const handleUpgradeCheckout = async () => {
    setIsUpdatingPlan("pro");
    const checkoutUrl = await startPlanCheckout("pro");
    setIsUpdatingPlan(null);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  const handleBuyAddon = async (addonCode: "extra_space" | "message_block" | "white_label" | "agency_portal") => {
    const quantity = addonCode === "white_label" || addonCode === "agency_portal"
      ? 1
      : Math.max(1, addonQuantities[addonCode] || 1);
    setIsProcessingAddon(addonCode);
    const checkoutUrl = await purchaseAddon(addonCode, quantity);
    setIsProcessingAddon(null);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  const visiblePlans = plans.filter((plan) => ["free", "pro"].includes(plan.code));
  const isProPlanActive = (billingRecord?.plan_code || "free") === "pro";
  const formatInvoiceAmount = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: (currency || "gbp").toUpperCase(),
      }).format(Number(amount || 0));
    } catch {
      return `£${Number(amount || 0).toFixed(2)}`;
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "Not available";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not available";
    return parsed.toLocaleDateString("en-GB");
  };

  const formatPlanAmount = () => {
    const amount = Number(
      subscriptionDetails?.current_price ??
      subscriptionStatus?.currentPrice ??
      activePlan?.monthly_price_gbp ??
      0
    );
    return `£${amount.toFixed(2)}`;
  };

  const handleManageSubscription = async () => {
    const isCurrentPlanPro = (billingRecord?.plan_code || "free") === "pro";
    const isCancellationScheduled = Boolean(subscriptionDetails?.cancel_at_period_end);

    if (isCurrentPlanPro && !isCancellationScheduled) {
      setShowPortalConfirmDialog(true);
      return;
    }

    setIsOpeningPortal(true);
    const portalUrl = await startCustomerPortalSession();
    setIsOpeningPortal(false);
    if (portalUrl) {
      window.location.href = portalUrl;
    }
  };

  const startedAt = subscriptionDetails?.created_at || billingRecord?.created_at || null;
  const nextPaymentDate = subscriptionDetails?.next_billing_date || subscriptionStatus?.nextBillingDate || null;
  const isCancellationScheduled = Boolean(subscriptionDetails?.cancel_at_period_end);
  const cancellationDate = subscriptionDetails?.cancel_at || null;
  const rawStatus = subscriptionDetails?.status || subscriptionStatus?.status || billingRecord?.billing_status || "free";
  const statusText = isCancellationScheduled ? "cancelling" : rawStatus;
  const manageSubscriptionLabel = isCancellationScheduled ? "Reactivate" : "Cancel in Stripe";
  const addonStatusText = isCancellationScheduled ? "cancelling" : isProPlanActive ? "active" : "inactive";
  const addonNextPaymentText = isCancellationScheduled
    ? "Cancelled"
    : formatDate(nextPaymentDate);

  const getAddonQuantity = (addonCode: string) => {
    if (addonCode === "extra_space") return billingRecord?.addon_extra_spaces || 0;
    if (addonCode === "message_block") return billingRecord?.addon_message_blocks || 0;
    if (addonCode === "white_label") return billingRecord?.addon_white_label ? 1 : 0;
    if (addonCode === "agency_portal") return billingRecord?.addon_agency_portal ? 1 : 0;
    return 0;
  };

  const formatAddonMonthlyAmount = (price: number, quantity: number) => {
    return `£${Number(price * quantity).toFixed(2)}`;
  };

  const handleConfirmPortalRedirect = async () => {
    setShowPortalConfirmDialog(false);
    setIsOpeningPortal(true);
    const portalUrl = await startCustomerPortalSession();
    setIsOpeningPortal(false);
    if (portalUrl) {
      window.location.href = portalUrl;
    }
  };

  const getInvoiceOpenLink = (invoice: {
    stripe_invoice_id: string;
    invoice_pdf?: string | null;
  }) => {
    if (invoice.invoice_pdf) return invoice.invoice_pdf;
    return `https://dashboard.stripe.com/invoices/${invoice.stripe_invoice_id}`;
  };

  return (
    <div className="space-y-6">
      <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 rounded-lg border p-4 dark:border-input dark:bg-background sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold">{activePlan?.name || "Free"}</span>
                <span className="text-muted-foreground">Status: {statusText}</span>
                <span className="text-muted-foreground">Started: {formatDate(startedAt)}</span>
                {isCancellationScheduled ? (
                  <>
                    <span className="text-muted-foreground">Access ends: {formatDate(cancellationDate)}</span>
                    <span className="text-muted-foreground">Next payment: Cancelled</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Next payment: {formatDate(nextPaymentDate)}</span>
                )}
                <span className="text-muted-foreground">Amount: {formatPlanAmount()}</span>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
              <Badge variant="outline">{(billingRecord?.plan_code || "free").toUpperCase()}</Badge>
              {(billingRecord?.plan_code || "free") === "pro" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
                  onClick={handleManageSubscription}
                  disabled={isOpeningPortal}
                >
                  {isOpeningPortal ? "Opening..." : manageSubscriptionLabel}
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto",
                  (billingRecord?.plan_code || "free") !== "pro" ? "col-span-1" : "col-span-2 sm:col-span-1"
                )}
                onClick={fetchBilling}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="rounded-lg border dark:border-input dark:bg-background">
            <button
              type="button"
              onClick={() => setIsInvoicesExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Invoices</span>
                <Badge variant="outline" className="text-xs">
                  {invoices.length}
                </Badge>
              </div>
              {isInvoicesExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {isInvoicesExpanded ? (
              <div className="border-t px-4 py-3 dark:border-input">
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Currently no invoices for this account.</p>
                ) : (
                  <div className="space-y-2">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex flex-col gap-3 rounded-lg border p-3 dark:border-input dark:bg-background sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            Invoice {invoice.stripe_invoice_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(invoice.created_at).toLocaleDateString("en-GB")} · {formatInvoiceAmount(invoice.amount_paid, invoice.currency)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={invoice.status === "paid" ? "default" : "outline"}>
                            {invoice.status}
                          </Badge>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-slate-800"
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

          {limits && (
            <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/30 dark:border-input dark:bg-background p-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Base spaces</p>
                <p className="text-lg font-semibold">{limits.baseSpaces}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Base messages</p>
                <p className="text-lg font-semibold">{limits.baseMessages.toLocaleString("en-GB")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total spaces</p>
                <p className="text-lg font-semibold">{limits.totalSpaces}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total messages</p>
                <p className="text-lg font-semibold">{limits.totalMessages.toLocaleString("en-GB")}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {visiblePlans.map((plan) => {
              const isCurrent = (billingRecord?.plan_code || "free") === plan.code;
              const isUpdating = isUpdatingPlan === plan.code;

              return (
                <div key={plan.code} className="rounded-lg border dark:border-input dark:bg-background p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {isCurrent && (
                      <Badge
                        variant="outline"
                        className="dark:border-input dark:bg-background dark:text-slate-100"
                      >
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-3 text-2xl font-semibold">
                    £{Number(plan.monthly_price_gbp || 0).toFixed(2)}
                    <span className="ml-1 text-sm text-muted-foreground">/month</span>
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> {plan.included_spaces} included spaces</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> {plan.included_messages.toLocaleString("en-GB")} included messages</p>
                  </div>
                  {isCurrent && plan.code === "pro" ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button
                        className="w-full dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-slate-800"
                        variant="outline"
                        disabled
                      >
                        Current Plan
                      </Button>
                      <Button
                        className="w-full dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-slate-800"
                        variant="outline"
                        onClick={handleManageSubscription}
                        disabled={isOpeningPortal}
                      >
                        {isOpeningPortal ? "Opening..." : manageSubscriptionLabel}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className={cn(
                        "mt-4 w-full",
                        isCurrent
                          ? "dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-slate-800"
                          : "dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                      )}
                      variant={isCurrent ? "outline" : "default"}
                      disabled={isCurrent || isUpdatingPlan !== null}
                      onClick={() => {
                        if (plan.code === "pro") {
                          handleUpgradeCheckout();
                        } else {
                          handleSelectPlan("free");
                        }
                      }}
                    >
                      {isUpdating
                        ? "Updating..."
                        : isCurrent
                          ? "Current Plan"
                          : plan.code === "pro"
                            ? "Upgrade via Stripe"
                            : `Switch to ${plan.name}`}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
        <CardHeader>
          <CardTitle>Add-ons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isProPlanActive ? (
            <div className="rounded-lg border border-dashed dark:border-input dark:bg-background p-4 text-sm text-muted-foreground">
              Add-ons are only available on the Pro plan. Upgrade to Pro to purchase extra spaces, message blocks, white-label, and agency portal.
            </div>
          ) : addons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No add-ons configured yet.</p>
          ) : (
            addons.map((addon) => (
              <div key={addon.id} className="flex flex-col gap-3 rounded-lg border p-3 dark:border-input dark:bg-background sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{addon.name}</p>
                  <p className="text-sm text-muted-foreground">{addon.description}</p>
                  {(() => {
                    const currentQuantity = getAddonQuantity(addon.code);
                    const isAddonActive = currentQuantity > 0;
                    if (!isAddonActive) {
                      return (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Status: inactive
                        </p>
                      );
                    }

                    return (
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>Status: {addonStatusText}</span>
                        <span>Started: {formatDate(startedAt)}</span>
                        {isCancellationScheduled ? (
                          <>
                            <span>Access ends: {formatDate(cancellationDate)}</span>
                            <span>Next payment: Cancelled</span>
                          </>
                        ) : (
                          <span>Next payment: {addonNextPaymentText}</span>
                        )}
                        <span>Amount: {formatAddonMonthlyAmount(Number(addon.monthly_price_gbp || 0), currentQuantity)}</span>
                      </div>
                    );
                  })()}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current: {addon.code === "extra_space"
                      ? billingRecord?.addon_extra_spaces || 0
                      : addon.code === "message_block"
                        ? billingRecord?.addon_message_blocks || 0
                        : addon.code === "white_label"
                          ? billingRecord?.addon_white_label
                            ? "Enabled"
                            : "Disabled"
                          : addon.code === "agency_portal"
                            ? billingRecord?.addon_agency_portal
                              ? "Enabled"
                              : "Disabled"
                            : "Disabled"}
                  </p>
                </div>
                <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
                  {addon.code !== "white_label" && addon.code !== "agency_portal" && (
                    <Input
                      type="number"
                      min={1}
                      className="w-full sm:w-20"
                      value={addonQuantities[addon.code] || 1}
                      onChange={(event) =>
                        setAddonQuantities((prev) => ({
                          ...prev,
                          [addon.code]: Math.max(1, Number(event.target.value || 1)),
                        }))
                      }
                    />
                  )}
                  <p className="text-sm font-medium leading-tight sm:whitespace-nowrap">
                    £{Number(addon.monthly_price_gbp || 0).toFixed(2)} / {addon.unit_label} per month
                  </p>
                  <Button
                    variant="outline"
                    className="w-full dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
                    onClick={() => handleBuyAddon(addon.code as "extra_space" | "message_block" | "white_label" | "agency_portal")}
                    disabled={isProcessingAddon !== null}
                  >
                    {isProcessingAddon === addon.code ? "Processing..." : "Add monthly"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={showPortalConfirmDialog} onOpenChange={setShowPortalConfirmDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Cancel subscription in Stripe?</DialogTitle>
            <DialogDescription>
              This will open Stripe so you can cancel your subscription. Any active monthly add-ons will also be scheduled for cancellation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPortalConfirmDialog(false)}
            >
              Keep subscription
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPortalRedirect}
              disabled={isOpeningPortal}
            >
              {isOpeningPortal ? "Opening..." : "Continue to Stripe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 