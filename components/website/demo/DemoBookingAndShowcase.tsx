"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { AlertCircle, CalendarCheck2, CheckCircle2, Loader2 } from "lucide-react";

export function DemoBookingAndShowcase() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    venueName: "",
    currentWebsite: "",
    preferredTime: "",
    timezone: "GMT",
    additionalInfo: ""
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setFeedbackMessage("");

    try {
      const response = await fetch("/api/public/demo", {
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
          `Thank you, ${formData.name}! We'll send a calendar invite to ${formData.email} shortly.`
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

  const timeSlots = [
    "09:00 - 09:30",
    "10:00 - 10:30",
    "11:00 - 11:30",
    "13:00 - 13:30",
    "14:00 - 14:30",
    "15:00 - 15:30",
    "16:00 - 16:30",
    "17:00 - 17:30",
  ];

  const demoTopics = [
    {
      title: "Tour setup and AI training",
      description: "How to connect your space, train the assistant, and go live quickly.",
    },
    {
      title: "Pricing and scaling model",
      description: "How Pro, additional spaces, and white-label add-ons fit your rollout.",
    },
    {
      title: "Operational best practice",
      description: "Go-live priorities, ownership, and optimisation steps after launch.",
    },
    {
      title: "Answers to your questions",
      description: "Ask questions about anything, so you can move forward with clarity.",
    },
  ];

  if (status === 'success') {
    return (
      <section className="container py-8 md:py-12 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <Card className="rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-green/15">
                <CheckCircle2 className="h-8 w-8 text-success-green" />
              </div>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                Demo Request Sent!
              </h2>
              <p className="mb-6 text-slate-300">
                {feedbackMessage}
              </p>
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
                  <h3 className="mb-2 font-semibold text-white">
                    What happens next?
                  </h3>
                  <ul className="space-y-2 text-left text-sm text-slate-300">
                    <li>• We review your enquiry and tailor the walkthrough to your use case.</li>
                    <li>• A calendar invite is sent to {formData.email}.</li>
                    <li>• We include practical next steps for rollout after the demo.</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => {
                      setStatus("idle");
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        venueName: "",
                        currentWebsite: "",
                        preferredTime: "",
                        timezone: "GMT",
                        additionalInfo: ""
                      });
                    }}
                    variant="outline"
                    className="border-slate-600 bg-transparent font-medium text-slate-100 hover:bg-slate-800"
                  >
                    Submit Another Request
                  </Button>
                  <Button className="bg-white font-semibold text-slate-900 hover:bg-slate-200" disabled>
                    Confirmation Sent
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="demo-booking" className="container pb-16 pt-2 md:pb-20 md:pt-4 lg:pb-24 lg:pt-6">
      <div className="mx-auto mb-10 flex max-w-4xl flex-col items-center space-y-5 text-center">
        <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
          Book your personalised demo call
        </h2>
        <p className="max-w-5xl text-base leading-relaxed text-slate-300 sm:text-lg lg:whitespace-nowrap">
          <span className="sm:hidden">
            Share a few details and we will tailor the session around your tour setup and goals.
          </span>
          <span className="hidden sm:inline">
            Share a few details and we will tailor the session around your tour setup, goals, and rollout timeline.
          </span>
        </p>
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <div>
            <Card className="h-full rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
              <CardHeader>
                <CardTitle className="text-xl text-white md:text-2xl">
                  Demo Booking Form
                </CardTitle>
                <p className="text-sm text-slate-300">
                  The more context you share, the more relevant the walkthrough will be.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">
                        Your Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Alex Smith"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        required
                        className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary"
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
                        placeholder="alex@company.co.uk"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        required
                        className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary"
                        disabled={status === 'loading'}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="venueName" className="text-white">Company name *</Label>
                      <Input
                        id="venueName"
                        value={formData.venueName}
                        onChange={(e) => handleChange("venueName", e.target.value)}
                        placeholder="Example Company Ltd"
                        required
                        className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary"
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
                        placeholder="+44 7123 456789"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary"
                        disabled={status === 'loading'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredTime" className="text-white">Preferred demo time *</Label>
                    <Select onValueChange={(value) => handleChange("preferredTime", value)} required disabled={status === 'loading'}>
                      <SelectTrigger className="border-slate-700/70 bg-slate-900/70 text-slate-100 focus-visible:border-brand-primary">
                        <SelectValue placeholder="Choose your preferred time slot" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentWebsite" className="text-white">Current website (optional)</Label>
                    <Input
                      id="currentWebsite"
                      value={formData.currentWebsite}
                      onChange={(e) => handleChange("currentWebsite", e.target.value)}
                      placeholder="https://yourcompany.co.uk"
                      className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary"
                      disabled={status === 'loading'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalInfo" className="text-white">Additional context (optional)</Label>
                    <Textarea
                      id="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={(e) => handleChange("additionalInfo", e.target.value)}
                      placeholder="Space type, target audience, rollout questions, or anything you want us to cover"
                      className="border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus-visible:border-brand-primary"
                      disabled={status === 'loading'}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-white font-semibold text-slate-900 hover:bg-slate-200" disabled={status === 'loading'}>
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Request Demo"
                    )}
                  </Button>

                  {status === 'error' && (
                    <div className="flex items-center rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      {feedbackMessage}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
              <CardHeader>
                <CardTitle className="text-xl text-white md:text-2xl">
                  What we cover in the session
                </CardTitle>
                <p className="text-sm text-slate-300">
                  A practical walkthrough focused on your operating model.
                </p>
              </CardHeader>
              <CardContent className="flex h-full flex-col space-y-5">
                {demoTopics.map((topic, index) => (
                  <div
                    key={topic.title}
                    className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/15 text-xs font-semibold text-brand-primary">
                        {index + 1}
                      </div>
                      <h3 className="text-sm font-semibold text-white md:text-base">
                        {topic.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">{topic.description}</p>
                  </div>
                ))}

                <div className="mt-auto rounded-xl border border-slate-700/70 bg-slate-950/40 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <CalendarCheck2 className="h-4 w-4 text-brand-primary" />
                    <p className="text-sm font-semibold text-white">Session format</p>
                  </div>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-primary" />
                      <span>20-minute call with live Q&A</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-primary" />
                      <span>No hard sell and no obligation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-primary" />
                      <span>Follow-up notes with next steps</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
} 