"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Link2, Copy, Check, ExternalLink } from "lucide-react";
import { usePaymentManagement } from "@/hooks/admin/usePaymentManagement";
import { useToast } from "@/components/ui/use-toast";

interface PaymentVenueOption {
  id: string;
  name: string;
  email: string;
  slug: string;
}

interface PlanOption {
  code: string;
  name: string;
  monthly_price_gbp: number;
  description?: string | null;
}

const SELECTABLE_PLAN_CODES = ["pro", "agency"];

export function PaymentLinkCreator() {
  const { createNewPaymentLink, isLoading } = usePaymentManagement();
  const { toast } = useToast();
  const [venues, setVenues] = useState<PaymentVenueOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [planName, setPlanName] = useState<string>("pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isCustomPlan, setIsCustomPlan] = useState(false);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedVenueId) {
      const selected = venues.find((v) => v.id === selectedVenueId);
      if (selected?.email && !customerEmail) {
        setCustomerEmail(selected.email);
      }
    }
  }, [selectedVenueId, venues, customerEmail]);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/admin/billing/venues");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch venues");

      const venueOptions = (data.rows || [])
        .map((row: any) => row?.venue)
        .filter((venue: any) => Boolean(venue?.id))
        .map((venue: any) => ({
          id: venue.id,
          name: venue.name || "Unnamed venue",
          email: venue.email || "",
          slug: venue.slug || "",
        }));
      setVenues(venueOptions);

      const planOptions = (data.plans || [])
        .filter((plan: any) => SELECTABLE_PLAN_CODES.includes(plan.code))
        .map((plan: any) => ({
          code: plan.code,
          name: plan.name,
          monthly_price_gbp: Number(plan.monthly_price_gbp || 0),
          description: plan.description,
        }));
      setPlans(planOptions);
      if (planOptions.length > 0 && !planOptions.some((p: PlanOption) => p.code === planName)) {
        setPlanName(planOptions[0].code);
      }
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to fetch venues: ${error.message}`, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVenueId || !customerEmail || !planName) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (isCustomPlan && (!customPrice || parseFloat(customPrice) <= 0)) {
      toast({ title: "Error", description: "Please enter a valid custom price", variant: "destructive" });
      return;
    }

    try {
      const result = await createNewPaymentLink({
        venueId: selectedVenueId,
        customerEmail: customerEmail.trim(),
        planName: planName as any,
        customPrice: isCustomPlan ? parseFloat(customPrice) : undefined,
        billingCycle,
      });

      setGeneratedLink(result.paymentLink);
      toast({ title: "Success", description: "Payment link created successfully." });

      setSelectedVenueId("");
      setCustomerEmail("");
      setBillingCycle("monthly");
      setIsCustomPlan(false);
      setCustomPrice("");
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to create payment link: ${error.message}`, variant: "destructive" });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      toast({ title: "Copied", description: "Payment link copied to clipboard." });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  const selectedPlan = plans.find((p) => p.code === planName);

  const displayPrice = (() => {
    const base = isCustomPlan ? parseFloat(customPrice) || 0 : selectedPlan?.monthly_price_gbp || 0;
    return billingCycle === "yearly" ? base * 12 : base;
  })();

  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
          <Link2 className="h-4 w-4 text-slate-500" />
          Create payment link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="venue">Account *</Label>
              <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Choose an account..." />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Customer email *</Label>
              <Input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                required
                className="border-slate-300"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Plan *</Label>
              <div className="flex items-center gap-2">
                <Switch id="custom-plan" checked={isCustomPlan} onCheckedChange={setIsCustomPlan} />
                <Label htmlFor="custom-plan" className="text-sm text-slate-600">
                  Custom pricing
                </Label>
              </div>
            </div>

            {!isCustomPlan ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {plans.map((plan) => {
                  const isSelected = planName === plan.code;
                  return (
                    <button
                      type="button"
                      key={plan.code}
                      onClick={() => setPlanName(plan.code)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-900">{plan.name}</h3>
                        {isSelected && (
                          <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-700">£{plan.monthly_price_gbp.toFixed(2)}/month</p>
                      {plan.description && <p className="mt-1 text-xs text-slate-500">{plan.description}</p>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="custom-price">Custom monthly price (£) *</Label>
                  <Input
                    id="custom-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="199.99"
                    required={isCustomPlan}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    {billingCycle === "yearly"
                      ? "Enter the monthly amount — the customer pays 12 months upfront."
                      : "Monthly subscription amount."}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Plan label</Label>
                  <Select value={planName} onValueChange={setPlanName}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.code} value={plan.code}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label htmlFor="billing-cycle">Billing cycle</Label>
              <p className="text-sm text-slate-500">Choose monthly or yearly billing.</p>
            </div>
            <Select value={billingCycle} onValueChange={(value: "monthly" | "yearly") => setBillingCycle(value)}>
              <SelectTrigger className="w-32 border-slate-300 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <h4 className="mb-2 text-sm font-medium text-slate-900">Payment summary</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>{billingCycle === "yearly" ? "Annual subscription (12 months)" : "Monthly subscription"}</span>
                <span>£{displayPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-medium text-slate-900">
                <span>{billingCycle === "yearly" ? "Annual payment (upfront)" : "First payment"}</span>
                <span>£{displayPrice.toFixed(2)}</span>
              </div>
              {billingCycle === "yearly" && (
                <p className="text-xs text-slate-500">Billed annually. Next payment in 12 months.</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="bg-slate-900 text-white hover:bg-slate-800">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating link...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Create payment link
              </>
            )}
          </Button>
        </form>

        {generatedLink && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <h4 className="mb-2 text-sm font-medium text-slate-900">Payment link created</h4>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={generatedLink} readOnly className="flex-1 border-slate-300 bg-white font-mono text-sm" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                >
                  {linkCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {linkCopied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                >
                  <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
