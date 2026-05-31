"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ExternalLink,
  FileText,
  RefreshCw,
  X
} from "lucide-react";
import { useBilling, type AddonCode, type PaidPlanCode } from "@/hooks/app/useBilling";
import { useUser } from "@/hooks/useUser";
import type { BillingAddon } from "@/lib/types";
import { cn } from "@/lib/utils";

// Add-ons are plan-scoped: core add-ons extend the Pro plan; agency add-ons
// extend the Agency plan. Agency capacity reuses the shared extra-space /
// message-block counters, so the underlying quantities map to the same fields.
const CORE_ADDON_CODES = new Set(["extra_space", "message_block", "white_label"]);
const AGENCY_ADDON_CODES = new Set(["agency_extra_space", "agency_message_block"]);

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
    messageUsage,
    addonSubscriptions,
    addonSubscriptionList,
    isLoading,
    fetchBilling,
    startPlanCheckout,
    switchPlan,
    purchaseAddon,
    cancelAddon,
    startCustomerPortalSession,
  } = useBilling();
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<string | null>(null);
  const [isProcessingAddon, setIsProcessingAddon] = useState<string | null>(null);
  const [isInvoicesExpanded, setIsInvoicesExpanded] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [cancelAddonTarget, setCancelAddonTarget] = useState<BillingAddon | null>(null);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({
    extra_space: 1,
    message_block: 1,
    white_label: 1,
    agency_extra_space: 1,
    agency_message_block: 1,
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

  const currentPlan = billingRecord?.plan_code || "free";
  const effectivePlan =
    billingRecord?.billing_override_enabled && billingRecord?.override_plan_code
      ? billingRecord.override_plan_code
      : currentPlan;
  const isPaidPlanActive = currentPlan === "pro" || currentPlan === "agency";
  const isAgencyPlanActive = effectivePlan === "agency";

  const handleStartCheckout = async (planCode: PaidPlanCode) => {
    setIsUpdatingPlan(planCode);
    const checkoutUrl = await startPlanCheckout(planCode);
    setIsUpdatingPlan(null);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  const handleSwitchPlan = async (planCode: PaidPlanCode) => {
    setIsUpdatingPlan(planCode);
    await switchPlan(planCode);
    setIsUpdatingPlan(null);
  };

  const handleBuyAddon = async (addonCode: AddonCode) => {
    const quantity = addonCode === "white_label"
      ? 1
      : Math.max(1, addonQuantities[addonCode] || 1);
    setIsProcessingAddon(addonCode);
    const checkoutUrl = await purchaseAddon(addonCode, quantity);
    setIsProcessingAddon(null);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  const visiblePlans = plans.filter((plan) => ["free", "pro", "agency"].includes(plan.code));

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

  // Open the Stripe customer portal directly so the customer can manage the
  // plan and every add-on (update, cancel, view invoices) in one place. All
  // subscriptions share a single Stripe customer, so the portal shows them all.
  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    const portalUrl = await startCustomerPortalSession();
    setIsOpeningPortal(false);
    if (portalUrl) {
      window.location.href = portalUrl;
    }
  };

  const addonName = (code: string) => addons.find((addon) => addon.code === code)?.name || code;

  const startedAt = subscriptionDetails?.created_at || billingRecord?.created_at || null;
  const nextPaymentDate = subscriptionDetails?.next_billing_date || subscriptionStatus?.nextBillingDate || null;
  const isCancellationScheduled = Boolean(subscriptionDetails?.cancel_at_period_end);
  const cancellationDate = subscriptionDetails?.cancel_at || null;
  const rawStatus = subscriptionDetails?.status || subscriptionStatus?.status || billingRecord?.billing_status || "free";
  const statusText = isCancellationScheduled ? "cancelling" : rawStatus;
  const manageSubscriptionLabel = isCancellationScheduled ? "Reactivate" : "Manage plan";

  const getAddonQuantity = (addonCode: string) => {
    if (addonCode === "extra_space" || addonCode === "agency_extra_space") return billingRecord?.addon_extra_spaces || 0;
    if (addonCode === "message_block" || addonCode === "agency_message_block") return billingRecord?.addon_message_blocks || 0;
    if (addonCode === "white_label") return billingRecord?.addon_white_label ? 1 : 0;
    return 0;
  };

  const formatAddonMonthlyAmount = (price: number, quantity: number) => {
    return `£${Number(price * quantity).toFixed(2)}`;
  };

  const coreAddons = addons.filter((addon) => CORE_ADDON_CODES.has(addon.code));
  const agencyAddons = addons.filter((addon) => AGENCY_ADDON_CODES.has(addon.code));

  const handleCancelAddon = async (addon: BillingAddon) => {
    setIsProcessingAddon(addon.code);
    await cancelAddon(addon.code as AddonCode);
    setIsProcessingAddon(null);
  };

  const getInvoiceOpenLink = (invoice: {
    stripe_invoice_id: string;
    invoice_pdf?: string | null;
  }) => {
    if (invoice.invoice_pdf) return invoice.invoice_pdf;
    return `https://dashboard.stripe.com/invoices/${invoice.stripe_invoice_id}`;
  };

  const renderAddonRow = (addon: BillingAddon) => {
    const currentQuantity = getAddonQuantity(addon.code);
    const subState = addonSubscriptions[addon.code];
    const isAddonActive = currentQuantity > 0 || Boolean(subState?.active);
    const isCancelling = Boolean(subState?.cancelAtPeriodEnd);
    const isQuantityAddon = addon.code !== "white_label";
    const currentValueLabel =
      addon.code === "extra_space" || addon.code === "agency_extra_space"
        ? `${billingRecord?.addon_extra_spaces || 0}`
        : addon.code === "message_block" || addon.code === "agency_message_block"
          ? `${billingRecord?.addon_message_blocks || 0}`
          : billingRecord?.addon_white_label ? "Enabled" : "Disabled";

    return (
      <div key={addon.id} className="flex flex-col gap-3 rounded-lg border p-3 dark:border-input dark:bg-background sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{addon.name}</p>
          <p className="text-sm text-muted-foreground">{addon.description}</p>
          {!isAddonActive ? (
            <p className="mt-1 text-xs text-muted-foreground">Status: inactive</p>
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>Status: {isCancelling ? "cancelling" : "active"}</span>
              {isCancelling ? (
                <span>Access ends: {formatDate(subState?.accessEndsAt)}</span>
              ) : (
                <span>Amount: {formatAddonMonthlyAmount(Number(addon.monthly_price_gbp || 0), Math.max(1, currentQuantity))}</span>
              )}
            </div>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Current: {currentValueLabel}</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
          {isQuantityAddon && !isCancelling && (
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
          {isCancelling ? (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 sm:whitespace-nowrap">
              Cancellation scheduled
            </span>
          ) : (
            <>
              {(!isAddonActive || isQuantityAddon) && (
                <Button
                  variant="outline"
                  className="w-full dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
                  onClick={() => handleBuyAddon(addon.code as AddonCode)}
                  disabled={isProcessingAddon !== null}
                >
                  {isProcessingAddon === addon.code ? "Processing..." : "Add monthly"}
                </Button>
              )}
              {isAddonActive && (
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive dark:border-input dark:bg-background sm:w-auto"
                  onClick={() => setCancelAddonTarget(addon)}
                  disabled={isProcessingAddon !== null}
                >
                  Cancel add-on
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderPlanAction = (plan: { code: string; name: string }) => {
    const isCurrent = currentPlan === plan.code;
    const isUpdating = isUpdatingPlan === plan.code;

    if (isCurrent) {
      if (plan.code === "free") {
        return (
          <Button
            className="w-full dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-slate-800"
            variant="outline"
            disabled
          >
            Current Plan
          </Button>
        );
      }
      return (
        <div className="grid grid-cols-2 gap-2">
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
      );
    }

    // Free plan card while on a paid plan: downgrading to free is a cancellation.
    if (plan.code === "free") {
      return (
        <Button
          className="w-full dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-slate-800"
          variant="outline"
          onClick={handleManageSubscription}
          disabled={isOpeningPortal}
        >
          {isOpeningPortal ? "Opening..." : "Cancel plan"}
        </Button>
      );
    }

    // Target is a paid plan. From free -> checkout; from another paid plan -> switch.
    const targetPlan = plan.code as PaidPlanCode;
    const isFromFree = currentPlan === "free";
    return (
      <Button
        className="w-full dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        disabled={isUpdatingPlan !== null}
        onClick={() => (isFromFree ? handleStartCheckout(targetPlan) : handleSwitchPlan(targetPlan))}
      >
        {isUpdating
          ? "Updating..."
          : isFromFree
            ? "Upgrade plan"
            : `Switch to ${plan.name}`}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4 dark:border-input dark:bg-background">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                {isPaidPlanActive ? (
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
                    !isPaidPlanActive ? "col-span-2 sm:col-span-1" : "col-span-1"
                  )}
                  onClick={fetchBilling}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="mt-4 border-t pt-3 dark:border-input">
              <p className="text-sm text-muted-foreground">Current add-ons</p>
              {addonSubscriptionList.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">None</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {addonSubscriptionList.map((addon) => (
                    <div
                      key={addon.id}
                      className="rounded-md border p-2 dark:border-input dark:bg-[#121923]/40"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="font-medium">
                          {addonName(addon.code)}
                          {addon.quantity > 1 ? ` ×${addon.quantity}` : ""}
                        </span>
                        <span className="text-muted-foreground">
                          Status: {addon.status === "cancelling" ? "cancelling" : "active"}
                        </span>
                        <span className="text-muted-foreground">Started: {formatDate(addon.startedAt)}</span>
                        {addon.cancelAtPeriodEnd ? (
                          <span className="text-muted-foreground">Access ends: {formatDate(addon.accessEndsAt)}</span>
                        ) : (
                          <span className="text-muted-foreground">Next payment: {formatDate(addon.nextPayment)}</span>
                        )}
                        <span className="text-muted-foreground">
                          Amount: £{Number(addon.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            <div className="space-y-2">
              <div className={cn(
                "grid grid-cols-1 gap-4 rounded-lg border bg-muted/30 dark:border-input dark:bg-background p-4 sm:grid-cols-2",
                isAgencyPlanActive ? "lg:grid-cols-5" : "md:grid-cols-4"
              )}>
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
                  <p className="text-sm text-muted-foreground">Message credits (this month)</p>
                  <p className="text-lg font-semibold">
                    {messageUsage
                      ? `${messageUsage.used.toLocaleString("en-GB")} / ${limits.totalMessages.toLocaleString("en-GB")}`
                      : limits.totalMessages.toLocaleString("en-GB")}
                  </p>
                </div>
                {isAgencyPlanActive && (
                  <div>
                    <p className="text-sm text-muted-foreground">Agency portal</p>
                    <p className="text-lg font-semibold">Enabled</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Message credits refresh on the 1st of each month
                {messageUsage?.resetAt ? ` — next reset ${formatDate(messageUsage.resetAt)}` : ""}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visiblePlans.map((plan) => {
              const isCurrent = currentPlan === plan.code;

              const positiveBullets: string[] = [
                `${plan.included_spaces} included spaces`,
                `${plan.included_messages.toLocaleString("en-GB")} included messages`,
              ];
              const negativeBullets: string[] = [];
              if (plan.code === "free") {
                negativeBullets.push("No live production hosting", "No add-on purchases");
              } else if (plan.code === "pro") {
                positiveBullets.push("Dashboard analytics & lead capture");
                negativeBullets.push("White-label sold as add-on");
              } else if (plan.code === "agency") {
                positiveBullets.push("Branded client portals", "White-label included");
              }

              const description =
                plan.code === "free"
                  ? `${plan.description} Always free forever.`
                  : plan.description;

              return (
                <div key={plan.code} className="flex h-full flex-col rounded-lg border dark:border-input dark:bg-background p-4">
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
                  <p className="mt-1 min-h-[2.5rem] text-sm text-muted-foreground">{description}</p>
                  <p className="mt-3 text-2xl font-semibold">
                    £{Number(plan.monthly_price_gbp || 0).toFixed(2)}
                    <span className="ml-1 text-sm text-muted-foreground">/month</span>
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    {positiveBullets.map((bullet) => (
                      <p key={bullet} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" /> {bullet}
                      </p>
                    ))}
                    {negativeBullets.map((bullet) => (
                      <p key={bullet} className="flex items-center gap-2 text-muted-foreground">
                        <X className="h-4 w-4 flex-shrink-0 text-slate-400" /> {bullet}
                      </p>
                    ))}
                  </div>
                  <div className="mt-auto pt-4">{renderPlanAction(plan)}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {currentPlan === "pro" && (
        <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
          <CardHeader>
            <CardTitle>Core add-ons</CardTitle>
            <p className="text-sm text-muted-foreground">
              Scale your Pro allowance with extra spaces, message blocks, and white-label branding.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {coreAddons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No core add-ons configured yet.</p>
            ) : (
              coreAddons.map((addon) => renderAddonRow(addon))
            )}
          </CardContent>
        </Card>
      )}

      {currentPlan === "agency" && (
        <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
          <CardHeader>
            <CardTitle>Agency add-ons</CardTitle>
            <p className="text-sm text-muted-foreground">
              Expand your shared agency pool with additional spaces and message credits. White-label branding is already included with your plan.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {agencyAddons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No agency add-ons configured yet.</p>
            ) : (
              agencyAddons.map((addon) => renderAddonRow(addon))
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={cancelAddonTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelAddonTarget(null);
        }}
        title={cancelAddonTarget ? `Cancel ${cancelAddonTarget.name}?` : "Cancel add-on?"}
        description="This add-on stays active until the end of your current billing period, then it will be removed and billing stops. You can re-enable it at any time."
        confirmText="Cancel add-on"
        cancelText="Keep add-on"
        destructive
        onConfirm={async () => {
          if (!cancelAddonTarget) return;
          await handleCancelAddon(cancelAddonTarget);
          setCancelAddonTarget(null);
        }}
      />
    </div>
  );
}
