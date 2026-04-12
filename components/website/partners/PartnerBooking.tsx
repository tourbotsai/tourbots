"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function PartnerBooking() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    partnerType: "",
    website: "",
    additionalInfo: ""
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setFeedbackMessage("");

    try {
      const response = await fetch("/api/public/partner-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus("success");
        setFeedbackMessage(
          `Thank you, ${formData.name}! We'll review your partner application and get back to you within 24 hours.`
        );
      } else {
        setStatus("error");
        setFeedbackMessage(result.error || "An error occurred. Please try again.");
      }
    } catch (error) {
      setStatus("error");
      setFeedbackMessage(
        "An unexpected error occurred. Please check your connection and try again."
      );
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const partnerTypes = [
    "Matterport camera supplier",
    "Tour capture/scanning provider",
    "Industry association or network",
    "Property/real-estate media network",
    "Marketing or growth agency",
    "Technology or software provider",
    "Consultant or implementation partner",
    "Other"
  ];

  return (
    <Card className="h-full rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
      <CardHeader>
        <CardTitle className="text-xl text-white md:text-2xl">
          Partner Application Form
        </CardTitle>
        <CardDescription className="text-slate-300">
          Tell us about your business and how you plan to introduce TourBots.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Your Name *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary"
                disabled={status === 'loading'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.co.uk"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary"
                disabled={status === 'loading'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-white">Company/Organisation *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="Your company name"
                required
                className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary"
                disabled={status === 'loading'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="07123 456789"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary"
                disabled={status === 'loading'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partnerType" className="text-white">Partner Type *</Label>
            <Select onValueChange={(value) => handleChange("partnerType", value)} required disabled={status === 'loading'}>
              <SelectTrigger className="border-slate-700/70 bg-slate-900/70 text-slate-100 focus:border-brand-primary focus:ring-brand-primary">
                <SelectValue placeholder="Select your business type" />
              </SelectTrigger>
              <SelectContent>
                {partnerTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-white">Company Website *</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleChange("website", e.target.value)}
              placeholder="https://yourcompany.co.uk"
              required
              className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary"
              disabled={status === 'loading'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo" className="text-white">Tell us about your business</Label>
            <Textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => handleChange("additionalInfo", e.target.value)}
                placeholder="e.g., your audience, typical account volume, and where TourBots fits in your current offer..."
              rows={4}
              className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary"
              disabled={status === 'loading'}
            />
          </div>

          <Button type="submit" className="w-full bg-white text-slate-900 hover:bg-slate-200" disabled={status === 'loading'}>
            {status === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Submit Partner Application"
            )}
          </Button>

          {status === 'success' && (
            <div className="flex items-center rounded-md border border-success-green/30 bg-success-green/12 p-3 text-sm text-success-green">
              <CheckCircle className="mr-2 h-4 w-4" />
              {feedbackMessage}
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
              <AlertCircle className="mr-2 h-4 w-4" />
              {feedbackMessage}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 