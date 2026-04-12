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

export function PaymentLinkCreator() {
  const { createNewPaymentLink, isLoading } = usePaymentManagement();
  const { toast } = useToast();
  const [venues, setVenues] = useState<PaymentVenueOption[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [planName, setPlanName] = useState<'pro'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isCustomPlan, setIsCustomPlan] = useState(false);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Pricing aligned to website catalogue
  const planConfigs = [
    {
      name: 'pro' as const,
      monthlyPrice: 19.99,
      yearlyPrice: 0,
    },
  ];

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    // Auto-fill email when venue is selected
    if (selectedVenueId) {
      const selected = venues.find(v => v.id === selectedVenueId);
      if (selected?.email && !customerEmail) {
        setCustomerEmail(selected.email);
      }
    }
  }, [selectedVenueId, venues, customerEmail]);

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/admin/billing/venues');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch venues');
      }

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch venues: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVenueId || !customerEmail || !planName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (isCustomPlan && (!customPrice || parseFloat(customPrice) <= 0)) {
      toast({
        title: "Error", 
        description: "Please enter a valid custom price",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createNewPaymentLink({
        venueId: selectedVenueId,
        customerEmail: customerEmail.trim(),
        planName,
        customPrice: isCustomPlan ? parseFloat(customPrice) : undefined,
        billingCycle,
      });

      setGeneratedLink(result.paymentLink);
      toast({
        title: "Success",
        description: "Payment link created successfully!",
      });
      
      // Reset form
      setSelectedVenueId("");
      setCustomerEmail("");
      setPlanName('pro');
      setBillingCycle('monthly');
      setIsCustomPlan(false);
      setCustomPrice("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create payment link: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      toast({
        title: "Success",
        description: "Payment link copied to clipboard!",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const selectedPlan = planConfigs.find(p => p.name === planName);
  
  // Calculate the correct price based on billing cycle
  const getDisplayPrice = () => {
    if (isCustomPlan) {
      const customAmount = parseFloat(customPrice) || 0;
      return billingCycle === 'yearly' ? customAmount * 12 : customAmount;
    }
    
    if (billingCycle === 'yearly') {
      // For yearly billing, show the full annual amount (monthly rate × 12)
      return (selectedPlan?.yearlyPrice || 0) * 12;
    } else {
      // For monthly billing, show monthly amount
      return selectedPlan?.monthlyPrice || 0;
    }
  };
  
  const currentPrice = getDisplayPrice();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Create Payment Link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Venue selection */}
            <div className="space-y-2">
              <Label htmlFor="venue">Select venue *</Label>
              <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a venue..." />
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

            {/* Customer Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Customer Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                required
                className="h-10 sm:h-11"
              />
            </div>
          </div>

          {/* Plan Selection */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Label>Plan Selection *</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="custom-plan"
                  checked={isCustomPlan}
                  onCheckedChange={setIsCustomPlan}
                />
                <Label htmlFor="custom-plan" className="text-sm">
                  Custom pricing
                </Label>
              </div>
            </div>

            {!isCustomPlan ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {planConfigs.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                      planName === plan.name
                        ? 'border-brand-blue bg-brand-blue/5'
                        : 'border-border-light dark:border-border-dark hover:border-brand-blue/50'
                    }`}
                    onClick={() => setPlanName(plan.name)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium capitalize">{plan.name}</h3>
                        {planName === plan.name && (
                          <Badge className="bg-brand-blue">Selected</Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">£19.99/month</p>
                        <p className="text-xs text-muted-foreground">Core paid plan with add-ons layered on top.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-price">Custom Monthly Price (£) *</Label>
                    <Input
                      id="custom-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="199.99"
                      required={isCustomPlan}
                      className="h-10 sm:h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      {billingCycle === 'yearly' 
                        ? 'Enter monthly amount - customer will pay 12 months upfront'
                        : 'Monthly subscription amount'
                      }
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Plan Name</Label>
                    <Select value={planName} onValueChange={(value: 'pro') => setPlanName(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pro">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Billing Cycle Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-bg-secondary-light dark:bg-bg-secondary-dark rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="billing-cycle">Billing Cycle</Label>
              <p className="text-sm text-muted-foreground">
                Choose monthly or yearly billing
              </p>
            </div>
            <Select value={billingCycle} onValueChange={(value: 'monthly' | 'yearly') => setBillingCycle(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          {(selectedPlan || isCustomPlan) && (
            <div className="p-4 bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-lg">
              <h4 className="font-medium mb-2">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>
                    {billingCycle === 'yearly'
                      ? `Yearly subscription (${((selectedPlan?.yearlyPrice || selectedPlan?.monthlyPrice || 0)).toFixed(2)}/month × 12):`
                      : 'Monthly subscription:'
                    }
                  </span>
                  <span>£{currentPrice.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>
                    {billingCycle === 'yearly' ? 'Annual payment (12 months upfront):' : 'First payment:'}
                  </span>
                  <span>£{currentPrice.toFixed(2)}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-xs text-muted-foreground">
                    Billed annually. Next payment in 12 months.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Link...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Create Payment Link
              </>
            )}
          </Button>
        </form>

        {/* Generated Link */}
        {generatedLink && (
          <div className="mt-8 p-4 bg-success-green/10 border border-success-green/20 rounded-lg">
            <h4 className="font-medium text-success-green mb-2">
              Payment Link Created Successfully!
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={generatedLink}
                readOnly
                className="flex-1 text-sm font-mono"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="w-full sm:w-auto"
                >
                  {linkCopied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {linkCopied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <a
                    href={generatedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
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